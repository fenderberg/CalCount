import cors from '@fastify/cors';
import Fastify from 'fastify';
import { budgetRoutes } from './routes/budget.js';
import { entryRoutes } from './routes/entries.js';
import { foodRoutes } from './routes/foods.js';
import { photoRoutes } from './routes/photo.js';
import { profileRoutes } from './routes/profile.js';
import { weightRoutes } from './routes/weights.js';

export async function buildApp() {
  // bodyLimit omhoog van Fastify's default (1MB): een base64-gecodeerde foto
  // (Story 3.1, Epic 3) overschrijdt dat vrijwel altijd.
  const app = Fastify({ logger: true, bodyLimit: 10 * 1024 * 1024 });

  await app.register(cors, { origin: true });

  // Health-check (Story 1.1).
  app.get('/health', async () => ({ status: 'ok' }));

  await app.register(profileRoutes);
  await app.register(budgetRoutes);
  await app.register(foodRoutes);
  await app.register(entryRoutes);
  await app.register(weightRoutes);
  await app.register(photoRoutes);

  return app;
}
