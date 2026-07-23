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
      <p className="rounded-2xl bg-white px-4 py-8 text-center text-sm text-slate-400 shadow-sm">
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
    <div className="rounded-2xl bg-white p-3 shadow-sm">
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#94a3b8' }} />
          <YAxis
            domain={[min, max]}
            tick={{ fontSize: 12, fill: '#94a3b8' }}
            width={40}
          />
          <Tooltip
            formatter={(v: number) => [`${v} kg`, 'Gewicht']}
            labelStyle={{ color: '#475569' }}
          />
          {targetWeightKg && (
            <ReferenceLine
              y={targetWeightKg}
              stroke="#16a34a"
              strokeDasharray="5 4"
              label={{
                value: `Doel ${targetWeightKg}`,
                position: 'insideBottomRight',
                fill: '#16a34a',
                fontSize: 11,
              }}
            />
          )}
          <Line
            type="monotone"
            dataKey="kg"
            stroke="#0f172a"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
