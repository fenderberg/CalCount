import type { FastifyInstance } from 'fastify';
import { prisma, PROFILE_ID } from '../db.js';
import { parseProfileInput, ValidationError } from '../validation.js';

export async function profileRoutes(app: FastifyInstance) {
  // Profiel ophalen. 404 als er nog geen profiel is (onboarding nog niet gedaan).
  app.get('/api/profile', async (_req, reply) => {
    const profile = await prisma.profile.findUnique({ where: { id: PROFILE_ID } });
    if (!profile) {
      return reply.code(404).send({ error: 'Nog geen profiel ingesteld' });
    }
    return profile;
  });

  // Profiel + doel opslaan of wijzigen (upsert; single-user).
  app.put('/api/profile', async (req, reply) => {
    let input;
    try {
      input = parseProfileInput(req.body);
    } catch (err) {
      if (err instanceof ValidationError) {
        return reply.code(400).send({ error: err.message });
      }
      throw err;
    }

    // PUT is een volledige vervanging: een ontbrekend streefgewicht wist het.
    const data = { ...input, targetWeightKg: input.targetWeightKg ?? null };
    const profile = await prisma.profile.upsert({
      where: { id: PROFILE_ID },
      create: { id: PROFILE_ID, ...data },
      update: data,
    });
    return profile;
  });
}
