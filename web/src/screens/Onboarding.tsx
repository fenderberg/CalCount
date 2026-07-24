import type { ActivityLevel, Sex, ThemePreference, UserProfile } from '@calcount/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { saveProfile, type StoredProfile } from '../api.js';
import { AppLogo } from '../components/AppLogo.js';

const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string; hint: string }[] = [
  { value: 'sedentary', label: 'Zittend', hint: 'Weinig beweging' },
  { value: 'light', label: 'Licht actief', hint: '1–3× sporten per week' },
  { value: 'moderate', label: 'Matig actief', hint: '3–5× sporten per week' },
  { value: 'active', label: 'Actief', hint: '6–7× sporten per week' },
  { value: 'very_active', label: 'Zeer actief', hint: 'Fysiek werk of intensieve sport' },
];

const GOAL_OPTIONS = [
  { value: -0.75, label: 'Snel afvallen', hint: '0,75 kg per week' },
  { value: -0.5, label: 'Afvallen', hint: '0,5 kg per week' },
  { value: -0.25, label: 'Rustig afvallen', hint: '0,25 kg per week' },
  { value: 0, label: 'Gewicht behouden', hint: 'Geen wekelijks verschil' },
];

const DEVICE_TIME_ZONE = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

function availableTimeZones(selected: string): string[] {
  const intl = Intl as typeof Intl & { supportedValuesOf?: (key: 'timeZone') => string[] };
  return [...new Set([selected, DEVICE_TIME_ZONE, 'UTC', ...(intl.supportedValuesOf?.('timeZone') ?? [])])].sort();
}

interface Props {
  existing?: StoredProfile;
  onDone: () => void;
  onCancel?: () => void;
}

