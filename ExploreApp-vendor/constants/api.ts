import { Platform } from "react-native";
import Constants from "expo-constants";

const PORT = process.env.EXPO_PUBLIC_API_PORT || "5000";

/** Live backend — hard default for Expo Go + APK */
export const PROD_API_BASE_URL = "https://tourapplication-api.onrender.com";

/** Render free tier can take 45–60s to wake; give enough room + retries */
const DEFAULT_TIMEOUT_MS = 55000;
const MAX_RETRIES = 2;

type ExtraConfig = {
  apiBaseUrl?: string;
  forceProdApi?: boolean | string;
};

const getExtra = (): ExtraConfig =>
  (Constants.expoConfig?.extra as ExtraConfig | undefined) || {};

const isLocalHost = (host: string) =>
  /localhost|127\.0\.0\.1/i.test(host);

const isLanOrLocalUrl = (url: string) => {
  try {
    const u = new URL(url);
    return (
      isLocalHost(u.hostname) ||
      /^192\.168\./.test(u.hostname) ||
      /^10\./.test(u.hostname) ||
      u.hostname === "10.0.2.2"
    );
  } catch {
    return false;
  }
};

const stripSlash = (url: string) => url.replace(/\/$/, "");

const getExpoDevHost = (): string | null => {
  try {
    const raw =
      Constants.expoConfig?.hostUri ??
      (Constants as { manifest2?: { extra?: { expoClient?: { hostUri?: string } } } })
        .manifest2?.extra?.expoClient?.hostUri ??
      (Constants as { manifest?: { debuggerHost?: string } }).manifest?.debuggerHost;

    if (!raw) return null;
    const cleaned = String(raw)
      .replace(/^exp:\/\//, "")
      .replace(/^https?:\/\//, "")
      .split("/")[0]
      .split(":")[0]
      .trim();
    if (!cleaned || isLocalHost(cleaned)) return null;
    return cleaned;
  } catch {
    return null;
  }
};

export const getProductionApiUrl = (): string => {
  const extra = getExtra();
  const fromEnv = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  const candidate = stripSlash(fromEnv || extra.apiBaseUrl || PROD_API_BASE_URL);
  if (!candidate || isLocalHost(candidate) || isLanOrLocalUrl(candidate)) {
    return PROD_API_BASE_URL;
  }
  // Always prefer canonical prod host if env is wrong/old
  if (candidate.includes("onrender.com")) return candidate;
  return PROD_API_BASE_URL;
};

const wantsLocalApi = () =>
  process.env.EXPO_PUBLIC_USE_LOCAL_API === "1" ||
  process.env.EXPO_PUBLIC_USE_LOCAL_API === "true";

/**
 * Default = production. Local only with explicit USE_LOCAL_API=1.
 */
const resolveBaseUrl = () => {
  // APK always production
  if (!__DEV__) return getProductionApiUrl();

  if (wantsLocalApi()) {
    const expoHost = getExpoDevHost();
    if (expoHost) return `http://${expoHost}:${PORT}`;
    const envHost = process.env.EXPO_PUBLIC_DEV_HOST?.trim();
    if (envHost) return `http://${envHost}:${PORT}`;
    if (Platform.OS === "android") return `http://10.0.2.2:${PORT}`;
    return `http://localhost:${PORT}`;
  }

  return getProductionApiUrl();
};

export const getApiBaseUrl = () => resolveBaseUrl();
export const API_BASE_URL = resolveBaseUrl();

// ─── Server wake lock (Render free tier) ───────────────────────────
let wakePromise: Promise<void> | null = null;
let lastWakeOk = 0;
const WAKE_OK_TTL = 90_000;

async function ensureServerAwake(base: string): Promise<void> {
  // Local backends don't need wake
  if (isLanOrLocalUrl(base)) return;
  if (Date.now() - lastWakeOk < WAKE_OK_TTL) return;

  if (wakePromise) return wakePromise;

  wakePromise = (async () => {
    const healthUrl = `${base}/health`;
    const attempts = 3;
    for (let i = 0; i < attempts; i++) {
      try {
        const controller = new AbortController();
        const t = setTimeout(() => controller.abort(), 25000);
        const res = await fetch(healthUrl, {
          method: "GET",
          signal: controller.signal,
        });
        clearTimeout(t);
        if (res.ok) {
          lastWakeOk = Date.now();
          return;
        }
      } catch {
        // retry
      }
      await new Promise((r) => setTimeout(r, 1500 * (i + 1)));
    }
    // Don't throw — real request will still try
  })().finally(() => {
    wakePromise = null;
  });

  return wakePromise;
}

/** Call once at app start */
export function warmUpApi(): void {
  const base = getApiBaseUrl();
  ensureServerAwake(base).catch(() => {});
}

if (__DEV__) {
  setTimeout(() => {
    console.log("[VizTravel Vendor] API →", getApiBaseUrl());
  }, 300);
}

// Kick wake early
setTimeout(() => warmUpApi(), 200);

export const apiUrl = (path: string) => {
  const base = getApiBaseUrl();
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
};

export const normalizeMediaUrl = (url?: string | null) => {
  if (!url) return "";
  try {
    const media = new URL(url);
    const base = new URL(getApiBaseUrl());
    const localish =
      isLocalHost(media.hostname) ||
      /^192\.168\./.test(media.hostname) ||
      /^10\./.test(media.hostname) ||
      media.port === "5000";

    if (localish) {
      media.protocol = base.protocol;
      media.host = base.host;
      return media.toString();
    }
    return url;
  } catch {
    if (url.startsWith("/")) return `${getApiBaseUrl()}${url}`;
    return url;
  }
};

type ApiFetchOptions = RequestInit & {
  timeoutMs?: number;
  retries?: number;
  skipWake?: boolean;
};

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function rawFetch(
  url: string,
  options: RequestInit,
  timeoutMs: number,
  signal?: AbortSignal
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const onAbort = () => controller.abort();
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener("abort", onAbort);
  }

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        ...(options.headers || {}),
      },
    });
  } finally {
    clearTimeout(timer);
    if (signal) signal.removeEventListener("abort", onAbort);
  }
}

