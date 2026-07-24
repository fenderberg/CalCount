import type { ActivityLevel, Sex, ThemePreference, UserProfile } from '@calcount/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { saveProfile, type StoredProfile } from '../api.js';

const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string }[] = [
  { value: 'sedentary', label: 'Zittend (weinig beweging)' },
  { value: 'light', label: 'Licht actief (1-3x/week)' },
  { value: 'moderate', label: 'Matig actief (3-5x/week)' },
  { value: 'active', label: 'Actief (6-7x/week)' },
  { value: 'very_active', label: 'Zeer actief (fysiek werk/sport)' },
];

// Doeltempo in kg/week; negatief = afvallen.
const GOAL_OPTIONS: { value: number; label: string }[] = [
  { value: -0.75, label: 'Snel afvallen (0,75 kg/week)' },
  { value: -0.5, label: 'Afvallen (0,5 kg/week)' },
  { value: -0.25, label: 'Rustig afvallen (0,25 kg/week)' },
  { value: 0, label: 'Gewicht behouden' },
];

const DEVICE_TIME_ZONE = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

function availableTimeZones(selected: string): string[] {
  const intl = Intl as typeof Intl & {
    supportedValuesOf?: (key: 'timeZone') => string[];
  };
  const supported = intl.supportedValuesOf?.('timeZone') ?? [];
  return [...new Set([selected, DEVICE_TIME_ZONE, 'UTC', ...supported])].sort();
}

interface Props {
  existing?: StoredProfile;
  onDone: () => void;
  onCancel?: () => void;
}

export function Onboarding({ existing, onDone, onCancel }: Props) {
  const queryClient = useQueryClient();
  const [heightCm, setHeightCm] = useState(existing?.heightCm?.toString() ?? '');
  const [weightKg, setWeightKg] = useState(existing?.weightKg?.toString() ?? '');
  const [birthDate, setBirthDate] = useState(existing?.birthDate ?? '');
  const [sex, setSex] = useState<Sex>(existing?.sex ?? 'male');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(
    existing?.activityLevel ?? 'moderate',
  );
  const [goalRateKgPerWeek, setGoalRate] = useState<number>(
    existing?.goalRateKgPerWeek ?? -0.5,
  );
  const [targetWeightKg, setTargetWeight] = useState(
    existing?.targetWeightKg?.toString() ?? '',
  );
  const [timeZone, setTimeZone] = useState(existing?.timeZone ?? DEVICE_TIME_ZONE);
  const [theme, setTheme] = useState<ThemePreference>(
    existing?.theme ?? (document.documentElement.classList.contains('dark') ? 'dark' : 'light'),
  );

  const mutation = useMutation({
    mutationFn: (p: UserProfile) => saveProfile(p),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['budget'] });
      queryClient.invalidateQueries({ queryKey: ['streak'] });
      queryClient.invalidateQueries({ queryKey: ['badges'] });
      onDone();
    },
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    mutation.mutate({
      heightCm: Number(heightCm),
      weightKg: Number(weightKg),
      birthDate,
      sex,
      activityLevel,
      goalRateKgPerWeek,
      targetWeightKg: targetWeightKg ? Number(targetWeightKg) : undefined,
      timeZone,
      theme,
    });
  }

  return (
    <div className="mx-auto min-h-dvh max-w-md bg-surface-page px-5 py-8">
      <header>
        <h1 className="text-3xl font-extrabold tracking-[-0.02em] text-ink">
          {existing ? 'Profiel wijzigen' : 'Welkom bij CalCount'}
        </h1>
      </header>
      <p className="mt-1 text-text-muted">
        Vul je gegevens in zodat we je dagbudget kunnen berekenen.
      </p>

      <form onSubmit={submit} className="mt-6 space-y-5">
        <Field label="Lengte (cm)">
          <input
            type="number"
            inputMode="numeric"
            required
            min={50}
            max={260}
            value={heightCm}
            onChange={(e) => setHeightCm(e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="Gewicht (kg)">
          <input
            type="number"
            inputMode="decimal"
            step="0.1"
            required
            min={20}
            max={400}
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="Geboortedatum">
          <input
            type="date"
            required
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="Geslacht">
          <div className="grid grid-cols-2 gap-3">
            <ToggleButton active={sex === 'male'} onClick={() => setSex('male')}>
              Man
            </ToggleButton>
            <ToggleButton active={sex === 'female'} onClick={() => setSex('female')}>
              Vrouw
            </ToggleButton>
          </div>
        </Field>

        <Field label="Activiteitsniveau">
          <select
            value={activityLevel}
            onChange={(e) => setActivityLevel(e.target.value as ActivityLevel)}
            className={inputClass}
          >
            {ACTIVITY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Doel">
          <select
            value={goalRateKgPerWeek}
            onChange={(e) => setGoalRate(Number(e.target.value))}
            className={inputClass}
          >
            {GOAL_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Streefgewicht (kg) — optioneel">
          <input
            type="number"
            inputMode="decimal"
            step="0.1"
            min={20}
            max={400}
            value={targetWeightKg}
            onChange={(e) => setTargetWeight(e.target.value)}
            placeholder="Bijv. 80"
            className={inputClass}
          />
        </Field>

        <Field label="Tijdzone voor daggrens">
          <select
            value={timeZone}
            onChange={(e) => setTimeZone(e.target.value)}
            className={inputClass}
          >
            {availableTimeZones(timeZone).map((zone) => (
              <option key={zone} value={zone}>{zone}</option>
            ))}
          </select>
        </Field>

        <Field label="Weergave">
          <div className="grid grid-cols-2 gap-3">
            <ToggleButton active={theme === 'light'} onClick={() => setTheme('light')}>
              Licht
            </ToggleButton>
            <ToggleButton active={theme === 'dark'} onClick={() => setTheme('dark')}>
              Donker
            </ToggleButton>
          </div>
        </Field>

        {mutation.isError && (
          <p className="text-sm font-medium text-budget-over">
            {(mutation.error as Error).message}
          </p>
        )}

        <div className="space-y-3 pt-2">
          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full rounded-lg bg-ink py-4 text-lg font-semibold text-surface-page active:opacity-90 disabled:opacity-50"
          >
            {mutation.isPending ? 'Opslaan...' : 'Opslaan'}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="w-full rounded-lg py-3 text-text-muted"
            >
              Annuleren
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

const inputClass =
  'w-full rounded-lg border border-ink/10 bg-surface-card px-4 py-4 text-lg text-ink outline-none focus:border-budget-under';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-text-subtle">
        {label}
      </span>
      {children}
    </label>
  );
}

function ToggleButton({
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
      type="button"
      onClick={onClick}
      className={`rounded-lg border py-4 text-lg font-medium ${
        active
          ? 'border-ink bg-ink text-surface-page'
          : 'border-ink/10 bg-surface-card text-text-subtle'
      }`}
    >
      {children}
    </button>
  );
}
