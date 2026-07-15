import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeImage } from "./SafeImage";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  DEFAULT_TOUR_IMAGE,
  ExploreColors,
  ExploreShadow,
  Layout,
  formatINR,
} from "../../constants/exploreTheme";
import type { TourItem } from "./TourHorizontalCard";

function openTour(item: TourItem, imageUri: string, title: string) {
  router.push({
    pathname: "/tourDetails",
    params: {
      packageId: item.packageId || item._id,
      tourId: item._id,
      title,
      image: imageUri,
      rating: String(item.rating ?? 4),
      locationName: item.location || "",
      price: String(item.price || ""),
      duration: item.duration || "",
      people: item.people || "",
      latitude: String(item.latitude || ""),
      longitude: String(item.longitude || ""),
    },
  });
}

export function TourListCard({ item, variant = "row" }: { item: TourItem; variant?: "row" | "full" }) {
  const imageUri = item.image || item.images?.[0] || item.gallery?.[0] || DEFAULT_TOUR_IMAGE;
  const title = item.title || item.name || "Tour";

  if (variant === "full") {
    return (
      <TouchableOpacity
        style={styles.fullCard}
        activeOpacity={0.9}
        onPress={() => openTour(item, imageUri, title)}
      >
        <SafeImage uri={imageUri} fallback={DEFAULT_TOUR_IMAGE} style={styles.fullImage} contentFit="cover" />
        <View style={styles.fullBody}>
          <Text style={styles.fullTitle} numberOfLines={2}>{title}</Text>
          <Text style={styles.fullLoc} numberOfLines={1}>{item.location || "India"}</Text>
          <View style={styles.fullRow}>
            <Text style={styles.fullMeta}>{item.duration || "Flexible"} · {item.people || "Group"}</Text>
            <Text style={styles.fullPrice}>{formatINR(item.price || 15000)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={styles.rowCard}
      activeOpacity={0.9}
      onPress={() => openTour(item, imageUri, title)}
    >
      <SafeImage uri={imageUri} fallback={DEFAULT_TOUR_IMAGE} style={styles.rowImage} contentFit="cover" />
      <View style={styles.rowBody}>
        <Text style={styles.rowTitle} numberOfLines={1}>{title}</Text>
        <Text style={styles.rowLoc} numberOfLines={1}>{item.location || "India"}</Text>
        <View style={styles.rowFooter}>
          <Text style={styles.rowPrice}>{formatINR(item.price || 15000)}</Text>
          <View style={styles.rowRating}>
            <Ionicons name="star" size={11} color="#F59E0B" />
            <Text style={styles.rowRatingText}>{Number(item.rating || 4.5).toFixed(1)}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  rowCard: {
    flexDirection: "row",
    height: Layout.listCardH,
    backgroundColor: ExploreColors.surface,
    borderRadius: Layout.radius,
    marginBottom: Layout.gap,
    overflow: "hidden",
    ...ExploreShadow.card,
  },
  rowImage: {
    width: Layout.listImg,
    height: Layout.listCardH,
  },
  rowBody: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: "space-between",
  },
  rowTitle: { fontSize: 15, fontWeight: "700", color: ExploreColors.text },
  rowLoc: { fontSize: 12, color: ExploreColors.textSecondary, marginTop: 2 },
  rowFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  rowPrice: { fontSize: 15, fontWeight: "800", color: ExploreColors.primary },
  rowRating: { flexDirection: "row", alignItems: "center", gap: 3 },
  rowRatingText: { fontSize: 12, fontWeight: "600", color: ExploreColors.textSecondary },
  fullCard: {
    backgroundColor: ExploreColors.surface,
    borderRadius: Layout.radius,
    overflow: "hidden",
    marginBottom: Layout.gap,
    ...ExploreShadow.card,
  },
  fullImage: { width: "100%", height: Layout.fullImgH },
  fullBody: { padding: Layout.pad },
  fullTitle: { fontSize: 16, fontWeight: "700", color: ExploreColors.text },
  fullLoc: { fontSize: 13, color: ExploreColors.textSecondary, marginTop: 4 },
  fullRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 10 },
  fullMeta: { fontSize: 12, color: ExploreColors.textMuted, flex: 1, marginRight: 8 },
  fullPrice: { fontSize: 16, fontWeight: "800", color: ExploreColors.primary },
});