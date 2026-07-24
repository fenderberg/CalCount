import {
  calculateDailyBudget,
  calculateNutritionTargets,
  dayBoundsUtc,
  shiftDay,
  summarizeNutrition,
  type NutritionSummary,
  type UserProfile,
} from '@calcount/core';
import type { FastifyInstance } from 'fastify';
import { prisma, PROFILE_ID } from '../db.js';

function parseDate(value: string): { start: Date; end: Date } {
  try {
    return dayBoundsUtc(value);
  } catch {
    throw new Error('invalid-date');
  }
}

function averageSummary(summary: NutritionSummary, days: number): NutritionSummary {
  if (days <= 0) return summary;
  return {
    ...summary,
    totals: Object.fromEntries(
      Object.entries(summary.totals).map(([key, value]) => [key, Math.round((value / days) * 10) / 10]),
    ) as unknown as NutritionSummary['totals'],
  };
}

function weeklyAssessment(summary: NutritionSummary, loggedDays: number) {
  if (loggedDays < 4) {
    return {
      status: 'insufficient' as const,
      title: 'Nog even doorloggen',
      points: [`Log op minimaal ${4 - loggedDays} extra dag${4 - loggedDays === 1 ? '' : 'en'} om je patroon te beoordelen.`],
    };
  }
  if (summary.coverage < 70) {
    return {
      status: 'insufficient' as const,
      title: 'Nog te weinig voedingswaarden bekend',
      points: ['Kies vaker producten met voedingswaarden of vul macro’s globaal in bij handmatig loggen.'],
    };
  }

  const { totals, targets } = summary;
  const points: string[] = [];
  if (totals.protein < targets.protein * 0.85) {
    points.push('Eiwit blijft wat achter; verdeel een eiwitbron over je maaltijden.');
  }
  if (totals.fiber < targets.fiber * 0.85) {
    points.push('Vezels blijven wat achter; denk aan volkoren, groente, fruit of peulvruchten.');
  }
  if (points.length < 2 && totals.fat > targets.fat.max * 1.1) {
    points.push('Vet ligt relatief hoog; kijk vooral naar porties olie, kaas, noten en sauzen.');
  }
  if (points.length < 2 && totals.carbs < targets.carbs.min * 0.85) {
    points.push('Koolhydraten liggen laag; kies zo nodig een volkoren bron die ook vezels levert.');
  }
  if (points.length === 0) {
    points.push('Je gemiddelde verdeling valt binnen de globale richtwaarden. Houd vooral dit patroon vast.');
  }
  return {
    status: 'ready' as const,
    title: points.length === 1 && points[0].startsWith('Je gemiddelde')
      ? 'Mooi in balans'
      : 'Een redelijke basis',
    points: points.slice(0, 2),
  };
}

export async function nutritionRoutes(app: FastifyInstance) {
  app.get('/api/nutrition', async (req, reply) => {
    const date = (req.query as { date?: string }).date ?? new Date().toISOString().slice(0, 10);
    let bounds;
    try {
      bounds = parseDate(date);
    } catch {
      return reply.code(400).send({ error: 'Ongeldige datum (YYYY-MM-DD)' });
    }
    const profile = await prisma.profile.findUnique({ where: { id: PROFILE_ID } });
    if (!profile) return reply.code(404).send({ error: 'Nog geen profiel ingesteld' });
    const entries = await prisma.foodEntry.findMany({ where: { loggedAt: { gte: bounds.start, lt: bounds.end } } });
    const budget = calculateDailyBudget(profile as unknown as UserProfile).budget;
    const summary = summarizeNutrition(entries, calculateNutritionTargets(profile as unknown as UserProfile, budget));
    return { date, ...summary };
  });

  app.get('/api/nutrition/week', async (req, reply) => {
    const end = (req.query as { end?: string }).end ?? new Date().toISOString().slice(0, 10);
    const start = shiftDay(end, -6);
    let bounds;
    try {
      bounds = { start: parseDate(start).start, end: parseDate(end).end };
    } catch {
      return reply.code(400).send({ error: 'Ongeldige datum (YYYY-MM-DD)' });
    }
    const profile = await prisma.profile.findUnique({ where: { id: PROFILE_ID } });
    if (!profile) return reply.code(404).send({ error: 'Nog geen profiel ingesteld' });
    const entries = await prisma.foodEntry.findMany({ where: { loggedAt: { gte: bounds.start, lt: bounds.end } } });
    const loggedDays = new Set(entries.map((entry) => entry.loggedAt.toISOString().slice(0, 10))).size;
    const budget = calculateDailyBudget(profile as unknown as UserProfile).budget;
    const targets = calculateNutritionTargets(profile as unknown as UserProfile, budget);
    const rawSummary = summarizeNutrition(entries, targets);
    const completeEntries = entries.filter((entry) =>
      entry.protein != null && entry.carbs != null && entry.fat != null && entry.fiber != null,
    );
    // Extrapoleer uitsluitend volledig bekende items naar een gemiddelde dag. Daardoor
    // worden ontbrekende waarden niet stilzwijgend nul; coverage houdt de onzekerheid zichtbaar.
    const equivalentCoveredDays = loggedDays * (rawSummary.coverage / 100);
    const summary = {
      ...averageSummary(summarizeNutrition(completeEntries, targets), equivalentCoveredDays),
      coverage: rawSummary.coverage,
    };
    return { start, end, loggedDays, ...summary, assessment: weeklyAssessment(summary, loggedDays) };
  });
}
