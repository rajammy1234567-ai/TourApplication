import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeImage } from "./SafeImage";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  DEFAULT_TOUR_IMAGE,
  ExploreColors,
  ExploreShadow,
  Layout,
  formatINR,
} from "../../constants/exploreTheme";

export type TourItem = {
  _id: string;
  packageId?: string;
  title?: string;
  name?: string;
  location?: string;
  rating?: number;
  image?: string;
  images?: string[];
  duration?: string;
  people?: string;
  category?: string;
  price?: number;
  latitude?: number;
  longitude?: number;
};

function tourParams(item: TourItem, imageUri: string, title: string) {
  return {
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
  };
}

export function TourHorizontalCard({
  item,
  isWishlisted,
  onToggleWishlist,
  isFirst,
}: {
  item: TourItem;
  isWishlisted: boolean;
  onToggleWishlist: (item: TourItem) => void;
  isFirst?: boolean;
}) {
  const imageUri = item.image || item.images?.[0] || DEFAULT_TOUR_IMAGE;
  const title = item.title || item.name || "Tour";

  return (
    <TouchableOpacity
      style={[styles.card, isFirst && styles.cardFirst]}
      activeOpacity={0.9}
      onPress={() => router.push({ pathname: "/tourDetails", params: tourParams(item, imageUri, title) })}
    >
      <SafeImage uri={imageUri} fallback={DEFAULT_TOUR_IMAGE} style={styles.image} contentFit="cover" />
      <LinearGradient colors={["transparent", "rgba(0,0,0,0.8)"]} style={styles.gradient} />

      <TouchableOpacity
        style={styles.heart}
        onPress={(e) => { e.stopPropagation?.(); onToggleWishlist(item); }}
        hitSlop={8}
      >
        <Ionicons name={isWishlisted ? "heart" : "heart-outline"} size={16} color={isWishlisted ? "#EF4444" : "#fff"} />
      </TouchableOpacity>

      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        <Text style={styles.location} numberOfLines={1}>{item.location || "India"}</Text>
        <View style={styles.row}>
          <View style={styles.rating}>
            <Ionicons name="star" size={11} color="#FBBF24" />
            <Text style={styles.ratingText}>{Number(item.rating || 4.5).toFixed(1)}</Text>
          </View>
          <Text style={styles.price}>{formatINR(item.price || 15000)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: Layout.hCardW,
    height: Layout.hCardH,
    borderRadius: Layout.radius,
    overflow: "hidden",
    marginRight: Layout.gap,
    backgroundColor: "#ddd",
    ...ExploreShadow.card,
  },
  cardFirst: { marginLeft: Layout.pad },
  image: { width: "100%", height: "100%" },
  gradient: { position: "absolute", left: 0, right: 0, bottom: 0, height: "55%" },
  heart: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  body: { position: "absolute", left: 10, right: 10, bottom: 10 },
  title: { color: "#fff", fontSize: 13, fontWeight: "700" },
  location: { color: "rgba(255,255,255,0.8)", fontSize: 11, marginTop: 2 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 6 },
  rating: { flexDirection: "row", alignItems: "center", gap: 3 },
  ratingText: { color: "#fff", fontSize: 11, fontWeight: "600" },
  price: { color: "#fff", fontSize: 12, fontWeight: "800" },
});