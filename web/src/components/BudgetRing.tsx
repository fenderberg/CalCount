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

const TEXT_COLOR: Record<DayStatus, string> = {
  under: 'text-budget-under',
  near: 'text-budget-near',
  over: 'text-budget-over',
};

/**
 * Het "een-getal-hoofdscherm": een ring die de gegeten fractie visualiseert,
 * met het resterende budget groot in het midden (Story 1.4 / UI Design Goals).
 */
export function BudgetRing({ remaining, budget, status }: Props) {
  const size = 240;
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
        <span className="text-sm font-medium text-text-muted">
          {remaining >= 0 ? 'Nog te gaan' : 'Over budget'}
        </span>
        <span
          className={`text-6xl font-extrabold tracking-[-0.03em] ${TEXT_COLOR[status]}`}
        >
          {Math.abs(remaining)}
        </span>
        <span className="text-sm font-medium text-text-muted">kcal</span>
      </div>
    </div>
  );
}
