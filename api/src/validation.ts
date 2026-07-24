import type { ActivityLevel, Sex, ThemePreference, UserProfile } from '@calcount/core';

const ACTIVITY_LEVELS: ActivityLevel[] = [
  'sedentary',
  'light',
  'moderate',
  'active',
  'very_active',
];
const SEXES: Sex[] = ['male', 'female'];
const THEMES: ThemePreference[] = ['light', 'dark'];

export class ValidationError extends Error {}

function timeZone(value: unknown): string | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const zone = String(value);
  try {
    new Intl.DateTimeFormat('nl-NL', { timeZone: zone }).format();
  } catch {
    throw new ValidationError('timeZone moet een geldige IANA-tijdzone zijn');
  }
  return zone;
}

function num(value: unknown, field: string, min: number, max: number): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) {
    throw new ValidationError(`${field} moet een getal zijn`);
  }
  if (n < min || n > max) {
    throw new ValidationError(`${field} moet tussen ${min} en ${max} liggen`);
  }
  return n;
}

/** Valideert en normaliseert een inkomend profiel-payload. */
export function parseProfileInput(body: unknown): UserProfile {
  if (typeof body !== 'object' || body === null) {
    throw new ValidationError('Verwacht een JSON-object');
  }
  const b = body as Record<string, unknown>;

  const heightCm = num(b.heightCm, 'heightCm', 50, 260);
  const weightKg = num(b.weightKg, 'weightKg', 20, 400);
  const goalRateKgPerWeek = num(b.goalRateKgPerWeek, 'goalRateKgPerWeek', -1.5, 1.5);

  const birthDate = String(b.birthDate ?? '');
  if (Number.isNaN(new Date(birthDate).getTime())) {
    throw new ValidationError('birthDate moet een geldige ISO-datum zijn');
  }

  const sex = b.sex as Sex;
  if (!SEXES.includes(sex)) {
    throw new ValidationError(`sex moet een van ${SEXES.join(', ')} zijn`);
  }

  const activityLevel = b.activityLevel as ActivityLevel;
  if (!ACTIVITY_LEVELS.includes(activityLevel)) {
    throw new ValidationError(
      `activityLevel moet een van ${ACTIVITY_LEVELS.join(', ')} zijn`,
    );
  }

  const profile: UserProfile = {
    heightCm,
    weightKg,
    birthDate,
    sex,
    activityLevel,
    goalRateKgPerWeek,
  };
  if (b.targetWeightKg !== undefined && b.targetWeightKg !== null) {
    profile.targetWeightKg = num(b.targetWeightKg, 'targetWeightKg', 20, 400);
  }
  const parsedTimeZone = timeZone(b.timeZone);
  if (parsedTimeZone) profile.timeZone = parsedTimeZone;
  const theme = b.theme ?? 'light';
  if (!THEMES.includes(theme as ThemePreference)) {
    throw new ValidationError(`theme moet een van ${THEMES.join(', ')} zijn`);
  }
  profile.theme = theme as ThemePreference;
  return profile;
}
