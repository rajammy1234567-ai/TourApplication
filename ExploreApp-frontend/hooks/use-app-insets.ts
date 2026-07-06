import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TAB_BAR_CONTENT_HEIGHT = Platform.OS === "ios" ? 50 : 56;

export function useAppInsets() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = TAB_BAR_CONTENT_HEIGHT + insets.bottom;
  const scrollBottomPad = tabBarHeight + 16;
  const footerBottomPad = Math.max(insets.bottom, 12);
  const headerTopPad = Math.max(insets.top, Platform.OS === "android" ? 8 : 0);
  const overlayTop = insets.top + 12;

  return {
    ...insets,
    tabBarHeight,
    scrollBottomPad,
    footerBottomPad,
    headerTopPad,
    overlayTop,
  };
}