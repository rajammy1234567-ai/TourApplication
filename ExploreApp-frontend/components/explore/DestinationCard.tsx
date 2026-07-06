import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { DEFAULT_TOUR_IMAGE, ExploreColors, Layout } from "../../constants/exploreTheme";
import { SafeImage } from "./SafeImage";

export type DestinationItem = {
  id: string;
  name: string;
  image: string;
  tagline?: string;
};

export function DestinationCard({
  item,
  onPress,
  isFirst,
}: {
  item: DestinationItem;
  onPress: () => void;
  isFirst?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.card, isFirst && styles.cardFirst]}
      activeOpacity={0.85}
      onPress={onPress}
    >
      <SafeImage uri={item.image} fallback={DEFAULT_TOUR_IMAGE} style={styles.image} contentFit="cover" transition={200} />
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {item.name}
        </Text>
        {item.tagline ? (
          <Text style={styles.tagline} numberOfLines={1}>
            {item.tagline}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: Layout.destinationW,
    marginRight: Layout.gap,
  },
  cardFirst: {
    marginLeft: Layout.pad,
  },
  image: {
    width: Layout.destinationW,
    height: Layout.destinationW,
    borderRadius: Layout.radius,
    backgroundColor: ExploreColors.borderLight,
  },
  body: {
    marginTop: 8,
  },
  name: {
    fontSize: 15,
    fontWeight: "600",
    color: ExploreColors.text,
  },
  tagline: {
    fontSize: 12,
    color: ExploreColors.textSecondary,
    marginTop: 2,
  },
});