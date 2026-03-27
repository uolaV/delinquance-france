"""
Importe les mandats municipaux depuis le fichier nuances politiques + RNE.

Fichiers requis dans data/raw/ :
  - communes_nuances_2020.csv  (nuances politiques maires 2020)
  - maires_rne.csv             (RNE maires, noms des maires actuels)

Le fichier communes_nuances_2020.csv contient les champs :
  nom_commune, cog_commune, siren_commune, nuance_politique, famille_nuance
"""
import sys
import os
import csv
import psycopg2
from datetime import date
from tqdm import tqdm
from config import DATABASE_URL, NUANCE_TO_SIGLE

RAW_DIR = os.path.join(os.path.dirname(__file__), '../raw')
NUANCES_FILE = os.path.join(RAW_DIR, 'communes_nuances_2020.csv')
MAIRES_FILE = os.path.join(RAW_DIR, 'maires_rne.csv')

def load_maires_rne():
    """Charger le mapping code_commune -> {nom, prenom, date_mandat} depuis le RNE."""
    maires = {}
    if not os.path.exists(MAIRES_FILE):
        print(f"  AVERTISSEMENT : {MAIRES_FILE} non trouvé — noms de maires non disponibles")
        return maires

    with open(MAIRES_FILE, encoding='utf-8') as f:
        reader = csv.DictReader(f, delimiter=';')
        for row in reader:
            # Colonnes RNE : Code du département; Code de la commune; Nom de l'élu; Prénom de l'élu; Date de début du mandat
            dep = row.get('Code du département', '').strip().zfill(2)
            commune = row.get('Code de la commune', '').strip().zfill(3)
            code_insee = dep + commune

            # Gérer les collectivités particulières (Paris, Lyon, Marseille, etc.)
            if row.get('Code de la collectivité à statut particulier', '').strip():
                code_insee = row.get('Code de la collectivité à statut particulier', '').strip() + commune

            nom = row.get("Nom de l'élu", '').strip()
            prenom = row.get("Prénom de l'élu", '').strip()
            date_str = row.get('Date de début du mandat', '').strip()

            if code_insee and nom:
                maires[code_insee] = {
                    'nom': f"{prenom} {nom}".strip(),
                    'date_mandat': date_str,
                }
    print(f"  {len(maires)} maires chargés depuis le RNE")
    return maires

def get_parti_id(cur, sigle):
    cur.execute("SELECT id FROM partis WHERE sigle = %s", (sigle,))
    row = cur.fetchone()
    return row[0] if row else None

def normalize_nuance(nuance):
    """Normaliser la nuance SSMSI en sigle de parti."""
    if not nuance or nuance in ('NC', '', 'Non classé'):
        return 'SE'
    # Prendre la première nuance si combinée (ex: "LSOC,LDVG" -> "LSOC")
    first = nuance.split(',')[0].strip()
    # Retirer le préfixe L si présent (LSOC -> SOC, LRN -> RN, etc.)
    # Mais garder LREM, LSOC, etc. tels quels pour le mapping
    return NUANCE_TO_SIGLE.get(first, NUANCE_TO_SIGLE.get(first.lstrip('L'), 'DIV'))

def get_valid_communes(cur):
    cur.execute("SELECT code_insee FROM communes WHERE population >= 10000")
    return {row[0] for row in cur.fetchall()}

def main():
    if not os.path.exists(NUANCES_FILE):
        print(f"ERREUR : {NUANCES_FILE} non trouvé")
        sys.exit(1)

    maires = load_maires_rne()

    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    valid_communes = get_valid_communes(cur)
    print(f"{len(valid_communes)} communes valides en base")

    # Supprimer les mandats existants pour réimport propre
    cur.execute("DELETE FROM mandats WHERE source = 'elections_2020'")
    conn.commit()

    inserted = 0
    skipped = 0

    with open(NUANCES_FILE, encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    for row in tqdm(rows, desc="Import mandats 2020"):
        code_insee = row.get('cog_commune', '').strip().zfill(5)
        if code_insee not in valid_communes:
            skipped += 1
            continue

        nuance = row.get('nuance_politique', '').strip()
        sigle_norm = normalize_nuance(nuance)
        parti_id = get_parti_id(cur, sigle_norm)

        maire_info = maires.get(code_insee, {})
        maire_nom = maire_info.get('nom', 'Inconnu')

        # Date de début du mandat 2020
        date_mandat_str = maire_info.get('date_mandat', '')
        try:
            if date_mandat_str:
                parts = date_mandat_str.split('/')
                if len(parts) == 3:
                    date_debut = date(int(parts[2]), int(parts[1]), int(parts[0]))
                else:
                    date_debut = date(2020, 7, 4)
            else:
                date_debut = date(2020, 7, 4)
        except (ValueError, IndexError):
            date_debut = date(2020, 7, 4)

        cur.execute("""
            INSERT INTO mandats (code_insee, maire_nom, parti_id, nuance_officielle, date_debut, date_fin, source)
            VALUES (%s, %s, %s, %s, %s, NULL, 'elections_2020')
            ON CONFLICT DO NOTHING
        """, (code_insee, maire_nom, parti_id, nuance, date_debut))
        inserted += 1

    conn.commit()
    cur.close()
    conn.close()
    print(f"\n✓ {inserted} mandats insérés (2020)")
    print(f"  {skipped} communes ignorées (population < 10 000)")

if __name__ == "__main__":
    main()
