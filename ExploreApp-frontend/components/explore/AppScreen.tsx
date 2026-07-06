import React from "react";
import { StyleProp, ViewStyle } from "react-native";
import { Edge, SafeAreaView } from "react-native-safe-area-context";
import { ExploreColors } from "../../constants/exploreTheme";

export type AppScreenVariant = "tab" | "stack" | "stackFooter" | "hero" | "auth";

const VARIANT_EDGES: Record<AppScreenVariant, Edge[]> = {
  tab: ["top"],
  stack: ["top", "bottom"],
  stackFooter: ["top"],
  hero: ["bottom"],
  auth: ["top", "bottom"],
};

type AppScreenProps = {
  variant?: AppScreenVariant;
  edges?: Edge[];
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
};

export function AppScreen({ variant = "stack", edges, style, children }: AppScreenProps) {
  return (
    <SafeAreaView
      style={[{ flex: 1, backgroundColor: ExploreColors.background }, style]}
      edges={edges ?? VARIANT_EDGES[variant]}
    >
      {children}
    </SafeAreaView>
  );
}