export function Onboarding({ existing, onDone, onCancel }: Props) {
  const queryClient = useQueryClient();
  const formRef = useRef<HTMLFormElement>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [heightCm, setHeightCm] = useState(existing?.heightCm?.toString() ?? '');
  const [weightKg, setWeightKg] = useState(existing?.weightKg?.toString() ?? '');
  const [birthDate, setBirthDate] = useState(existing?.birthDate ?? '');
  const [sex, setSex] = useState<Sex>(existing?.sex ?? 'male');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(existing?.activityLevel ?? 'light');
  const [goalRateKgPerWeek, setGoalRate] = useState(existing?.goalRateKgPerWeek ?? -0.5);
  const [targetWeightKg, setTargetWeight] = useState(existing?.targetWeightKg?.toString() ?? '');
  const [timeZone, setTimeZone] = useState(existing?.timeZone ?? DEVICE_TIME_ZONE);
  const [theme, setTheme] = useState<ThemePreference>(
    existing?.theme ?? (document.documentElement.classList.contains('dark') ? 'dark' : 'light'),
  );

  const mutation = useMutation({
    mutationFn: (profile: UserProfile) => saveProfile(profile),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['profile'] }),
        queryClient.invalidateQueries({ queryKey: ['budget'] }),
        queryClient.invalidateQueries({ queryKey: ['streak'] }),
        queryClient.invalidateQueries({ queryKey: ['badges'] }),
      ]);
      onDone();
    },
  });

  function next() {
    if (formRef.current?.reportValidity()) setStep(2);
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
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
    <div className="mx-auto min-h-dvh max-w-md bg-surface-page pb-28">
      <header className="px-6 pt-6">
        <div className="flex items-center justify-between">
          <AppLogo size={38} wordmark />
          {onCancel && (
            <button type="button" onClick={onCancel} className="min-h-tap-min px-2 text-sm font-semibold text-text-muted">
              Sluiten
            </button>
          )}
        </div>
        <div className="mt-7 flex gap-1.5" aria-label={`Stap ${step} van 2`}>
          <span className="h-[5px] flex-1 rounded-full bg-budget-under" />
          <span className={`h-[5px] flex-1 rounded-full ${step === 2 ? 'bg-budget-under' : 'bg-ink/10'}`} />
        </div>
        <p className="mt-4 text-[13px] font-semibold text-text-muted">Stap {step} van 2</p>
        <h1 className="mt-1 text-[27px] font-extrabold leading-[1.15] tracking-[-0.02em] text-ink">
          {step === 1 ? (existing ? 'Jouw profiel' : <>Vertel iets over<br />jezelf</>) : 'Doel & voorkeuren'}
        </h1>
      </header>

      <form ref={formRef} onSubmit={submit} className="px-[22px] pt-5">
        {step === 1 ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <CompactField label="Lengte" suffix="cm">
                <input type="number" inputMode="numeric" required min={50} max={260} value={heightCm} onChange={(e) => setHeightCm(e.target.value)} className={compactInput} />
              </CompactField>
              <CompactField label="Gewicht" suffix="kg">
                <input type="number" inputMode="decimal" required step="0.1" min={20} max={400} value={weightKg} onChange={(e) => setWeightKg(e.target.value)} className={compactInput} />
              </CompactField>
            </div>

            <CardField label="Geboortedatum">
              <input type="date" required value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className={cardInput} />
            </CardField>

            <FieldLabel label="Geslacht">
              <div className="grid grid-cols-2 rounded-md bg-surface-muted p-1">
                <SegmentButton active={sex === 'male'} onClick={() => setSex('male')}>Man</SegmentButton>
                <SegmentButton active={sex === 'female'} onClick={() => setSex('female')}>Vrouw</SegmentButton>
              </div>
            </FieldLabel>

            <FieldLabel label="Activiteitsniveau">
              <select value={activityLevel} onChange={(e) => setActivityLevel(e.target.value as ActivityLevel)} className={`${cardInput} border-[1.5px] border-budget-under`}>
                {ACTIVITY_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label} — {option.hint}</option>)}
              </select>
            </FieldLabel>
          </div>
        ) : (
          <div className="space-y-4">
            <FieldLabel label="Doeltempo">
              <select value={goalRateKgPerWeek} onChange={(e) => setGoalRate(Number(e.target.value))} className={`${cardInput} border-[1.5px] border-budget-under`}>
                {GOAL_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label} — {option.hint}</option>)}
              </select>
            </FieldLabel>

            <CardField label="Streefgewicht (optioneel)" suffix="kg">
              <input type="number" inputMode="decimal" step="0.1" min={20} max={400} value={targetWeightKg} onChange={(e) => setTargetWeight(e.target.value)} placeholder="Bijv. 78" className={cardInput} />
            </CardField>

            <FieldLabel label="Tijdzone voor daggrens">
              <select value={timeZone} onChange={(e) => setTimeZone(e.target.value)} className={cardInput}>
                {availableTimeZones(timeZone).map((zone) => <option key={zone} value={zone}>{zone}</option>)}
              </select>
            </FieldLabel>

            <FieldLabel label="Weergave">
              <div className="grid grid-cols-2 rounded-md bg-surface-muted p-1">
                <SegmentButton active={theme === 'light'} onClick={() => setTheme('light')}>Licht</SegmentButton>
                <SegmentButton active={theme === 'dark'} onClick={() => setTheme('dark')}>Donker</SegmentButton>
              </div>
            </FieldLabel>

            <p className="px-3 text-center text-xs leading-5 text-text-faint">
              Je gegevens blijven van jou. AI-schattingen zijn indicatief en vervangen geen medisch advies.
            </p>
          </div>
        )}

        {mutation.isError && <p className="mt-4 text-sm font-medium text-budget-over">{(mutation.error as Error).message}</p>}

        <div className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md bg-gradient-to-t from-surface-page via-surface-page to-transparent px-[22px] pb-7 pt-8">
          {step === 1 ? (
            <button type="button" onClick={next} className={primaryButton}>Volgende</button>
          ) : (
            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(1)} className="min-h-[58px] rounded-lg bg-surface-muted px-5 font-bold text-text-subtle">Terug</button>
              <button type="submit" disabled={mutation.isPending} className={`${primaryButton} flex-1 disabled:opacity-50`}>
                {mutation.isPending ? 'Opslaan…' : existing ? 'Wijzigingen opslaan' : 'Start CalCount'}
              </button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}

const compactInput = 'mt-0.5 min-w-0 w-full bg-transparent text-[22px] font-bold leading-tight text-ink outline-none';
const cardInput = 'w-full rounded-lg border border-ink/10 bg-surface-card px-4 py-4 text-base font-semibold text-ink outline-none focus:border-budget-under';
const primaryButton = 'min-h-[58px] w-full rounded-lg bg-ink px-5 text-base font-bold text-surface-page active:opacity-90';

function CompactField({ label, suffix, children }: { label: string; suffix: string; children: React.ReactNode }) {
  return <label className="rounded-lg border border-ink/10 bg-surface-card px-4 py-3"><span className="block text-xs font-semibold text-text-muted">{label}</span><span className="flex items-end gap-1">{children}<span className="pb-0.5 text-sm font-semibold text-text-muted">{suffix}</span></span></label>;
}

function CardField({ label, suffix, children }: { label: string; suffix?: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1.5 block px-1 text-[13px] font-semibold text-text-subtle">{label}</span><span className="relative block">{children}{suffix && <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-text-muted">{suffix}</span>}</span></label>;
}

function FieldLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><p className="mb-2 px-1 text-[13px] font-semibold text-text-subtle">{label}</p>{children}</div>;
}

function SegmentButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} className={`min-h-tap-min rounded-sm text-[15px] ${active ? 'bg-surface-card font-bold text-ink shadow-sm' : 'font-semibold text-text-muted'}`}>{children}</button>;
}
