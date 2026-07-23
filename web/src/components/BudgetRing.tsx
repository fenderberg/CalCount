import type { DayStatus } from '@calcount/core';

interface Props {
  remaining: number;
  budget: number;
  status: DayStatus;
}

const COLORS: Record<DayStatus, string> = {
  under: '#16a34a', // groen
  near: '#f59e0b', // oranje
  over: '#dc2626', // rood
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
  const color = COLORS[status];

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference - dash}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-sm text-slate-500">
          {remaining >= 0 ? 'Nog te gaan' : 'Over budget'}
        </span>
        <span className="text-5xl font-bold" style={{ color }}>
          {Math.abs(remaining)}
        </span>
        <span className="text-sm text-slate-500">kcal</span>
      </div>
    </div>
  );
}
