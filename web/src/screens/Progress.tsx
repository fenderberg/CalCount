import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  addWeight,
  askCoach,
  deleteWeight,
  getBudget,
  getCoachUsage,
  getInsights,
  getWeights,
  type CoachMessage,
  type StoredProfile,
  type WeightEntry,
} from '../api.js';
import { BadgeNotifications } from '../components/BadgeNotifications.js';
import { WeightChart } from '../components/WeightChart.js';
import { todayStr } from '../dates.js';

type ProgressView = 'weight' | 'insights' | 'coach';

export function Progress({
  profile,
  onEditProfile,
}: {
  profile: StoredProfile;
  onEditProfile: () => void;
}) {
  const [view, setView] = useState<ProgressView>('weight');
  const timeZone = profile.timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC';
  return (
    <div className="mx-auto min-h-dvh max-w-md px-5 pb-28 pt-8">
      <BadgeNotifications timeZone={timeZone} />
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold tracking-[-0.02em] text-ink">Voortgang</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={onEditProfile}
            className="rounded-lg bg-surface-muted px-4 py-2 text-sm font-semibold text-text-subtle active:bg-surface-track"
          >
            Profiel
          </button>
        </div>
      </header>

      <nav className="mt-5 grid grid-cols-3 gap-1 rounded-full bg-surface-muted p-1" aria-label="Voortgangsonderdelen">
        <ViewButton active={view === 'weight'} onClick={() => setView('weight')}>Gewicht</ViewButton>
        <ViewButton active={view === 'insights'} onClick={() => setView('insights')}>Inzichten</ViewButton>
        <ViewButton active={view === 'coach'} onClick={() => setView('coach')}>AI-coach</ViewButton>
      </nav>

      {view === 'weight' && <WeightPanel profile={profile} />}
      {view === 'insights' && <InsightsPanel timeZone={timeZone} />}
      {view === 'coach' && <CoachPanel timeZone={timeZone} />}
    </div>
  );
}

function ViewButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={`min-h-tap-min rounded-full px-2 text-xs font-semibold ${
        active ? 'bg-surface-card text-ink shadow-sm' : 'text-text-muted'
      }`}
    >
      {children}
    </button>
  );
}

function WeightPanel({ profile }: { profile: StoredProfile }) {
  const queryClient = useQueryClient();
  const [value, setValue] = useState('');
  const [note, setNote] = useState<string | null>(null);
  const timeZone = profile.timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC';
  const today = todayStr(timeZone);
  const weights = useQuery({ queryKey: ['weights'], queryFn: getWeights });
  const budget = useQuery({ queryKey: ['budget', today], queryFn: () => getBudget(today) });

  const refreshWeightData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['weights'] }),
      queryClient.invalidateQueries({ queryKey: ['profile'] }),
      queryClient.invalidateQueries({ queryKey: ['budget'] }),
      queryClient.invalidateQueries({ queryKey: ['badges'] }),
    ]);
  };
  const add = useMutation({
    mutationFn: (kg: number) => addWeight(kg),
    onSuccess: async () => {
      setValue('');
      await refreshWeightData();
      const fresh = await getBudget(today);
      setNote(`Opgeslagen. Je dagbudget is nu ${fresh.budget} kcal.`);
    },
  });
  const del = useMutation({
    mutationFn: (id: string) => deleteWeight(id),
    onSuccess: refreshWeightData,
  });

  const list = weights.data ?? [];
  const current = list.length > 0 ? list[list.length - 1].weightKg : profile.weightKg;
  const target = profile.targetWeightKg ?? undefined;
  const toGo = target !== undefined ? +(current - target).toFixed(1) : undefined;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const kg = Number(value);
    if (kg > 0) add.mutate(kg);
  }

  return (
    <>
      <div className="mt-6 rounded-md border border-ink/[0.07] bg-surface-card px-5 py-4">
        <p className="text-sm font-medium text-text-muted">Huidig gewicht</p>
        <p className="text-3xl font-extrabold text-ink">{current} kg</p>
        {target !== undefined && (
          <p className="mt-1 text-sm text-text-muted">
            Streefgewicht {target} kg
            {toGo !== undefined && toGo > 0 && ` · nog ${toGo} kg te gaan`}
            {toGo !== undefined && toGo <= 0 && ' · doel bereikt'}
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
          className="min-w-0 flex-1 rounded-lg border border-ink/10 bg-surface-card px-4 py-3.5 text-lg text-ink outline-none focus:border-budget-under"
        />
        <button
          type="submit"
          disabled={add.isPending || Number(value) <= 0}
          className="rounded-lg bg-ink px-5 text-lg font-semibold text-surface-page disabled:opacity-40"
        >
          {add.isPending ? '...' : 'Log'}
        </button>
      </form>

      {note && <p className="mt-3 rounded-lg bg-budget-under/10 px-4 py-3 text-sm font-medium text-budget-under">{note}</p>}

      <section className="mt-6">
        <h2 className="mb-2 text-xs font-semibold text-text-muted">Verloop</h2>
        {weights.isLoading ? <p className="text-sm text-text-faint">Laden...</p> : <WeightChart weights={list} targetWeightKg={target} />}
      </section>

      {list.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 text-xs font-semibold text-text-muted">Metingen</h2>
          <ul className="space-y-2">
            {[...list].reverse().map((weight) => (
              <MeasurementRow key={weight.id} entry={weight} onDelete={() => del.mutate(weight.id)} />
            ))}
          </ul>
        </section>
      )}
      {budget.isError && <p className="mt-4 text-sm text-budget-over">Het actuele budget kon niet worden geladen.</p>}
    </>
  );
}

