import { prisma } from '../db.js';

export interface FoodRef {
  id?: string;
  name: string;
  caloriesPer100g: number;
  proteinPer100g?: number;
  carbsPer100g?: number;
  fatPer100g?: number;
  source: 'off' | 'manual' | 'ai';
  externalId?: string;
}

const OFF_SEARCH =
  'https://world.openfoodfacts.org/cgi/search.pl?json=1&page_size=20' +
  '&fields=code,product_name,product_name_nl,brands,nutriments';

interface OffProduct {
  code?: string;
  product_name?: string;
  product_name_nl?: string;
  brands?: string;
  nutriments?: Record<string, number | string | undefined>;
}

function toNumber(v: unknown): number | undefined {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function mapProduct(p: OffProduct): FoodRef | null {
  const name = (p.product_name_nl || p.product_name || '').trim();
  const kcal = toNumber(p.nutriments?.['energy-kcal_100g']);
  if (!name || kcal === undefined || kcal <= 0) return null;
  const label = p.brands ? `${name} (${p.brands.split(',')[0].trim()})` : name;
  return {
    name: label,
    caloriesPer100g: Math.round(kcal),
    proteinPer100g: toNumber(p.nutriments?.['proteins_100g']),
    carbsPer100g: toNumber(p.nutriments?.['carbohydrates_100g']),
    fatPer100g: toNumber(p.nutriments?.['fat_100g']),
    source: 'off',
    externalId: p.code,
  };
}

/**
 * Zoekt producten. Combineert de lokale referentie-cache (werkt offline) met
 * een live Open Food Facts-zoekopdracht. Nieuwe treffers worden gecachet.
 */
export async function searchFoods(query: string): Promise<FoodRef[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  // 1. Lokale cache (eerder gezochte/geloghde producten) — altijd beschikbaar.
  const cached = await prisma.foodReference.findMany({
    where: { name: { contains: q } },
    orderBy: { lastUsedAt: 'desc' },
    take: 10,
  });
  const cachedRefs: FoodRef[] = cached.map((c) => ({
    id: c.id,
    name: c.name,
    caloriesPer100g: c.caloriesPer100g,
    proteinPer100g: c.proteinPer100g ?? undefined,
    carbsPer100g: c.carbsPer100g ?? undefined,
    fatPer100g: c.fatPer100g ?? undefined,
    source: c.source as FoodRef['source'],
    externalId: c.externalId ?? undefined,
  }));

  // 2. Live Open Food Facts (best-effort; faalt stil bij geen internet).
  let offRefs: FoodRef[] = [];
  try {
    const url = `${OFF_SEARCH}&search_terms=${encodeURIComponent(q)}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'CalCount/0.1 (hobby project)' },
      signal: AbortSignal.timeout(12000),
    });
    if (res.ok) {
      const data = (await res.json()) as { products?: OffProduct[] };
      offRefs = (data.products ?? [])
        .map(mapProduct)
        .filter((r): r is FoodRef => r !== null);
      await cacheReferences(offRefs);
    }
  } catch {
    // geen internet of time-out: alleen cache-resultaten teruggeven
  }

  // Dedup op externalId/name, cache eerst.
  const seen = new Set<string>();
  const result: FoodRef[] = [];
  for (const ref of [...cachedRefs, ...offRefs]) {
    const key = ref.externalId ?? ref.name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(ref);
  }
  return result.slice(0, 15);
}

/** Cachet OFF-producten in de referentietabel (upsert op externalId). */
async function cacheReferences(refs: FoodRef[]): Promise<void> {
  await Promise.all(
    refs
      .filter((r) => r.externalId)
      .map((r) =>
        prisma.foodReference.upsert({
          where: { externalId: r.externalId! },
          create: {
            name: r.name,
            caloriesPer100g: r.caloriesPer100g,
            proteinPer100g: r.proteinPer100g,
            carbsPer100g: r.carbsPer100g,
            fatPer100g: r.fatPer100g,
            source: 'off',
            externalId: r.externalId,
          },
          update: { name: r.name, caloriesPer100g: r.caloriesPer100g },
        }),
      ),
  );
}
