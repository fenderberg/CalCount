import type {
  ActivityLevel,
  BudgetResult,
  DaySummary,
  Sex,
  UserProfile,
} from './types.js';

/** Activiteitsfactoren voor TDEE (Mifflin-St Jeor). */
export const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

/** Kcal per kg lichaamsvet (gangbare vuistregel). */
export const KCAL_PER_KG = 7700;

/** Veilige ondergrens per geslacht — niet aanbevolen eronder te gaan. */
export const SAFE_FLOOR: Record<Sex, number> = {
  female: 1200,
  male: 1500,
};

/** Leeftijd in hele jaren op een peildatum. */
export function calculateAge(birthDate: string, now: Date = new Date()): number {
  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) {
    throw new Error(`Ongeldige geboortedatum: ${birthDate}`);
  }
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age;
}

/** Basaal metabolisme (BMR) volgens Mifflin-St Jeor. */
export function calculateBMR(profile: UserProfile, now: Date = new Date()): number {
  const age = calculateAge(profile.birthDate, now);
  const base = 10 * profile.weightKg + 6.25 * profile.heightCm - 5 * age;
  return profile.sex === 'male' ? base + 5 : base - 161;
}

/** Onderhoudsniveau (TDEE) = BMR × activiteitsfactor. */
export function calculateTDEE(profile: UserProfile, now: Date = new Date()): number {
  return calculateBMR(profile, now) * ACTIVITY_FACTORS[profile.activityLevel];
}

/**
 * Dagelijks caloriebudget op basis van doeltempo, met veilige ondergrens.
 * Een negatief doeltempo (afvallen) verlaagt het budget onder het onderhoudsniveau.
 */
export function calculateDailyBudget(
  profile: UserProfile,
  now: Date = new Date(),
): BudgetResult {
  const tdee = calculateTDEE(profile, now);
  const dailyAdjustment = (profile.goalRateKgPerWeek * KCAL_PER_KG) / 7;
  const rawBudget = tdee + dailyAdjustment;
  const floor = SAFE_FLOOR[profile.sex];

  const clampedToFloor = rawBudget < floor;
  const budget = clampedToFloor ? floor : rawBudget;

  return {
    tdee: Math.round(tdee),
    budget: Math.round(budget),
    floor,
    clampedToFloor,
  };
}

/** Drempel (fractie van budget) waaronder de dag als "bijna vol" geldt. */
export const NEAR_THRESHOLD = 0.1;

/** Combineer budget met de reeds gegeten calorieën tot een dagoverzicht. */
export function summarizeDay(
  budgetResult: BudgetResult,
  consumed: number,
): DaySummary {
  const remaining = budgetResult.budget - consumed;
  let status: DaySummary['status'];
  if (remaining < 0) {
    status = 'over';
  } else if (remaining <= budgetResult.budget * NEAR_THRESHOLD) {
    status = 'near';
  } else {
    status = 'under';
  }
  return { ...budgetResult, consumed, remaining, status };
}
