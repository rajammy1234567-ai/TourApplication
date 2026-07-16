import { Dimensions, ViewStyle } from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export const ExploreColors = {
  primary: "#003D82",
  primaryDark: "#002652",
  primarySoft: "#E8EEF7",
  gold: "#F5B800",
  background: "#F4F6FA",
  surface: "#FFFFFF",
  text: "#0F172A",
  textSecondary: "#64748B",
  textMuted: "#94A3B8",
  border: "#E2E8F0",
  borderLight: "#F1F5F9",
  error: "#EF4444",
};

export const Layout = {
  screenWidth: SCREEN_WIDTH,
  /** Horizontal page padding — safe on narrow phones */
  pad: Math.max(16, Math.min(20, Math.round(SCREEN_WIDTH * 0.045))),
  /** Alias used by detail screens */
  screenPadding: Math.max(16, Math.min(20, Math.round(SCREEN_WIDTH * 0.045))),
  gap: 12,
  sectionGap: 28,
  radius: 14,
  radiusSm: 12,
  heroHeight: 240,
  hCardW: 160,
  hCardH: 210,
  listImg: 96,
  listCardH: 112,
  fullImgH: 180,
  hotelImgH: 180,
  listingCardW: Math.round(SCREEN_WIDTH * 0.42),
  listingImgH: Math.round(SCREEN_WIDTH * 0.42),
  destinationW: 140,
  /** @deprecated Use useAppInsets().scrollBottomPad instead */
  tabBarPad: 100,
};

export const ExploreShadow = {
  card: {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  } satisfies ViewStyle,
};

export const formatINR = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);

export const DEFAULT_TOUR_IMAGE =
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&q=80&auto=format";

export const DEFAULT_HOTEL_IMAGE =
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80&auto=format";

export const DEFAULT_EVENT_IMAGE =
  "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&q=80&auto=format";

export const isValidImageUrl = (url?: string | null): url is string =>
  Boolean(url?.trim().startsWith("http"));

export const resolveImageUrl = (url: string | undefined | null, fallback: string) => {
  if (!isValidImageUrl(url)) return fallback;
  // Lazy import avoids circular dependency with constants/api.ts
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { normalizeMediaUrl } = require("./api") as typeof import("./api");
    return normalizeMediaUrl(url.trim()) || fallback;
  } catch {
    return url.trim();
  }
};