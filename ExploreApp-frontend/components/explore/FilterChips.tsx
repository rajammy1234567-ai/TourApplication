import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity } from "react-native";
import { ExploreColors, Layout } from "../../constants/exploreTheme";

export function FilterChips({
  items,
  active,
  onChange,
}: {
  items: string[];
  active: string;
  onChange: (v: string) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {items.map((item) => {
        const selected = active === item;
        return (
          <TouchableOpacity
            key={item}
            style={[styles.chip, selected && styles.chipActive]}
            onPress={() => onChange(item)}
            activeOpacity={0.8}
          >
            <Text style={[styles.text, selected && styles.textActive]}>{item}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: Layout.pad,
    gap: 8,
  },
  chip: {
    backgroundColor: ExploreColors.surface,
    borderWidth: 1,
    borderColor: ExploreColors.border,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  chipActive: {
    backgroundColor: ExploreColors.primary,
    borderColor: ExploreColors.primary,
  },
  text: {
    fontSize: 13,
    fontWeight: "600",
    color: ExploreColors.textSecondary,
  },
  textActive: { color: "#fff" },
});