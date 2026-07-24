import type { Sex, UserProfile } from './types.js';

export interface NutritionValues {
  calories: number;
  protein?: number | null;
  carbs?: number | null;
  fat?: number | null;
  fiber?: number | null;
}

export interface NutritionRange {
  min: number;
  max: number;
}

export interface NutritionTargets {
  protein: number;
  carbs: NutritionRange;
  fat: NutritionRange;
  fiber: number;
}

export interface NutritionTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export interface MacroRatio {
  protein: number;
  carbs: number;
  fat: number;
}

export interface NutritionSummary {
  totals: NutritionTotals;
  targets: NutritionTargets;
  coverage: number;
  macroRatio: MacroRatio | null;
}

const FIBER_MINIMUM: Record<Sex, number> = { female: 25, male: 30 };

function roundToFive(value: number): number {
  return Math.round(value / 5) * 5;
}

/**
 * Praktische richtwaarden voor een globaal patroon, niet voor medische precisie.
 * Eiwit krijgt bij afvallen extra nadruk; koolhydraten en vet blijven bandbreedtes.
 */
export function calculateNutritionTargets(
  profile: UserProfile,
  calorieBudget: number,
): NutritionTargets {
  const losingWeight = profile.goalRateKgPerWeek < 0;
  const referenceWeight =
    losingWeight && profile.targetWeightKg
      ? Math.min(profile.weightKg, profile.targetWeightKg)
      : profile.weightKg;
  const proteinByWeight = losingWeight
    ? Math.max(0.83 * profile.weightKg, 1.2 * referenceWeight)
    : 0.83 * referenceWeight;
  const proteinEnergyCap = (calorieBudget * 0.25) / 4;
  const protein = roundToFive(Math.min(proteinByWeight, proteinEnergyCap));

  const carbs = {
    min: roundToFive((calorieBudget * 0.4) / 4),
    max: roundToFive((calorieBudget * 0.7) / 4),
  };
  const fat = {
    min: roundToFive((calorieBudget * 0.2) / 9),
    max: roundToFive((calorieBudget * 0.4) / 9),
  };
  const energyAdjustedFiber = (calorieBudget * 4.184 * 3.4) / 1000;
  const fiber = Math.round(Math.max(FIBER_MINIMUM[profile.sex], energyAdjustedFiber));

  return { protein, carbs, fat, fiber };
}

/** Somt alleen bekende waarden op en telt onbekend nooit als nul mee in de dekking. */
export function summarizeNutrition(
  entries: NutritionValues[],
  targets: NutritionTargets,
): NutritionSummary {
  const totals: NutritionTotals = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
  };
  let completeCalories = 0;
  let macroProtein = 0;
  let macroCarbs = 0;
  let macroFat = 0;

  for (const entry of entries) {
    totals.calories += entry.calories;
    if (entry.protein != null) totals.protein += entry.protein;
    if (entry.carbs != null) totals.carbs += entry.carbs;
    if (entry.fat != null) totals.fat += entry.fat;
    if (entry.fiber != null) totals.fiber += entry.fiber;

    const complete =
      entry.protein != null && entry.carbs != null && entry.fat != null && entry.fiber != null;
    if (complete) completeCalories += entry.calories;
    if (entry.protein != null && entry.carbs != null && entry.fat != null) {
      macroProtein += entry.protein;
      macroCarbs += entry.carbs;
      macroFat += entry.fat;
    }
  }

  const macroEnergy = macroProtein * 4 + macroCarbs * 4 + macroFat * 9;
  const macroRatio = macroEnergy > 0
    ? {
        protein: Math.round((macroProtein * 4 * 100) / macroEnergy),
        carbs: Math.round((macroCarbs * 4 * 100) / macroEnergy),
        fat: Math.round((macroFat * 9 * 100) / macroEnergy),
      }
    : null;

  return {
    totals: Object.fromEntries(
      Object.entries(totals).map(([key, value]) => [key, Math.round(value * 10) / 10]),
    ) as unknown as NutritionTotals,
    targets,
    coverage: totals.calories > 0 ? Math.round((completeCalories * 100) / totals.calories) : 0,
    macroRatio,
  };
}
