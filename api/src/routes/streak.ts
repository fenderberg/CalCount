import { calculateStreak } from '@calcount/core';
import type { FastifyInstance } from 'fastify';
import { prisma, PROFILE_ID } from '../db.js';

function isValidTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat('en', { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}

function dateInTimeZone(timeZone: string, now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? '';
  return `${part('year')}-${part('month')}-${part('day')}`;
}

export async function streakRoutes(app: FastifyInstance) {
  app.get('/api/streak', async (req, reply) => {
    const requestedTimeZone = (req.query as { timeZone?: string }).timeZone;
    if (requestedTimeZone && !isValidTimeZone(requestedTimeZone)) {
      return reply.code(400).send({ error: 'Ongeldige tijdzone' });
    }

    const profile = await prisma.profile.findUnique({ where: { id: PROFILE_ID } });
    if (!profile) {
      return reply.code(404).send({ error: 'Nog geen profiel ingesteld' });
    }

    // Voor bestaande profielen wordt de apparaattijdzone eenmalig vastgelegd.
    // Daarna bepaalt alleen het opgeslagen profiel de daggrens.
    const timeZone = profile.timeZone ?? requestedTimeZone ?? 'UTC';
    if (!profile.timeZone) {
      await prisma.profile.update({
        where: { id: PROFILE_ID },
        data: { timeZone },
      });
    }

    const entries = await prisma.foodEntry.findMany({ select: { loggedAt: true } });
    const loggedDays = entries.map((entry) => entry.loggedAt.toISOString().slice(0, 10));
    const today = dateInTimeZone(timeZone);

    return { ...calculateStreak(loggedDays, today), today, timeZone };
  });
}
