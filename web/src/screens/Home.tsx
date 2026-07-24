import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { getBudget, getEntries, getStreak, type StoredProfile } from '../api.js';
import { BudgetRing } from '../components/BudgetRing.js';
import { EntryList } from '../components/EntryList.js';
import { formatDate, shiftDay, todayStr } from '../dates.js';
import { LogSheet } from './LogSheet.js';

interface Props {
  profile: StoredProfile;
  onEditProfile: () => void;
}

export function Home({ profile, onEditProfile }: Props) {
  const timeZone =
    profile.timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC';
  const today = todayStr(timeZone);
  const [date, setDate] = useState(today);
  const [showLog, setShowLog] = useState(false);
  const isToday = date === today;

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

  return (
    <div className="mx-auto min-h-dvh max-w-md px-5 pb-28 pt-8">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setDate(shiftDay(date, -1))}
            aria-label="Vorige dag"
            className="flex h-tap-min w-tap-min items-center justify-center rounded-full text-xl text-text-muted active:text-ink"
          >
            ‹
          </button>
          <div className="min-w-[92px] text-center">
            <p className="text-sm font-semibold text-ink">{formatDate(date, timeZone)}</p>
          </div>
          <button
            onClick={() => setDate(shiftDay(date, 1))}
            disabled={isToday}
            aria-label="Volgende dag"
            className="flex h-tap-min w-tap-min items-center justify-center rounded-full text-xl text-text-muted active:text-ink disabled:opacity-30"
          >
            ›
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onEditProfile}
            className="rounded-lg bg-surface-muted px-4 py-2 text-sm font-semibold text-text-subtle active:bg-surface-track"
          >
            Profiel
          </button>
        </div>
      </header>

      {streak.data && <StreakCard streak={streak.data.currentStreak} loggedToday={streak.data.loggedToday} />}

      <main className="mt-8 flex flex-col items-center">
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

            <div className="mt-6 grid w-full grid-cols-2 gap-3">
              <Stat label="Budget" value={`${budget.data.budget} kcal`} />
              <Stat
                label="Gegeten"
                value={`${Math.round(budget.data.consumed)} kcal`}
              />
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

        <section className="mt-8 w-full">
          <h2 className="mb-1 text-xs font-semibold text-text-muted">Gelogd</h2>
          {entries.data && <EntryList entries={entries.data} />}
        </section>
      </main>

      {/* Prominente logknop (Story 2.1 / UI Design Goals). DESIGN.md: components.fab. */}
      <button
        onClick={() => setShowLog(true)}
        aria-label="Eten toevoegen"
        className="fixed bottom-20 left-1/2 z-40 flex h-[62px] w-[62px] -translate-x-1/2 items-center justify-center rounded-full bg-ink text-3xl text-surface-page shadow-fab active:opacity-90"
      >
        +
      </button>

      {showLog && <LogSheet date={date} onClose={() => setShowLog(false)} />}
    </div>
  );
}

function StreakCard({ streak, loggedToday }: { streak: number; loggedToday: boolean }) {
  let message = 'Elke logdag telt — begin vandaag aan een nieuwe reeks.';
  if (streak > 0 && loggedToday) {
    message = `${streak} ${streak === 1 ? 'dag' : 'dagen'} op rij`;
  } else if (streak > 0) {
    message = `${streak} ${streak === 1 ? 'dag' : 'dagen'} op rij · log vandaag om door te gaan`;
  }

  return (
    <div className="mt-5 flex items-center gap-3 rounded-lg border border-reward/20 bg-reward-surface px-4 py-3 text-reward-text-strong">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-reward text-lg text-white" aria-hidden="true">↗</span>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-reward-text">Logreeks</p>
        <p className="text-sm font-semibold">{message}</p>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-ink/[0.07] bg-surface-card px-4 py-3 text-center">
      <p className="text-xs font-medium text-text-muted">{label}</p>
      <p className="text-lg font-bold text-ink">{value}</p>
    </div>
  );
}
