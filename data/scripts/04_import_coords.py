"""
Enrichit les communes avec les coordonnées GPS (centroïde) depuis geo.api.gouv.fr.
Traite les communes par batch de 50 pour limiter les appels.
"""
import os
import json
import time
import psycopg2
import urllib.request
from tqdm import tqdm
from config import DATABASE_URL

GEO_API = 'https://geo.api.gouv.fr'
BATCH_SIZE = 50

def fetch_coords_single(code):
    """Récupérer le centroïde d'une commune par son code INSEE."""
    url = f'{GEO_API}/communes/{code}?fields=centre&format=json'
    try:
        with urllib.request.urlopen(url, timeout=10) as r:
            data = json.loads(r.read())
        coords = data.get('centre', {}).get('coordinates', [None, None])
        if coords[0] and coords[1]:
            return (coords[1], coords[0])  # lat, lng
        return None
    except Exception:
        return None


def fetch_coords_batch(codes):
    """Récupérer les centroïdes pour une liste de codes INSEE."""
    # L'API /communes?code= ne gère pas les requêtes multi-codes correctement
    # On passe par l'endpoint individuel /communes/{code}
    result = {}
    for code in codes:
        coords = fetch_coords_single(code)
        if coords:
            result[code] = coords
        time.sleep(0.01)
    return result

def main():
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    cur.execute("SELECT code_insee FROM communes WHERE latitude IS NULL AND population >= 10000 ORDER BY population DESC")
    codes = [row[0] for row in cur.fetchall()]
    print(f'{len(codes)} communes sans coordonnées à enrichir')

    if not codes:
        print('Toutes les communes ont déjà des coordonnées.')
        cur.close(); conn.close(); return

    updated = 0
    batches = [codes[i:i+BATCH_SIZE] for i in range(0, len(codes), BATCH_SIZE)]

    for batch in tqdm(batches, desc='Fetch coords'):
        coords_map = fetch_coords_batch(batch)
        for code_insee, (lat, lng) in coords_map.items():
            cur.execute(
                'UPDATE communes SET latitude = %s, longitude = %s WHERE code_insee = %s',
                (lat, lng, code_insee)
            )
            updated += 1
        conn.commit()
        time.sleep(0.05)  # gentil avec l'API

    cur.close()
    conn.close()
    print(f'\n✓ {updated} communes enrichies avec coordonnées GPS')

if __name__ == '__main__':
    main()
