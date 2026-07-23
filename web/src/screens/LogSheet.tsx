import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import {
  createEntry,
  estimateFood,
  getRecent,
  searchFoods,
  type FoodEntry,
  type FoodRef,
  type NewEntry,
} from '../api.js';

type Tab = 'recent' | 'search' | 'manual' | 'ai';

/** Concept-item dat de gebruiker bevestigt vóór opslaan. */
interface Draft {
  name: string;
  source: NewEntry['source'];
  grams?: number;
  caloriesPer100g?: number; // aanwezig => grammen bepalen de calorieën
  calories: number;
  isEstimate?: boolean;
}

interface Props {
  date: string;
  onClose: () => void;
}

export function LogSheet({ date, onClose }: Props) {
  const [tab, setTab] = useState<Tab>('recent');
  const [draft, setDraft] = useState<Draft | null>(null);
  const queryClient = useQueryClient();

  const logMutation = useMutation({
    mutationFn: (entry: NewEntry) => createEntry(entry),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget'] });
      queryClient.invalidateQueries({ queryKey: ['entries'] });
      queryClient.invalidateQueries({ queryKey: ['recent'] });
      onClose();
    },
  });

  function loggedAtFor(): string {
    // Log op de gekozen dag; bij vandaag de echte tijd, anders middaguur.
    const today = new Date().toISOString().slice(0, 10);
    if (date === today) return new Date().toISOString();
    return new Date(`${date}T12:00:00`).toISOString();
  }

  function save(d: Draft) {
    logMutation.mutate({
      name: d.name,
      source: d.source,
      calories: d.calories,
      grams: d.grams,
      isEstimate: d.isEstimate,
      loggedAt: loggedAtFor(),
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <h2 className="text-lg font-bold text-slate-900">Eten toevoegen</h2>
        <button onClick={onClose} className="text-slate-500" aria-label="Sluiten">
          Sluiten
        </button>
      </header>

      {draft ? (
        <PortionEditor
          draft={draft}
          onCancel={() => setDraft(null)}
          onSave={save}
          saving={logMutation.isPending}
        />
      ) : (
        <>
          <nav className="flex gap-1 px-3 py-2">
            {(
              [
                ['recent', 'Recent'],
                ['search', 'Zoeken'],
                ['manual', 'Handmatig'],
                ['ai', 'AI'],
              ] as [Tab, string][]
            ).map(([value, label]) => (
              <button
                key={value}
                onClick={() => setTab(value)}
                className={`flex-1 rounded-xl py-2.5 text-sm font-medium ${
                  tab === value
                    ? 'bg-green-600 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {label}
              </button>
            ))}
          </nav>

          <div className="flex-1 overflow-y-auto px-5 py-3">
            {tab === 'recent' && (
              <RecentTab onLog={(e) => save(recentToDraft(e))} />
            )}
            {tab === 'search' && <SearchTab onPick={setDraft} />}
            {tab === 'manual' && <ManualTab onPick={setDraft} />}
            {tab === 'ai' && <AiTab onPick={setDraft} />}
          </div>
        </>
      )}
    </div>
  );
}

function recentToDraft(e: FoodEntry): Draft {
  return {
    name: e.name,
    source: 'recent',
    grams: e.grams ?? undefined,
    calories: e.calories,
    isEstimate: e.isEstimate,
  };
}

// ---- Recent ----
function RecentTab({ onLog }: { onLog: (e: FoodEntry) => void }) {
  const { data, isLoading } = useQuery({ queryKey: ['recent'], queryFn: getRecent });
  if (isLoading) return <Muted>Laden...</Muted>;
  if (!data || data.length === 0)
    return <Muted>Nog geen eerder gelogde items. Zoek of voeg handmatig toe.</Muted>;
  return (
    <ul className="space-y-2">
      {data.map((e) => (
        <li key={e.id}>
          <button
            onClick={() => onLog(e)}
            className="flex w-full items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-left active:bg-slate-50"
          >
            <span className="font-medium text-slate-800">{e.name}</span>
            <span className="text-sm text-slate-500">
              {e.calories} kcal{e.grams ? ` · ${e.grams} g` : ''}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

// ---- Zoeken (Open Food Facts) ----
function SearchTab({ onPick }: { onPick: (d: Draft) => void }) {
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 400);
    return () => clearTimeout(t);
  }, [query]);

  const { data, isFetching, isError } = useQuery({
    queryKey: ['foodSearch', debounced],
    queryFn: () => searchFoods(debounced),
    enabled: debounced.length >= 2,
  });

  return (
    <div>
      <input
        autoFocus
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Zoek een product (bv. banaan)"
        className="w-full rounded-2xl border border-slate-200 px-4 py-3.5 text-lg outline-none focus:border-green-500"
      />
      {debounced.length >= 2 && isFetching && <Muted>Zoeken...</Muted>}
      {isError && <Muted>Zoeken lukte niet. Probeer handmatig invoeren.</Muted>}
      <ul className="mt-3 space-y-2">
        {data?.map((ref) => (
          <li key={ref.externalId ?? ref.id ?? ref.name}>
            <button
              onClick={() => onPick(refToDraft(ref))}
              className="flex w-full items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-left active:bg-slate-50"
            >
              <span className="font-medium text-slate-800">{ref.name}</span>
              <span className="text-sm text-slate-500">
                {ref.caloriesPer100g} kcal/100g
              </span>
            </button>
          </li>
        ))}
        {data && data.length === 0 && debounced.length >= 2 && !isFetching && (
          <Muted>Geen resultaten. Probeer een andere term of voeg handmatig toe.</Muted>
        )}
      </ul>
    </div>
  );
}

function refToDraft(ref: FoodRef): Draft {
  return {
    name: ref.name,
    source: 'search',
    grams: 100,
    caloriesPer100g: ref.caloriesPer100g,
    calories: ref.caloriesPer100g,
  };
}

// ---- Handmatig ----
function ManualTab({ onPick }: { onPick: (d: Draft) => void }) {
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [grams, setGrams] = useState('');

  function submit(e: React.FormEvent) {
    e.preventDefault();
    onPick({
      name: name.trim(),
      source: 'manual',
      calories: Math.round(Number(calories)),
      grams: grams ? Number(grams) : undefined,
    });
  }

  const valid = name.trim().length > 0 && Number(calories) > 0;

  return (
    <form onSubmit={submit} className="space-y-4">
      <LabeledInput label="Naam">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Bijv. Zelfgemaakte pasta"
          className={fieldClass}
        />
      </LabeledInput>
      <LabeledInput label="Calorieën (kcal)">
        <input
          type="number"
          inputMode="numeric"
          value={calories}
          onChange={(e) => setCalories(e.target.value)}
          className={fieldClass}
        />
      </LabeledInput>
      <LabeledInput label="Gewicht (gram) — optioneel">
        <input
          type="number"
          inputMode="numeric"
          value={grams}
          onChange={(e) => setGrams(e.target.value)}
          className={fieldClass}
        />
      </LabeledInput>
      <button
        type="submit"
        disabled={!valid}
        className="w-full rounded-2xl bg-green-600 py-4 text-lg font-semibold text-white disabled:opacity-40"
      >
        Verder
      </button>
    </form>
  );
}

// ---- AI-tekstschatting ----
function AiTab({ onPick }: { onPick: (d: Draft) => void }) {
  const [description, setDescription] = useState('');
  const mutation = useMutation({ mutationFn: (d: string) => estimateFood(d) });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    mutation.mutate(description.trim(), {
      onSuccess: (est) =>
        onPick({
          name: est.name,
          source: 'ai',
          grams: est.estimatedGrams,
          calories: est.calories,
          isEstimate: true,
        }),
    });
  }

  const unavailable = (mutation.error as { message?: string })?.message?.includes(
    'niet geconfigureerd',
  );

  return (
    <form onSubmit={submit} className="space-y-4">
      <LabeledInput label="Omschrijf wat je at">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Bijv. een handje amandelen, of twee sneetjes bruinbrood met kaas"
          rows={3}
          className={fieldClass}
        />
      </LabeledInput>
      <button
        type="submit"
        disabled={description.trim().length < 2 || mutation.isPending}
        className="w-full rounded-2xl bg-green-600 py-4 text-lg font-semibold text-white disabled:opacity-40"
      >
        {mutation.isPending ? 'Schatten...' : 'Laat AI schatten'}
      </button>
      {mutation.isError && (
        <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {unavailable
            ? 'AI-schatting is nog niet beschikbaar (geen API-sleutel ingesteld). Gebruik zolang Zoeken of Handmatig.'
            : 'Schatten lukte niet. Probeer het opnieuw of voeg handmatig toe.'}
        </p>
      )}
      <p className="text-xs text-slate-400">
        AI geeft een schatting met marge — je kunt de waarden daarna nog aanpassen.
      </p>
    </form>
  );
}

// ---- Portie-editor (bevestigen/corrigeren vóór opslaan) ----
function PortionEditor({
  draft,
  onCancel,
  onSave,
  saving,
}: {
  draft: Draft;
  onCancel: () => void;
  onSave: (d: Draft) => void;
  saving: boolean;
}) {
  const [name, setName] = useState(draft.name);
  const [grams, setGrams] = useState(draft.grams?.toString() ?? '');
  const [calories, setCalories] = useState(draft.calories.toString());

  // Bij een product met kcal/100g bepalen de grammen de calorieën.
  useEffect(() => {
    if (draft.caloriesPer100g && grams !== '') {
      setCalories(Math.round((Number(grams) / 100) * draft.caloriesPer100g).toString());
    }
  }, [grams, draft.caloriesPer100g]);

  const perGramLocked = draft.caloriesPer100g !== undefined;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      ...draft,
      name: name.trim(),
      grams: grams ? Number(grams) : undefined,
      calories: Math.round(Number(calories)),
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-1 flex-col overflow-y-auto px-5 py-4">
      {draft.isEstimate && (
        <p className="mb-4 rounded-2xl bg-blue-50 px-4 py-3 text-sm text-blue-700">
          AI-schatting — controleer en pas aan waar nodig.
        </p>
      )}
      <div className="space-y-4">
        <LabeledInput label="Naam">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={fieldClass}
          />
        </LabeledInput>

        {(perGramLocked || draft.grams !== undefined) && (
          <LabeledInput label="Gewicht (gram)">
            <input
              type="number"
              inputMode="numeric"
              value={grams}
              onChange={(e) => setGrams(e.target.value)}
              className={fieldClass}
            />
          </LabeledInput>
        )}

        <LabeledInput
          label={perGramLocked ? 'Calorieën (berekend)' : 'Calorieën (kcal)'}
        >
          <input
            type="number"
            inputMode="numeric"
            value={calories}
            onChange={(e) => setCalories(e.target.value)}
            readOnly={perGramLocked}
            className={`${fieldClass} ${perGramLocked ? 'bg-slate-50 text-slate-500' : ''}`}
          />
        </LabeledInput>
        {perGramLocked && (
          <p className="text-xs text-slate-400">
            {draft.caloriesPer100g} kcal per 100 g — pas het gewicht aan om de
            calorieën te wijzigen.
          </p>
        )}
      </div>

      <div className="mt-auto space-y-3 pt-6">
        <button
          type="submit"
          disabled={saving || name.trim() === '' || Number(calories) <= 0}
          className="w-full rounded-2xl bg-green-600 py-4 text-lg font-semibold text-white disabled:opacity-40"
        >
          {saving ? 'Opslaan...' : 'Toevoegen'}
        </button>
        <button type="button" onClick={onCancel} className="w-full py-3 text-slate-500">
          Terug
        </button>
      </div>
    </form>
  );
}

// ---- kleine helpers ----
const fieldClass =
  'w-full rounded-2xl border border-slate-200 px-4 py-3.5 text-lg outline-none focus:border-green-500';

function LabeledInput({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}

function Muted({ children }: { children: React.ReactNode }) {
  return <p className="mt-4 text-center text-sm text-slate-400">{children}</p>;
}
