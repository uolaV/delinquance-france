"""
Importe les statistiques de délinquance SSMSI depuis le fichier unique CSV.GZ.

Fichier requis dans data/raw/ :
  - ssmsi_all.csv.gz

Colonnes du fichier :
  CODGEO_2025;annee;indicateur;unite_de_compte;nombre;taux_pour_mille;est_diffuse;
  insee_pop;insee_pop_millesime;insee_log;insee_log_millesime;
  complement_info_nombre;complement_info_taux
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

# Mapping indicateurs SSMSI -> nom en DB
INDICATEUR_MAP = {
    'Cambriolages de logement':                    'cambriolages_logement',
    'Destructions et dégradations volontaires':    'destructions_degradations',
    'Escroqueries et fraudes aux moyens de paiement': 'escroqueries',
    'Usage de stupéfiants':                        'stupefiants_usage',
    'Violences sexuelles':                         'violences_sexuelles',
    'Vols de véhicule':                            'vols_vehicules',
    'Vols sans violence contre des personnes':     'vols_sans_violence',
    # Coups et blessures = physiques hors famille + intrafamiliales
    'Violences physiques hors cadre familial':     'coups_blessures_volontaires',
    'Violences physiques intrafamiliales':         'coups_blessures_volontaires',
    # Vols avec violence = avec armes + sans arme
    'Vols avec armes':                             'vols_avec_violence',
    'Vols violents sans arme':                     'vols_avec_violence',
}

def get_valid_communes(cur):
    cur.execute("SELECT code_insee FROM communes WHERE population >= 10000")
    return {row[0] for row in cur.fetchall()}

def main():
    if not os.path.exists(SSMSI_FILE):
        print(f"ERREUR : {SSMSI_FILE} non trouvé")
        sys.exit(1)

    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    valid_communes = get_valid_communes(cur)
    print(f"{len(valid_communes)} communes valides en base")

    # Compter les lignes pour la barre de progression
    print("Comptage des lignes...")
    total_lines = 0
    with gzip.open(SSMSI_FILE, 'rt', encoding='utf-8') as f:
        for _ in f:
            total_lines += 1
    print(f"  {total_lines:,} lignes à traiter")

    # Pour les indicateurs agrégés (CBV = physiques hors famille + intrafamiliales),
    # on accumule par (code_insee, annee) avant d'insérer
    # Structure : {(code_insee, annee, indicateur_db): {taux: float, brut: int}}
    aggregated = {}

    print("Lecture et agrégation des données SSMSI...")
    skipped_not_diffuse = 0
    skipped_no_taux = 0
    skipped_not_commune = 0

    with gzip.open(SSMSI_FILE, 'rt', encoding='utf-8') as f:
        reader = csv.DictReader(f, delimiter=';')
        for i, row in enumerate(tqdm(reader, total=total_lines - 1, desc="Lecture SSMSI")):
            code = row.get('CODGEO_2025', '').strip().zfill(5)
            annee_str = row.get('annee', '').strip()
            indicateur_ssmsi = row.get('indicateur', '').strip()
            taux_str = row.get('taux_pour_mille', '').strip().replace(',', '.')
            nombre_str = row.get('nombre', '').strip()
            est_diffuse = row.get('est_diffuse', '').strip()

            # Filtres
            if code not in valid_communes:
                skipped_not_commune += 1
                continue
            if est_diffuse != 'diff':
                skipped_not_diffuse += 1
                continue
            if indicateur_ssmsi not in INDICATEUR_MAP:
                continue
            if not annee_str.isdigit():
                continue

            indicateur_db = INDICATEUR_MAP[indicateur_ssmsi]

            taux = None
            if taux_str and taux_str not in ('', 'NA', 'nan'):
                try:
                    taux = float(taux_str)
                except ValueError:
                    pass

            brut = None
            if nombre_str and nombre_str not in ('', 'NA', 'nan'):
                try:
                    brut = int(float(nombre_str))
                except ValueError:
                    pass

            if taux is None:
                skipped_no_taux += 1
                continue

            key = (code, int(annee_str), indicateur_db)
            if key not in aggregated:
                aggregated[key] = {'taux': 0.0, 'brut': 0}
            aggregated[key]['taux'] += taux
            if brut is not None:
                aggregated[key]['brut'] += brut

    print(f"\n  Filtrés (pas commune cible) : {skipped_not_commune:,}")
    print(f"  Filtrés (non diffusés)      : {skipped_not_diffuse:,}")
    print(f"  Filtrés (taux absent)       : {skipped_no_taux:,}")
    print(f"  Enregistrements agrégés     : {len(aggregated):,}")

    print("\nInsertion en base de données...")
    inserted = 0
    for (code_insee, annee, indicateur_db), vals in tqdm(aggregated.items(), desc="INSERT criminalite"):
        cur.execute("""
            INSERT INTO criminalite (code_insee, annee, indicateur, valeur_pour_mille, valeur_brute)
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT (code_insee, annee, indicateur) DO UPDATE SET
                valeur_pour_mille = EXCLUDED.valeur_pour_mille,
                valeur_brute = EXCLUDED.valeur_brute
        """, (code_insee, annee, indicateur_db, round(vals['taux'], 4), vals['brut']))
        inserted += 1

        # Commit par batch de 10 000
        if inserted % 10000 == 0:
            conn.commit()

    conn.commit()
    cur.close()
    conn.close()
    print(f"\n✓ {inserted} enregistrements insérés/mis à jour")

if __name__ == "__main__":
    main()
