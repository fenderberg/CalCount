// Datumlogica los van tijdzones. Een "dag" is een kalenderdatum-string
// (YYYY-MM-DD), niet een tijdstip — dit voorkomt de klassieke bug waarbij
// een lokale Date via toISOString() (UTC) een dag verspringt.

/** Verschuif een YYYY-MM-DD-datum met een aantal dagen. Puur, tijdzone-onafhankelijk. */
export function shiftDay(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

/**
 * Begin (inclusief) en eind (exclusief) van een kalenderdag in UTC.
 * Deterministisch ongeacht de tijdzone van de server — items worden gebucket
 * op de UTC-dag die overeenkomt met hun opgeslagen datum-tag.
 */
export function dayBoundsUtc(dateStr: string): { start: Date; end: Date } {
  const start = new Date(`${dateStr}T00:00:00.000Z`);
  if (Number.isNaN(start.getTime())) {
    throw new Error('invalid-date');
  }
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}

/**
 * Tijdstip om een item op te slaan zodat het in de bedoelde kalenderdag valt:
 * middag UTC van die dag. Robuust voor alle realistische tijdzones (±12u rond
 * middag UTC blijft binnen dezelfde UTC-dag).
 */
export function loggedAtForDay(dateStr: string): string {
  return `${dateStr}T12:00:00.000Z`;
}
