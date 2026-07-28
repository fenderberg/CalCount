import {
  BADGE_DEFINITIONS,
  badgeProgress,
  calculateStreak,
  eligibleBadgeKeys,
  hasWeightTrendTowardTarget,
  weightMilestoneMetrics,
  type BadgeKey,
} from '@calcount/core';
import { prisma, PROFILE_ID } from '../db.js';

export interface BadgeView {
  key: BadgeKey;
  title: string;
  description: string;
  icon: string;
  earnedAt: string | null;
  current: number;
  target: number;
}

export async function evaluateBadges(today: string): Promise<{
  badges: BadgeView[];
  newlyEarned: BadgeView[];
}> {
  const [profile, entries, weights, existingAwards] = await Promise.all([
    prisma.profile.findUnique({ where: { id: PROFILE_ID } }),
    prisma.foodEntry.findMany({ select: { loggedAt: true } }),
    prisma.weightEntry.findMany({ orderBy: { measuredAt: 'asc' } }),
    prisma.badgeAward.findMany(),
  ]);
  if (!profile) return { badges: [], newlyEarned: [] };

  const streak = calculateStreak(
    entries.map((entry) => entry.loggedAt.toISOString().slice(0, 10)),
    today,
  );
  const metrics = {
    longestStreak: streak.longestStreak,
    totalLoggedDays: streak.totalLoggedDays,
    weightTrend: hasWeightTrendTowardTarget(weights, profile.targetWeightKg),
    ...weightMilestoneMetrics(weights, profile.targetWeightKg),
  };
  const eligible = eligibleBadgeKeys(metrics);
  const existingKeys = new Set(existingAwards.map((award) => award.key));
  const newKeys = eligible.filter((key) => !existingKeys.has(key));

  if (newKeys.length > 0) {
    await prisma.badgeAward.createMany({
      data: newKeys.map((key) => ({ key })),
      skipDuplicates: true,
    });
  }
  const awards =
    newKeys.length > 0 ? await prisma.badgeAward.findMany() : existingAwards;
  const awardMap = new Map(awards.map((award) => [award.key, award.earnedAt]));

  const badges = BADGE_DEFINITIONS.map((definition) => ({
    ...definition,
    ...badgeProgress(definition, metrics),
    earnedAt: awardMap.get(definition.key)?.toISOString() ?? null,
  }));
  return {
    badges,
    newlyEarned: badges.filter((badge) => newKeys.includes(badge.key)),
  };
}
