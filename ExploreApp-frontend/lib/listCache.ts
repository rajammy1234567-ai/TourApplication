/**
 * Fast list cache for VizTravel tabs.
 * Memory (instant) + AsyncStorage (survives tab switches / restarts).
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

type Entry<T> = { data: T; at: number };

const mem = new Map<string, Entry<unknown>>();
const DEFAULT_TTL_MS = 3 * 60 * 1000; // 3 min “fresh”
const STALE_TTL_MS = 24 * 60 * 60 * 1000; // show stale up to 24h while revalidating

const storageKey = (key: string) => `@vt_cache:${key}`;

export function getMemoryCache<T>(key: string, maxAgeMs = STALE_TTL_MS): T | null {
  const hit = mem.get(key) as Entry<T> | undefined;
  if (!hit) return null;
  if (Date.now() - hit.at > maxAgeMs) return null;
  return hit.data;
}

export function isCacheFresh(key: string, ttlMs = DEFAULT_TTL_MS): boolean {
  const hit = mem.get(key);
  if (!hit) return false;
  return Date.now() - hit.at <= ttlMs;
}

export function setMemoryCache<T>(key: string, data: T): void {
  mem.set(key, { data, at: Date.now() });
}

export async function getPersistedCache<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(storageKey(key));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Entry<T>;
    if (!parsed?.data || !parsed?.at) return null;
    if (Date.now() - parsed.at > STALE_TTL_MS) return null;
    mem.set(key, parsed);
    return parsed.data;
  } catch {
    return null;
  }
}

export async function setPersistedCache<T>(key: string, data: T): Promise<void> {
  const entry: Entry<T> = { data, at: Date.now() };
  mem.set(key, entry);
  try {
    await AsyncStorage.setItem(storageKey(key), JSON.stringify(entry));
  } catch {
    // storage full — memory still works
  }
}

/** Read memory first, then disk. */
export async function readCache<T>(key: string): Promise<T | null> {
  const m = getMemoryCache<T>(key);
  if (m != null) return m;
  return getPersistedCache<T>(key);
}

export async function writeCache<T>(key: string, data: T): Promise<void> {
  await setPersistedCache(key, data);
}

export const CacheKeys = {
  tours: "tours:list",
  hotels: (q: string, t: string) => `hotels:list:${q}|${t}`,
  events: "events:list",
  vendorApp: "vendor:application",
} as const;
