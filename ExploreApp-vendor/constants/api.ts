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
};

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
  return !wantsLocalApi();
};

const resolveBaseUrl = () => {
  const prodUrl = getProductionApiUrl();
  if (!__DEV__) return prodUrl;
  if (forceProdApi()) return prodUrl;

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
  console.log("[VizTravel Vendor] API →", getApiBaseUrl());
}

export const apiUrl = (path: string) =>
  `${getApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;

export const normalizeMediaUrl = (url: string) => {
  if (!url) return url;
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
    return url;
  }
};

type ApiFetchOptions = RequestInit & { timeoutMs?: number };

export async function apiFetch(path: string, options: ApiFetchOptions = {}) {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, signal, ...rest } = options;
  const base = getApiBaseUrl();
  const pathPart = path.startsWith("/") ? path : `/${path}`;
  const url = `${base}${pathPart}`;
  const prodUrl = getProductionApiUrl();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const onAbort = () => controller.abort();
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener("abort", onAbort);
  }

  try {
    return await fetch(url, { ...rest, signal: controller.signal });
  } catch (err) {
    if (isLanOrLocalUrl(base) && !url.startsWith(prodUrl)) {
      try {
        clearTimeout(timer);
        const c2 = new AbortController();
        const t2 = setTimeout(() => c2.abort(), timeoutMs);
        try {
          return await fetch(`${prodUrl}${pathPart}`, {
            ...rest,
            signal: c2.signal,
          });
        } finally {
          clearTimeout(t2);
        }
      } catch {
        // fall through
      }
    }
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("Server is slow or waking up. Try again in a few seconds.");
    }
    throw new Error(`Cannot reach server (${base}). Check internet connection.`);
  } finally {
    clearTimeout(timer);
    if (signal) signal.removeEventListener("abort", onAbort);
  }
}
