export const BADGE_KEYS = [
  'streak-3',
  'streak-7',
  'streak-30',
  'logged-days-30',
  'weight-trend',
] as const;

export type BadgeKey = (typeof BADGE_KEYS)[number];

export interface BadgeDefinition {
  key: BadgeKey;
  title: string;
  description: string;
  icon: string;
  target: number;
  metric: 'longestStreak' | 'totalLoggedDays' | 'weightTrend';
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
] as const;

export interface BadgeWeightPoint {
  measuredAt: Date | string;
  weightKg: number;
}

export interface BadgeMetrics {
  longestStreak: number;
  totalLoggedDays: number;
  weightTrend: boolean;
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
    if (badge.metric === 'weightTrend') return metrics.weightTrend;
    return metrics[badge.metric] >= badge.target;
  }).map((badge) => badge.key);
}

export function badgeProgress(
  badge: BadgeDefinition,
  metrics: BadgeMetrics,
): { current: number; target: number } {
  const current =
    badge.metric === 'weightTrend'
      ? Number(metrics.weightTrend)
      : metrics[badge.metric];
  return { current: Math.min(current, badge.target), target: badge.target };
}
