import { describe, expect, it } from 'vitest';
import { calculateStreak } from './streak.js';

describe('calculateStreak', () => {
  it('telt een reeks die vandaag eindigt', () => {
    expect(calculateStreak(['2026-07-22', '2026-07-23', '2026-07-24'], '2026-07-24')).toEqual({
      currentStreak: 3,
      longestStreak: 3,
      totalLoggedDays: 3,
      loggedToday: true,
    });
  });

  it('houdt de reeks gedurende een nog lege huidige dag actief', () => {
    const result = calculateStreak(['2026-07-22', '2026-07-23'], '2026-07-24');
    expect(result.currentStreak).toBe(2);
    expect(result.loggedToday).toBe(false);
  });

  it('zet de huidige reeks na een volledig gemiste dag terug', () => {
    const result = calculateStreak(['2026-07-20', '2026-07-21'], '2026-07-24');
    expect(result.currentStreak).toBe(0);
    expect(result.longestStreak).toBe(2);
  });

  it('dedupliceert meerdere items op dezelfde dag', () => {
    const result = calculateStreak(
      ['2026-07-23', '2026-07-23', '2026-07-24'],
      '2026-07-24',
    );
    expect(result.currentStreak).toBe(2);
    expect(result.totalLoggedDays).toBe(2);
  });

  it('bewaart de langste historische reeks na een onderbreking', () => {
    const result = calculateStreak(
      ['2026-07-10', '2026-07-11', '2026-07-12', '2026-07-23', '2026-07-24'],
      '2026-07-24',
    );
    expect(result.currentStreak).toBe(2);
    expect(result.longestStreak).toBe(3);
  });

  it('herberekent naar nul als de laatste logdag is verwijderd', () => {
    expect(calculateStreak([], '2026-07-24').currentStreak).toBe(0);
  });
});
