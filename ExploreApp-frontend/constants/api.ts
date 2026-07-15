import { Platform } from "react-native";
import Constants from "expo-constants";

const PORT = process.env.EXPO_PUBLIC_API_PORT || "5000";
const DEFAULT_TIMEOUT_MS = 20000;

/** Production API (Render) — used for release APK / when force-prod is set */
export const PROD_API_BASE_URL = "https://tourapplication-api.onrender.com";

const isLocalHost = (host: string) =>
  /localhost|127\.0\.0\.1/i.test(host);

const stripSlash = (url: string) => url.replace(/\/$/, "");

/** LAN IP from Expo Metro (dev only). */
const getExpoDevHost = (): string | null => {
  try {
    const raw =
      Constants.expoConfig?.hostUri ??
      (Constants as { manifest2?: { extra?: { expoClient?: { hostUri?: string } } } }).manifest2
        ?.extra?.expoClient?.hostUri ??
      (Constants as { manifest?: { debuggerHost?: string } }).manifest?.debuggerHost ??
      (Constants as { linkingUri?: string }).linkingUri;

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

const getConfiguredProdUrl = (): string | null => {
  const fromExtra = (Constants.expoConfig?.extra as { apiBaseUrl?: string } | undefined)
    ?.apiBaseUrl;
  const fromEnv = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  const candidate = stripSlash(fromEnv || fromExtra || PROD_API_BASE_URL);
  if (!candidate || isLocalHost(candidate)) return null;
  return candidate;
};

/**
 * Production / release builds → always production API.
 * Dev (Expo Go) → LAN backend if Metro host available, else production API.
 * Set EXPO_PUBLIC_FORCE_PROD_API=1 to always hit Render even in dev.
 */
const resolveBaseUrl = () => {
  const forceProd =
    process.env.EXPO_PUBLIC_FORCE_PROD_API === "1" ||
    process.env.EXPO_PUBLIC_FORCE_PROD_API === "true";

  const prodUrl = getConfiguredProdUrl();

  // Release APK / production bundle
  if (!__DEV__ || forceProd) {
    return prodUrl || PROD_API_BASE_URL;
  }

  // Dev: prefer local Metro machine so you can run backend on PC
  const expoHost = getExpoDevHost();
  if (expoHost) {
    return `http://${expoHost}:${PORT}`;
  }

  if (prodUrl) return prodUrl;

  const envHost = process.env.EXPO_PUBLIC_DEV_HOST?.trim();
  if (envHost) return `http://${envHost}:${PORT}`;

  if (Platform.OS === "android") {
    return `http://10.0.2.2:${PORT}`;
  }

  return `http://localhost:${PORT}`;
};

export const getApiBaseUrl = () => resolveBaseUrl();

export const API_BASE_URL = resolveBaseUrl();

if (__DEV__) {
  setTimeout(() => {
    console.log("[VizTravel User] API:", getApiBaseUrl());
  }, 500);
}

export const apiUrl = (path: string) => {
  const base = getApiBaseUrl();
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
};

/** Rewrite only local /uploads media to current API host; keep Cloudinary/CDN as-is. */
export const normalizeMediaUrl = (url?: string | null) => {
  if (!url) return "";
  try {
    const media = new URL(url);
    const base = new URL(getApiBaseUrl());
    if (
      isLocalHost(media.hostname) ||
      /^192\.168\./.test(media.hostname) ||
      /^10\./.test(media.hostname) ||
      media.port === "5000" ||
      media.pathname.startsWith("/uploads")
    ) {
      // Only rewrite if it looks like our backend host, not random CDNs
      if (
        isLocalHost(media.hostname) ||
        /^192\.168\./.test(media.hostname) ||
        /^10\./.test(media.hostname) ||
        media.hostname.includes("onrender.com") ||
        media.port === "5000"
      ) {
        media.protocol = base.protocol;
        media.host = base.host;
        return media.toString();
      }
    }
    return url;
  } catch {
    if (url.startsWith("/")) return `${getApiBaseUrl()}${url}`;
    return url;
  }
};

type ApiFetchOptions = RequestInit & { timeoutMs?: number };

export async function apiFetch(path: string, options: ApiFetchOptions = {}) {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, signal, ...rest } = options;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const base = getApiBaseUrl();
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;

  const onAbort = () => controller.abort();
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener("abort", onAbort);
  }

  try {
    return await fetch(url, {
      ...rest,
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("Request timed out. Server slow or offline.");
    }
    throw new Error(`Cannot reach server (${base}).`);
  } finally {
    clearTimeout(timer);
    if (signal) signal.removeEventListener("abort", onAbort);
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
    throw new Error(res.ok ? "Invalid server response" : `Server error (HTTP ${res.status})`);
  }
  if (!res.ok || data?.success === false) {
    throw new Error(data?.message || `Request failed (HTTP ${res.status})`);
  }
  return data as T;
}
