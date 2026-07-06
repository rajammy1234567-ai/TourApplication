import React from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ExploreColors, ExploreShadow, Layout } from "../../constants/exploreTheme";

export function SearchPill({
  onPress,
  title = "Where to?",
  subtitle = "Anywhere · Any week · Add guests",
}: {
  onPress?: () => void;
  title?: string;
  subtitle?: string;
}) {
  return (
    <TouchableOpacity style={styles.wrap} activeOpacity={0.92} onPress={onPress}>
      <View style={styles.iconCircle}>
        <Ionicons name="search" size={18} color={ExploreColors.text} />
      </View>
      <View style={styles.textWrap}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: ExploreColors.surface,
    borderRadius: 40,
    paddingVertical: Platform.OS === "ios" ? 12 : 10,
    paddingHorizontal: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: ExploreColors.border,
    ...ExploreShadow.card,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: ExploreColors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  textWrap: { flex: 1 },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: ExploreColors.text,
  },
  subtitle: {
    fontSize: 12,
    color: ExploreColors.textSecondary,
    marginTop: 1,
  },
});