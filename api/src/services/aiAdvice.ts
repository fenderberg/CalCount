import Anthropic from '@anthropic-ai/sdk';
import { calculateDailyBudget, dayBoundsUtc, shiftDay, type UserProfile } from '@calcount/core';
import { prisma, PROFILE_ID } from '../db.js';
import { AiUnavailableError } from './aiEstimate.js';

const MODEL = process.env.CALCOUNT_AI_MODEL || 'claude-haiku-4-5';
const MIN_LOGGED_DAYS = 4;

export interface AdviceContext {
  windowStart: string;
  windowEnd: string;
  budget: number;
  loggedDays: number;
  days: { date: string; calories: number }[];
  weights: { date: string; weightKg: number }[];
  targetWeightKg: number | null;
}

export function dateInTimeZone(timeZone: string, now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

export async function buildAdviceContext(
  timeZone: string,
  daysBack: number,
): Promise<AdviceContext | null> {
  const profile = await prisma.profile.findUnique({ where: { id: PROFILE_ID } });
  if (!profile) return null;
  const windowEnd = dateInTimeZone(timeZone);
  const windowStart = shiftDay(windowEnd, -(daysBack - 1));
  const start = dayBoundsUtc(windowStart).start;
  const end = dayBoundsUtc(windowEnd).end;
  const [entries, weights] = await Promise.all([
    prisma.foodEntry.findMany({
      where: { loggedAt: { gte: start, lt: end } },
      select: { loggedAt: true, calories: true },
    }),
    prisma.weightEntry.findMany({
      where: { measuredAt: { gte: start, lt: end } },
      orderBy: { measuredAt: 'asc' },
    }),
  ]);
  const caloriesByDay = new Map<string, number>();
  for (const entry of entries) {
    const day = entry.loggedAt.toISOString().slice(0, 10);
    caloriesByDay.set(day, (caloriesByDay.get(day) ?? 0) + entry.calories);
  }
  const budget = calculateDailyBudget(profile as unknown as UserProfile).budget;
  return {
    windowStart,
    windowEnd,
    budget,
    loggedDays: caloriesByDay.size,
    days: Array.from({ length: daysBack }, (_, index) => {
      const date = shiftDay(windowStart, index);
      return { date, calories: Math.round(caloriesByDay.get(date) ?? 0) };
    }),
    weights: weights.map((weight) => ({
      date: dateInTimeZone(timeZone, weight.measuredAt),
      weightKg: weight.weightKg,
    })),
    targetWeightKg: profile.targetWeightKg,
  };
}

export function hasEnoughAdviceData(context: AdviceContext): boolean {
  return context.loggedDays >= MIN_LOGGED_DAYS;
}

async function askClaude(system: string, messages: { role: 'user' | 'assistant'; content: string }[]) {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new AiUnavailableError('AI-advies is niet geconfigureerd (geen API-sleutel)');
  }
  const response = await new Anthropic().messages.create({
    model: MODEL,
    max_tokens: 700,
    system,
    messages,
  });
  const text = response.content.find((block) => block.type === 'text');
  if (!text || text.type !== 'text') throw new Error('Onverwacht AI-antwoord');
  return text.text.trim();
}

export async function generateInsight(context: AdviceContext): Promise<string> {
  return askClaude(
    'Je bent de nuchtere voedingscoach van CalCount. Schrijf in het Nederlands maximaal ' +
      'drie korte alinea\'s: één concrete observatie, één mogelijke verklaring en één ' +
      'haalbare suggestie. Gebruik alleen de verstrekte data. Doe geen medische claims, ' +
      'stel geen diagnose en presenteer alles als suggestie. Benoem ontbrekende gewichtdata eerlijk.',
    [{ role: 'user', content: `Maak het wekelijkse inzicht uit deze data:\n${JSON.stringify(context)}` }],
  );
}

export interface CoachMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function answerCoach(
  context: AdviceContext,
  question: string,
  history: CoachMessage[],
): Promise<string> {
  return askClaude(
    'Je bent de AI-coach van CalCount. Antwoord kort en praktisch in het Nederlands, ' +
      'uitsluitend over voeding, caloriebudget of gewichtsvoortgang op basis van de ' +
      'meegegeven gebruikersdata. Formuleer advies als suggestie. Weiger medische vragen ' +
      'en onderwerpen buiten deze scope; fantaseer geen feiten. Gesprekshistorie is alleen ' +
      'voor deze browsersessie en mag niet als blijvend geheugen worden voorgesteld.',
    [
      { role: 'user', content: `Dit is mijn actuele CalCount-context:\n${JSON.stringify(context)}` },
      { role: 'assistant', content: 'Ik gebruik deze context alleen voor dit gesprek.' },
      ...history,
      { role: 'user', content: question },
    ],
  );
}
