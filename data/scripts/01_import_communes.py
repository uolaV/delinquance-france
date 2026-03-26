"""
Importe les communes > 10 000 habitants depuis le fichier INSEE.

Source : https://www.insee.fr/fr/information/2028028
Télécharger : correspondance-code-insee-code-postal-commune-canton-2024.csv
Placer dans : data/raw/communes_insee.csv
"""
import sys
import pandas as pd
import psycopg2
from tqdm import tqdm
from config import DATABASE_URL

CSV_PATH = "../raw/communes_insee.csv"
POPULATION_MIN = 10_000

def main():
    print("Lecture du fichier communes INSEE...")
    try:
        df = pd.read_csv(CSV_PATH, dtype=str, sep=";", encoding="utf-8")
    except FileNotFoundError:
        print(f"ERREUR : fichier non trouvé : {CSV_PATH}")
        print("Télécharger depuis : https://www.insee.fr/fr/information/2028028")
        sys.exit(1)

    print(f"Colonnes disponibles : {list(df.columns)}")

    # Adapter selon les colonnes réelles du fichier INSEE
    # Le fichier varie selon les années — renommer si nécessaire
    col_map = {
        "COM": "code_insee",
        "LIBELLE": "nom",
        "DEP": "departement",
        "LIBDEP": "departement_nom",
        "REG": "region",
        "PMUN": "population",
    }
    df = df.rename(columns={k: v for k, v in col_map.items() if k in df.columns})

    if "population" not in df.columns:
        print("ERREUR : colonne population introuvable. Vérifier les colonnes ci-dessus.")
        sys.exit(1)

    df["population"] = pd.to_numeric(df["population"], errors="coerce").fillna(0).astype(int)
    df = df[df["population"] >= POPULATION_MIN].copy()

    print(f"{len(df)} communes > {POPULATION_MIN:,} habitants trouvées")

    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    inserted = 0
    for _, row in tqdm(df.iterrows(), total=len(df), desc="Import communes"):
        cur.execute("""
            INSERT INTO communes (code_insee, nom, departement, departement_nom, region, population)
            VALUES (%s, %s, %s, %s, %s, %s)
            ON CONFLICT (code_insee) DO UPDATE SET
                nom = EXCLUDED.nom,
                departement = EXCLUDED.departement,
                departement_nom = EXCLUDED.departement_nom,
                region = EXCLUDED.region,
                population = EXCLUDED.population,
                updated_at = now()
        """, (
            row.get("code_insee", ""),
            row.get("nom", ""),
            row.get("departement", ""),
            row.get("departement_nom", ""),
            row.get("region", ""),
            int(row.get("population", 0)),
        ))
        inserted += 1

    conn.commit()
    cur.close()
    conn.close()
    print(f"✓ {inserted} communes importées/mises à jour")

if __name__ == "__main__":
    main()
