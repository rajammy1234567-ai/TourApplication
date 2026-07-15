import { Platform } from "react-native";
import Constants from "expo-constants";

const PORT = process.env.EXPO_PUBLIC_API_PORT || "5000";

/** Production API (Render) */
export const PROD_API_BASE_URL = "https://tourapplication-api.onrender.com";

const isLocalUrl = (url: string) => /localhost|127\.0\.0\.1/i.test(url);
const isLocalHost = (host: string) => /localhost|127\.0\.0\.1/i.test(host);
const stripSlash = (url: string) => url.replace(/\/$/, "");

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

const getConfiguredProdUrl = (): string | null => {
  const fromExtra = (Constants.expoConfig?.extra as { apiBaseUrl?: string } | undefined)
    ?.apiBaseUrl;
  const fromEnv = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  const candidate = stripSlash(fromEnv || fromExtra || PROD_API_BASE_URL);
  if (!candidate || isLocalUrl(candidate)) return null;
  return candidate;
};

const resolveBaseUrl = () => {
  const forceProd =
    process.env.EXPO_PUBLIC_FORCE_PROD_API === "1" ||
    process.env.EXPO_PUBLIC_FORCE_PROD_API === "true";

  const prodUrl = getConfiguredProdUrl();

  if (!__DEV__ || forceProd) {
    return prodUrl || PROD_API_BASE_URL;
  }

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

export const API_BASE_URL = resolveBaseUrl();

if (__DEV__) {
  console.log("[VizTravel Vendor] API:", API_BASE_URL);
}

export const apiUrl = (path: string) =>
  `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;

/** Keep Cloudinary/CDN URLs intact; only rewrite local backend uploads. */
export const normalizeMediaUrl = (url: string) => {
  if (!url) return url;
  try {
    const media = new URL(url);
    const base = new URL(API_BASE_URL);
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
