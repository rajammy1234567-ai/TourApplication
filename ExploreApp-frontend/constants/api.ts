import { Platform } from "react-native";
import Constants from "expo-constants";

const PORT = process.env.EXPO_PUBLIC_API_PORT || "5000";

const isLocalUrl = (url: string) => /localhost|127\.0\.0\.1/i.test(url);

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
  // Prefer Metro/Expo host so phone always hits the PC on the current Wi‑Fi.
  const expoHost = getExpoDevHost();
  if (expoHost) return expoHost;

  const envHost = process.env.EXPO_PUBLIC_DEV_HOST?.trim();
  if (envHost) return envHost;

  if (Platform.OS === "android") {
    return "10.0.2.2";
  }

  return "localhost";
};

const resolveBaseUrl = () => {
  const expoHost = getExpoDevHost();

  // Physical device / Expo Go: Metro host is most reliable for local backend.
  if (expoHost) {
    return `http://${expoHost}:${PORT}`;
  }

  const envUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, "");
  if (envUrl && !isLocalUrl(envUrl)) return envUrl;

  const host = resolveDevHost();
  return `http://${host}:${PORT}`;
};

export const API_BASE_URL = resolveBaseUrl();

if (__DEV__) {
  console.log("[Explore User] API:", API_BASE_URL);
}

export const apiUrl = (path: string) =>
  `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;