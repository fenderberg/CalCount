import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import {
  analyzeFood,
  createEntries,
  createEntry,
  getBudget,
  getRecent,
  searchFoods,
  type AiFoodEstimate,
  type FoodEntry,
  type FoodRef,
  type NewEntry,
} from '../api.js';
import { loggedAtForDay } from '@calcount/core';

type Tab = 'ai' | 'recent' | 'search' | 'manual';

/** Concept-item dat de gebruiker bevestigt vóór opslaan. */
interface Draft {
  name: string;
  source: NewEntry['source'];
  grams?: number;
  caloriesPer100g?: number; // aanwezig => grammen bepalen de calorieën
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  nutrientsPer100g?: { protein?: number; carbs?: number; fat?: number; fiber?: number };
  isEstimate?: boolean;
}

interface Props {
  date: string;
  onClose: () => void;
}

export function LogSheet({ date, onClose }: Props) {
  const [tab, setTab] = useState<Tab>('ai');
  const [draft, setDraft] = useState<Draft | null>(null);
  const queryClient = useQueryClient();

  const logMutation = useMutation({
    mutationFn: (entries: NewEntry[]) => entries.length === 1
      ? createEntry(entries[0]).then((entry) => [entry])
      : createEntries(entries),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget'] });
      queryClient.invalidateQueries({ queryKey: ['entries'] });
      queryClient.invalidateQueries({ queryKey: ['recent'] });
      queryClient.invalidateQueries({ queryKey: ['streak'] });
      queryClient.invalidateQueries({ queryKey: ['badges'] });
      queryClient.invalidateQueries({ queryKey: ['nutrition'] });
      onClose();
    },
  });

  function save(d: Draft) {
    saveMany([d]);
  }

  function saveMany(drafts: Draft[]) {
    logMutation.mutate(drafts.map((d) => ({
      name: d.name,
      source: d.source,
      calories: d.calories,
      grams: d.grams,
      isEstimate: d.isEstimate,
      protein: d.protein,
      carbs: d.carbs,
      fat: d.fat,
      fiber: d.fiber,
      // Bucket het item in de bekeken kalenderdag (middag-UTC), zodat het
      // ongeacht tijdzone op precies die dag verschijnt.
      loggedAt: loggedAtForDay(date),
    })));
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
          <nav className="grid grid-cols-4 gap-1 px-3 py-2">
            {(
              [
                ['ai', 'AI'],
                ['recent', 'Recent'],
                ['search', 'Zoeken'],
                ['manual', 'Handmatig'],
              ] as [Tab, string][]
            ).map(([value, label]) => (
              <button
                key={value}
                onClick={() => setTab(value)}
                className={`min-h-tap-min rounded-full px-1 py-2 text-[13px] font-semibold ${
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
            {tab === 'ai' && <AiTab onSave={saveMany} saving={logMutation.isPending}
              saveError={logMutation.error as Error | null} />}
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
    protein: e.protein ?? undefined,
    carbs: e.carbs ?? undefined,
    fat: e.fat ?? undefined,
    fiber: e.fiber ?? undefined,
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
    protein: ref.proteinPer100g,
    carbs: ref.carbsPer100g,
    fat: ref.fatPer100g,
    fiber: ref.fiberPer100g,
    nutrientsPer100g: {
      protein: ref.proteinPer100g,
      carbs: ref.carbsPer100g,
      fat: ref.fatPer100g,
      fiber: ref.fiberPer100g,
    },
  };
}

// ---- Handmatig ----
function ManualTab({ onPick }: { onPick: (d: Draft) => void }) {
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [grams, setGrams] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [fiber, setFiber] = useState('');

  function submit(e: React.FormEvent) {
    e.preventDefault();
    onPick({
      name: name.trim(),
      source: 'manual',
      calories: Math.round(Number(calories)),
      grams: grams ? Number(grams) : undefined,
      protein: protein ? Number(protein) : undefined,
      carbs: carbs ? Number(carbs) : undefined,
      fat: fat ? Number(fat) : undefined,
      fiber: fiber ? Number(fiber) : undefined,
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
      <details className="rounded-lg bg-surface-muted px-4 py-3">
        <summary className="cursor-pointer text-sm font-semibold text-text-subtle">Voedingswaarden toevoegen <span className="font-normal text-text-faint">(optioneel)</span></summary>
        <fieldset className="mt-3">
          <legend className="sr-only">Voedingswaarden in gram</legend>
          <div className="grid grid-cols-2 gap-2">
            {([
              ['Eiwit', protein, setProtein],
              ['Koolhydraten', carbs, setCarbs],
              ['Vet', fat, setFat],
              ['Vezels', fiber, setFiber],
            ] as const).map(([label, value, setter]) => (
              <input key={label} type="number" inputMode="decimal" min="0" step="0.1" value={value}
                onChange={(event) => setter(event.target.value)} placeholder={label} aria-label={`${label} in gram`} className={fieldClass} />
            ))}
          </div>
          <p className="mt-2 text-xs text-text-faint">Een grove schatting is genoeg voor je balans.</p>
        </fieldset>
      </details>
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

// ---- Gecombineerde AI-analyse: tekst, foto of beide ----
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

interface AiDraft extends Draft {
  confidence: AiFoodEstimate['confidence'];
}

function estimateToDraft(item: AiFoodEstimate, source: 'ai' | 'photo'): AiDraft {
  return {
    name: item.name,
    source,
    grams: item.estimatedGrams,
    calories: item.calories,
    protein: item.protein,
    carbs: item.carbs,
    fat: item.fat,
    fiber: item.fiber,
    confidence: item.confidence,
    isEstimate: true,
  };
}

function AiTab({ onSave, saving, saveError }: {
  onSave: (items: Draft[]) => void;
  saving: boolean;
  saveError: Error | null;
}) {
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState<{ base64: string; mediaType: string } | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [items, setItems] = useState<AiDraft[] | null>(null);
  const mutation = useMutation({
    mutationFn: () => analyzeFood({
      description: description.trim() || undefined,
      image: photo?.base64,
      mediaType: photo?.mediaType,
    }),
    onSuccess: (result) => setItems(result.items.map((item) => estimateToDraft(item, photo ? 'photo' : 'ai'))),
  });

  async function onFileChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.currentTarget.value = '';
    try {
      setPhotoError(null);
      setPhoto(await compressImageFile(file));
      setItems(null);
    } catch {
      setPhotoError('Deze foto kon niet worden gelezen. Kies een andere foto.');
    }
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    mutation.mutate();
  }

  function updateItem(index: number, patch: Partial<AiDraft>) {
    setItems((current) => current?.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item) ?? null);
  }

  function addItem() {
    setItems((current) => [...(current ?? []), {
      name: '', source: photo ? 'photo' : 'ai', grams: 100, calories: 0,
      protein: 0, carbs: 0, fat: 0, fiber: 0, confidence: 'low', isEstimate: true,
    }]);
  }

  const canAnalyze = description.trim().length >= 2 || photo !== null;
  const validItems = items?.filter((item) => item.name.trim() && item.calories >= 0) ?? [];

  return (
    <form onSubmit={submit} className="space-y-4">
      {!items && (
        <>
          <div>
            <h3 className="text-lg font-extrabold text-ink">Wat heb je gegeten?</h3>
            <p className="mt-1 text-sm leading-5 text-text-muted">Typ een korte omschrijving, voeg een foto toe, of combineer beide.</p>
          </div>
          <textarea value={description} onChange={(event) => setDescription(event.target.value)}
            placeholder="Bijv. zalm met aardappels en salade" rows={3} className={fieldClass} />
          {photo && <img src={`data:${photo.mediaType};base64,${photo.base64}`} alt="Gekozen maaltijd" className="max-h-48 w-full rounded-lg object-cover" />}
          <div className="grid grid-cols-2 gap-2">
            <label className="flex min-h-tap-min cursor-pointer items-center justify-center rounded-lg bg-surface-muted px-3 text-center text-sm font-semibold text-text-subtle">
              Foto maken
              <input type="file" accept="image/*" capture="environment" onChange={onFileChosen}
                disabled={mutation.isPending} className="hidden" />
            </label>
            <label className="flex min-h-tap-min cursor-pointer items-center justify-center rounded-lg bg-surface-muted px-3 text-center text-sm font-semibold text-text-subtle">
              Foto kiezen
              <input type="file" accept="image/*" onChange={onFileChosen}
                disabled={mutation.isPending} className="hidden" />
            </label>
          </div>
          {photo && (
            <button type="button" onClick={() => setPhoto(null)} className="w-full text-sm text-text-muted">Foto verwijderen</button>
          )}
          {photoError && <p className="rounded-lg bg-budget-near/10 px-4 py-3 text-sm text-budget-near">{photoError}</p>}
          <button type="submit" disabled={!canAnalyze || mutation.isPending}
            className="w-full rounded-lg bg-ink py-4 text-lg font-semibold text-surface-page disabled:opacity-40">
            {mutation.isPending ? 'AI analyseert…' : 'Analyseren'}
          </button>
          {mutation.isPending && <PhotoSkeleton />}
          {mutation.isError && (
            <p className="rounded-lg bg-budget-near/10 px-4 py-3 text-sm font-medium text-budget-near">
              {(mutation.error as Error).message.includes('niet geconfigureerd')
                ? 'AI is nog niet beschikbaar. Gebruik Zoeken of Handmatig.'
                : 'Analyseren lukte niet. Probeer het opnieuw of gebruik Handmatig.'}
            </p>
          )}
        </>
      )}

      {items && (
        <>
          <div className="flex items-start justify-between gap-3">
            <div><h3 className="text-lg font-extrabold text-ink">Controleer de schatting</h3><p className="mt-1 text-xs text-text-faint">Pas aan wat niet klopt. De foto wordt niet bewaard.</p></div>
            <button type="button" onClick={() => setItems(null)} className="text-sm font-semibold text-text-muted">Opnieuw</button>
          </div>
          <div className="space-y-3">
            {items.map((item, index) => (
              <AiItemEditor key={index} item={item} onChange={(patch) => updateItem(index, patch)}
                onRemove={() => setItems((current) => current?.filter((_, itemIndex) => itemIndex !== index) ?? null)} />
            ))}
          </div>
          <button type="button" onClick={addItem} className="w-full rounded-lg bg-surface-muted py-3 text-sm font-semibold text-text-subtle">+ Gemist item toevoegen</button>
          <button type="button" disabled={saving || validItems.length === 0}
            onClick={() => onSave(validItems)} className="w-full rounded-lg bg-ink py-4 text-lg font-semibold text-surface-page disabled:opacity-40">
            {saving ? 'Opslaan…' : `${validItems.length} ${validItems.length === 1 ? 'item' : 'items'} toevoegen`}
          </button>
          {saveError && <p className="rounded-lg bg-budget-over/10 px-4 py-3 text-sm text-budget-over">Opslaan lukte niet. Je correcties staan er nog; probeer het opnieuw.</p>}
        </>
      )}
      <p className="text-xs leading-5 text-text-faint">AI geeft een schatting met marge. Foto’s worden alleen voor deze analyse verwerkt en niet opgeslagen.</p>
    </form>
  );
}

function AiItemEditor({ item, onChange, onRemove }: {
  item: AiDraft;
  onChange: (patch: Partial<AiDraft>) => void;
  onRemove: () => void;
}) {
  const numeric = (key: 'grams' | 'calories' | 'protein' | 'carbs' | 'fat' | 'fiber', value: string) =>
    onChange({ [key]: Math.max(0, Number(value)) } as Partial<AiDraft>);
  return (
    <fieldset className="rounded-xl bg-surface-card px-4 py-4">
      <div className="flex items-center justify-between gap-3">
        <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${confidenceClass(item.confidence)}`}>{item.confidence}</span>
        <button type="button" onClick={onRemove} className="text-sm text-text-muted" aria-label={`${item.name || 'Item'} verwijderen`}>Verwijder</button>
      </div>
      <input value={item.name} onChange={(event) => onChange({ name: event.target.value })} aria-label="Naam"
        className="mt-3 w-full border-0 border-b border-ink/10 bg-transparent pb-2 text-base font-bold text-ink outline-none" />
      <div className="mt-3 grid grid-cols-2 gap-2">
        {([
          ['Gram', 'grams'], ['kcal', 'calories'], ['Eiwit', 'protein'],
          ['Koolhydraten', 'carbs'], ['Vet', 'fat'], ['Vezels', 'fiber'],
        ] as const).map(([label, key]) => (
          <label key={key} className="rounded-md bg-surface-muted px-3 py-2">
            <span className="block text-[10px] font-semibold text-text-faint">{label}</span>
            <input type="number" min="0" step={key === 'calories' || key === 'grams' ? '1' : '0.1'}
              value={item[key] ?? 0} onChange={(event) => numeric(key, event.target.value)}
              className="mt-0.5 w-full bg-transparent text-sm font-bold text-ink outline-none" />
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function confidenceClass(confidence: AiFoodEstimate['confidence']) {
  if (confidence === 'high') return 'bg-confidence-high-surface text-confidence-high';
  if (confidence === 'medium') return 'bg-confidence-medium-surface text-confidence-medium';
  return 'bg-confidence-low-surface text-confidence-low';
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
    const factor = draft.nutrientsPer100g && grams ? Number(grams) / 100 : 1;
    const nutrient = (key: 'protein' | 'carbs' | 'fat' | 'fiber') => {
      const value = draft.nutrientsPer100g?.[key] ?? draft[key];
      return value === undefined ? undefined : Math.round(value * factor * 10) / 10;
    };
    onSave({
      ...draft,
      name: name.trim(),
      grams: grams ? Number(grams) : undefined,
      calories: Math.round(Number(calories)),
      protein: nutrient('protein'),
      carbs: nutrient('carbs'),
      fat: nutrient('fat'),
      fiber: nutrient('fiber'),
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
