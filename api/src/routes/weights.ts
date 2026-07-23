import type { FastifyInstance } from 'fastify';
import { prisma, PROFILE_ID } from '../db.js';
import { ValidationError } from '../validation.js';

function parseWeight(body: unknown, partial = false): {
  weightKg?: number;
  measuredAt?: Date;
} {
  if (typeof body !== 'object' || body === null) {
    throw new ValidationError('Verwacht een JSON-object');
  }
  const b = body as Record<string, unknown>;
  const out: { weightKg?: number; measuredAt?: Date } = {};

  if (b.weightKg !== undefined || !partial) {
    const w = Number(b.weightKg);
    if (!Number.isFinite(w) || w < 20 || w > 400) {
      throw new ValidationError('weightKg moet tussen 20 en 400 liggen');
    }
    out.weightKg = w;
  }
  if (b.measuredAt !== undefined) {
    const d = new Date(String(b.measuredAt));
    if (Number.isNaN(d.getTime())) throw new ValidationError('measuredAt ongeldig');
    out.measuredAt = d;
  }
  return out;
}

/**
 * Houdt het profielgewicht gelijk aan de meest recente meting, zodat TDEE en
 * budget automatisch meebewegen (PRD FR11). Doet niets als er geen metingen
 * meer zijn of geen profiel bestaat.
 */
async function syncProfileWeight(): Promise<void> {
  const latest = await prisma.weightEntry.findFirst({
    orderBy: { measuredAt: 'desc' },
  });
  if (!latest) return;
  await prisma.profile
    .update({ where: { id: PROFILE_ID }, data: { weightKg: latest.weightKg } })
    .catch(() => undefined); // profiel bestaat nog niet
}

export async function weightRoutes(app: FastifyInstance) {
  // Gewichtsverloop (oplopend op datum, voor de grafiek).
  app.get('/api/weights', async () =>
    prisma.weightEntry.findMany({ orderBy: { measuredAt: 'asc' } }),
  );

  // Gewichtsmeting toevoegen; synct het profielgewicht.
  app.post('/api/weights', async (req, reply) => {
    let input;
    try {
      input = parseWeight(req.body);
    } catch (err) {
      if (err instanceof ValidationError) return reply.code(400).send({ error: err.message });
      throw err;
    }
    const entry = await prisma.weightEntry.create({
      data: { weightKg: input.weightKg!, measuredAt: input.measuredAt ?? new Date() },
    });
    await syncProfileWeight();
    return entry;
  });

  // Meting bewerken.
  app.patch('/api/weights/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    let input;
    try {
      input = parseWeight(req.body, true);
    } catch (err) {
      if (err instanceof ValidationError) return reply.code(400).send({ error: err.message });
      throw err;
    }
    try {
      const entry = await prisma.weightEntry.update({ where: { id }, data: input });
      await syncProfileWeight();
      return entry;
    } catch {
      return reply.code(404).send({ error: 'Meting niet gevonden' });
    }
  });

  // Meting verwijderen.
  app.delete('/api/weights/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    try {
      await prisma.weightEntry.delete({ where: { id } });
      await syncProfileWeight();
      return reply.code(204).send();
    } catch {
      return reply.code(404).send({ error: 'Meting niet gevonden' });
    }
  });
}
