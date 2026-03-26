import { getPool } from '../db.js';

export default async function partisRoutes(fastify) {

  // GET /api/partis — liste des partis
  fastify.get('/api/partis', async (_request, reply) => {
    const pool = getPool();
    const { rows } = await pool.query(`
      SELECT p.*,
        COUNT(DISTINCT m.code_insee) AS nb_communes_actuelles
      FROM partis p
      LEFT JOIN mandats m ON m.parti_id = p.id AND (m.date_fin IS NULL OR m.date_fin >= CURRENT_DATE)
      GROUP BY p.id
      ORDER BY nb_communes_actuelles DESC
    `);
    return reply.send({ data: rows });
  });

  // GET /api/partis/:sigle — vue agrégée d'un parti
  fastify.get('/api/partis/:sigle', async (request, reply) => {
    const pool = getPool();
    const { sigle } = request.params;

    const { rows: partiRows } = await pool.query(
      'SELECT * FROM partis WHERE sigle = $1', [sigle.toUpperCase()]
    );
    if (!partiRows[0]) return reply.status(404).send({ code: 'NOT_FOUND' });
    const parti = partiRows[0];

    // Communes actuellement dirigées
    const { rows: communes } = await pool.query(`
      SELECT c.code_insee, c.nom, c.departement, c.population,
        m.maire_nom, m.date_debut,
        (SELECT ROUND(AVG(ev.evolution_pct), 2)
         FROM criminalite_evolution ev WHERE ev.code_insee = c.code_insee) AS evolution_globale_pct
      FROM mandats m
      JOIN communes c ON c.code_insee = m.code_insee
      WHERE m.parti_id = $1
        AND (m.date_fin IS NULL OR m.date_fin >= CURRENT_DATE)
        AND c.population >= 10000
      ORDER BY c.population DESC
    `, [parti.id]);

    // Évolution moyenne des communes dirigées par ce parti vs nationale
    const { rows: evolution } = await pool.query(`
      SELECT cr.annee, cr.indicateur,
        ROUND(AVG(cr.valeur_pour_mille), 4) AS moyenne_parti,
        (SELECT ROUND(AVG(cr2.valeur_pour_mille), 4)
         FROM criminalite cr2 WHERE cr2.annee = cr.annee AND cr2.indicateur = cr.indicateur) AS moyenne_nationale
      FROM criminalite cr
      WHERE cr.code_insee IN (
        SELECT m.code_insee FROM mandats m
        WHERE m.parti_id = $1
          AND cr.annee BETWEEN EXTRACT(YEAR FROM m.date_debut) AND COALESCE(EXTRACT(YEAR FROM m.date_fin), EXTRACT(YEAR FROM CURRENT_DATE))
      )
      GROUP BY cr.annee, cr.indicateur
      ORDER BY cr.annee ASC, cr.indicateur ASC
    `, [parti.id]);

    return reply.send({ parti, communes, evolution });
  });
}
