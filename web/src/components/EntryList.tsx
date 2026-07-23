import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { deleteEntry, updateEntry, type FoodEntry } from '../api.js';

const SOURCE_LABEL: Record<FoodEntry['source'], string> = {
  search: 'Zoeken',
  manual: 'Handmatig',
  ai: 'AI',
  recent: 'Recent',
  photo: 'Foto',
};

export function EntryList({ entries }: { entries: FoodEntry[] }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<FoodEntry | null>(null);

  const del = useMutation({
    mutationFn: (id: string) => deleteEntry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget'] });
      queryClient.invalidateQueries({ queryKey: ['entries'] });
    },
  });

  if (entries.length === 0) {
    return (
      <p className="mt-6 text-center text-sm text-slate-400">
        Nog niets gelogd op deze dag. Tik op + om eten toe te voegen.
      </p>
    );
  }

  return (
    <>
      <ul className="mt-2 space-y-2">
        {entries.map((e) => (
          <li
            key={e.id}
            className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm"
          >
            <button
              onClick={() => setEditing(e)}
              className="min-w-0 flex-1 text-left"
            >
              <p className="truncate font-medium text-slate-800">
                {e.name}
                {e.isEstimate && (
                  <span className="ml-1.5 text-xs text-blue-500">~schatting</span>
                )}
              </p>
              <p className="text-xs text-slate-400">
                {SOURCE_LABEL[e.source]}
                {e.grams ? ` · ${e.grams} g` : ''}
              </p>
            </button>
            <span className="shrink-0 font-semibold text-slate-700">
              {e.calories} kcal
            </span>
            <button
              onClick={() => del.mutate(e.id)}
              aria-label="Verwijderen"
              className="shrink-0 rounded-full px-2 py-1 text-slate-300 active:text-red-500"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>

      {editing && (
        <EditEntryModal entry={editing} onClose={() => setEditing(null)} />
      )}
    </>
  );
}

function EditEntryModal({
  entry,
  onClose,
}: {
  entry: FoodEntry;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(entry.name);
  const [calories, setCalories] = useState(entry.calories.toString());
  const [grams, setGrams] = useState(entry.grams?.toString() ?? '');

  const save = useMutation({
    mutationFn: () =>
      updateEntry(entry.id, {
        name: name.trim(),
        calories: Math.round(Number(calories)),
        grams: grams ? Number(grams) : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget'] });
      queryClient.invalidateQueries({ queryKey: ['entries'] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/30 sm:items-center sm:justify-center">
      <div className="w-full rounded-t-3xl bg-white p-5 sm:max-w-md sm:rounded-3xl">
        <h3 className="text-lg font-bold text-slate-900">Item bewerken</h3>
        <div className="mt-4 space-y-3">
          <Field label="Naam">
            <input value={name} onChange={(e) => setName(e.target.value)} className={fc} />
          </Field>
          <Field label="Calorieën (kcal)">
            <input
              type="number"
              inputMode="numeric"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              className={fc}
            />
          </Field>
          <Field label="Gewicht (gram) — optioneel">
            <input
              type="number"
              inputMode="numeric"
              value={grams}
              onChange={(e) => setGrams(e.target.value)}
              className={fc}
            />
          </Field>
        </div>
        <div className="mt-5 space-y-2">
          <button
            onClick={() => save.mutate()}
            disabled={save.isPending || name.trim() === '' || Number(calories) <= 0}
            className="w-full rounded-2xl bg-green-600 py-3.5 font-semibold text-white disabled:opacity-40"
          >
            {save.isPending ? 'Opslaan...' : 'Opslaan'}
          </button>
          <button onClick={onClose} className="w-full py-2.5 text-slate-500">
            Annuleren
          </button>
        </div>
      </div>
    </div>
  );
}

const fc =
  'w-full rounded-2xl border border-slate-200 px-4 py-3 text-lg outline-none focus:border-green-500';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}
