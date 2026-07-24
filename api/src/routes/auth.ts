import type { FastifyInstance } from 'fastify';
import { checkCredentials, clearSessionCookieHeader, createSessionToken, sessionCookieHeader } from '../services/auth.js';

export async function authRoutes(app: FastifyInstance) {
  app.post('/api/login', async (req, reply) => {
    const body = req.body as { username?: unknown; password?: unknown } | undefined;
    const username = typeof body?.username === 'string' ? body.username : '';
    const password = typeof body?.password === 'string' ? body.password : '';

    if (!checkCredentials(username, password)) {
      // TIJDELIJK diagnostisch (geen secrets, alleen lengtes) — wordt na
      // troubleshooting weer verwijderd.
      return reply.code(401).send({
        error: 'Onjuiste gebruikersnaam of wachtwoord',
        debug: {
          receivedUserLen: username.length,
          receivedPassLen: password.length,
          expectedUserLen: (process.env.AUTH_USERNAME ?? '').length,
          expectedPassLen: (process.env.AUTH_PASSWORD ?? '').length,
          hasSecret: Boolean(process.env.AUTH_SECRET),
        },
      });
    }

    reply.header('set-cookie', sessionCookieHeader(createSessionToken()));
    return { ok: true };
  });

  app.post('/api/logout', async (_req, reply) => {
    reply.header('set-cookie', clearSessionCookieHeader());
    return { ok: true };
  });
}
