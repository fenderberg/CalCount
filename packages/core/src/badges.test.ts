import { describe, expect, it } from 'vitest';
import {
  badgeProgress,
  BADGE_DEFINITIONS,
  eligibleBadgeKeys,
  hasWeightTrendTowardTarget,
  weightMilestoneMetrics,
  type BadgeMetrics,
} from './badges.js';

const metrics = (overrides: Partial<BadgeMetrics> = {}): BadgeMetrics => ({
  longestStreak: 0,
  totalLoggedDays: 0,
  weightTrend: false,
  weightLostKg: 0,
  halfwayToGoal: false,
  goalReached: false,
  ...overrides,
});

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
      eligibleBadgeKeys(metrics({ longestStreak: 30, totalLoggedDays: 30 })),
    ).toEqual(['streak-3', 'streak-7', 'streak-30', 'logged-days-30', 'first-log']);
  });

  it('kent first-log al toe vanaf de eerste logdag', () => {
    expect(eligibleBadgeKeys(metrics({ totalLoggedDays: 1 }))).toEqual(['first-log']);
  });

  it('kent gewichtsmijlpalen toe op basis van kilo’s kwijt', () => {
    expect(
      eligibleBadgeKeys(metrics({ weightLostKg: 6, halfwayToGoal: true })),
    ).toEqual(['weight-lost-5', 'halfway-to-goal']);
  });

  it('begrensde voortgang overschrijdt het doel niet', () => {
    expect(
      badgeProgress(BADGE_DEFINITIONS[0], metrics({ longestStreak: 12, totalLoggedDays: 12 })),
    ).toEqual({ current: 3, target: 3 });
  });

  it('geeft booleaanse mijlpalen weer als 0/1-voortgang', () => {
    const goalReached = BADGE_DEFINITIONS.find((badge) => badge.key === 'goal-reached')!;
    expect(badgeProgress(goalReached, metrics({ goalReached: true }))).toEqual({
      current: 1,
      target: 1,
    });
    expect(badgeProgress(goalReached, metrics({ goalReached: false }))).toEqual({
      current: 0,
      target: 1,
    });
  });
});

describe('weightMilestoneMetrics', () => {
  it('telt kilo’s kwijt vanaf de eerste meting', () => {
    expect(weightMilestoneMetrics(weights(110, 108, 104), 95)).toMatchObject({
      weightLostKg: 6,
      halfwayToGoal: false,
      goalReached: false,
    });
  });

  it('herkent halverwege en doel bereikt', () => {
    // start 110, doel 95 -> 15 kg te gaan; 8 kg kwijt = over de helft
    expect(weightMilestoneMetrics(weights(110, 102), 95).halfwayToGoal).toBe(true);
    expect(weightMilestoneMetrics(weights(110, 94), 95).goalReached).toBe(true);
  });

  it('gaat nooit onder nul en negeert een doel dat niet lager ligt', () => {
    expect(weightMilestoneMetrics(weights(100, 102), 95).weightLostKg).toBe(0);
    expect(weightMilestoneMetrics(weights(100, 98), 105)).toEqual({
      weightLostKg: 2,
      halfwayToGoal: false,
      goalReached: false,
    });
  });
});
