"""
Importe les communes >= 10 000 habitants depuis le fichier SSMSI.
La population est extraite directement du fichier SSMSI (colonne insee_pop).
Les noms des communes sont complétés depuis le fichier nuances politiques.

Fichiers requis dans data/raw/ :
  - ssmsi_all.csv.gz  (SSMSI data.gouv.fr)
  - communes_nuances_2020.csv  (dataset communes enrichies data.gouv.fr)
"""
import sys
import os
import gzip
import csv
import psycopg2
from tqdm import tqdm
from config import DATABASE_URL

RAW_DIR = os.path.join(os.path.dirname(__file__), '../raw')
SSMSI_FILE = os.path.join(RAW_DIR, 'ssmsi_all.csv.gz')
NUANCES_FILE = os.path.join(RAW_DIR, 'communes_nuances_2020.csv')
POPULATION_MIN = 10_000

def load_noms_communes():
    """Charger le mapping code_insee -> nom depuis le fichier nuances."""
    noms = {}
    try:
        with open(NUANCES_FILE, encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                code = row.get('cog_commune', '').strip().zfill(5)
                nom = row.get('nom_commune', '').strip()
                if code and nom:
                    noms[code] = nom
        print(f"  {len(noms)} noms de communes chargés depuis nuances")
    except FileNotFoundError:
        print(f"  AVERTISSEMENT : {NUANCES_FILE} non trouvé — noms de communes absents")
    return noms

def extract_communes_from_ssmsi():
    """Extraire les communes + populations du fichier SSMSI."""
    communes = {}  # code_insee -> {population, departement}
    print("Lecture du fichier SSMSI pour extraire les communes...")
    with gzip.open(SSMSI_FILE, 'rt', encoding='utf-8') as f:
        reader = csv.DictReader(f, delimiter=';')
        for row in reader:
            code = row.get('CODGEO_2025', '').strip().zfill(5)
            pop_str = row.get('insee_pop', '').strip()
            if code and pop_str and pop_str.isdigit():
                pop = int(pop_str)
                if pop >= POPULATION_MIN:
                    if code not in communes or communes[code]['population'] < pop:
                        dep = code[:3] if code[:2] == '97' else code[:2]
                        communes[code] = {'population': pop, 'departement': dep}
    return communes

def main():
    if not os.path.exists(SSMSI_FILE):
        print(f"ERREUR : {SSMSI_FILE} non trouvé")
        sys.exit(1)

    noms = load_noms_communes()
    communes = extract_communes_from_ssmsi()
    print(f"{len(communes)} communes >= {POPULATION_MIN:,} habitants trouvées dans le SSMSI")

    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    inserted = 0
    for code_insee, data in tqdm(communes.items(), desc="Import communes"):
        nom = noms.get(code_insee, f"Commune {code_insee}")
        dep = data['departement']

        cur.execute("""
            INSERT INTO communes (code_insee, nom, departement, population)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (code_insee) DO UPDATE SET
                nom = EXCLUDED.nom,
                departement = EXCLUDED.departement,
                population = EXCLUDED.population,
                updated_at = now()
        """, (code_insee, nom, dep, data['population']))
        inserted += 1

    conn.commit()
    cur.close()
    conn.close()
    print(f"✓ {inserted} communes importées/mises à jour")

if __name__ == "__main__":
    main()
