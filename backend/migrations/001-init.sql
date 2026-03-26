-- ============================================================
-- Délinquance France — Schema initial
-- ============================================================

-- ============================================================
-- 1. partis
-- ============================================================
CREATE TABLE IF NOT EXISTS partis (
  id SERIAL PRIMARY KEY,
  nom TEXT NOT NULL,
  sigle TEXT NOT NULL UNIQUE,
  famille TEXT NOT NULL CHECK (famille IN (
    'gauche', 'centre_gauche', 'centre', 'centre_droit',
    'droite', 'extreme_droite', 'extreme_gauche', 'divers'
  )),
  couleur_hex TEXT NOT NULL DEFAULT '#888888',
  actif BOOLEAN NOT NULL DEFAULT true
);

INSERT INTO partis (nom, sigle, famille, couleur_hex) VALUES
  ('Parti Socialiste',                   'PS',    'gauche',         '#FF8080'),
  ('La France Insoumise',                'LFI',   'extreme_gauche', '#CC2443'),
  ('Parti Communiste Français',          'PCF',   'extreme_gauche', '#DD0000'),
  ('Europe Écologie Les Verts',          'EELV',  'gauche',         '#49A13A'),
  ('Renaissance (ex-LREM)',              'REN',   'centre',         '#FFBE00'),
  ('La République En Marche',            'LREM',  'centre',         '#FFBE00'),
  ('MoDem',                              'MDM',   'centre',         '#FF6600'),
  ('Union des Démocrates Indépendants',  'UDI',   'centre_droit',   '#00AADD'),
  ('Les Républicains',                   'LR',    'droite',         '#0066CC'),
  ('Rassemblement National',             'RN',    'extreme_droite', '#003189'),
  ('Divers Gauche',                      'DVG',   'gauche',         '#FF8080'),
  ('Divers Droite',                      'DVD',   'droite',         '#0066CC'),
  ('Divers Centre',                      'DVC',   'centre',         '#FFBE00'),
  ('Sans Étiquette',                     'SE',    'divers',         '#888888'),
  ('Divers',                             'DIV',   'divers',         '#888888')
ON CONFLICT (sigle) DO NOTHING;

-- ============================================================
-- 2. communes
-- ============================================================
CREATE TABLE IF NOT EXISTS communes (
  code_insee TEXT PRIMARY KEY,
  nom TEXT NOT NULL,
  departement TEXT NOT NULL,
  departement_nom TEXT,
  region TEXT,
  population INTEGER,
  superficie_km2 NUMERIC(10,2),
  densite NUMERIC(10,2),
  latitude NUMERIC(10,6),
  longitude NUMERIC(10,6),
  indice_pauvrete NUMERIC(5,2),   -- % ménages sous seuil de pauvreté (INSEE Filosofi)
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_communes_departement ON communes(departement);
CREATE INDEX IF NOT EXISTS idx_communes_population ON communes(population DESC);

-- ============================================================
-- 3. mandats
-- ============================================================
CREATE TABLE IF NOT EXISTS mandats (
  id SERIAL PRIMARY KEY,
  code_insee TEXT NOT NULL REFERENCES communes(code_insee) ON DELETE CASCADE,
  maire_nom TEXT NOT NULL,
  parti_id INTEGER REFERENCES partis(id),
  nuance_officielle TEXT,       -- code nuance du Ministère de l'Intérieur (DVD, DVG, etc.)
  date_debut DATE NOT NULL,
  date_fin DATE,                -- NULL = mandat en cours
  source TEXT,                  -- 'elections_2014' | 'elections_2020' | 'elections_2026' | 'wikipedia'
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mandats_commune ON mandats(code_insee);
CREATE INDEX IF NOT EXISTS idx_mandats_parti ON mandats(parti_id);
CREATE INDEX IF NOT EXISTS idx_mandats_dates ON mandats(date_debut, date_fin);

-- ============================================================
-- 4. criminalite
-- ============================================================
CREATE TABLE IF NOT EXISTS criminalite (
  id SERIAL PRIMARY KEY,
  code_insee TEXT NOT NULL REFERENCES communes(code_insee) ON DELETE CASCADE,
  annee SMALLINT NOT NULL,
  indicateur TEXT NOT NULL CHECK (indicateur IN (
    'coups_blessures_volontaires',
    'vols_avec_violence',
    'vols_sans_violence',
    'cambriolages_logement',
    'vols_vehicules',
    'destructions_degradations',
    'stupefiants_usage',
    'violences_sexuelles',
    'escroqueries'
  )),
  valeur_pour_mille NUMERIC(10,4),   -- pour 1000 habitants
  valeur_brute INTEGER,              -- nombre absolu de faits
  source TEXT DEFAULT 'ssmsi',
  UNIQUE (code_insee, annee, indicateur)
);

CREATE INDEX IF NOT EXISTS idx_criminalite_commune ON criminalite(code_insee);
CREATE INDEX IF NOT EXISTS idx_criminalite_annee ON criminalite(annee);
CREATE INDEX IF NOT EXISTS idx_criminalite_indicateur ON criminalite(indicateur);

-- ============================================================
-- 5. Vue : mandat actif par commune
-- ============================================================
CREATE OR REPLACE VIEW mandats_actifs AS
SELECT DISTINCT ON (code_insee)
  m.*,
  p.nom AS parti_nom,
  p.sigle AS parti_sigle,
  p.famille AS parti_famille,
  p.couleur_hex AS parti_couleur
FROM mandats m
LEFT JOIN partis p ON p.id = m.parti_id
WHERE m.date_fin IS NULL OR m.date_fin >= CURRENT_DATE
ORDER BY code_insee, m.date_debut DESC;

-- ============================================================
-- 6. Vue : évolution criminalité (dernière année vs 5 ans avant)
-- ============================================================
CREATE OR REPLACE VIEW criminalite_evolution AS
SELECT
  c.code_insee,
  c.indicateur,
  MAX(CASE WHEN c.annee = (SELECT MAX(annee) FROM criminalite) THEN c.valeur_pour_mille END) AS valeur_actuelle,
  AVG(CASE WHEN c.annee BETWEEN
    (SELECT MAX(annee) - 5 FROM criminalite) AND
    (SELECT MAX(annee) - 1 FROM criminalite)
    THEN c.valeur_pour_mille END) AS moyenne_5ans,
  ROUND(
    (MAX(CASE WHEN c.annee = (SELECT MAX(annee) FROM criminalite) THEN c.valeur_pour_mille END) -
     AVG(CASE WHEN c.annee BETWEEN
       (SELECT MAX(annee) - 5 FROM criminalite) AND
       (SELECT MAX(annee) - 1 FROM criminalite)
       THEN c.valeur_pour_mille END)
    ) / NULLIF(AVG(CASE WHEN c.annee BETWEEN
       (SELECT MAX(annee) - 5 FROM criminalite) AND
       (SELECT MAX(annee) - 1 FROM criminalite)
       THEN c.valeur_pour_mille END), 0) * 100
  , 2) AS evolution_pct
FROM criminalite c
GROUP BY c.code_insee, c.indicateur;
