import React from "react";
import { Platform, StyleSheet, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ExploreColors, ExploreShadow, Layout } from "../../constants/exploreTheme";

export function SearchBar({
  value,
  onChangeText,
  placeholder = "Search...",
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <View style={styles.wrap}>
      <Ionicons name="search" size={18} color={ExploreColors.textMuted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={ExploreColors.textMuted}
        style={styles.input}
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: ExploreColors.surface,
    borderRadius: Layout.radiusSm,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 12 : 10,
    gap: 8,
    ...ExploreShadow.card,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: ExploreColors.text,
  },
});