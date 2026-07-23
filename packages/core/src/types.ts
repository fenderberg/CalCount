// Gedeelde domeintypes voor CalCount. Gewichten in kg, lengte in cm, calorieën in kcal.

export type Sex = 'male' | 'female';

export type ActivityLevel =
  | 'sedentary'
  | 'light'
  | 'moderate'
  | 'active'
  | 'very_active';

/** Persoonlijke gegevens + afvaldoel. Single-user v1: één profiel. */
export interface UserProfile {
  heightCm: number;
  weightKg: number;
  birthDate: string; // ISO-datum (YYYY-MM-DD), voor leeftijdsberekening
  sex: Sex;
  activityLevel: ActivityLevel;
  /** Doeltempo in kg/week. Negatief = afvallen (calorietekort). Bijv. -0.5. */
  goalRateKgPerWeek: number;
  targetWeightKg?: number;
}

/** Resultaat van de budgetberekening voor één dag. */
export interface BudgetResult {
  /** Onderhoudsniveau (Total Daily Energy Expenditure). */
  tdee: number;
  /** Dagelijks caloriebudget na toepassing van het doeltempo en de veilige ondergrens. */
  budget: number;
  /** De veilige ondergrens die is gehanteerd. */
  floor: number;
  /** True als het budget op de ondergrens is vastgezet (doel te agressief). */
  clampedToFloor: boolean;
}

export type DayStatus = 'under' | 'near' | 'over';

/** Dagoverzicht: budget vs. gegeten. */
export interface DaySummary extends BudgetResult {
  consumed: number;
  remaining: number;
  status: DayStatus;
}
