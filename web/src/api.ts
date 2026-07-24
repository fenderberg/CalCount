import type { DaySummary, UserProfile } from '@calcount/core';

/** Profiel zoals opgeslagen door de backend (met updatedAt). */
export interface StoredProfile extends UserProfile {
  id: number;
  updatedAt: string;
}

export type DayBudget = DaySummary & { date: string };

// Op GitHub Pages draait de frontend los van de backend (Render), dus moet
// /api/* naar een absolute URL. Lokaal (npm run dev:web) blijft dit leeg —
// Vite's dev-proxy handelt relatieve /api/*-paden dan af (zie vite.config.ts).
const API_BASE = import.meta.env.VITE_API_URL ?? '';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    // Nodig voor de sessie-cookie: frontend/backend zijn andere origins
    // (GitHub Pages / Render) zodra VITE_API_URL absoluut is.
    credentials: 'include',
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(body.error ?? `HTTP ${res.status}`) as Error & {
      status?: number;
    };
    err.status = res.status;
    throw err;
  }
  return res.json() as Promise<T>;
}

/** Haalt het profiel op, of null als het nog niet bestaat (404 → onboarding). */
export async function getProfile(): Promise<StoredProfile | null> {
  try {
    return await request<StoredProfile>('/api/profile');
  } catch (err) {
    if ((err as { status?: number }).status === 404) return null;
    throw err;
  }
}

export function saveProfile(profile: UserProfile): Promise<StoredProfile> {
  return request<StoredProfile>('/api/profile', {
    method: 'PUT',
    body: JSON.stringify(profile),
  });
}

export function getBudget(date?: string): Promise<DayBudget> {
  const q = date ? `?date=${date}` : '';
  return request<DayBudget>(`/api/budget${q}`);
}

// ---- Epic 2: eten loggen ----

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

export interface FoodEntry {
  id: string;
  loggedAt: string;
  name: string;
  source: 'search' | 'manual' | 'ai' | 'recent' | 'photo';
  grams: number | null;
  calories: number;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  isEstimate: boolean;
}

export interface AiFoodEstimate {
  name: string;
  estimatedGrams: number;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  confidence: 'low' | 'medium' | 'high';
}

export interface NewEntry {
  name: string;
  source: FoodEntry['source'];
  calories: number;
  grams?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  isEstimate?: boolean;
  loggedAt?: string;
}

export function searchFoods(query: string): Promise<FoodRef[]> {
  return request<FoodRef[]>(`/api/foods/search?q=${encodeURIComponent(query)}`);
}

export function estimateFood(description: string): Promise<AiFoodEstimate> {
  return request<AiFoodEstimate>('/api/foods/estimate', {
    method: 'POST',
    body: JSON.stringify({ description }),
  });
}

export interface AiPhotoEstimate {
  items: AiFoodEstimate[];
}

export function analyzePhoto(
  base64Image: string,
  mediaType: string,
): Promise<AiPhotoEstimate> {
  return request<AiPhotoEstimate>('/api/photo/analyze', {
    method: 'POST',
    body: JSON.stringify({ image: base64Image, mediaType }),
  });
}

export function getRecent(): Promise<FoodEntry[]> {
  return request<FoodEntry[]>('/api/foods/recent');
}

export function getEntries(date: string): Promise<FoodEntry[]> {
  return request<FoodEntry[]>(`/api/entries?date=${date}`);
}

export function createEntry(entry: NewEntry): Promise<FoodEntry> {
  return request<FoodEntry>('/api/entries', {
    method: 'POST',
    body: JSON.stringify(entry),
  });
}

export function updateEntry(
  id: string,
  patch: Partial<NewEntry>,
): Promise<FoodEntry> {
  return request<FoodEntry>(`/api/entries/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}

export async function deleteEntry(id: string): Promise<void> {
  await fetch(`${API_BASE}/api/entries/${id}`, { method: 'DELETE', credentials: 'include' });
}

// ---- Epic 4: gewicht & voortgang ----

export interface WeightEntry {
  id: string;
  measuredAt: string;
  weightKg: number;
}

export function getWeights(): Promise<WeightEntry[]> {
  return request<WeightEntry[]>('/api/weights');
}

export function addWeight(weightKg: number, measuredAt?: string): Promise<WeightEntry> {
  return request<WeightEntry>('/api/weights', {
    method: 'POST',
    body: JSON.stringify({ weightKg, measuredAt }),
  });
}

export function updateWeight(
  id: string,
  patch: { weightKg?: number; measuredAt?: string },
): Promise<WeightEntry> {
  return request<WeightEntry>(`/api/weights/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}

export async function deleteWeight(id: string): Promise<void> {
  await fetch(`${API_BASE}/api/weights/${id}`, { method: 'DELETE', credentials: 'include' });
}

// ---- Login ----

export function login(username: string, password: string): Promise<{ ok: true }> {
  return request<{ ok: true }>('/api/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export async function logout(): Promise<void> {
  await request('/api/logout', { method: 'POST' });
}
