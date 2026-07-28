export const BADGE_KEYS = [
  'first-log',
  'streak-3',
  'streak-7',
  'streak-30',
  'logged-days-30',
  'weight-trend',
  'weight-lost-5',
  'weight-lost-10',
  'halfway-to-goal',
  'goal-reached',
] as const;

export type BadgeKey = (typeof BADGE_KEYS)[number];

export interface BadgeDefinition {
  key: BadgeKey;
  title: string;
  description: string;
  icon: string;
  target: number;
  metric: keyof BadgeMetrics;
}

export const BADGE_DEFINITIONS: readonly BadgeDefinition[] = [
  {
    key: 'streak-3',
    title: 'Goed begonnen',
    description: '3 dagen achter elkaar gelogd',
    icon: '03',
    target: 3,
    metric: 'longestStreak',
  },
  {
    key: 'streak-7',
    title: 'Een volle week',
    description: '7 dagen achter elkaar gelogd',
    icon: '07',
    target: 7,
    metric: 'longestStreak',
  },
  {
    key: 'streak-30',
    title: 'Vaste gewoonte',
    description: '30 dagen achter elkaar gelogd',
    icon: '30',
    target: 30,
    metric: 'longestStreak',
  },
  {
    key: 'logged-days-30',
    title: '30 logdagen',
    description: 'Op 30 verschillende dagen gelogd',
    icon: 'Σ30',
    target: 30,
    metric: 'totalLoggedDays',
  },
  {
    key: 'weight-trend',
    title: 'In de goede richting',
    description: 'Je gewichtstrend beweegt richting je doel',
    icon: '↘',
    target: 1,
    metric: 'weightTrend',
  },
  {
    key: 'first-log',
    title: 'Van start',
    description: 'Je allereerste maaltijd gelogd',
    icon: '1',
    target: 1,
    metric: 'totalLoggedDays',
  },
  {
    key: 'weight-lost-5',
    title: '5 kilo lichter',
    description: '5 kg kwijt sinds je start',
    icon: '−5',
    target: 5,
    metric: 'weightLostKg',
  },
  {
    key: 'weight-lost-10',
    title: '10 kilo lichter',
    description: '10 kg kwijt sinds je start',
    icon: '−10',
    target: 10,
    metric: 'weightLostKg',
  },
  {
    key: 'halfway-to-goal',
    title: 'Halverwege',
    description: 'Halverwege naar je streefgewicht',
    icon: '½',
    target: 1,
    metric: 'halfwayToGoal',
  },
  {
    key: 'goal-reached',
    title: 'Doel bereikt',
    description: 'Je hebt je streefgewicht bereikt',
    icon: '★',
    target: 1,
    metric: 'goalReached',
  },
] as const;

export interface BadgeWeightPoint {
  measuredAt: Date | string;
  weightKg: number;
}

export interface BadgeMetrics {
  longestStreak: number;
  totalLoggedDays: number;
  weightTrend: boolean;
  /** Kilo's kwijt sinds de eerste meting (nooit negatief). */
  weightLostKg: number;
  /** True zodra minstens de helft van het verschil naar het doel is afgelegd. */
  halfwayToGoal: boolean;
  /** True zodra de laatste meting op of onder het streefgewicht ligt. */
  goalReached: boolean;
}

/**
 * Mijlpaalmetrieken op basis van gewichtsverloop. Baseline is de eerste meting,
 * consistent met {@link hasWeightTrendTowardTarget}. Alleen zinvol bij afvallen
 * (doel lager dan startgewicht); anders zijn de mijlpalen niet van toepassing.
 */
export function weightMilestoneMetrics(
  points: readonly BadgeWeightPoint[],
  targetWeightKg?: number | null,
): Pick<BadgeMetrics, 'weightLostKg' | 'halfwayToGoal' | 'goalReached'> {
  if (points.length === 0) {
    return { weightLostKg: 0, halfwayToGoal: false, goalReached: false };
  }
  const sorted = [...points].sort(
    (a, b) => new Date(a.measuredAt).getTime() - new Date(b.measuredAt).getTime(),
  );
  const start = sorted[0].weightKg;
  const latest = sorted[sorted.length - 1].weightKg;
  const weightLostKg = Math.max(0, Number((start - latest).toFixed(2)));
  if (targetWeightKg == null || targetWeightKg >= start) {
    return { weightLostKg, halfwayToGoal: false, goalReached: false };
  }
  const totalToLose = start - targetWeightKg;
  return {
    weightLostKg,
    halfwayToGoal: weightLostKg >= totalToLose / 2,
    goalReached: latest <= targetWeightKg,
  };
}

/** Minimaal drie metingen, met een regressietrend én netto vooruitgang richting doel. */
export function hasWeightTrendTowardTarget(
  points: readonly BadgeWeightPoint[],
  targetWeightKg?: number | null,
): boolean {
  if (targetWeightKg == null || points.length < 3) return false;
  const sorted = [...points].sort(
    (a, b) => new Date(a.measuredAt).getTime() - new Date(b.measuredAt).getTime(),
  );
  const first = sorted[0].weightKg;
  const latest = sorted[sorted.length - 1].weightKg;
  const desiredDirection = Math.sign(targetWeightKg - first);
  if (desiredDirection === 0) return false;

  const meanX = (sorted.length - 1) / 2;
  const meanY = sorted.reduce((sum, point) => sum + point.weightKg, 0) / sorted.length;
  let numerator = 0;
  let denominator = 0;
  sorted.forEach((point, index) => {
    numerator += (index - meanX) * (point.weightKg - meanY);
    denominator += (index - meanX) ** 2;
  });
  const slope = denominator === 0 ? 0 : numerator / denominator;
  const movesInDesiredDirection = Math.sign(slope) === desiredDirection;
  const closerThanStart =
    Math.abs(latest - targetWeightKg) < Math.abs(first - targetWeightKg);
  return Math.abs(slope) >= 0.01 && movesInDesiredDirection && closerThanStart;
}

export function eligibleBadgeKeys(metrics: BadgeMetrics): BadgeKey[] {
  return BADGE_DEFINITIONS.filter((badge) => {
    const value = metrics[badge.metric];
    return typeof value === 'boolean' ? value : value >= badge.target;
  }).map((badge) => badge.key);
}

export function badgeProgress(
  badge: BadgeDefinition,
  metrics: BadgeMetrics,
): { current: number; target: number } {
  const value = metrics[badge.metric];
  const current = typeof value === 'boolean' ? Number(value) : value;
  return { current: Math.min(current, badge.target), target: badge.target };
}
