import { getPool } from '../db.js';

const INDICATEURS = [
  'coups_blessures_volontaires', 'vols_avec_violence', 'vols_sans_violence',
  'cambriolages_logement', 'vols_vehicules', 'destructions_degradations',
  'stupefiants_usage', 'violences_sexuelles', 'escroqueries',
];

export default async function criminaliteRoutes(fastify) {

  // GET /api/criminalite/:codeInsee — série temporelle complète
  fastify.get('/api/criminalite/:codeInsee', async (request, reply) => {
    const pool = getPool();
    const { codeInsee } = request.params;
    const { indicateur } = request.query;

    let query = 'SELECT annee, indicateur, valeur_pour_mille, valeur_brute FROM criminalite WHERE code_insee = $1';
    const params = [codeInsee];

    if (indicateur && INDICATEURS.includes(indicateur)) {
      params.push(indicateur);
      query += ` AND indicateur = $${params.length}`;
    }

    query += ' ORDER BY annee ASC, indicateur ASC';
    const { rows } = await pool.query(query, params);
    return reply.send({ data: rows });
  });

  // GET /api/criminalite/national/moyennes — moyennes nationales par année
  fastify.get('/api/criminalite/national/moyennes', async (_request, reply) => {
    const pool = getPool();
    const { rows } = await pool.query(`
      SELECT annee, indicateur,
        ROUND(AVG(valeur_pour_mille), 4) AS moyenne,
        ROUND(MIN(valeur_pour_mille), 4) AS min,
        ROUND(MAX(valeur_pour_mille), 4) AS max,
        COUNT(DISTINCT code_insee) AS nb_communes
      FROM criminalite
      GROUP BY annee, indicateur
      ORDER BY annee ASC, indicateur ASC
    `);
    return reply.send({ data: rows });
  });

  // GET /api/criminalite/indicateurs — liste des indicateurs disponibles
  fastify.get('/api/criminalite/indicateurs', async (_request, reply) => {
    return reply.send({ data: INDICATEURS });
  });
}
