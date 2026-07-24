import { shiftDay } from '@calcount/core';

export { shiftDay };

/** Vandaag als YYYY-MM-DD in de vaste profiel- of lokale apparaattijdzone. */
export function todayStr(timeZone?: string): string {
  const d = new Date();
  if (timeZone) {
    const parts = new Intl.DateTimeFormat('en', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(d);
    const part = (type: Intl.DateTimeFormatPartTypes) =>
      parts.find((item) => item.type === type)?.value ?? '';
    return `${part('year')}-${part('month')}-${part('day')}`;
  }
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Menselijke weergave van een YYYY-MM-DD-datum (Vandaag/Gisteren of korte datum). */
export function formatDate(dateStr: string, timeZone?: string): string {
  const today = todayStr(timeZone);
  if (dateStr === today) return 'Vandaag';
  if (dateStr === shiftDay(today, -1)) return 'Gisteren';
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('nl-NL', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}
