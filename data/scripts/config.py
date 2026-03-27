import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '../../.env'))

DATABASE_URL = os.environ["DATABASE_URL"]

# Mapping nuances politiques (fichier communes_nuances_2020.csv) -> sigle en DB
# Format : LSOC, LRN, LDVG, etc.
NUANCE_TO_SIGLE = {
    # Gauche
    'LSOC': 'PS',      # Socialiste
    'LUG':  'DVG',     # Union de la Gauche
    'LDVG': 'DVG',     # Divers Gauche
    'LCOM': 'PCF',     # Communiste
    'LRDG': 'DVG',     # Radical de Gauche
    'LVEC': 'EELV',    # Verts / Écologistes
    'LECO': 'EELV',    # Écologistes
    'LFI':  'LFI',     # France Insoumise
    # Centre
    'LREM': 'LREM',    # La République En Marche
    'LMDM': 'MDM',     # MoDem
    'LUC':  'UDI',     # Union du Centre
    'LUDI': 'UDI',     # UDI
    'LDVC': 'DVC',     # Divers Centre
    # Droite
    'LLR':  'LR',      # Les Républicains
    'LUD':  'LR',      # Union pour la Droite
    'LDVD': 'DVD',     # Divers Droite
    # Extrême droite
    'LRN':  'RN',      # Rassemblement National
    'LEXD': 'RN',      # Extrême Droite
    # Divers
    'LDIV': 'DIV',     # Divers
    'LREG': 'DIV',     # Régionaliste
    'LNC':  'SE',      # Non Classé
    'NC':   'SE',      # Non Classé
    # Anciens formats (résultats élections 2014)
    'DVG': 'DVG', 'PS': 'PS', 'PRG': 'DVG', 'VEC': 'EELV', 'ECO': 'EELV',
    'COM': 'PCF', 'FG': 'PCF', 'UG': 'DVG',
    'LREM_old': 'LREM', 'REM': 'LREM', 'REN': 'REN', 'ENS': 'REN',
    'MDM': 'MDM', 'UDI': 'UDI', 'UC': 'UDI',
    'DVD': 'DVD', 'LR': 'LR', 'UMP': 'LR',
    'RN': 'RN', 'FN': 'RN', 'DLF': 'RN',
    'EXG': 'PCF', 'LO': 'PCF', 'NPA': 'LFI',
    'SE': 'SE', 'DIV': 'DIV', 'REG': 'DIV',
}
