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
          <CartesianGrid strokeDasharray="3 3" stroke="#ece0cd" />
          <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#a39d93' }} />
          <YAxis
            domain={[min, max]}
            tick={{ fontSize: 12, fill: '#a39d93' }}
            width={40}
          />
          <Tooltip
            formatter={(v: number) => [`${v} kg`, 'Gewicht']}
            labelStyle={{ color: '#2a2621' }}
            contentStyle={{
              background: '#ffffff',
              border: '1px solid rgba(42, 38, 33, 0.07)',
              borderRadius: 12,
            }}
            itemStyle={{ color: '#2a2621' }}
          />
          {targetWeightKg && (
            <ReferenceLine
              y={targetWeightKg}
              stroke="#2f8f5e"
              strokeDasharray="5 4"
              label={{
                value: `Doel ${targetWeightKg}`,
                position: 'insideBottomRight',
                fill: '#2f8f5e',
                fontSize: 11,
              }}
            />
          )}
          <Line
            type="monotone"
            dataKey="kg"
            stroke="#2a2621"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
