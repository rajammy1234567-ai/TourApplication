import { Platform } from "react-native";
import Constants from "expo-constants";

const PORT = process.env.EXPO_PUBLIC_API_PORT || "5000";
const DEFAULT_TIMEOUT_MS = 30000;

/** Live backend (Render) — Expo Go + APK both use this by default */
export const PROD_API_BASE_URL = "https://tourapplication-api.onrender.com";

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

/** Always returns a public HTTPS API URL (never LAN). */
export const getProductionApiUrl = (): string => {
  const extra = getExtra();
  const fromEnv = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  const candidate = stripSlash(fromEnv || extra.apiBaseUrl || PROD_API_BASE_URL);
  if (!candidate || isLocalHost(candidate) || isLanOrLocalUrl(candidate)) {
    return PROD_API_BASE_URL;
  }
  return candidate;
};

const wantsLocalApi = () =>
  process.env.EXPO_PUBLIC_USE_LOCAL_API === "1" ||
  process.env.EXPO_PUBLIC_USE_LOCAL_API === "true";

const forceProdApi = () => {
  const extra = getExtra();
  if (
    process.env.EXPO_PUBLIC_FORCE_PROD_API === "1" ||
    process.env.EXPO_PUBLIC_FORCE_PROD_API === "true"
  ) {
    return true;
  }
  if (extra.forceProdApi === true || extra.forceProdApi === "1" || extra.forceProdApi === "true") {
    return true;
  }
  // Default: production (safe for phone testing + APK)
  // Only local when EXPO_PUBLIC_USE_LOCAL_API=1
  return !wantsLocalApi();
};

/**
 * Expo Go (dev) → production API by default (works without PC backend).
 * APK / release → always production API.
 * Optional local: set EXPO_PUBLIC_USE_LOCAL_API=1 and run backend on :5000.
 */
const resolveBaseUrl = () => {
  const prodUrl = getProductionApiUrl();

  // APK / store builds
  if (!__DEV__) return prodUrl;

  // Dev with force prod (default)
  if (forceProdApi()) return prodUrl;

  // Explicit local backend mode
  if (wantsLocalApi()) {
    const expoHost = getExpoDevHost();
    if (expoHost) return `http://${expoHost}:${PORT}`;

    const envHost = process.env.EXPO_PUBLIC_DEV_HOST?.trim();
    if (envHost) return `http://${envHost}:${PORT}`;

    if (Platform.OS === "android") return `http://10.0.2.2:${PORT}`;
    return `http://localhost:${PORT}`;
  }

  return prodUrl;
};

export const getApiBaseUrl = () => resolveBaseUrl();
export const API_BASE_URL = resolveBaseUrl();

if (__DEV__) {
  setTimeout(() => {
    console.log("[VizTravel] API →", getApiBaseUrl());
  }, 400);
}

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

type ApiFetchOptions = RequestInit & { timeoutMs?: number };

async function rawFetch(
  url: string,
  options: RequestInit,
  timeoutMs: number,
  signal?: AbortSignal
) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const onAbort = () => controller.abort();
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener("abort", onAbort);
  }
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
    if (signal) signal.removeEventListener("abort", onAbort);
  }
}

export async function apiFetch(path: string, options: ApiFetchOptions = {}) {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, signal, ...rest } = options;
  const base = getApiBaseUrl();
  const pathPart = path.startsWith("/") ? path : `/${path}`;
  const url = `${base}${pathPart}`;
  const prodUrl = getProductionApiUrl();

  try {
    return await rawFetch(url, rest, timeoutMs, signal);
  } catch (err) {
    // LAN fail → automatic production retry (Expo Go safety net)
    if (isLanOrLocalUrl(base) && !url.startsWith(prodUrl)) {
      try {
        return await rawFetch(`${prodUrl}${pathPart}`, rest, timeoutMs, signal);
      } catch {
        // continue
      }
    }

    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(
        "Server is slow or waking up. Wait a few seconds and try again."
      );
    }
    throw new Error(
      `Cannot reach server (${base}). Check internet connection.`
    );
  }
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
