import { calculateDailyBudget, dayBoundsUtc, summarizeDay, type UserProfile } from '@calcount/core';
import type { FastifyInstance } from 'fastify';
import { prisma, PROFILE_ID } from '../db.js';

export async function budgetRoutes(app: FastifyInstance) {
  // Dagbudget: TDEE, budget, gegeten en resterend voor een dag.
  app.get('/api/budget', async (req, reply) => {
    const dateStr =
      (req.query as { date?: string }).date ??
      new Date().toISOString().slice(0, 10);

    let bounds;
    try {
      bounds = dayBoundsUtc(dateStr);
    } catch {
      return reply.code(400).send({ error: 'Ongeldige datum (verwacht YYYY-MM-DD)' });
    }

    const profile = await prisma.profile.findUnique({ where: { id: PROFILE_ID } });
    if (!profile) {
      return reply.code(404).send({ error: 'Nog geen profiel ingesteld' });
    }

    // Som van gegeten calorieën die dag (Epic 2 vult dit; nu meestal 0).
    const agg = await prisma.foodEntry.aggregate({
      _sum: { calories: true },
      where: { loggedAt: { gte: bounds.start, lt: bounds.end } },
    });
    const consumed = agg._sum.calories ?? 0;

    const budgetResult = calculateDailyBudget(profile as unknown as UserProfile);
    const summary = summarizeDay(budgetResult, consumed);
    return { date: dateStr, ...summary };
  });
}
