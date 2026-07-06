import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ExploreColors, Layout } from "../../constants/exploreTheme";

export type CategoryItem = {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
};

export function CategoryScroller({
  items,
  active,
  onChange,
}: {
  items: CategoryItem[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {items.map((item) => {
        const selected = active === item.id;
        return (
          <TouchableOpacity
            key={item.id}
            style={styles.item}
            onPress={() => onChange(item.id)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={item.icon}
              size={22}
              color={selected ? ExploreColors.text : ExploreColors.textMuted}
            />
            <Text style={[styles.label, selected && styles.labelActive]}>{item.label}</Text>
            {selected ? <View style={styles.underline} /> : <View style={styles.underlinePlaceholder} />}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: Layout.pad,
    gap: 4,
    borderBottomWidth: 1,
    borderBottomColor: ExploreColors.borderLight,
    paddingBottom: 0,
  },
  item: {
    alignItems: "center",
    paddingHorizontal: 14,
    paddingTop: 4,
    paddingBottom: 10,
    minWidth: 68,
  },
  label: {
    fontSize: 11,
    fontWeight: "500",
    color: ExploreColors.textMuted,
    marginTop: 4,
  },
  labelActive: {
    color: ExploreColors.text,
    fontWeight: "600",
  },
  underline: {
    position: "absolute",
    bottom: 0,
    left: 8,
    right: 8,
    height: 2,
    backgroundColor: ExploreColors.text,
    borderRadius: 1,
  },
  underlinePlaceholder: {
    position: "absolute",
    bottom: 0,
    left: 8,
    right: 8,
    height: 2,
    backgroundColor: "transparent",
  },
});