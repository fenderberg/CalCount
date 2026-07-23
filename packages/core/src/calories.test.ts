import { describe, expect, it } from 'vitest';
import {
  ACTIVITY_FACTORS,
  calculateAge,
  calculateBMR,
  calculateDailyBudget,
  calculateTDEE,
  SAFE_FLOOR,
  summarizeDay,
} from './calories.js';
import type { UserProfile } from './types.js';

// Vaste peildatum zodat leeftijd deterministisch is.
const NOW = new Date('2026-07-22T12:00:00Z');

const maleProfile: UserProfile = {
  heightCm: 180,
  weightKg: 85,
  birthDate: '1990-01-01',
  sex: 'male',
  activityLevel: 'moderate',
  goalRateKgPerWeek: -0.5,
};

const femaleProfile: UserProfile = {
  heightCm: 165,
  weightKg: 60,
  birthDate: '1995-06-15',
  sex: 'female',
  activityLevel: 'light',
  goalRateKgPerWeek: -0.5,
};

describe('calculateAge', () => {
  it('berekent hele jaren op de peildatum', () => {
    expect(calculateAge('1990-01-01', NOW)).toBe(36);
  });

  it('trekt een jaar af als de verjaardag nog niet is geweest', () => {
    // Geboortedag 15 juni al voorbij op 22 juli
    expect(calculateAge('1995-06-15', NOW)).toBe(31);
    // Geboortedag in september nog niet geweest
    expect(calculateAge('1995-09-15', NOW)).toBe(30);
  });

  it('gooit een fout bij een ongeldige datum', () => {
    expect(() => calculateAge('geen-datum', NOW)).toThrow();
  });
});

describe('calculateBMR (Mifflin-St Jeor)', () => {
  it('gebruikt +5 voor mannen', () => {
    // 10*85 + 6.25*180 - 5*36 + 5 = 850 + 1125 - 180 + 5 = 1800
    expect(calculateBMR(maleProfile, NOW)).toBeCloseTo(1800, 5);
  });

  it('gebruikt -161 voor vrouwen', () => {
    // 10*60 + 6.25*165 - 5*31 - 161 = 600 + 1031.25 - 155 - 161 = 1315.25
    expect(calculateBMR(femaleProfile, NOW)).toBeCloseTo(1315.25, 5);
  });
});

describe('calculateTDEE', () => {
  it('vermenigvuldigt BMR met de activiteitsfactor', () => {
    const expected = 1800 * ACTIVITY_FACTORS.moderate; // 2790
    expect(calculateTDEE(maleProfile, NOW)).toBeCloseTo(expected, 5);
  });
});

describe('calculateDailyBudget', () => {
  it('trekt een dagelijks tekort af bij afvallen', () => {
    // TDEE 2790, tekort = -0.5 * 7700 / 7 = -550 => budget 2240
    const result = calculateDailyBudget(maleProfile, NOW);
    expect(result.tdee).toBe(2790);
    expect(result.budget).toBe(2240);
    expect(result.clampedToFloor).toBe(false);
  });

  it('zet het budget vast op de veilige ondergrens bij een te agressief doel', () => {
    const aggressive: UserProfile = {
      ...femaleProfile,
      goalRateKgPerWeek: -1.5, // tekort ~ -1650/dag
    };
    const result = calculateDailyBudget(aggressive, NOW);
    expect(result.clampedToFloor).toBe(true);
    expect(result.budget).toBe(SAFE_FLOOR.female);
  });

  it('geeft het onderhoudsniveau als budget bij doeltempo 0', () => {
    const maintain: UserProfile = { ...maleProfile, goalRateKgPerWeek: 0 };
    const result = calculateDailyBudget(maintain, NOW);
    expect(result.budget).toBe(result.tdee);
  });
});

describe('summarizeDay', () => {
  const budget = calculateDailyBudget(maleProfile, NOW); // budget 2240

  it('status "under" als er ruim budget over is', () => {
    const day = summarizeDay(budget, 1000);
    expect(day.remaining).toBe(1240);
    expect(day.status).toBe('under');
  });

  it('status "near" vlak onder het budget', () => {
    const day = summarizeDay(budget, 2100); // remaining 140 < 10% van 2240 (224)
    expect(day.status).toBe('near');
  });

  it('status "over" bij overschrijding', () => {
    const day = summarizeDay(budget, 2500);
    expect(day.remaining).toBe(-260);
    expect(day.status).toBe('over');
  });
});
