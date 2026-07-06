import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ExploreColors, Layout } from "../../constants/exploreTheme";

export function SectionHeader({
  title,
  subtitle,
  actionLabel,
  onAction,
}: {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.textWrap}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {actionLabel && onAction ? (
        <TouchableOpacity style={styles.action} onPress={onAction} activeOpacity={0.7}>
          <Text style={styles.actionText}>{actionLabel}</Text>
          <Ionicons name="chevron-forward" size={14} color={ExploreColors.primary} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: Layout.pad,
    marginBottom: Layout.gap,
  },
  textWrap: { flex: 1, marginRight: 12 },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: ExploreColors.text,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 13,
    color: ExploreColors.textSecondary,
    marginTop: 3,
    lineHeight: 18,
  },
  action: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingBottom: 2,
  },
  actionText: {
    fontSize: 14,
    fontWeight: "600",
    color: ExploreColors.primary,
  },
});