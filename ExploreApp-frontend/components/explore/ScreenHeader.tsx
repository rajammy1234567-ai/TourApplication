import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ExploreColors, Layout } from "../../constants/exploreTheme";

export function ScreenHeader({
  title,
  subtitle,
  icon,
}: {
  title: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.textWrap}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <View style={styles.iconBox}>
        <Ionicons name={icon} size={20} color={ExploreColors.primary} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Layout.pad,
    paddingTop: 8,
    paddingBottom: 12,
  },
  textWrap: { flex: 1 },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: ExploreColors.text,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: ExploreColors.textSecondary,
    marginTop: 2,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: Layout.radiusSm,
    backgroundColor: ExploreColors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
});