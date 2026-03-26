import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.environ["DATABASE_URL"]

# Mapping nuances officielles Ministère de l'Intérieur -> sigle normalisé
NUANCE_TO_SIGLE = {
    # Gauche
    "DVG": "DVG", "PS": "PS", "PRG": "DVG", "VEC": "EELV", "ECO": "EELV",
    "COM": "PCF", "FG": "PCF", "FI": "LFI", "LFI": "LFI", "UG": "DVG",
    # Centre
    "LREM": "LREM", "REM": "LREM", "REN": "REN", "ENS": "REN",
    "MDM": "MDM", "UDI": "UDI", "UC": "UDI", "AJ": "REN",
    # Droite
    "DVD": "DVD", "LR": "LR", "UMP": "LR", "RPR": "LR",
    # Extrême droite
    "RN": "RN", "FN": "RN", "DLF": "RN",
    # Extrême gauche
    "EXG": "PCF", "LO": "PCF", "NPA": "LFI",
    # Divers
    "SE": "SE", "DIV": "DIV", "REG": "DIV", "DLN": "DIV",
    "GJ": "DIV", "REC": "DIV",
}

# Indicateurs SSMSI -> nom colonne en DB
SSMSI_COLUMNS = {
    "Coups et blessures volontaires": "coups_blessures_volontaires",
    "Vols avec violences": "vols_avec_violence",
    "Vols sans violence contre des personnes": "vols_sans_violence",
    "Cambriolages de logement": "cambriolages_logement",
    "Vols de véhicules": "vols_vehicules",
    "Destructions et dégradations volontaires": "destructions_degradations",
    "Usage de stupéfiants": "stupefiants_usage",
    "Violences sexuelles": "violences_sexuelles",
    "Escroqueries": "escroqueries",
}
