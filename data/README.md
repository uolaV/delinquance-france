# Pipeline de données

## Étapes dans l'ordre

### 1. Télécharger les fichiers source

**Communes INSEE**
- URL : https://www.insee.fr/fr/information/2028028
- Fichier : `correspondance-code-insee-...csv`
- Renommer en : `data/raw/communes_insee.csv`

**Criminalité SSMSI**
- URL : https://www.data.gouv.fr/fr/datasets/bases-statistiques-communales-departementales-et-regionales-de-la-delinquance/
- Télécharger le fichier CSV communal pour chaque année (2016 → 2024)
- Renommer en : `data/raw/ssmsi_2016.csv`, `data/raw/ssmsi_2017.csv`, etc.

**Élections municipales 2014**
- URL : https://www.data.gouv.fr/fr/datasets/elections-municipales-2014-resultats-par-bureaux-de-vote/
- Renommer en : `data/raw/elections_2014.csv`

**Élections municipales 2020**
- URL : https://www.data.gouv.fr/fr/datasets/elections-municipales-2020-resultats-definitifs-du-1er-tour/
- Renommer en : `data/raw/elections_2020.csv`

### 2. Installer les dépendances Python

```bash
cd data
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 3. Configurer la DB

```bash
cp ../.env.example ../.env
# Renseigner DATABASE_URL
```

### 4. Lancer les scripts dans l'ordre

```bash
cd data/scripts

# 1. Communes
python 01_import_communes.py

# 2. Criminalité (tous les fichiers ssmsi_XXXX.csv détectés automatiquement)
python 02_import_criminalite.py

# 3. Résultats élections
python 03_import_elections.py
```

## Notes

- Les fichiers `data/raw/*.csv` sont dans `.gitignore` (trop volumineux)
- Les scripts sont idempotents : on peut les relancer sans doublon (ON CONFLICT DO UPDATE)
- Les colonnes des fichiers SSMSI changent parfois d'une année à l'autre — les scripts affichent les colonnes disponibles pour faciliter le debug
