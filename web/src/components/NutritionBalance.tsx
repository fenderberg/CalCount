import type { NutritionSummary } from '@calcount/core';

type NutrientKey = 'protein' | 'carbs' | 'fat' | 'fiber';

const labels: Record<NutrientKey, string> = {
  protein: 'Eiwit',
  carbs: 'Koolhydraten',
  fat: 'Vet',
  fiber: 'Vezels',
};

export function NutritionBars({ summary, compact = false }: { summary: NutritionSummary; compact?: boolean }) {
  const rows: NutrientKey[] = ['protein', 'carbs', 'fat', 'fiber'];
  return (
    <div className={compact ? 'space-y-3' : 'space-y-4'}>
      {rows.map((key) => {
        const value = summary.totals[key];
        const target = summary.targets[key];
        const min = typeof target === 'number' ? target : target.min;
        const max = typeof target === 'number' ? target : target.max;
        const percent = Math.min(100, (value / max) * 100);
        const targetText = typeof target === 'number' ? `richtpunt ${target} g` : `globaal ${target.min}–${target.max} g`;
        return (
          <div key={key}>
            <div className="mb-1.5 flex items-baseline justify-between gap-3">
              <span className="text-[13px] font-bold text-ink">{labels[key]}</span>
              <span className="text-xs text-text-muted"><strong className="text-text-subtle">{Math.round(value)} g</strong> · {targetText}</span>
            </div>
            <div className="relative h-2.5 overflow-hidden rounded-full bg-surface-track">
              {typeof target !== 'number' && (
                <span className="absolute inset-y-0 rounded-full bg-nutrition/20" style={{ left: `${(min / max) * 100}%`, right: 0 }} />
              )}
              <span className="absolute inset-y-0 left-0 rounded-full bg-nutrition" style={{ width: `${percent}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function MacroRatioBar({ summary }: { summary: NutritionSummary }) {
  if (!summary.macroRatio) return null;
  const ratio = summary.macroRatio;
  return (
    <div>
      <div className="mb-2 flex justify-between text-xs font-semibold text-text-muted">
        <span>Eiwit {ratio.protein}%</span><span>Koolhydraten {ratio.carbs}%</span><span>Vet {ratio.fat}%</span>
      </div>
      <div className="flex h-3 overflow-hidden rounded-full bg-surface-track" aria-label="Verdeling van energie uit eiwit, koolhydraten en vet">
        <span className="bg-nutrition" style={{ width: `${ratio.protein}%` }} />
        <span className="bg-nutrition/65" style={{ width: `${ratio.carbs}%` }} />
        <span className="bg-nutrition/35" style={{ width: `${ratio.fat}%` }} />
      </div>
    </div>
  );
}
