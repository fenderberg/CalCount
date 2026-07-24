import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  addWeight,
  deleteWeight,
  getBudget,
  getWeights,
  type StoredProfile,
  type WeightEntry,
} from '../api.js';
import { WeightChart } from '../components/WeightChart.js';

export function Progress({
  profile,
  onEditProfile,
}: {
  profile: StoredProfile;
  onEditProfile: () => void;
}) {
  const queryClient = useQueryClient();
  const [value, setValue] = useState('');
  const [note, setNote] = useState<string | null>(null);

  const weights = useQuery({ queryKey: ['weights'], queryFn: getWeights });
  const budget = useQuery({
    queryKey: ['budget', new Date().toISOString().slice(0, 10)],
    queryFn: () => getBudget(),
  });

  const add = useMutation({
    mutationFn: (kg: number) => addWeight(kg),
    onSuccess: async () => {
      setValue('');
      // Gewicht synct het profiel → budget/TDEE herberekenen (FR11).
      await queryClient.invalidateQueries({ queryKey: ['weights'] });
      await queryClient.invalidateQueries({ queryKey: ['profile'] });
      await queryClient.invalidateQueries({ queryKey: ['budget'] });
      const fresh = await getBudget();
      setNote(`Opgeslagen. Je dagbudget is nu ${fresh.budget} kcal.`);
    },
  });

  const del = useMutation({
    mutationFn: (id: string) => deleteWeight(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weights'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['budget'] });
    },
  });

  const list = weights.data ?? [];
  const current = list.length > 0 ? list[list.length - 1].weightKg : profile.weightKg;
  // API geeft null bij geen streefgewicht; normaliseer naar undefined.
  const target = profile.targetWeightKg ?? undefined;
  const toGo = target !== undefined ? +(current - target).toFixed(1) : undefined;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const kg = Number(value);
    if (kg > 0) add.mutate(kg);
  }

  return (
    <div className="mx-auto min-h-dvh max-w-md px-5 pb-28 pt-8">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold tracking-[-0.02em] text-ink">
          Voortgang
        </h1>
        <button
          onClick={onEditProfile}
          className="rounded-lg bg-surface-muted px-4 py-2 text-sm font-semibold text-text-subtle active:bg-surface-track"
        >
          Profiel
        </button>
      </header>

      <div className="mt-6 rounded-md border border-ink/[0.07] bg-surface-card px-5 py-4">
        <p className="text-sm font-medium text-text-muted">Huidig gewicht</p>
        <p className="text-3xl font-extrabold text-ink">{current} kg</p>
        {target !== undefined && (
          <p className="mt-1 text-sm text-text-muted">
            Streefgewicht {target} kg
            {toGo !== undefined && toGo > 0 && ` · nog ${toGo} kg te gaan`}
            {toGo !== undefined && toGo <= 0 && ' · doel bereikt 🎉'}
          </p>
        )}
      </div>

      <form onSubmit={submit} className="mt-4 flex gap-2">
        <input
          type="number"
          inputMode="decimal"
          step="0.1"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Nieuw gewicht (kg)"
          className="flex-1 rounded-lg border border-ink/10 bg-surface-card px-4 py-3.5 text-lg text-ink outline-none focus:border-budget-under"
        />
        <button
          type="submit"
          disabled={add.isPending || Number(value) <= 0}
          className="rounded-lg bg-ink px-5 text-lg font-semibold text-surface-page disabled:opacity-40"
        >
          {add.isPending ? '...' : 'Log'}
        </button>
      </form>

      {note && (
        <p className="mt-3 rounded-lg bg-budget-under/10 px-4 py-3 text-sm font-medium text-budget-under">
          {note}
        </p>
      )}

      <section className="mt-6">
        <h2 className="mb-2 text-xs font-semibold text-text-muted">Verloop</h2>
        {weights.isLoading ? (
          <p className="text-sm text-text-faint">Laden...</p>
        ) : (
          <WeightChart weights={list} targetWeightKg={target} />
        )}
      </section>

      {list.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 text-xs font-semibold text-text-muted">Metingen</h2>
          <ul className="space-y-2">
            {[...list].reverse().map((w) => (
              <MeasurementRow key={w.id} entry={w} onDelete={() => del.mutate(w.id)} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function MeasurementRow({
  entry,
  onDelete,
}: {
  entry: WeightEntry;
  onDelete: () => void;
}) {
  return (
    <li className="flex items-center justify-between rounded-md border border-ink/[0.07] bg-surface-card px-4 py-3">
      <span className="text-sm text-text-faint">
        {new Date(entry.measuredAt).toLocaleDateString('nl-NL', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
        })}
      </span>
      <span className="font-semibold text-ink">{entry.weightKg} kg</span>
      <button
        onClick={onDelete}
        aria-label="Verwijderen"
        className="rounded-full px-2 py-1 text-text-faint active:text-budget-over"
      >
        ✕
      </button>
    </li>
  );
}
