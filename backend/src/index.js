import Fastify from 'fastify';
import cors from '@fastify/cors';
import { getPool } from './db.js';
import communesRoutes from './routes/communes.js';
import criminaliteRoutes from './routes/criminalite.js';
import partisRoutes from './routes/partis.js';
import classementsRoutes from './routes/classements.js';

const fastify = Fastify({ logger: true });

await fastify.register(cors, {
  origin: process.env.NODE_ENV === 'production'
    ? [process.env.FRONTEND_URL].filter(Boolean)
    : true,
});

// Health check
fastify.get('/api/health', async () => ({ status: 'ok' }));

// Routes
await fastify.register(communesRoutes);
await fastify.register(criminaliteRoutes);
await fastify.register(partisRoutes);
await fastify.register(classementsRoutes);

// Error handler
fastify.setErrorHandler((error, _request, reply) => {
  fastify.log.error(error);
  reply.status(error.statusCode || 500).send({
    code: error.code || 'INTERNAL_ERROR',
    message: process.env.NODE_ENV === 'production' ? 'Une erreur est survenue' : error.message,
  });
});

const port = parseInt(process.env.PORT || '3000', 10);
await fastify.listen({ port, host: '0.0.0.0' });
console.log(`API running on port ${port}`);
