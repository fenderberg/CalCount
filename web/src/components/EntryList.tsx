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
      <p className="mt-6 text-center text-sm text-text-faint">
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
            className="flex items-center gap-3 rounded-md border border-ink/[0.07] bg-surface-card px-4 py-3"
          >
            <button
              onClick={() => setEditing(e)}
              className="min-w-0 flex-1 text-left"
            >
              <p className="truncate font-medium text-ink">
                {e.name}
                {e.isEstimate && (
                  <span className="ml-1.5 text-xs text-confidence-medium">
                    ~schatting
                  </span>
                )}
              </p>
              <p className="text-xs text-text-faint">
                {SOURCE_LABEL[e.source]}
                {e.grams ? ` · ${e.grams} g` : ''}
              </p>
            </button>
            <span className="shrink-0 font-semibold text-ink">
              {e.calories} kcal
            </span>
            <button
              onClick={() => del.mutate(e.id)}
              aria-label="Verwijderen"
              className="shrink-0 rounded-full px-2 py-1 text-text-faint active:text-budget-over"
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
    <div className="fixed inset-0 z-50 flex items-end bg-ink/30 sm:items-center sm:justify-center">
      <div className="w-full rounded-t-2xl bg-surface-page p-5 sm:max-w-md sm:rounded-2xl">
        <h3 className="text-xl font-bold text-ink">Item bewerken</h3>
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
            className="w-full rounded-lg bg-ink py-3.5 font-semibold text-surface-page disabled:opacity-40"
          >
            {save.isPending ? 'Opslaan...' : 'Opslaan'}
          </button>
          <button onClick={onClose} className="w-full py-2.5 text-text-muted">
            Annuleren
          </button>
        </div>
      </div>
    </div>
  );
}

const fc =
  'w-full rounded-lg border border-ink/10 bg-surface-card px-4 py-3 text-lg text-ink outline-none focus:border-budget-under';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-text-subtle">{label}</span>
      {children}
    </label>
  );
}
