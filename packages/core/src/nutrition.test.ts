import { describe, expect, it } from 'vitest';
import { calculateNutritionTargets, summarizeNutrition } from './nutrition.js';
import type { UserProfile } from './types.js';

const profile: UserProfile = {
  heightCm: 180,
  weightKg: 85,
  targetWeightKg: 75,
  birthDate: '1990-01-01',
  sex: 'male',
  activityLevel: 'moderate',
  goalRateKgPerWeek: -0.5,
};

describe('calculateNutritionTargets', () => {
  it('geeft bij afvallen extra eiwit op basis van het streefgewicht', () => {
    const targets = calculateNutritionTargets(profile, 2200);
    expect(targets.protein).toBe(90);
    expect(targets.carbs).toEqual({ min: 220, max: 385 });
    expect(targets.fat).toEqual({ min: 50, max: 100 });
    expect(targets.fiber).toBe(31);
  });
});

describe('summarizeNutrition', () => {
  const targets = calculateNutritionTargets(profile, 2200);

  it('berekent totalen, energieratio en caloriegewogen dekking', () => {
    const result = summarizeNutrition([
      { calories: 600, protein: 30, carbs: 60, fat: 20, fiber: 8 },
      { calories: 400, protein: 20, carbs: 30, fat: 15 },
    ], targets);
    expect(result.totals).toMatchObject({ calories: 1000, protein: 50, carbs: 90, fat: 35, fiber: 8 });
    expect(result.coverage).toBe(60);
    expect(result.macroRatio).toEqual({ protein: 23, carbs: 41, fat: 36 });
  });

  it('behandelt volledig onbekende voeding niet als nulmeting', () => {
    const result = summarizeNutrition([{ calories: 500 }], targets);
    expect(result.coverage).toBe(0);
    expect(result.macroRatio).toBeNull();
  });
});
