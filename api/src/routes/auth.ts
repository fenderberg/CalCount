import type { FastifyInstance } from 'fastify';
import { checkCredentials, clearSessionCookieHeader, createSessionToken, sessionCookieHeader } from '../services/auth.js';

export async function authRoutes(app: FastifyInstance) {
  app.post('/api/login', async (req, reply) => {
    const body = req.body as { username?: unknown; password?: unknown } | undefined;
    const username = typeof body?.username === 'string' ? body.username : '';
    const password = typeof body?.password === 'string' ? body.password : '';

    if (!checkCredentials(username, password)) {
      return reply.code(401).send({ error: 'Onjuiste gebruikersnaam of wachtwoord' });
    }

    const token = createSessionToken();
    reply.header('set-cookie', sessionCookieHeader(token));
    // Bearer-fallback voor browsers die de cross-site cookie tussen GitHub Pages
    // en Render blokkeren. De cookie blijft bestaan voor same-site/lokale clients.
    return { ok: true, token };
  });

  app.post('/api/logout', async (_req, reply) => {
    reply.header('set-cookie', clearSessionCookieHeader());
    return { ok: true };
  });
}
