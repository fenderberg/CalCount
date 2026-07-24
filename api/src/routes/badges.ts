import type { FastifyInstance } from 'fastify';
import { PROFILE_ID, prisma } from '../db.js';
import { evaluateBadges } from '../services/badges.js';

function dateInTimeZone(timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? '';
  return `${part('year')}-${part('month')}-${part('day')}`;
}

function isValidTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat('en', { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}

export async function badgeRoutes(app: FastifyInstance) {
  app.get('/api/badges', async (req, reply) => {
    const requestedTimeZone = (req.query as { timeZone?: string }).timeZone;
    if (requestedTimeZone && !isValidTimeZone(requestedTimeZone)) {
      return reply.code(400).send({ error: 'Ongeldige tijdzone' });
    }
    const profile = await prisma.profile.findUnique({ where: { id: PROFILE_ID } });
    if (!profile) return reply.code(404).send({ error: 'Nog geen profiel ingesteld' });
    const timeZone = profile.timeZone ?? requestedTimeZone ?? 'UTC';
    if (!profile.timeZone) {
      await prisma.profile.update({ where: { id: PROFILE_ID }, data: { timeZone } });
    }
    return evaluateBadges(dateInTimeZone(timeZone));
  });
}
