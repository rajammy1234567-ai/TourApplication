import { Platform } from "react-native";
import Constants from "expo-constants";

const PORT = process.env.EXPO_PUBLIC_API_PORT || "5000";
const DEFAULT_TIMEOUT_MS = 15000;

const isLocalHost = (host: string) =>
  /localhost|127\.0\.0\.1/i.test(host);

/** LAN IP from Expo Metro — re-read every time (hostUri can be empty at first import). */
const getExpoDevHost = (): string | null => {
  try {
    const raw =
      Constants.expoConfig?.hostUri ??
      (Constants as { manifest2?: { extra?: { expoClient?: { hostUri?: string } } } }).manifest2
        ?.extra?.expoClient?.hostUri ??
      (Constants as { manifest?: { debuggerHost?: string } }).manifest?.debuggerHost ??
      // Expo Go sometimes exposes this:
      (Constants as { linkingUri?: string }).linkingUri;

    if (!raw) return null;

    // hostUri / debuggerHost: "192.168.1.5:8081"
    // linkingUri: "exp://192.168.1.5:8081"
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

const resolveBaseUrl = () => {
  const expoHost = getExpoDevHost();
  if (expoHost) {
    return `http://${expoHost}:${PORT}`;
  }

  const envUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, "");
  if (envUrl && !isLocalHost(envUrl)) {
    return envUrl;
  }

  const envHost = process.env.EXPO_PUBLIC_DEV_HOST?.trim();
  if (envHost) {
    return `http://${envHost}:${PORT}`;
  }

  // Android emulator loopback to host machine
  if (Platform.OS === "android") {
    return `http://10.0.2.2:${PORT}`;
  }

  return `http://localhost:${PORT}`;
};

/** Always resolve at call-time so Expo hostUri is not frozen empty. */
export const getApiBaseUrl = () => resolveBaseUrl();

/** @deprecated Prefer getApiBaseUrl() — kept for older imports */
export const API_BASE_URL = resolveBaseUrl();

if (__DEV__) {
  // Log after a tick so Constants often already has hostUri
  setTimeout(() => {
    console.log("[VizTravel User] API:", getApiBaseUrl());
  }, 500);
}

export const apiUrl = (path: string) => {
  const base = getApiBaseUrl();
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
};

/** Rewrite media URLs that still point at an old PC IP / localhost. */
export const normalizeMediaUrl = (url?: string | null) => {
  if (!url) return "";
  try {
    const media = new URL(url);
    const base = new URL(getApiBaseUrl());
    if (
      isLocalHost(media.hostname) ||
      /^192\.168\./.test(media.hostname) ||
      /^10\./.test(media.hostname) ||
      media.port === "5000"
    ) {
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

/**
 * fetch with timeout + clear errors. Base URL resolved per request.
 */
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
      throw new Error("Request timed out. Check backend is running on same Wi‑Fi.");
    }
    throw new Error("Cannot reach server. Start backend & stay on same Wi‑Fi.");
  } finally {
    clearTimeout(timer);
    if (signal) signal.removeEventListener("abort", onAbort);
  }
}

/** GET/POST helper that parses JSON and surfaces API message. */
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
