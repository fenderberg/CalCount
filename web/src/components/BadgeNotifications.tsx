import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { getBadges, type BadgeKey, type BadgeView } from '../api.js';
import { Confetti } from './Confetti.js';

/** Mijlpalen krijgen een uitbundiger viering dan gewone badges. */
const MILESTONE_KEYS = new Set<BadgeKey>([
  'weight-lost-5',
  'weight-lost-10',
  'halfway-to-goal',
  'goal-reached',
]);

export function BadgeNotifications({ timeZone }: { timeZone: string }) {
  const query = useQuery({
    queryKey: ['badge-popup', timeZone],
    queryFn: () => getBadges(timeZone),
    refetchOnMount: 'always',
    gcTime: 0,
  });
  const [visible, setVisible] = useState<BadgeView[]>([]);
  const [burst, setBurst] = useState(0);
  const handled = useRef(new Set<string>());

  useEffect(() => {
    if (!query.isFetchedAfterMount || query.isFetching) return;
    const fresh = (query.data?.newlyEarned ?? []).filter(
      (badge) => !handled.current.has(`${badge.key}:${badge.earnedAt}`),
    );
    if (fresh.length === 0) return;
    fresh.forEach((badge) => handled.current.add(`${badge.key}:${badge.earnedAt}`));
    setVisible((current) => [...current, ...fresh]);
    setBurst((n) => n + 1);
    const timer = window.setTimeout(() => {
      setVisible((current) => current.filter((badge) => !fresh.includes(badge)));
    }, 6000);
    return () => window.clearTimeout(timer);
  }, [query.data, query.isFetchedAfterMount, query.isFetching]);

  if (visible.length === 0) return null;
  return (
    <>
      {burst > 0 && <Confetti key={burst} />}
      <div className="fixed inset-x-4 top-4 z-[70] mx-auto max-w-sm space-y-2" aria-live="polite">
        {visible.map((badge) => {
          const milestone = MILESTONE_KEYS.has(badge.key);
          return (
            <div
              key={`${badge.key}:${badge.earnedAt}`}
              className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-reward-text-strong shadow-ambient ${
                milestone
                  ? 'border-reward/40 bg-reward-surface ring-2 ring-reward/25'
                  : 'border-reward/20 bg-reward-surface'
              }`}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-reward font-mono text-xs font-bold text-white">
                {badge.icon}
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide opacity-75">
                  {milestone ? '🎉 Mijlpaal behaald' : 'Nieuwe badge'}
                </p>
                <p className="font-bold">{badge.title}</p>
                {milestone && (
                  <p className="mt-0.5 text-xs leading-5 opacity-80">{badge.description}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
