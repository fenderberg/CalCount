import { describe, expect, it } from 'vitest';
import { dayBoundsUtc, loggedAtForDay, shiftDay } from './dates.js';

describe('shiftDay', () => {
  it('gaat één dag vooruit', () => {
    expect(shiftDay('2026-07-24', 1)).toBe('2026-07-25');
  });

  it('gaat één dag achteruit', () => {
    expect(shiftDay('2026-07-24', -1)).toBe('2026-07-23');
  });

  it('rolt over een maandgrens', () => {
    expect(shiftDay('2026-07-31', 1)).toBe('2026-08-01');
    expect(shiftDay('2026-08-01', -1)).toBe('2026-07-31');
  });

  it('rolt over een jaargrens', () => {
    expect(shiftDay('2026-12-31', 1)).toBe('2027-01-01');
  });

  it('is idempotent bij 0 en omkeerbaar', () => {
    expect(shiftDay('2026-07-24', 0)).toBe('2026-07-24');
    expect(shiftDay(shiftDay('2026-07-24', 5), -5)).toBe('2026-07-24');
  });
});

describe('dayBoundsUtc', () => {
  it('geeft een venster van precies één UTC-dag', () => {
    const { start, end } = dayBoundsUtc('2026-07-24');
    expect(start.toISOString()).toBe('2026-07-24T00:00:00.000Z');
    expect(end.toISOString()).toBe('2026-07-25T00:00:00.000Z');
  });

  it('werpt bij een ongeldige datum', () => {
    expect(() => dayBoundsUtc('geen-datum')).toThrow();
  });
});

describe('loggedAtForDay', () => {
  it('valt binnen de UTC-bounds van diezelfde dag', () => {
    const day = '2026-07-24';
    const at = new Date(loggedAtForDay(day));
    const { start, end } = dayBoundsUtc(day);
    expect(at >= start && at < end).toBe(true);
  });
});
