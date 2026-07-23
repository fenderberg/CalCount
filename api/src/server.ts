import cors from '@fastify/cors';
import Fastify from 'fastify';
import { budgetRoutes } from './routes/budget.js';
import { entryRoutes } from './routes/entries.js';
import { foodRoutes } from './routes/foods.js';
import { profileRoutes } from './routes/profile.js';
import { weightRoutes } from './routes/weights.js';

const app = Fastify({ logger: true });

await app.register(cors, { origin: true });

// Health-check (Story 1.1).
app.get('/health', async () => ({ status: 'ok' }));

await app.register(profileRoutes);
await app.register(budgetRoutes);
await app.register(foodRoutes);
await app.register(entryRoutes);
await app.register(weightRoutes);

const port = Number(process.env.PORT ?? 3001);
try {
  await app.listen({ port, host: '0.0.0.0' });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
