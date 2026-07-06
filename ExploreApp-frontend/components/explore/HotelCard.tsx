import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeImage } from "./SafeImage";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  DEFAULT_HOTEL_IMAGE,
  ExploreColors,
  ExploreShadow,
  Layout,
  formatINR,
} from "../../constants/exploreTheme";

export type HotelItem = {
  _id: string;
  title: string;
  image?: string;
  location?: string;
  city?: string;
  pricePerNight: number;
  rating?: number;
  propertyType?: string;
  bedrooms?: number;
  maxGuests?: number;
};

export function HotelCard({ item }: { item: HotelItem }) {
  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.9}
      onPress={() => router.push({ pathname: "/hotelDetails", params: { hotelId: item._id } })}
    >
      <SafeImage uri={item.image} fallback={DEFAULT_HOTEL_IMAGE} style={styles.image} contentFit="cover" />
      <View style={styles.body}>
        <View style={styles.top}>
          <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
          <View style={styles.rating}>
            <Ionicons name="star" size={11} color="#F59E0B" />
            <Text style={styles.ratingText}>{Number(item.rating || 4.5).toFixed(1)}</Text>
          </View>
        </View>
        <Text style={styles.loc} numberOfLines={1}>{item.city || item.location || "India"}</Text>
        <Text style={styles.meta}>
          {item.bedrooms || 1} beds · {item.maxGuests || 2} guests
        </Text>
        <Text style={styles.price}>
          {formatINR(item.pricePerNight)}
          <Text style={styles.perNight}> /night</Text>
        </Text>
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
  image: { width: "100%", height: Layout.hotelImgH },
  body: { padding: Layout.pad },
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  title: { flex: 1, fontSize: 16, fontWeight: "700", color: ExploreColors.text },
  rating: { flexDirection: "row", alignItems: "center", gap: 3 },
  ratingText: { fontSize: 12, fontWeight: "600", color: ExploreColors.textSecondary },
  loc: { fontSize: 13, color: ExploreColors.textSecondary, marginTop: 4 },
  meta: { fontSize: 12, color: ExploreColors.textMuted, marginTop: 4 },
  price: { fontSize: 17, fontWeight: "800", color: ExploreColors.primary, marginTop: 8 },
  perNight: { fontSize: 12, fontWeight: "500", color: ExploreColors.textSecondary },
});