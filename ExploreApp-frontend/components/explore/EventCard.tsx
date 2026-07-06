import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { DEFAULT_EVENT_IMAGE, ExploreColors, ExploreShadow, Layout } from "../../constants/exploreTheme";
import { SafeImage } from "./SafeImage";

export type EventItem = {
  id: string;
  title: string;
  date: string;
  time?: string;
  image: string;
  location: string;
  city?: string;
};

const formatDate = (date: string) => {
  if (!date) return "TBA";
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
};

export function EventCard({ item, onPress }: { item: EventItem; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.9} onPress={onPress}>
      <SafeImage uri={item.image} fallback={DEFAULT_EVENT_IMAGE} style={styles.image} contentFit="cover" />
      <View style={styles.body}>
        <Text style={styles.date}>{formatDate(item.date)}</Text>
        <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
        <View style={styles.locRow}>
          <Ionicons name="location-outline" size={13} color={ExploreColors.textMuted} />
          <Text style={styles.loc} numberOfLines={1}>
            {item.location}{item.city ? `, ${item.city}` : ""}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: ExploreColors.surface,
    borderRadius: Layout.radius,
    overflow: "hidden",
    marginBottom: Layout.gap,
    ...ExploreShadow.card,
  },
  image: { width: "100%", height: Layout.fullImgH },
  body: { padding: Layout.pad },
  date: { fontSize: 12, fontWeight: "700", color: ExploreColors.primary, marginBottom: 4 },
  title: { fontSize: 16, fontWeight: "700", color: ExploreColors.text, lineHeight: 21 },
  locRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 8 },
  loc: { flex: 1, fontSize: 13, color: ExploreColors.textSecondary },
});