function isRetryableNetworkError(err: unknown): boolean {
  if (!err || typeof err !== "object") return true;
  const name = (err as Error).name;
  const msg = String((err as Error).message || "").toLowerCase();
  if (name === "AbortError") return true;
  if (msg.includes("network")) return true;
  if (msg.includes("failed")) return true;
  if (msg.includes("fetch")) return true;
  return true;
}

export async function apiFetch(path: string, options: ApiFetchOptions = {}) {
  const {
    timeoutMs = DEFAULT_TIMEOUT_MS,
    signal,
    retries = MAX_RETRIES,
    skipWake = false,
    ...rest
  } = options;

  let base = getApiBaseUrl();
  // Safety: never stay stuck on dead LAN if not explicitly local mode
  if (isLanOrLocalUrl(base) && !wantsLocalApi()) {
    base = getProductionApiUrl();
  }

  const pathPart = path.startsWith("/") ? path : `/${path}`;
  const prodUrl = getProductionApiUrl();

  if (!skipWake) {
    await ensureServerAwake(base);
  }

  let lastError: unknown;

  const urlsToTry = [base];
  if (isLanOrLocalUrl(base) && prodUrl !== base) {
    urlsToTry.push(prodUrl);
  }

  for (const host of urlsToTry) {
    const url = `${host}${pathPart}`;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        // Slightly longer timeout on later attempts (cold start)
        const t = timeoutMs + attempt * 10000;
        return await rawFetch(url, rest, t, signal);
      } catch (err) {
        lastError = err;
        if (!isRetryableNetworkError(err) || attempt >= retries) break;
        // Reset wake cache so next loop re-pings health
        lastWakeOk = 0;
        await sleep(1200 * (attempt + 1));
        await ensureServerAwake(host);
      }
    }
  }

  if (lastError instanceof Error && lastError.name === "AbortError") {
    throw new Error(
      "Server is waking up (can take ~1 min on free plan). Please try again."
    );
  }

  throw new Error(
    `Cannot reach server. Check internet and try again in a few seconds.`
  );
}

export async function apiJson<T = any>(
  path: string,
  options: ApiFetchOptions = {}
): Promise<T> {
  const res = await apiFetch(path, options);
  let data: any = null;
  try {
    data = await res.json();
  } catch {
    throw new Error(
      res.ok ? "Invalid server response" : `Server error (HTTP ${res.status})`
    );
  }
  if (!res.ok || data?.success === false) {
    throw new Error(
      data?.message || data?.msg || `Request failed (HTTP ${res.status})`
    );
  }
  return data as T;
}
