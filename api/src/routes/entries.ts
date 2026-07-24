import { dayBoundsUtc } from '@calcount/core';
import type { FastifyInstance } from 'fastify';
import { prisma } from '../db.js';
import { ValidationError } from '../validation.js';

const SOURCES = ['search', 'manual', 'ai', 'recent', 'photo'];

interface EntryInput {
  name: string;
  source: string;
  calories: number;
  grams?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  isEstimate: boolean;
  loggedAt: Date;
}

function optionalNum(v: unknown, field: string): number | undefined {
  if (v === undefined || v === null) return undefined;
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) throw new ValidationError(`${field} ongeldig`);
  return n;
}

function parseEntryInput(body: unknown, partial = false): Partial<EntryInput> {
  if (typeof body !== 'object' || body === null) {
    throw new ValidationError('Verwacht een JSON-object');
  }
  const b = body as Record<string, unknown>;
  const out: Partial<EntryInput> = {};

  if (b.name !== undefined || !partial) {
    const name = String(b.name ?? '').trim();
    if (!name) throw new ValidationError('name is verplicht');
    out.name = name;
  }
  if (b.calories !== undefined || !partial) {
    const cal = Number(b.calories);
    if (!Number.isFinite(cal) || cal < 0) throw new ValidationError('calories ongeldig');
    out.calories = Math.round(cal);
  }
  if (b.source !== undefined || !partial) {
    const source = String(b.source ?? 'manual');
    if (!SOURCES.includes(source)) throw new ValidationError('source ongeldig');
    out.source = source;
  }
  if (b.grams !== undefined) out.grams = optionalNum(b.grams, 'grams');
  if (b.protein !== undefined) out.protein = optionalNum(b.protein, 'protein');
  if (b.carbs !== undefined) out.carbs = optionalNum(b.carbs, 'carbs');
  if (b.fat !== undefined) out.fat = optionalNum(b.fat, 'fat');
  if (b.fiber !== undefined) out.fiber = optionalNum(b.fiber, 'fiber');
  if (b.isEstimate !== undefined) out.isEstimate = Boolean(b.isEstimate);
  if (b.loggedAt !== undefined) {
    const d = new Date(String(b.loggedAt));
    if (Number.isNaN(d.getTime())) throw new ValidationError('loggedAt ongeldig');
    out.loggedAt = d;
  }
  return out;
}

export async function entryRoutes(app: FastifyInstance) {
  // Items van een dag.
  app.get('/api/entries', async (req, reply) => {
    const dateStr =
      (req.query as { date?: string }).date ?? new Date().toISOString().slice(0, 10);
    let bounds;
    try {
      bounds = dayBoundsUtc(dateStr);
    } catch {
      return reply.code(400).send({ error: 'Ongeldige datum (YYYY-MM-DD)' });
    }
    return prisma.foodEntry.findMany({
      where: { loggedAt: { gte: bounds.start, lt: bounds.end } },
      // loggedAt is nu middag-UTC per dag (gelijk voor items op dezelfde dag),
      // dus createdAt bepaalt de stabiele volgorde binnen een dag.
      orderBy: [{ loggedAt: 'asc' }, { createdAt: 'asc' }],
    });
  });

  // Item loggen.
  app.post('/api/entries', async (req, reply) => {
    let input;
    try {
      input = parseEntryInput(req.body);
    } catch (err) {
      if (err instanceof ValidationError) return reply.code(400).send({ error: err.message });
      throw err;
    }
    return prisma.foodEntry.create({
      data: {
        name: input.name!,
        source: input.source!,
        calories: input.calories!,
        grams: input.grams,
        protein: input.protein,
        carbs: input.carbs,
        fat: input.fat,
        fiber: input.fiber,
        isEstimate: input.isEstimate ?? false,
        loggedAt: input.loggedAt ?? new Date(),
      },
    });
  });

  // Item bewerken.
  app.patch('/api/entries/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    let input;
    try {
      input = parseEntryInput(req.body, true);
    } catch (err) {
      if (err instanceof ValidationError) return reply.code(400).send({ error: err.message });
      throw err;
    }
    try {
      return await prisma.foodEntry.update({ where: { id }, data: input });
    } catch {
      return reply.code(404).send({ error: 'Item niet gevonden' });
    }
  });

  // Item verwijderen.
  app.delete('/api/entries/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    try {
      await prisma.foodEntry.delete({ where: { id } });
      return reply.code(204).send();
    } catch {
      return reply.code(404).send({ error: 'Item niet gevonden' });
    }
  });
}
