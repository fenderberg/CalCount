import type { FastifyInstance } from 'fastify';
import { prisma, PROFILE_ID } from '../db.js';
import {
  answerCoach,
  buildAdviceContext,
  dateInTimeZone,
  generateInsight,
  hasEnoughAdviceData,
  type CoachMessage,
} from '../services/aiAdvice.js';
import { AiUnavailableError } from '../services/aiEstimate.js';

const MAX_COACH_QUESTIONS = 20;

function validTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat('nl-NL', { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}

async function profileTimeZone(requested?: string) {
  const profile = await prisma.profile.findUnique({ where: { id: PROFILE_ID } });
  if (!profile) return null;
  return profile.timeZone ?? requested ?? 'UTC';
}

export async function adviceRoutes(app: FastifyInstance) {
  app.get('/api/insights', async (req, reply) => {
    const requested = (req.query as { timeZone?: string }).timeZone;
    if (requested && !validTimeZone(requested)) {
      return reply.code(400).send({ error: 'Ongeldige tijdzone' });
    }
    const timeZone = await profileTimeZone(requested);
    if (!timeZone) return reply.code(404).send({ error: 'Nog geen profiel ingesteld' });

    const latest = await prisma.aiInsight.findFirst({ orderBy: { createdAt: 'desc' } });
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    if (latest && latest.createdAt >= oneWeekAgo) {
      return { status: 'ready', insight: latest };
    }

    const context = await buildAdviceContext(timeZone, 7);
    if (!context || !hasEnoughAdviceData(context)) {
      return {
        status: 'insufficient',
        message: 'Log op minstens vier dagen binnen een week om een betrouwbaar inzicht te krijgen.',
        insight: latest,
      };
    }
    try {
      const content = await generateInsight(context);
      const insight = await prisma.aiInsight.create({
        data: { windowStart: context.windowStart, windowEnd: context.windowEnd, content },
      });
      return { status: 'ready', insight };
    } catch (error) {
      if (!(error instanceof AiUnavailableError)) req.log.error(error);
      return reply.code(503).send({
        error: error instanceof AiUnavailableError
          ? error.message
          : 'Het wekelijkse inzicht kon nu niet worden gemaakt. Probeer het later opnieuw.',
      });
    }
  });

  app.get('/api/coach/usage', async (req, reply) => {
    const requested = (req.query as { timeZone?: string }).timeZone;
    if (requested && !validTimeZone(requested)) {
      return reply.code(400).send({ error: 'Ongeldige tijdzone' });
    }
    const timeZone = await profileTimeZone(requested);
    if (!timeZone) return reply.code(404).send({ error: 'Nog geen profiel ingesteld' });
    const day = dateInTimeZone(timeZone);
    const usage = await prisma.aiCoachUsage.findUnique({ where: { day } });
    return { used: Math.min(usage?.count ?? 0, MAX_COACH_QUESTIONS), remaining: Math.max(0, MAX_COACH_QUESTIONS - (usage?.count ?? 0)) };
  });

  app.post('/api/coach', async (req, reply) => {
    const body = req.body as {
      question?: unknown;
      history?: unknown;
      timeZone?: unknown;
    };
    const question = String(body?.question ?? '').trim();
    if (!question || question.length > 1000) {
      return reply.code(400).send({ error: 'Voer een vraag van maximaal 1000 tekens in.' });
    }
    const requested = typeof body.timeZone === 'string' ? body.timeZone : undefined;
    if (requested && !validTimeZone(requested)) {
      return reply.code(400).send({ error: 'Ongeldige tijdzone' });
    }
    const rawHistory = Array.isArray(body.history) ? body.history : [];
    const history: CoachMessage[] = rawHistory
      .filter((item): item is CoachMessage => {
        if (!item || typeof item !== 'object') return false;
        const candidate = item as Partial<CoachMessage>;
        return (candidate.role === 'user' || candidate.role === 'assistant') &&
          typeof candidate.content === 'string';
      })
      .slice(-12)
      .map((item) => ({ ...item, content: item.content.slice(0, 2000) }));

    const timeZone = await profileTimeZone(requested);
    if (!timeZone) return reply.code(404).send({ error: 'Nog geen profiel ingesteld' });
    const context = await buildAdviceContext(timeZone, 28);
    if (!context || !hasEnoughAdviceData(context)) {
      return reply.code(422).send({
        error: 'Er is nog te weinig gelogde data voor een zinvol antwoord. Log eerst op minstens vier dagen.',
      });
    }

    const day = dateInTimeZone(timeZone);
    const usage = await prisma.aiCoachUsage.upsert({
      where: { day },
      create: { day, count: 1 },
      update: { count: { increment: 1 } },
    });
    if (usage.count > MAX_COACH_QUESTIONS) {
      await prisma.aiCoachUsage.update({ where: { day }, data: { count: MAX_COACH_QUESTIONS } });
      return reply.code(429).send({ error: 'Je hebt vandaag 20 coachvragen gebruikt. Morgen kun je verder.' });
    }
    try {
      const answer = await answerCoach(context, question, history);
      return { answer, remaining: MAX_COACH_QUESTIONS - usage.count };
    } catch (error) {
      await prisma.aiCoachUsage.update({ where: { day }, data: { count: { decrement: 1 } } });
      if (!(error instanceof AiUnavailableError)) req.log.error(error);
      return reply.code(503).send({
        error: error instanceof AiUnavailableError
          ? error.message
          : 'De AI-coach is nu niet bereikbaar. Je logboek en budget blijven gewoon werken.',
      });
    }
  });
}
