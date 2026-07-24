import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { getBadges, type BadgeView } from '../api.js';

export function BadgeNotifications({ timeZone }: { timeZone: string }) {
  const query = useQuery({
    queryKey: ['badge-popup', timeZone],
    queryFn: () => getBadges(timeZone),
    refetchOnMount: 'always',
    gcTime: 0,
  });
  const [visible, setVisible] = useState<BadgeView[]>([]);
  const handled = useRef(new Set<string>());

  useEffect(() => {
    if (!query.isFetchedAfterMount || query.isFetching) return;
    const fresh = (query.data?.newlyEarned ?? []).filter(
      (badge) => !handled.current.has(`${badge.key}:${badge.earnedAt}`),
    );
    if (fresh.length === 0) return;
    fresh.forEach((badge) => handled.current.add(`${badge.key}:${badge.earnedAt}`));
    setVisible((current) => [...current, ...fresh]);
    const timer = window.setTimeout(() => {
      setVisible((current) => current.filter((badge) => !fresh.includes(badge)));
    }, 6000);
    return () => window.clearTimeout(timer);
  }, [query.data, query.isFetchedAfterMount, query.isFetching]);

  if (visible.length === 0) return null;
  return (
    <div className="fixed inset-x-4 top-4 z-[70] mx-auto max-w-sm space-y-2" aria-live="polite">
      {visible.map((badge) => (
        <div
          key={`${badge.key}:${badge.earnedAt}`}
          className="flex items-center gap-3 rounded-lg border border-reward/20 bg-reward-surface px-4 py-3 text-reward-text-strong shadow-ambient"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-sm bg-reward font-mono text-xs font-bold text-white">
            {badge.icon}
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide opacity-75">Nieuwe badge</p>
            <p className="font-bold">{badge.title}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
