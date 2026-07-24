import type { FastifyInstance } from 'fastify';
import {
  AiUnavailableError,
  estimateFromPhoto,
  isValidPhotoMediaType,
} from '../services/aiEstimate.js';

export async function photoRoutes(app: FastifyInstance) {
  // Foto → AI-schatting (nog niet opgeslagen; opslaan gebeurt via POST /api/entries).
  app.post('/api/photo/analyze', async (req, reply) => {
    const body = req.body as { image?: string; mediaType?: string } | undefined;
    const image = body?.image ?? '';
    const mediaType = body?.mediaType ?? '';
    if (!image || !mediaType) {
      return reply.code(400).send({ error: 'image en mediaType zijn verplicht' });
    }
    if (!isValidPhotoMediaType(mediaType)) {
      return reply
        .code(400)
        .send({ error: 'mediaType moet image/jpeg, image/png, image/gif of image/webp zijn' });
    }
    try {
      return await estimateFromPhoto(image, mediaType);
    } catch (err) {
      if (err instanceof AiUnavailableError) {
        return reply.code(503).send({ error: err.message });
      }
      req.log.error(err);
      return reply.code(502).send({ error: 'AI-fotoherkenning mislukt, probeer het opnieuw' });
    }
  });
}
