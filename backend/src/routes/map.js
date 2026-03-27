import { getPool } from '../db.js';

export default async function mapRoutes(fastify) {

  // GET /api/map/communes?indicateur=coups_blessures_volontaires
  // Retourne toutes les communes avec evolution_pct + couleur parti (pour la carte)
  fastify.get('/api/map/communes', async (request, reply) => {
    const pool = getPool();
    const { indicateur = 'coups_blessures_volontaires' } = request.query;

    const { rows } = await pool.query(`
      SELECT
        c.code_insee,
        c.nom,
        c.departement,
        c.population,
        c.latitude,
        c.longitude,
        ma.parti_sigle,
        ma.parti_nom,
        ma.parti_famille,
        ma.parti_couleur,
        ma.maire_nom,
        ma.date_debut AS mandat_debut,
        ev.evolution_pct,
        ev.valeur_actuelle
      FROM communes c
      LEFT JOIN mandats_actifs ma ON ma.code_insee = c.code_insee
      LEFT JOIN criminalite_evolution ev
        ON ev.code_insee = c.code_insee AND ev.indicateur = $1
      WHERE c.population >= 10000
      ORDER BY c.population DESC
    `, [indicateur]);

    return reply.send({ data: rows, count: rows.length });
  });

  // GET /api/map/commune/:codeInsee?indicateur=...
  // Stats rapides pour le panel latéral (pas la fiche complète)
  fastify.get('/api/map/commune/:codeInsee', async (request, reply) => {
    const pool = getPool();
    const { codeInsee } = request.params;

    // Commune + mandat
    const { rows: communeRows } = await pool.query(`
      SELECT
        c.code_insee, c.nom, c.departement, c.population, c.indice_pauvrete,
        ma.maire_nom, ma.parti_nom, ma.parti_sigle, ma.parti_famille,
        ma.parti_couleur, ma.date_debut AS mandat_debut
      FROM communes c
      LEFT JOIN mandats_actifs ma ON ma.code_insee = c.code_insee
      WHERE c.code_insee = $1
    `, [codeInsee]);

    if (!communeRows[0]) return reply.status(404).send({ code: 'NOT_FOUND' });

    // Évolution tous indicateurs
    const { rows: evolutions } = await pool.query(`
      SELECT indicateur, evolution_pct, valeur_actuelle
      FROM criminalite_evolution
      WHERE code_insee = $1
      ORDER BY evolution_pct DESC NULLS LAST
    `, [codeInsee]);

    // Année des données disponibles
    const { rows: anneesRows } = await pool.query(`
      SELECT MIN(annee) AS annee_min, MAX(annee) AS annee_max
      FROM criminalite WHERE code_insee = $1
    `, [codeInsee]);

    return reply.send({
      commune: communeRows[0],
      evolutions,
      annees: anneesRows[0],
    });
  });

  // GET /api/map/search?q=villeparisis
  fastify.get('/api/map/search', async (request, reply) => {
    const pool = getPool();
    const { q } = request.query;
    if (!q || q.trim().length < 2) return reply.send({ data: [] });

    const { rows } = await pool.query(`
      SELECT
        c.code_insee, c.nom, c.departement, c.population,
        ma.parti_sigle, ma.parti_couleur
      FROM communes c
      LEFT JOIN mandats_actifs ma ON ma.code_insee = c.code_insee
      WHERE c.population >= 10000
        AND lower(unaccent(c.nom)) LIKE lower(unaccent($1))
      ORDER BY c.population DESC
      LIMIT 8
    `, [`%${q.trim()}%`]);

    return reply.send({ data: rows });
  });
}
