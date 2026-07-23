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
        <h1 className="text-xl font-bold text-slate-900">Voortgang</h1>
        <button
          onClick={onEditProfile}
          className="rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm active:bg-slate-100"
        >
          Profiel
        </button>
      </header>

      <div className="mt-6 rounded-2xl bg-white px-5 py-4 shadow-sm">
        <p className="text-sm text-slate-500">Huidig gewicht</p>
        <p className="text-3xl font-bold text-slate-900">{current} kg</p>
        {target !== undefined && (
          <p className="mt-1 text-sm text-slate-500">
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
          className="flex-1 rounded-2xl border border-slate-200 px-4 py-3.5 text-lg outline-none focus:border-green-500"
        />
        <button
          type="submit"
          disabled={add.isPending || Number(value) <= 0}
          className="rounded-2xl bg-green-600 px-5 text-lg font-semibold text-white disabled:opacity-40"
        >
          {add.isPending ? '...' : 'Log'}
        </button>
      </form>

      {note && (
        <p className="mt-3 rounded-2xl bg-green-50 px-4 py-3 text-sm text-green-700">
          {note}
        </p>
      )}

      <section className="mt-6">
        <h2 className="mb-2 text-sm font-semibold text-slate-500">Verloop</h2>
        {weights.isLoading ? (
          <p className="text-sm text-slate-400">Laden...</p>
        ) : (
          <WeightChart weights={list} targetWeightKg={target} />
        )}
      </section>

      {list.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 text-sm font-semibold text-slate-500">Metingen</h2>
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
    <li className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-sm">
      <span className="text-sm text-slate-500">
        {new Date(entry.measuredAt).toLocaleDateString('nl-NL', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
        })}
      </span>
      <span className="font-semibold text-slate-800">{entry.weightKg} kg</span>
      <button
        onClick={onDelete}
        aria-label="Verwijderen"
        className="rounded-full px-2 py-1 text-slate-300 active:text-red-500"
      >
        ✕
      </button>
    </li>
  );
}
