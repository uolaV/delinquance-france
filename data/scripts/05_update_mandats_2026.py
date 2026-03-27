"""
Met a jour les mandats avec les resultats des elections municipales de mars 2026.

A lancer une fois que les fichiers 2026 sont disponibles sur data.gouv.fr.
Ce script telecharge automatiquement les fichiers les plus recents.

Sources attendues :
  - RNE maires (Repertoire National des Elus) mis a jour apres mars 2026
  - Fichier communes enrichies avec nuances politiques 2026

Ce script est idempotent : il peut etre relance plusieurs fois sans doublon.
"""
import os
import sys
import csv
import json
import urllib.request
import psycopg2
from datetime import date
from tqdm import tqdm
from config import DATABASE_URL, NUANCE_TO_SIGLE

RAW_DIR = os.path.join(os.path.dirname(__file__), '../raw')

# URLs des datasets data.gouv.fr
RNE_DATASET_ID = '5c34c4d1634f4173183a64f1'
NUANCES_DATASET_ID = '672de493bf9bd19deda0c563'
DATA_GOUV_API = 'https://www.data.gouv.fr/api/1/datasets'

def get_latest_resource_url(dataset_id, keyword):
    """Recuperer l URL de la ressource la plus recente contenant keyword dans le titre."""
    url = f'{DATA_GOUV_API}/{dataset_id}/'
    with urllib.request.urlopen(url, timeout=10) as r:
        data = json.loads(r.read())
    resources = data.get('resources', [])
    # Filtrer par mot-cle et trier par date de modification
    candidates = [
        r for r in resources
        if keyword.lower() in r.get('title', '').lower()
    ]
    if not candidates:
        return None
    candidates.sort(key=lambda x: x.get('last_modified', ''), reverse=True)
    return candidates[0]['url'], candidates[0]['last_modified'][:10]

def download_file(url, dest_path):
    """Telecharger un fichier si pas deja present ou si la version est plus recente."""
    print(f'  Telechargement : {url[:80]}...')
    urllib.request.urlretrieve(url, dest_path)
    size = os.path.getsize(dest_path)
    print(f'  Taille : {size / 1024:.0f} KB')

def check_rne_updated():
    """Verifier si le RNE a ete mis a jour apres le 22 mars 2026 (second tour)."""
    url, last_modified = get_latest_resource_url(RNE_DATASET_ID, 'maires')
    print(f'RNE maires - derniere mise a jour : {last_modified}')
    if last_modified < '2026-03-22':
        print('  ATTENTION : le RNE n a pas encore ete mis a jour pour les elections 2026.')
        print('  Revenir plus tard (generalement 2 a 4 semaines apres les elections).')
        return None, None
    print('  OK : le RNE inclut les donnees post-elections 2026.')
    return url, last_modified

def check_nuances_updated():
    """Verifier si le fichier nuances a ete mis a jour pour 2026."""
    url, last_modified = get_latest_resource_url(NUANCES_DATASET_ID, 'nuance')
    print(f'Communes + nuances - derniere mise a jour : {last_modified}')
    if last_modified < '2026-03-22':
        print('  ATTENTION : le fichier nuances n a pas encore ete mis a jour pour 2026.')
        print('  Ce fichier est produit par un tiers et peut prendre plusieurs semaines.')
        return None, None
    return url, last_modified

def load_maires_rne(filepath):
    """Charger le mapping code_commune -> nom du maire depuis le RNE."""
    maires = {}
    with open(filepath, encoding='utf-8') as f:
        reader = csv.DictReader(f, delimiter=';')
        for row in reader:
            dep = row.get('Code du département', '').strip().zfill(2)
            commune = row.get('Code de la commune', '').strip().zfill(3)
            code_insee = dep + commune
            csp = row.get('Code de la collectivité à statut particulier', '').strip()
            if csp:
                code_insee = csp + commune
            nom = row.get("Nom de l'élu", '').strip()
            prenom = row.get("Prénom de l'élu", '').strip()
            date_str = row.get('Date de début du mandat', '').strip()
            if code_insee and nom:
                maires[code_insee] = {
                    'nom': f'{prenom} {nom}'.strip(),
                    'date_mandat': date_str,
                }
    print(f'  {len(maires)} maires charges depuis le RNE')
    return maires

def get_parti_id(cur, sigle):
    cur.execute('SELECT id FROM partis WHERE sigle = %s', (sigle,))
    row = cur.fetchone()
    return row[0] if row else None

