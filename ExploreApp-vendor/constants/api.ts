import { Platform } from "react-native";
import Constants from "expo-constants";

const PORT = process.env.EXPO_PUBLIC_API_PORT || "5000";

const isLocalUrl = (url: string) => /localhost|127\.0\.0\.1/i.test(url);

/** LAN IP from Expo Metro — always matches the network your phone is on. */
const getExpoDevHost = (): string | null => {
  const raw =
    Constants.expoConfig?.hostUri ??
    (Constants as { manifest2?: { extra?: { expoClient?: { hostUri?: string } } } }).manifest2
      ?.extra?.expoClient?.hostUri ??
    (Constants as { manifest?: { debuggerHost?: string } }).manifest?.debuggerHost;

  if (!raw) return null;

  const cleaned = raw.replace(/^exp:\/\//, "").split(":")[0];
  if (!cleaned || cleaned === "localhost" || cleaned === "127.0.0.1") {
    return null;
  }
  return cleaned;
};

const resolveDevHost = () => {
  const expoHost = getExpoDevHost();
  if (expoHost) return expoHost;

  const envHost = process.env.EXPO_PUBLIC_DEV_HOST?.trim();
  if (envHost) return envHost;

  if (Platform.OS === "android") {
    return Constants.isDevice ? "10.0.2.2" : "10.0.2.2";
  }

  if (!Constants.isDevice) return "localhost";
  return "localhost";
};

const resolveBaseUrl = () => {
  const expoHost = getExpoDevHost();

  // Physical device on Expo Go: Metro host is the most reliable (same WiFi, current IP).
  if (expoHost) {
    return `http://${expoHost}:${PORT}`;
  }

  const envUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, "");
  if (envUrl && !isLocalUrl(envUrl)) {
    return envUrl;
  }

  const host = resolveDevHost();
  return `http://${host}:${PORT}`;
};

export const API_BASE_URL = resolveBaseUrl();

if (__DEV__) {
  console.log("[Explore Vendor] API:", API_BASE_URL);
}

export const apiUrl = (path: string) =>
  `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;

/** Ensure uploaded image URLs use the same host the app talks to (not stale localhost). */
export const normalizeMediaUrl = (url: string) => {
  if (!url) return url;
  try {
    const media = new URL(url);
    const base = new URL(API_BASE_URL);
    media.protocol = base.protocol;
    media.host = base.host;
    return media.toString();
  } catch {
    return url;
  }
};