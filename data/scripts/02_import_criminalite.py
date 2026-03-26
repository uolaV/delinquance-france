"""
Importe les statistiques de délinquance SSMSI par commune.

Source : https://www.data.gouv.fr/fr/datasets/bases-statistiques-communales-departementales-et-regionales-de-la-delinquance/
Télécharger le fichier CSV communal (base commune) pour chaque année disponible.
Placer les fichiers dans : data/raw/ssmsi_XXXX.csv

Format attendu :
  CODGEO_2024 | Année | tauxpourmille_indicateur | ... | nb_faits_indicateur
"""
import sys
import os
import pandas as pd
import psycopg2
from tqdm import tqdm
from config import DATABASE_URL, SSMSI_COLUMNS

RAW_DIR = "../raw"

# Mapping colonnes SSMSI -> indicateur DB
# Les noms de colonnes changent selon les années — adapter si nécessaire
TAUX_COLS = {
    "tauxpourmille_Coups et blessures volontaires": "coups_blessures_volontaires",
    "tauxpourmille_Vols avec violences": "vols_avec_violence",
    "tauxpourmille_Vols sans violence contre des personnes": "vols_sans_violence",
    "tauxpourmille_Cambriolages de logement": "cambriolages_logement",
    "tauxpourmille_Vols de véhicules": "vols_vehicules",
    "tauxpourmille_Destructions et dégradations volontaires": "destructions_degradations",
    "tauxpourmille_Usage de stupéfiants": "stupefiants_usage",
    "tauxpourmille_Violences sexuelles": "violences_sexuelles",
    "tauxpourmille_Escroqueries": "escroqueries",
}

FAITS_COLS = {
    "faits_Coups et blessures volontaires": "coups_blessures_volontaires",
    "faits_Vols avec violences": "vols_avec_violence",
    "faits_Vols sans violence contre des personnes": "vols_sans_violence",
    "faits_Cambriolages de logement": "cambriolages_logement",
    "faits_Vols de véhicules": "vols_vehicules",
    "faits_Destructions et dégradations volontaires": "destructions_degradations",
    "faits_Usage de stupéfiants": "stupefiants_usage",
    "faits_Violences sexuelles": "violences_sexuelles",
    "faits_Escroqueries": "escroqueries",
}

def find_ssmsi_files():
    files = []
    for f in os.listdir(RAW_DIR):
        if f.startswith("ssmsi_") and f.endswith(".csv"):
            year = f.replace("ssmsi_", "").replace(".csv", "")
            if year.isdigit():
                files.append((int(year), os.path.join(RAW_DIR, f)))
    return sorted(files)

def get_valid_communes(cur):
    cur.execute("SELECT code_insee FROM communes WHERE population >= 10000")
    return {row[0] for row in cur.fetchall()}

def import_file(cur, year, filepath, valid_communes):
    print(f"\nImport {year} depuis {filepath}...")
    df = pd.read_csv(filepath, dtype=str, sep=";", encoding="utf-8")
    print(f"  {len(df)} lignes, colonnes : {list(df.columns[:5])}...")

    # Identifier la colonne code commune
    code_col = None
    for candidate in ["CODGEO_2024", "CODGEO_2023", "CODGEO_2022", "CODGEO", "COG"]:
        if candidate in df.columns:
            code_col = candidate
            break
    if not code_col:
        print(f"  ERREUR : colonne code commune introuvable dans {filepath}")
        return 0

    inserted = 0
    for _, row in tqdm(df.iterrows(), total=len(df), desc=f"  {year}"):
        code_insee = str(row[code_col]).strip().zfill(5)
        if code_insee not in valid_communes:
            continue

        for col_taux, indicateur in TAUX_COLS.items():
            valeur_taux = None
            valeur_brute = None

            # Chercher la colonne taux (noms varient selon années)
            for c in df.columns:
                if indicateur in c.lower() or any(k in c for k in [col_taux]):
                    val = row.get(c)
                    if pd.notna(val) and str(val).replace(".", "").replace(",", "").isdigit():
                        valeur_taux = float(str(val).replace(",", "."))
                        break

            # Chercher la colonne faits bruts
            for col_faits, ind2 in FAITS_COLS.items():
                if ind2 == indicateur:
                    for c in df.columns:
                        if "faits" in c.lower() and indicateur.replace("_", " ") in c.lower():
                            val = row.get(c)
                            if pd.notna(val):
                                try:
                                    valeur_brute = int(float(str(val).replace(",", ".")))
                                except (ValueError, TypeError):
                                    pass
                            break

            if valeur_taux is not None:
                cur.execute("""
                    INSERT INTO criminalite (code_insee, annee, indicateur, valeur_pour_mille, valeur_brute)
                    VALUES (%s, %s, %s, %s, %s)
                    ON CONFLICT (code_insee, annee, indicateur) DO UPDATE SET
                        valeur_pour_mille = EXCLUDED.valeur_pour_mille,
                        valeur_brute = EXCLUDED.valeur_brute
                """, (code_insee, year, indicateur, valeur_taux, valeur_brute))
                inserted += 1

    return inserted

def main():
    files = find_ssmsi_files()
    if not files:
        print(f"Aucun fichier ssmsi_XXXX.csv trouvé dans {RAW_DIR}/")
        print("Télécharger depuis : https://www.data.gouv.fr/fr/datasets/bases-statistiques-communales-departementales-et-regionales-de-la-delinquance/")
        sys.exit(1)

    print(f"Fichiers trouvés : {[f for _, f in files]}")

    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    valid_communes = get_valid_communes(cur)
    print(f"{len(valid_communes)} communes valides en base")

    total = 0
    for year, filepath in files:
        n = import_file(cur, year, filepath, valid_communes)
        conn.commit()
        total += n
        print(f"  ✓ {n} enregistrements insérés pour {year}")

    cur.close()
    conn.close()
    print(f"\n✓ Total : {total} enregistrements de criminalité importés")

if __name__ == "__main__":
    main()
