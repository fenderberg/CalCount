import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { getBudget, getEntries, getNutrition, getStreak, type StoredProfile } from '../api.js';
import { BudgetRing } from '../components/BudgetRing.js';
import { EntryList } from '../components/EntryList.js';
import { NutritionBars } from '../components/NutritionBalance.js';
import { formatDate, shiftDay, todayStr } from '../dates.js';
import { LogSheet } from './LogSheet.js';

interface Props {
  profile: StoredProfile;
  openLogRequest: boolean;
  onLogRequestHandled: () => void;
}

export function Home({ profile, openLogRequest, onLogRequestHandled }: Props) {
  const timeZone =
    profile.timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC';
  const today = todayStr(timeZone);
  const [date, setDate] = useState(today);
  const [showLog, setShowLog] = useState(false);
  const isToday = date === today;

  useEffect(() => {
    if (!openLogRequest) return;
    setShowLog(true);
    onLogRequestHandled();
  }, [openLogRequest, onLogRequestHandled]);

  const budget = useQuery({
    queryKey: ['budget', date],
    queryFn: () => getBudget(date),
  });
  const entries = useQuery({
    queryKey: ['entries', date],
    queryFn: () => getEntries(date),
  });
  const streak = useQuery({
    queryKey: ['streak', timeZone],
    queryFn: () => getStreak(timeZone),
  });
  const nutrition = useQuery({
    queryKey: ['nutrition', date],
    queryFn: () => getNutrition(date),
  });

  return (
    <div className="mx-auto min-h-dvh max-w-md px-5 pb-32 pt-5">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDate(shiftDay(date, -1))}
            aria-label="Vorige dag"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-muted text-xl text-text-muted active:text-ink"
          >
            ‹
          </button>
          <div className="min-w-[88px] text-center">
            <p className="text-base font-bold text-ink">{formatDate(date, timeZone)}</p>
            <p className="text-xs font-medium text-text-muted">{shortDate(date)}</p>
          </div>
          <button
            onClick={() => setDate(shiftDay(date, 1))}
            disabled={isToday}
            aria-label="Volgende dag"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-muted text-xl text-text-muted active:text-ink disabled:opacity-30"
          >
            ›
          </button>
        </div>
        {streak.data && <StreakPill streak={streak.data.currentStreak} />}
      </header>

      <main className="mt-5 flex flex-col items-center">
        {budget.isLoading && <p className="text-text-muted">Budget berekenen...</p>}
        {budget.isError && (
          <p className="text-center text-budget-over">
            {(budget.error as Error).message}
          </p>
        )}
        {budget.data && (
          <>
            <BudgetRing
              remaining={budget.data.remaining}
              budget={budget.data.budget}
              status={budget.data.status}
            />
            <div className="mt-3 flex gap-6 text-[13px] font-semibold text-text-muted">
              <span><strong className="font-extrabold text-budget-under">{Math.round(budget.data.consumed)}</strong> gegeten</span>
              <span><strong className="font-extrabold text-ink">{budget.data.budget}</strong> budget</span>
            </div>

            {budget.data.status === 'over' && (
              <p className="mt-4 w-full rounded-lg bg-budget-over/10 px-4 py-3 text-center text-sm font-medium text-budget-over">
                Je zit {Math.abs(budget.data.remaining)} kcal boven je budget vandaag.
              </p>
            )}
            {budget.data.clampedToFloor && (
              <p className="mt-4 w-full rounded-lg bg-budget-near/10 px-4 py-3 text-sm font-medium text-budget-near">
                Je doel is streng: het budget staat op de veilige ondergrens van{' '}
                {budget.data.floor} kcal.
              </p>
            )}
          </>
        )}

        {nutrition.data && nutrition.data.totals.calories > 0 && (
          <section className="mt-7 w-full rounded-xl bg-surface-card px-4 py-4">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-[15px] font-bold text-ink">Voedingsbalans</h2>
                <p className="mt-0.5 text-xs text-text-faint">Globale richting voor deze dag</p>
              </div>
              <span className="rounded-full bg-nutrition-surface px-2.5 py-1 text-[11px] font-bold text-nutrition">{nutrition.data.coverage}% bekend</span>
            </div>
            <NutritionBars summary={nutrition.data} compact />
            {nutrition.data.coverage < 70 && (
              <p className="mt-3 text-xs leading-5 text-text-faint">Nog niet alles heeft voedingswaarden. Zie dit als een grove indicatie.</p>
            )}
          </section>
        )}

        <section className="mt-7 w-full">
          <div className="mb-2 flex items-center justify-between px-1">
            <h2 className="text-[15px] font-bold text-ink">{isToday ? 'Vandaag gegeten' : 'Gegeten'}</h2>
            <span className="text-[13px] font-semibold text-text-muted">{entries.data?.length ?? 0} items</span>
          </div>
          {entries.data && <EntryList entries={entries.data} />}
        </section>
      </main>

      {showLog && <LogSheet date={date} onClose={() => setShowLog(false)} />}
    </div>
  );
}

function StreakPill({ streak }: { streak: number }) {
  return (
    <div className="flex items-center gap-2 rounded-full bg-reward-surface px-3 py-2 text-reward-text-strong" aria-label={`${streak} dagen logreeks`}>
      <span className="h-4 w-4 rounded-full bg-reward" aria-hidden="true" />
      <span className="text-sm font-bold">{streak}</span>
    </div>
  );
}

function shortDate(date: string) {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('nl-NL', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}
