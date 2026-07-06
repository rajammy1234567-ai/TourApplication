import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const TAB_BAR_BASE_HEIGHT = 56;

/** Minimum bottom pad when Android reports 0 inset (gesture nav bar). */
export const getBottomInset = (inset: number) =>
  Math.max(inset, Platform.OS === "android" ? 24 : inset > 0 ? inset : 12);

export function useTabBarMetrics() {
  const insets = useSafeAreaInsets();
  const bottom = getBottomInset(insets.bottom);

  return {
    top: insets.top,
    bottom,
    tabBarHeight: TAB_BAR_BASE_HEIGHT + bottom,
    contentBottomPad: TAB_BAR_BASE_HEIGHT + bottom + 16,
    fabBottom: TAB_BAR_BASE_HEIGHT + bottom + 20,
  };
}