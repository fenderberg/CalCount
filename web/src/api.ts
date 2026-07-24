import type { DaySummary, NutritionSummary, UserProfile } from '@calcount/core';

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
const AUTH_TOKEN_KEY = 'calcount-session';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
    // Cookie voor compatibele browsers; Authorization is de betrouwbare fallback
    // wanneer GitHub Pages → Render als third-party cookie wordt geblokkeerd.
    credentials: 'include',
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(body.error ?? `HTTP ${res.status}`) as Error & {
      status?: number;
    };
    err.status = res.status;
    if (res.status === 401) localStorage.removeItem(AUTH_TOKEN_KEY);
    throw err;
  }
  if (res.status === 204) return undefined as T;
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

export interface StreakSummary {
  currentStreak: number;
  longestStreak: number;
  totalLoggedDays: number;
  loggedToday: boolean;
  today: string;
  timeZone: string;
}

export function getStreak(timeZone: string): Promise<StreakSummary> {
  return request<StreakSummary>(`/api/streak?timeZone=${encodeURIComponent(timeZone)}`);
}

export interface BadgeView {
  key: 'streak-3' | 'streak-7' | 'streak-30' | 'logged-days-30' | 'weight-trend';
  title: string;
  description: string;
  icon: string;
  earnedAt: string | null;
  current: number;
  target: number;
}

export interface BadgeSummary {
  badges: BadgeView[];
  newlyEarned: BadgeView[];
}

export function getBadges(timeZone: string): Promise<BadgeSummary> {
  return request<BadgeSummary>(`/api/badges?timeZone=${encodeURIComponent(timeZone)}`);
}

export interface AiInsight {
  id: string;
  windowStart: string;
  windowEnd: string;
  content: string;
  createdAt: string;
}

export interface InsightResponse {
  status: 'ready' | 'insufficient';
  insight: AiInsight | null;
  message?: string;
}

export function getInsights(timeZone: string): Promise<InsightResponse> {
  return request<InsightResponse>(`/api/insights?timeZone=${encodeURIComponent(timeZone)}`);
}

export interface CoachMessage {
  role: 'user' | 'assistant';
  content: string;
}

export function askCoach(
  question: string,
  history: CoachMessage[],
  timeZone: string,
): Promise<{ answer: string; remaining: number }> {
  return request('/api/coach', {
    method: 'POST',
    body: JSON.stringify({ question, history, timeZone }),
  });
}

export function getCoachUsage(timeZone: string): Promise<{ used: number; remaining: number }> {
  return request(`/api/coach/usage?timeZone=${encodeURIComponent(timeZone)}`);
}

// ---- Epic 2: eten loggen ----

export interface FoodRef {
  id?: string;
  name: string;
  caloriesPer100g: number;
  proteinPer100g?: number;
  carbsPer100g?: number;
  fatPer100g?: number;
  fiberPer100g?: number;
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
  fiber: number | null;
  isEstimate: boolean;
}

export interface AiFoodEstimate {
  name: string;
  estimatedGrams: number;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
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
  fiber?: number;
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
  await request<void>(`/api/entries/${id}`, { method: 'DELETE' });
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
  await request<void>(`/api/weights/${id}`, { method: 'DELETE' });
}

// ---- Login ----

export async function login(username: string, password: string): Promise<{ ok: true }> {
  const response = await request<{ ok: true; token: string }>('/api/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  localStorage.setItem(AUTH_TOKEN_KEY, response.token);
  return { ok: true };
}

export type DailyNutrition = NutritionSummary & { date: string };
export type WeeklyNutrition = NutritionSummary & {
  start: string;
  end: string;
  loggedDays: number;
  assessment: {
    status: 'ready' | 'insufficient';
    title: string;
    points: string[];
  };
};

export function getNutrition(date: string): Promise<DailyNutrition> {
  return request<DailyNutrition>(`/api/nutrition?date=${date}`);
}

export function getWeeklyNutrition(end: string): Promise<WeeklyNutrition> {
  return request<WeeklyNutrition>(`/api/nutrition/week?end=${end}`);
}

export async function logout(): Promise<void> {
  try {
    await request('/api/logout', { method: 'POST' });
  } finally {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  }
}
