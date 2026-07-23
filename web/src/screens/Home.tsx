import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { getBudget, getEntries, type StoredProfile } from '../api.js';
import { BudgetRing } from '../components/BudgetRing.js';
import { EntryList } from '../components/EntryList.js';
import { LogSheet } from './LogSheet.js';

interface Props {
  profile: StoredProfile;
  onEditProfile: () => void;
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function shiftDate(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function formatDate(dateStr: string): string {
  const today = todayStr();
  if (dateStr === today) return 'Vandaag';
  if (dateStr === shiftDate(today, -1)) return 'Gisteren';
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString('nl-NL', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

export function Home({ onEditProfile }: Props) {
  const [date, setDate] = useState(todayStr());
  const [showLog, setShowLog] = useState(false);
  const isToday = date === todayStr();

  const budget = useQuery({
    queryKey: ['budget', date],
    queryFn: () => getBudget(date),
  });
  const entries = useQuery({
    queryKey: ['entries', date],
    queryFn: () => getEntries(date),
  });

  return (
    <div className="mx-auto min-h-dvh max-w-md px-5 pb-28 pt-8">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setDate(shiftDate(date, -1))}
            aria-label="Vorige dag"
            className="rounded-full px-2 py-1 text-xl text-slate-400 active:text-slate-700"
          >
            ‹
          </button>
          <div className="min-w-[92px] text-center">
            <p className="text-sm font-semibold text-slate-900">{formatDate(date)}</p>
          </div>
          <button
            onClick={() => setDate(shiftDate(date, 1))}
            disabled={isToday}
            aria-label="Volgende dag"
            className="rounded-full px-2 py-1 text-xl text-slate-400 active:text-slate-700 disabled:opacity-30"
          >
            ›
          </button>
        </div>
        <button
          onClick={onEditProfile}
          className="rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm active:bg-slate-100"
        >
          Profiel
        </button>
      </header>

      <main className="mt-8 flex flex-col items-center">
        {budget.isLoading && <p className="text-slate-500">Budget berekenen...</p>}
        {budget.isError && (
          <p className="text-center text-red-600">
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
              <p className="mt-4 w-full rounded-2xl bg-red-50 px-4 py-3 text-center text-sm text-red-600">
                Je zit {Math.abs(budget.data.remaining)} kcal boven je budget vandaag.
              </p>
            )}
            {budget.data.clampedToFloor && (
              <p className="mt-4 w-full rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
                Je doel is streng: het budget staat op de veilige ondergrens van{' '}
                {budget.data.floor} kcal.
              </p>
            )}
          </>
        )}

        <section className="mt-8 w-full">
          <h2 className="mb-1 text-sm font-semibold text-slate-500">Gelogd</h2>
          {entries.data && <EntryList entries={entries.data} />}
        </section>
      </main>

      {/* Prominente logknop (Story 2.1 / UI Design Goals). */}
      <button
        onClick={() => setShowLog(true)}
        aria-label="Eten toevoegen"
        className="fixed bottom-20 left-1/2 z-40 flex h-16 w-16 -translate-x-1/2 items-center justify-center rounded-full bg-green-600 text-3xl text-white shadow-lg active:bg-green-700"
      >
        +
      </button>

      {showLog && <LogSheet date={date} onClose={() => setShowLog(false)} />}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white px-4 py-3 text-center shadow-sm">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-lg font-semibold text-slate-900">{value}</p>
    </div>
  );
}