def normalize_nuance(nuance):
    if not nuance or nuance in ('NC', '', 'Non classe'):
        return 'SE'
    first = nuance.split(',')[0].strip()
    return NUANCE_TO_SIGLE.get(first, NUANCE_TO_SIGLE.get(first.lstrip('L'), 'DIV'))

def main():
    print('=== Mise a jour mandats 2026 ===\n')

    # --- Verifier disponibilite des donnees ---
    print('1. Verification de la disponibilite des donnees...')
    rne_url, rne_date = check_rne_updated()
    nuances_url, nuances_date = check_nuances_updated()
    print()

    if not rne_url and not nuances_url:
        print('Aucune source disponible pour 2026. Reessayer dans quelques semaines.')
        print('\nDates de reference a surveiller :')
        print('  - RNE : data.gouv.fr/datasets/5c34c4d1634f4173183a64f1')
        print('  - Nuances : data.gouv.fr/datasets/672de493bf9bd19deda0c563')
        sys.exit(0)

    # --- Telecharger les fichiers disponibles ---
    print('2. Telechargement des fichiers...')

    rne_path = os.path.join(RAW_DIR, 'maires_rne_2026.csv')
    nuances_path = os.path.join(RAW_DIR, 'communes_nuances_2026.csv')

    if rne_url:
        download_file(rne_url, rne_path)
    elif os.path.exists(os.path.join(RAW_DIR, 'maires_rne.csv')):
        # Fallback : utiliser le RNE 2025 si pas encore mis a jour
        print('  Fallback : utilisation du RNE 2025 pour les noms de maires')
        rne_path = os.path.join(RAW_DIR, 'maires_rne.csv')

    if nuances_url:
        download_file(nuances_url, nuances_path)
    elif os.path.exists(os.path.join(RAW_DIR, 'communes_nuances_2020.csv')):
        print('  ATTENTION : fichier nuances 2026 non disponible. Les nuances 2020 seront utilisees.')
        print('  Relancer ce script quand le fichier 2026 sera disponible.')
        nuances_path = os.path.join(RAW_DIR, 'communes_nuances_2020.csv')
    print()

    # --- Import en base ---
    print('3. Import en base de donnees...')
    maires = load_maires_rne(rne_path)

    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    cur.execute('SELECT code_insee FROM communes WHERE population >= 10000')
    valid_communes = {row[0] for row in cur.fetchall()}
    print(f'  {len(valid_communes)} communes valides en base')

    # Cloture des mandats 2020 (date_fin = veille du second tour 2026)
    cur.execute("""
        UPDATE mandats SET date_fin = '2026-03-21'
        WHERE source = 'elections_2020' AND date_fin IS NULL
    """)
    updated_closures = cur.rowcount
    print(f'  {updated_closures} mandats 2020 clos (date_fin = 2026-03-21)')

    # Suppression des mandats 2026 existants (pour reimport propre)
    cur.execute("DELETE FROM mandats WHERE source = 'elections_2026'")

    # Insertion des mandats 2026
    inserted = 0
    skipped = 0

    with open(nuances_path, encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    for row in tqdm(rows, desc='  Import mandats 2026'):
        code_insee = row.get('cog_commune', '').strip().zfill(5)
        if code_insee not in valid_communes:
            skipped += 1
            continue

        nuance = row.get('nuance_politique', '').strip()
        sigle_norm = normalize_nuance(nuance)
        parti_id = get_parti_id(cur, sigle_norm)

        maire_info = maires.get(code_insee, {})
        maire_nom = maire_info.get('nom', 'Inconnu')

        date_mandat_str = maire_info.get('date_mandat', '')
        try:
            if date_mandat_str:
                parts = date_mandat_str.split('/')
                if len(parts) == 3:
                    date_debut = date(int(parts[2]), int(parts[1]), int(parts[0]))
                else:
                    date_debut = date(2026, 3, 22)
            else:
                date_debut = date(2026, 3, 22)
        except (ValueError, IndexError):
            date_debut = date(2026, 3, 22)

        cur.execute("""
            INSERT INTO mandats (code_insee, maire_nom, parti_id, nuance_officielle, date_debut, date_fin, source)
            VALUES (%s, %s, %s, %s, %s, NULL, 'elections_2026')
            ON CONFLICT DO NOTHING
        """, (code_insee, maire_nom, parti_id, nuance, date_debut))
        inserted += 1

    conn.commit()
    cur.close()
    conn.close()
    print(f'\n  {inserted} mandats 2026 inseres')
    print(f'  {skipped} communes ignorees (population < 10 000)')
    print('\nMise a jour terminee. Pensez a relancer si le fichier nuances 2026 n etait pas encore disponible.')

if __name__ == '__main__':
    main()
