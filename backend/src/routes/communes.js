import { getPool } from '../db.js';

export default async function communesRoutes(fastify) {

  // GET /api/communes — liste avec mandat actif + évolution globale
  fastify.get('/api/communes', async (request, reply) => {
    const pool = getPool();
    const { region, departement, parti_famille, limit = 50, offset = 0 } = request.query;

    let where = ['c.population >= 10000'];
    const params = [];

    if (region) {
      params.push(region);
      where.push(`c.region = $${params.length}`);
    }
    if (departement) {
      params.push(departement);
      where.push(`c.departement = $${params.length}`);
    }
    if (parti_famille) {
      params.push(parti_famille);
      where.push(`ma.parti_famille = $${params.length}`);
    }

    params.push(parseInt(limit));
    params.push(parseInt(offset));

    const { rows } = await pool.query(`
      SELECT
        c.code_insee, c.nom, c.departement, c.departement_nom, c.region,
        c.population, c.densite, c.latitude, c.longitude, c.indice_pauvrete,
        ma.maire_nom, ma.parti_nom, ma.parti_sigle, ma.parti_famille, ma.parti_couleur,
        ma.date_debut AS mandat_debut,
        (SELECT ROUND(AVG(ev.evolution_pct), 2)
         FROM criminalite_evolution ev
         WHERE ev.code_insee = c.code_insee) AS evolution_globale_pct
      FROM communes c
      LEFT JOIN mandats_actifs ma ON ma.code_insee = c.code_insee
      WHERE ${where.join(' AND ')}
      ORDER BY c.population DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `, params);

    return reply.send({ data: rows, count: rows.length });
  });

  // GET /api/communes/:codeInsee — fiche détaillée
  fastify.get('/api/communes/:codeInsee', async (request, reply) => {
    const pool = getPool();
    const { codeInsee } = request.params;

    // Commune + mandat actif
    const { rows: communeRows } = await pool.query(`
      SELECT
        c.*,
        ma.maire_nom, ma.parti_nom, ma.parti_sigle, ma.parti_famille, ma.parti_couleur,
        ma.date_debut AS mandat_debut
      FROM communes c
      LEFT JOIN mandats_actifs ma ON ma.code_insee = c.code_insee
      WHERE c.code_insee = $1
    `, [codeInsee]);

    if (!communeRows[0]) return reply.status(404).send({ code: 'NOT_FOUND' });

    // Historique des mandats
    const { rows: mandats } = await pool.query(`
      SELECT m.*, p.nom AS parti_nom, p.sigle AS parti_sigle, p.famille AS parti_famille, p.couleur_hex
      FROM mandats m
      LEFT JOIN partis p ON p.id = m.parti_id
      WHERE m.code_insee = $1
      ORDER BY m.date_debut DESC
    `, [codeInsee]);

    // Données criminalité par année et indicateur
    const { rows: criminalite } = await pool.query(`
      SELECT annee, indicateur, valeur_pour_mille, valeur_brute
      FROM criminalite
      WHERE code_insee = $1
      ORDER BY annee ASC, indicateur ASC
    `, [codeInsee]);

    // Moyennes nationales pour comparaison
    const { rows: nationales } = await pool.query(`
      SELECT annee, indicateur, ROUND(AVG(valeur_pour_mille), 4) AS moyenne_nationale
      FROM criminalite
      GROUP BY annee, indicateur
      ORDER BY annee ASC, indicateur ASC
    `);

    return reply.send({
      commune: communeRows[0],
      mandats,
      criminalite,
      moyennes_nationales: nationales,
    });
  });

  // GET /api/communes/search?q=lyon
  fastify.get('/api/communes/search', async (request, reply) => {
    const pool = getPool();
    const { q } = request.query;
    if (!q || q.length < 2) return reply.send({ data: [] });

    const { rows } = await pool.query(`
      SELECT code_insee, nom, departement, departement_nom, population,
             ma.parti_sigle, ma.parti_famille, ma.parti_couleur
      FROM communes c
      LEFT JOIN mandats_actifs ma ON ma.code_insee = c.code_insee
      WHERE c.population >= 10000
        AND unaccent(lower(c.nom)) LIKE unaccent(lower($1))
      ORDER BY c.population DESC
      LIMIT 10
    `, [`%${q}%`]);

    return reply.send({ data: rows });
  });
}
