import { getPool } from '../db.js';

export default async function classementsRoutes(fastify) {

  // GET /api/classements/hausse — top 20 communes avec plus forte hausse
  // GET /api/classements/baisse — top 20 communes avec plus forte baisse
  fastify.get('/api/classements/:sens', async (request, reply) => {
    const pool = getPool();
    const { sens } = request.params;
    if (!['hausse', 'baisse'].includes(sens)) {
      return reply.status(400).send({ code: 'INVALID_PARAM' });
    }

    const { indicateur = 'coups_blessures_volontaires', limit = 20 } = request.query;
    const order = sens === 'hausse' ? 'DESC' : 'ASC';

    const { rows } = await pool.query(`
      SELECT
        c.code_insee, c.nom, c.departement, c.population,
        ma.parti_nom, ma.parti_sigle, ma.parti_famille, ma.parti_couleur,
        ev.evolution_pct,
        ev.valeur_actuelle,
        ev.moyenne_5ans
      FROM criminalite_evolution ev
      JOIN communes c ON c.code_insee = ev.code_insee
      LEFT JOIN mandats_actifs ma ON ma.code_insee = c.code_insee
      WHERE ev.indicateur = $1
        AND c.population >= 10000
        AND ev.evolution_pct IS NOT NULL
      ORDER BY ev.evolution_pct ${order}
      LIMIT $2
    `, [indicateur, parseInt(limit)]);

    return reply.send({ data: rows, indicateur, sens });
  });

  // GET /api/classements/familles — comparaison par famille politique
  fastify.get('/api/classements/familles', async (request, reply) => {
    const pool = getPool();
    const { indicateur = 'coups_blessures_volontaires' } = request.query;

    const { rows } = await pool.query(`
      SELECT
        p.famille,
        COUNT(DISTINCT c.code_insee) AS nb_communes,
        ROUND(AVG(ev.evolution_pct), 2) AS evolution_moyenne_pct,
        ROUND(AVG(ev.valeur_actuelle), 4) AS valeur_actuelle_moyenne,
        (SELECT ROUND(AVG(cr.valeur_pour_mille), 4)
         FROM criminalite cr
         WHERE cr.annee = (SELECT MAX(annee) FROM criminalite)
           AND cr.indicateur = $1) AS moyenne_nationale
      FROM criminalite_evolution ev
      JOIN communes c ON c.code_insee = ev.code_insee
      JOIN mandats_actifs ma ON ma.code_insee = c.code_insee
      JOIN partis p ON p.sigle = ma.parti_sigle
      WHERE ev.indicateur = $1
        AND c.population >= 10000
      GROUP BY p.famille
      ORDER BY evolution_moyenne_pct DESC
    `, [indicateur]);

    return reply.send({ data: rows, indicateur });
  });
}
