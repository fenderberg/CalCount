import type { DayStatus } from '@calcount/core';

interface Props {
  remaining: number;
  budget: number;
  status: DayStatus;
}

// DESIGN.md: components.ring-progress + colors.budget-*.
const RING_STROKE: Record<DayStatus, string> = {
  under: 'stroke-budget-under',
  near: 'stroke-budget-near',
  over: 'stroke-budget-over',
};

/**
 * Het "een-getal-hoofdscherm": een ring die de gegeten fractie visualiseert,
 * met het resterende budget groot in het midden (Story 1.4 / UI Design Goals).
 */
export function BudgetRing({ remaining, budget, status }: Props) {
  const size = 230;
  const stroke = 18;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  const consumed = budget - remaining;
  const fraction = budget > 0 ? Math.min(Math.max(consumed / budget, 0), 1) : 0;
  const dash = circumference * fraction;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          className="stroke-surface-track"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          className={RING_STROKE[status]}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference - dash}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[13px] font-bold uppercase tracking-[0.06em] text-text-muted">
          {remaining >= 0 ? 'Nog over' : 'Over budget'}
        </span>
        <span
          className={`text-[60px] font-extrabold leading-none tracking-[-0.03em] ${status === 'over' ? 'text-budget-over' : 'text-ink'}`}
        >
          {Math.abs(remaining)}
        </span>
        <span className="text-sm font-semibold text-text-muted">van {budget} kcal</span>
      </div>
    </div>
  );
}
