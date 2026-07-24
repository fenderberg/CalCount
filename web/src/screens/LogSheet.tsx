import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import {
  analyzePhoto,
  createEntry,
  estimateFood,
  getBudget,
  getRecent,
  searchFoods,
  type AiPhotoEstimate,
  type FoodEntry,
  type FoodRef,
  type NewEntry,
} from '../api.js';
import { loggedAtForDay } from '@calcount/core';

type Tab = 'recent' | 'search' | 'manual' | 'ai' | 'photo';

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
      queryClient.invalidateQueries({ queryKey: ['streak'] });
      queryClient.invalidateQueries({ queryKey: ['badges'] });
      onClose();
    },
  });

  function save(d: Draft) {
    logMutation.mutate({
      name: d.name,
      source: d.source,
      calories: d.calories,
      grams: d.grams,
      isEstimate: d.isEstimate,
      // Bucket het item in de bekeken kalenderdag (middag-UTC), zodat het
      // ongeacht tijdzone op precies die dag verschijnt.
      loggedAt: loggedAtForDay(date),
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-surface-page">
      <header className="flex items-center justify-between border-b border-ink/[0.07] px-5 py-4">
        <h2 className="text-lg font-bold text-ink">Eten toevoegen</h2>
        <button onClick={onClose} className="text-text-muted" aria-label="Sluiten">
          Sluiten
        </button>
      </header>

      {draft ? (
        <PortionEditor
          draft={draft}
          date={date}
          onCancel={() => setDraft(null)}
          onSave={save}
          saving={logMutation.isPending}
        />
      ) : (
        <>
          <nav className="flex flex-wrap gap-1 px-3 py-2">
            {(
              [
                ['recent', 'Recent'],
                ['search', 'Zoeken'],
                ['manual', 'Handmatig'],
                ['ai', 'AI'],
                ['photo', 'Foto'],
              ] as [Tab, string][]
            ).map(([value, label]) => (
              <button
                key={value}
                onClick={() => setTab(value)}
                className={`min-h-tap-min basis-[30%] flex-grow rounded-full px-2 py-2 text-sm font-semibold ${
                  tab === value
                    ? 'bg-ink text-surface-page'
                    : 'bg-surface-muted text-text-subtle'
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
            {tab === 'photo' && <PhotoTab />}
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
            className="flex w-full items-center justify-between rounded-md border border-ink/[0.07] bg-surface-card px-4 py-3 text-left active:bg-surface-muted"
          >
            <span className="font-medium text-ink">{e.name}</span>
            <span className="text-sm text-text-muted">
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
        className={fieldClass}
      />
      {debounced.length >= 2 && isFetching && <Muted>Zoeken...</Muted>}
      {isError && <Muted>Zoeken lukte niet. Probeer handmatig invoeren.</Muted>}
      <ul className="mt-3 space-y-2">
        {data?.map((ref) => (
          <li key={ref.externalId ?? ref.id ?? ref.name}>
            <button
              onClick={() => onPick(refToDraft(ref))}
              className="flex w-full items-center justify-between rounded-md border border-ink/[0.07] bg-surface-card px-4 py-3 text-left active:bg-surface-muted"
            >
              <span className="font-medium text-ink">{ref.name}</span>
              <span className="text-sm text-text-muted">
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
        className="w-full rounded-lg bg-ink py-4 text-lg font-semibold text-surface-page disabled:opacity-40"
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
        className="w-full rounded-lg bg-ink py-4 text-lg font-semibold text-surface-page disabled:opacity-40"
      >
        {mutation.isPending ? 'Schatten...' : 'Laat AI schatten'}
      </button>
      {mutation.isError && (
        <p className="rounded-lg bg-budget-near/10 px-4 py-3 text-sm font-medium text-budget-near">
          {unavailable
            ? 'AI-schatting is nog niet beschikbaar (geen API-sleutel ingesteld). Gebruik zolang Zoeken of Handmatig.'
            : 'Schatten lukte niet. Probeer het opnieuw of voeg handmatig toe.'}
        </p>
      )}
      <p className="text-xs text-text-faint">
        AI geeft een schatting met marge — je kunt de waarden daarna nog aanpassen.
      </p>
    </form>
  );
}

// ---- Foto-herkenning (Epic 3, Story 3.1) ----
// Compressie vóór upload: base64 blaast de bestandsgrootte ~33% op, en de
// backend heeft een bodyLimit van 10MB (api/src/app.ts) — comprimeren houdt
// uploads ruim daaronder en scheelt mobiele data/snelheid.
const PHOTO_MAX_DIMENSION = 1024;
const PHOTO_JPEG_QUALITY = 0.8;

function compressImageFile(
  file: File,
): Promise<{ base64: string; mediaType: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const scale = Math.min(1, PHOTO_MAX_DIMENSION / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas niet beschikbaar'));
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', PHOTO_JPEG_QUALITY);
      const [, base64] = dataUrl.split(',');
      resolve({ base64, mediaType: 'image/jpeg' });
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Foto kon niet worden gelezen'));
    };
    img.src = objectUrl;
  });
}

function PhotoTab() {
  const mutation = useMutation({
    mutationFn: async (file: File) => {
      const { base64, mediaType } = await compressImageFile(file);
      return analyzePhoto(base64, mediaType);
    },
  });

  function onFileChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) mutation.mutate(file);
  }

  const unavailable = (mutation.error as { message?: string })?.message?.includes(
    'niet geconfigureerd',
  );

  return (
    <div className="space-y-4">
      <label className="block w-full cursor-pointer rounded-lg bg-ink py-4 text-center text-lg font-semibold text-surface-page">
        Foto maken of kiezen
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={onFileChosen}
          disabled={mutation.isPending}
          className="hidden"
        />
      </label>

      {mutation.isPending && <PhotoSkeleton />}

      {mutation.isError && (
        <p className="rounded-lg bg-budget-near/10 px-4 py-3 text-sm font-medium text-budget-near">
          {unavailable
            ? 'AI-fotoherkenning is nog niet beschikbaar (geen API-sleutel ingesteld). Gebruik zolang Zoeken of Handmatig.'
            : 'Foto herkennen lukte niet. Probeer het opnieuw of voeg handmatig toe.'}
        </p>
      )}

      {mutation.isSuccess && <PhotoResultPreview result={mutation.data} />}

      <p className="text-xs text-text-faint">
        AI geeft een schatting met marge. Corrigeren en opslaan volgt in een volgende stap.
      </p>
    </div>
  );
}

/** Read-only weergave van de herkende items (Story 3.1 scope — geen correctie/opslaan). */
function PhotoResultPreview({ result }: { result: AiPhotoEstimate }) {
  if (result.items.length === 0) {
    return <Muted>Geen items herkend op deze foto. Probeer Zoeken of Handmatig.</Muted>;
  }
  return (
    <ul className="space-y-2">
      {result.items.map((item, i) => (
        <li
          key={i}
          className="flex items-center justify-between rounded-md border border-ink/[0.07] bg-surface-card px-4 py-3"
        >
          <span className="font-medium text-ink">{item.name}</span>
          <span className="flex items-center gap-2 text-sm text-text-muted">
            {item.calories} kcal
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                item.confidence === 'high'
                  ? 'bg-confidence-high-surface text-confidence-high'
                  : item.confidence === 'medium'
                    ? 'bg-confidence-medium-surface text-confidence-medium'
                    : 'bg-confidence-low-surface text-confidence-low'
              }`}
            >
              {item.confidence}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}

function PhotoSkeleton() {
  return (
    <div className="animate-pulse space-y-2" role="status" aria-label="Foto wordt herkend">
      <div className="h-14 rounded-md bg-surface-muted" />
      <div className="h-14 rounded-md bg-surface-muted" />
    </div>
  );
}

// ---- Portie-editor (bevestigen/corrigeren vóór opslaan) ----
function PortionEditor({
  draft,
  date,
  onCancel,
  onSave,
  saving,
}: {
  draft: Draft;
  date: string;
  onCancel: () => void;
  onSave: (d: Draft) => void;
  saving: boolean;
}) {
  const [name, setName] = useState(draft.name);
  const [grams, setGrams] = useState(draft.grams?.toString() ?? '');
  const [calories, setCalories] = useState(draft.calories.toString());
  const budget = useQuery({ queryKey: ['budget', date], queryFn: () => getBudget(date) });

  // Bij een product met kcal/100g bepalen de grammen de calorieën.
  useEffect(() => {
    if (draft.caloriesPer100g && grams !== '') {
      setCalories(Math.round((Number(grams) / 100) * draft.caloriesPer100g).toString());
    }
  }, [grams, draft.caloriesPer100g]);

  const perGramLocked = draft.caloriesPer100g !== undefined;
  const proposedCalories = Number(calories);
  const afterAdding = budget.data ? budget.data.remaining - proposedCalories : undefined;

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
        <p className="mb-4 rounded-lg bg-surface-muted px-4 py-3 text-sm text-text-subtle">
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
            className={`${fieldClass} ${perGramLocked ? 'bg-surface-muted text-text-muted' : ''}`}
          />
        </LabeledInput>
        {perGramLocked && (
          <p className="text-xs text-text-faint">
            {draft.caloriesPer100g} kcal per 100 g — pas het gewicht aan om de
            calorieën te wijzigen.
          </p>
        )}
        {afterAdding !== undefined && Number.isFinite(proposedCalories) && proposedCalories > 0 && (
          <p
            className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium ${
              afterAdding >= 0
                ? 'bg-budget-under/10 text-budget-under'
                : 'bg-budget-near/10 text-budget-near'
            }`}
          >
            <span className="h-2 w-2 shrink-0 rounded-full bg-current" aria-hidden="true" />
            {afterAdding >= 0
              ? `Past binnen je dagbudget · daarna ${Math.round(afterAdding)} kcal over`
              : `Brengt je ${Math.abs(Math.round(afterAdding))} kcal boven je dagbudget`}
          </p>
        )}
      </div>

      <div className="mt-auto space-y-3 pt-6">
        <button
          type="submit"
          disabled={saving || name.trim() === '' || Number(calories) <= 0}
          className="w-full rounded-lg bg-ink py-4 text-lg font-semibold text-surface-page disabled:opacity-40"
        >
          {saving ? 'Opslaan...' : 'Toevoegen'}
        </button>
        <button type="button" onClick={onCancel} className="w-full py-3 text-text-muted">
          Terug
        </button>
      </div>
    </form>
  );
}

// ---- kleine helpers ----
const fieldClass =
  'w-full rounded-lg border border-ink/10 bg-surface-card px-4 py-3.5 text-lg text-ink outline-none focus:border-budget-under';

function LabeledInput({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-text-subtle">{label}</span>
      {children}
    </label>
  );
}

function Muted({ children }: { children: React.ReactNode }) {
  return <p className="mt-4 text-center text-sm text-text-faint">{children}</p>;
}
