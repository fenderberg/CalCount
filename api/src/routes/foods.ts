import type { FastifyInstance } from 'fastify';
import { prisma } from '../db.js';
import { AiUnavailableError, estimateFromText } from '../services/aiEstimate.js';
import { searchFoods } from '../services/openFoodFacts.js';

export async function foodRoutes(app: FastifyInstance) {
  // Producten zoeken (Open Food Facts + lokale cache).
  app.get('/api/foods/search', async (req) => {
    const q = (req.query as { q?: string }).q ?? '';
    return searchFoods(q);
  });

  // AI-tekstschatting van een portie. 503 als AI niet is geconfigureerd.
  app.post('/api/foods/estimate', async (req, reply) => {
    const description = (req.body as { description?: string })?.description ?? '';
    if (description.trim().length < 2) {
      return reply.code(400).send({ error: 'Geef een omschrijving van het eten' });
    }
    try {
      return await estimateFromText(description);
    } catch (err) {
      if (err instanceof AiUnavailableError) {
        return reply.code(503).send({ error: err.message });
      }
      req.log.error(err);
      return reply.code(502).send({ error: 'AI-schatting mislukt, probeer het opnieuw' });
    }
  });

  // Recent/vaak gelogde items voor één-tik her-loggen (Story 2.4).
  app.get('/api/foods/recent', async () => {
    const entries = await prisma.foodEntry.findMany({
      orderBy: { loggedAt: 'desc' },
      take: 50,
    });
    // Dedup op naam, meest recente eerst.
    const seen = new Set<string>();
    const recent: typeof entries = [];
    for (const e of entries) {
      const key = e.name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      recent.push(e);
      if (recent.length >= 12) break;
    }
    return recent;
  });
}
