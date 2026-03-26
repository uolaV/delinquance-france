"""
Importe les résultats des élections municipales (2014, 2020).

Source 2020 : https://www.data.gouv.fr/fr/datasets/elections-municipales-2020-resultats-definitifs-du-1er-tour/
Source 2014 : https://www.data.gouv.fr/fr/datasets/elections-municipales-2014-resultats-par-bureaux-de-vote/

Placer dans data/raw/ :
  elections_2014.csv
  elections_2020.csv

Format attendu (colonnes minimales) :
  CodeInsee | NomCommune | NomMaire | Prénom | Nuance | Date
"""
import sys
import pandas as pd
import psycopg2
from datetime import date
from tqdm import tqdm
from config import DATABASE_URL, NUANCE_TO_SIGLE

RAW_DIR = "../raw"

ELECTIONS = [
    {
        "file": f"{RAW_DIR}/elections_2014.csv",
        "date_debut": date(2014, 4, 5),
        "date_fin": date(2020, 7, 3),
        "source": "elections_2014",
    },
    {
        "file": f"{RAW_DIR}/elections_2020.csv",
        "date_debut": date(2020, 7, 4),
        "date_fin": None,
        "source": "elections_2020",
    },
]

def get_parti_id(cur, sigle):
    cur.execute("SELECT id FROM partis WHERE sigle = %s", (sigle,))
    row = cur.fetchone()
    return row[0] if row else None

def normalize_nuance(nuance):
    if not nuance or pd.isna(nuance):
        return "SE"
    n = str(nuance).strip().upper()
    return NUANCE_TO_SIGLE.get(n, "DIV")

def import_election(cur, election, valid_communes):
    filepath = election["file"]
    try:
        df = pd.read_csv(filepath, dtype=str, sep=";", encoding="utf-8")
    except FileNotFoundError:
        print(f"  Fichier non trouvé : {filepath} — ignoré")
        return 0

    print(f"\nImport {election['source']} — {len(df)} lignes")
    print(f"  Colonnes : {list(df.columns[:8])}")

    # Identifier les colonnes (noms varient selon les fichiers)
    code_col = next((c for c in df.columns if "code" in c.lower() and "insee" in c.lower()), None) or \
               next((c for c in df.columns if c.upper() in ["CODINSEE", "COG", "CODGEO"]), None)
    nom_maire_col = next((c for c in df.columns if "nom" in c.lower() and "maire" in c.lower()), None) or \
                    next((c for c in df.columns if "nom" in c.lower()), None)
    prenom_col = next((c for c in df.columns if "prenom" in c.lower()), None)
    nuance_col = next((c for c in df.columns if "nuance" in c.lower()), None)

    if not code_col:
        print(f"  ERREUR : colonne code INSEE introuvable. Colonnes : {list(df.columns)}")
        return 0

    # Garder uniquement les maires (élus, rang 1 dans les résultats)
    # Les fichiers du Ministère ont souvent une colonne "Siège" ou "Rang"
    siege_col = next((c for c in df.columns if "siege" in c.lower() or "elu" in c.lower()), None)
    if siege_col:
        df = df[df[siege_col].astype(str).str.contains("1|maire|oui", case=False, na=False)]

    inserted = 0
    for _, row in tqdm(df.iterrows(), total=len(df), desc=f"  {election['source']}"):
        code_insee = str(row.get(code_col, "")).strip().zfill(5)
        if code_insee not in valid_communes:
            continue

        nom = str(row.get(nom_maire_col, "")).strip() if nom_maire_col else ""
        prenom = str(row.get(prenom_col, "")).strip() if prenom_col else ""
        maire_nom = f"{prenom} {nom}".strip() if prenom else nom
        nuance = str(row.get(nuance_col, "SE")).strip() if nuance_col else "SE"

        sigle_norm = normalize_nuance(nuance)
        parti_id = get_parti_id(cur, sigle_norm)

        if not maire_nom:
            continue

        cur.execute("""
            INSERT INTO mandats (code_insee, maire_nom, parti_id, nuance_officielle, date_debut, date_fin, source)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT DO NOTHING
        """, (
            code_insee, maire_nom, parti_id, nuance,
            election["date_debut"], election["date_fin"], election["source"]
        ))
        inserted += 1

    return inserted

def main():
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    cur.execute("SELECT code_insee FROM communes WHERE population >= 10000")
    valid_communes = {row[0] for row in cur.fetchall()}
    print(f"{len(valid_communes)} communes valides en base")

    total = 0
    for election in ELECTIONS:
        n = import_election(cur, election, valid_communes)
        conn.commit()
        total += n
        print(f"  ✓ {n} mandats insérés pour {election['source']}")

    cur.close()
    conn.close()
    print(f"\n✓ Total : {total} mandats importés")

if __name__ == "__main__":
    main()
