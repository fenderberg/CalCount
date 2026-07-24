import cors from '@fastify/cors';
import Fastify from 'fastify';
import { authRoutes } from './routes/auth.js';
import { adviceRoutes } from './routes/advice.js';
import { badgeRoutes } from './routes/badges.js';
import { budgetRoutes } from './routes/budget.js';
import { entryRoutes } from './routes/entries.js';
import { foodRoutes } from './routes/foods.js';
import { photoRoutes } from './routes/photo.js';
import { profileRoutes } from './routes/profile.js';
import { streakRoutes } from './routes/streak.js';
import { weightRoutes } from './routes/weights.js';
import { parseCookie, verifySessionToken } from './services/auth.js';

// Routes die geen sessie vereisen: health-check en de login zelf.
const PUBLIC_PATHS = new Set(['/health', '/api/login']);

export async function buildApp() {
  // bodyLimit omhoog van Fastify's default (1MB): een base64-gecodeerde foto
  // (Story 3.1, Epic 3) overschrijdt dat vrijwel altijd.
  const app = Fastify({ logger: true, bodyLimit: 10 * 1024 * 1024 });

  // Credentials blijft aan voor de cookievariant. Browsers die cross-site cookies
  // blokkeren gebruiken daarnaast de Authorization Bearer-fallback.
  await app.register(cors, {
    origin: true,
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Health-check (Story 1.1) — blijft open, ook voor Render's eigen health-check.
  app.get('/health', async () => ({ status: 'ok' }));

  // Simpele single-user login (vaste username/wachtwoord uit env, zie
  // services/auth.ts). Alles hieronder vereist een geldige cookie- of bearer-sessie.
  app.addHook('onRequest', async (req, reply) => {
    const path = req.url.split('?')[0];
    if (PUBLIC_PATHS.has(path)) return;
    const cookieToken = parseCookie(req.headers.cookie, 'session');
    const authorization = req.headers.authorization;
    const bearerToken = authorization?.startsWith('Bearer ')
      ? authorization.slice('Bearer '.length)
      : undefined;
    const token = cookieToken ?? bearerToken;
    if (!verifySessionToken(token)) {
      return reply.code(401).send({ error: 'Niet ingelogd' });
    }
  });

  await app.register(authRoutes);
  await app.register(adviceRoutes);
  await app.register(badgeRoutes);
  await app.register(profileRoutes);
  await app.register(budgetRoutes);
  await app.register(foodRoutes);
  await app.register(entryRoutes);
  await app.register(weightRoutes);
  await app.register(photoRoutes);
  await app.register(streakRoutes);

  return app;
}
