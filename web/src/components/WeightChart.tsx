import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { WeightEntry } from '../api.js';

interface Props {
  weights: WeightEntry[];
  targetWeightKg?: number;
}

export function WeightChart({ weights, targetWeightKg }: Props) {
  if (weights.length < 2) {
    return (
      <p className="rounded-md border border-ink/[0.07] bg-surface-card px-4 py-8 text-center text-sm text-text-faint">
        Log minstens twee metingen om je verloop te zien.
      </p>
    );
  }

  const data = weights.map((w) => ({
    label: new Date(w.measuredAt).toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'numeric',
    }),
    kg: w.weightKg,
  }));

  const values = weights.map((w) => w.weightKg);
  if (targetWeightKg) values.push(targetWeightKg);
  const min = Math.floor(Math.min(...values) - 1);
  const max = Math.ceil(Math.max(...values) + 1);

  return (
    <div className="rounded-md border border-ink/[0.07] bg-surface-card p-3">
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--surface-track))" />
          <XAxis dataKey="label" tick={{ fontSize: 12, fill: 'rgb(var(--text-faint))' }} />
          <YAxis
            domain={[min, max]}
            tick={{ fontSize: 12, fill: 'rgb(var(--text-faint))' }}
            width={40}
          />
          <Tooltip
            formatter={(v: number) => [`${v} kg`, 'Gewicht']}
            labelStyle={{ color: 'rgb(var(--ink))' }}
            contentStyle={{
              background: 'rgb(var(--surface-card))',
              border: '1px solid rgb(var(--ink) / 0.07)',
              borderRadius: 12,
            }}
            itemStyle={{ color: 'rgb(var(--ink))' }}
          />
          {targetWeightKg && (
            <ReferenceLine
              y={targetWeightKg}
              stroke="rgb(var(--budget-under))"
              strokeDasharray="5 4"
              label={{
                value: `Doel ${targetWeightKg}`,
                position: 'insideBottomRight',
                fill: 'rgb(var(--budget-under))',
                fontSize: 11,
              }}
            />
          )}
          <Line
            type="monotone"
            dataKey="kg"
            stroke="rgb(var(--ink))"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
