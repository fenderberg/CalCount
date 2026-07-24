import { describe, expect, it } from 'vitest';
import {
  badgeProgress,
  BADGE_DEFINITIONS,
  eligibleBadgeKeys,
  hasWeightTrendTowardTarget,
} from './badges.js';

const weights = (...values: number[]) =>
  values.map((weightKg, index) => ({
    weightKg,
    measuredAt: `2026-07-${String(index + 1).padStart(2, '0')}T12:00:00Z`,
  }));

describe('hasWeightTrendTowardTarget', () => {
  it('vereist minimaal drie metingen en een doel', () => {
    expect(hasWeightTrendTowardTarget(weights(90, 89), 80)).toBe(false);
    expect(hasWeightTrendTowardTarget(weights(90, 89, 88), null)).toBe(false);
  });

  it('herkent een dalende trend richting een lager doel', () => {
    expect(hasWeightTrendTowardTarget(weights(90, 89.4, 88.8), 80)).toBe(true);
  });

  it('herkent een stijgende trend richting een hoger doel', () => {
    expect(hasWeightTrendTowardTarget(weights(60, 60.5, 61.1), 70)).toBe(true);
  });

  it('wijst ruis of een trend van het doel af', () => {
    expect(hasWeightTrendTowardTarget(weights(90, 89, 90.2), 80)).toBe(false);
    expect(hasWeightTrendTowardTarget(weights(90, 91, 92), 80)).toBe(false);
  });
});

describe('badges', () => {
  it('kent alle bereikte streak- en logdagbadges toe', () => {
    expect(
      eligibleBadgeKeys({ longestStreak: 30, totalLoggedDays: 30, weightTrend: false }),
    ).toEqual(['streak-3', 'streak-7', 'streak-30', 'logged-days-30']);
  });

  it('begrensde voortgang overschrijdt het doel niet', () => {
    expect(
      badgeProgress(BADGE_DEFINITIONS[0], {
        longestStreak: 12,
        totalLoggedDays: 12,
        weightTrend: false,
      }),
    ).toEqual({ current: 3, target: 3 });
  });
});