function InsightsPanel({ timeZone }: { timeZone: string }) {
  const insight = useQuery({
    queryKey: ['insights', timeZone],
    queryFn: () => getInsights(timeZone),
  });
  if (insight.isLoading) return <PanelMessage>Je wekelijkse inzicht wordt opgehaald…</PanelMessage>;
  if (insight.isError) return <PanelMessage tone="error">{(insight.error as Error).message}</PanelMessage>;
  if (insight.data?.status === 'insufficient') {
    return <PanelMessage>{insight.data.message ?? 'Er is nog onvoldoende data voor een inzicht.'}</PanelMessage>;
  }
  const item = insight.data?.insight;
  if (!item) return <PanelMessage>Er is nog geen inzicht beschikbaar.</PanelMessage>;
  return (
    <section className="mt-6 rounded-lg border border-ink/[0.07] bg-surface-card px-5 py-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
        {item.windowStart} t/m {item.windowEnd}
      </p>
      <h2 className="mt-2 text-xl font-bold text-ink">Je wekelijkse inzicht</h2>
      <p className="mt-3 whitespace-pre-line text-sm leading-6 text-text-subtle">{item.content}</p>
      <p className="mt-4 text-xs leading-5 text-text-faint">AI-observatie en suggestie, geen medisch advies.</p>
    </section>
  );
}

function CoachPanel({ timeZone }: { timeZone: string }) {
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [question, setQuestion] = useState('');
  const [remaining, setRemaining] = useState(20);
  const usage = useQuery({
    queryKey: ['coach-usage', timeZone],
    queryFn: () => getCoachUsage(timeZone),
  });
  const available = usage.data?.remaining ?? remaining;
  const mutation = useMutation({
    mutationFn: (text: string) => askCoach(text, messages, timeZone),
    onSuccess: (result, text) => {
      setMessages((current) => [
        ...current,
        { role: 'user', content: text },
        { role: 'assistant', content: result.answer },
      ]);
      setRemaining(result.remaining);
      setQuestion('');
    },
  });

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const text = question.trim();
    if (text && !mutation.isPending) mutation.mutate(text);
  }

  return (
    <section className="mt-6">
      <div className="rounded-lg border border-ink/[0.07] bg-surface-card px-4 py-4">
        <h2 className="text-lg font-bold text-ink">AI-coach</h2>
        <p className="mt-1 text-xs leading-5 text-text-muted">
          Vraag iets over je voeding, budget of gewichtstrend. Dit gesprek wordt niet opgeslagen.
        </p>
      </div>
      <div className="mt-3 space-y-3" aria-live="polite">
        {messages.length === 0 && (
          <p className="rounded-lg bg-surface-muted px-4 py-4 text-sm text-text-muted">
            Bijvoorbeeld: “Wat valt op aan mijn afgelopen week?”
          </p>
        )}
        {messages.map((message, index) => (
          <div
            key={index}
            className={`max-w-[90%] rounded-lg px-4 py-3 text-sm leading-6 ${
              message.role === 'user'
                ? 'ml-auto bg-ink text-surface-page'
                : 'bg-surface-card text-text-subtle'
            }`}
          >
            {message.content}
          </div>
        ))}
      </div>
      {mutation.isError && (
        <p className="mt-3 rounded-lg bg-budget-over/10 px-4 py-3 text-sm text-budget-over">
          {(mutation.error as Error).message}
        </p>
      )}
      <form onSubmit={submit} className="mt-4">
        <textarea
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          maxLength={1000}
          rows={3}
          placeholder="Stel je vraag…"
          className="w-full resize-none rounded-lg border border-ink/10 bg-surface-card px-4 py-3 text-ink outline-none focus:border-budget-under"
        />
        <div className="mt-2 flex items-center justify-between gap-3">
          <p className="text-xs text-text-faint">Nog {Math.min(available, remaining)} vragen vandaag</p>
          <button
            type="submit"
            disabled={!question.trim() || mutation.isPending || Math.min(available, remaining) === 0}
            className="min-h-tap-min rounded-lg bg-ink px-5 font-semibold text-surface-page disabled:opacity-40"
          >
            {mutation.isPending ? 'Denken…' : 'Vraag stellen'}
          </button>
        </div>
      </form>
      <p className="mt-4 text-xs leading-5 text-text-faint">Suggesties zijn geen medisch advies.</p>
    </section>
  );
}

function PanelMessage({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'neutral' | 'error' }) {
  return (
    <p className={`mt-6 rounded-lg px-5 py-6 text-sm leading-6 ${tone === 'error' ? 'bg-budget-over/10 text-budget-over' : 'bg-surface-card text-text-muted'}`}>
      {children}
    </p>
  );
}

function MeasurementRow({ entry, onDelete }: { entry: WeightEntry; onDelete: () => void }) {
  return (
    <li className="flex items-center justify-between rounded-md border border-ink/[0.07] bg-surface-card px-4 py-3">
      <span className="text-sm text-text-faint">
        {new Date(entry.measuredAt).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })}
      </span>
      <span className="font-semibold text-ink">{entry.weightKg} kg</span>
      <button type="button" onClick={onDelete} aria-label="Verwijderen" className="rounded-full px-2 py-1 text-text-faint active:text-budget-over">✕</button>
    </li>
  );
}
