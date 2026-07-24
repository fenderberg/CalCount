import { shiftDay } from './dates.js';

export interface StreakResult {
  currentStreak: number;
  longestStreak: number;
  totalLoggedDays: number;
  loggedToday: boolean;
}

/**
 * Berekent logreeksen uit kalenderdagen (YYYY-MM-DD).
 * Een reeks blijft gedurende de huidige dag actief: als vandaag nog niet is
 * gelogd, mag gisteren dus nog het einde van de huidige reeks zijn.
 */
export function calculateStreak(loggedDays: Iterable<string>, today: string): StreakResult {
  const days = [...new Set(loggedDays)].sort();
  const daySet = new Set(days);
  const loggedToday = daySet.has(today);

  let currentStreak = 0;
  let cursor = loggedToday ? today : shiftDay(today, -1);
  while (daySet.has(cursor)) {
    currentStreak += 1;
    cursor = shiftDay(cursor, -1);
  }

  let longestStreak = 0;
  let run = 0;
  let previous: string | undefined;
  for (const day of days) {
    run = previous && day === shiftDay(previous, 1) ? run + 1 : 1;
    longestStreak = Math.max(longestStreak, run);
    previous = day;
  }

  return {
    currentStreak,
    longestStreak,
    totalLoggedDays: days.length,
    loggedToday,
  };
}
