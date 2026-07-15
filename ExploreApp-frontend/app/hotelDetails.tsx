import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { AppScreen } from "../components/explore/AppScreen";
import { useAppInsets } from "../hooks/use-app-insets";
import { apiUrl } from "../constants/api";
import { SafeImage } from "../components/explore/SafeImage";
import {
  DEFAULT_HOTEL_IMAGE,
  ExploreColors,
  Layout,
  formatINR,
} from "../constants/exploreTheme";

type Hotel = {
  _id: string;
  title: string;
  description?: string;
  image?: string;
  gallery?: string[];
  location?: string;
  city?: string;
  state?: string;
  pricePerNight: number;
  rating?: number;
  propertyType?: string;
  bedrooms?: number;
  bathrooms?: number;
  maxGuests?: number;
  amenities?: string[];
  checkInTime?: string;
  checkOutTime?: string;
};

export default function HotelDetailsScreen() {
  const { overlayTop, footerBottomPad } = useAppInsets();
  const { hotelId } = useLocalSearchParams<{ hotelId: string }>();
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHotel = async () => {
      try {
        const response = await fetch(apiUrl(`/api/hotels/${hotelId}`));
        const data = await response.json();
        if (response.ok && data.success) {
          setHotel(data.hotel);
        }
      } finally {
        setLoading(false);
      }
    };

    if (hotelId) fetchHotel();
  }, [hotelId]);

  if (loading) {
    return (
      <AppScreen variant="stack" style={styles.safe}>
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={ExploreColors.primary} />
        </View>
      </AppScreen>
    );
  }

  if (!hotel) {
    return (
      <AppScreen variant="stack" style={styles.safe}>
        <View style={styles.loader}>
          <Text style={styles.muted}>Hotel not found</Text>
        </View>
      </AppScreen>
    );
  }

  const images = [hotel.image, ...(hotel.gallery || [])].filter(Boolean) as string[];
  const footerH = 72 + footerBottomPad;

  return (
    <AppScreen variant="hero" style={styles.safe}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: footerH + 16 }}
      >
        <View style={styles.hero}>
          <SafeImage
            uri={images[0]}
            fallback={DEFAULT_HOTEL_IMAGE}
            style={styles.heroImage}
            contentFit="cover"
          />
          <TouchableOpacity style={[styles.backBtn, { top: overlayTop }]} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={ExploreColors.text} />
          </TouchableOpacity>
        </View>

        {images.length > 1 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.gallery}>
            {images.slice(1).map((uri, idx) => (
              <SafeImage
                key={`${uri}-${idx}`}
                uri={uri}
                fallback={DEFAULT_HOTEL_IMAGE}
                style={styles.galleryImg}
                contentFit="cover"
              />
            ))}
          </ScrollView>
        ) : null}

        <View style={styles.content}>
          <Text style={styles.title}>{hotel.title}</Text>
          <Text style={styles.location}>
            <Ionicons name="location-outline" size={14} color={ExploreColors.textSecondary} />{" "}
            {[hotel.city, hotel.state, hotel.location].filter(Boolean).join(", ")}
          </Text>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Ionicons name="bed-outline" size={18} color={ExploreColors.primary} />
              <Text style={styles.statText}>{hotel.bedrooms || 1} Beds</Text>
            </View>
            <View style={styles.stat}>
              <Ionicons name="water-outline" size={18} color={ExploreColors.primary} />
              <Text style={styles.statText}>{hotel.bathrooms || 1} Baths</Text>
            </View>
            <View style={styles.stat}>
              <Ionicons name="people-outline" size={18} color={ExploreColors.primary} />
              <Text style={styles.statText}>{hotel.maxGuests || 2} Guests</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>About this place</Text>
          <Text style={styles.description}>
            {hotel.description || "A comfortable stay with great amenities, perfect for your next trip."}
          </Text>

          {hotel.amenities?.length ? (
            <>
              <Text style={styles.sectionTitle}>Amenities</Text>
              <View style={styles.amenities}>
                {hotel.amenities.map((item) => (
                  <View key={item} style={styles.amenityChip}>
                    <Text style={styles.amenityText}>{item}</Text>
                  </View>
                ))}
              </View>
            </>
          ) : null}

          <Text style={styles.sectionTitle}>Check-in / Check-out</Text>
          <Text style={styles.description}>
            Check-in: {hotel.checkInTime || "14:00"} · Check-out: {hotel.checkOutTime || "11:00"}
          </Text>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: footerBottomPad }]}>
        <View>
          <Text style={styles.price}>{formatINR(hotel.pricePerNight)}</Text>
          <Text style={styles.perNight}>per night</Text>
        </View>
        <TouchableOpacity
          style={styles.bookBtn}
          onPress={() =>
            router.push({
              pathname: "/BookNow",
              params: {
                type: "hotel",
                hotelId: hotel._id,
                title: hotel.title,
                price: String(hotel.pricePerNight),
                image: hotel.image || "",
                locationName: [hotel.city, hotel.location].filter(Boolean).join(", "),
                city: hotel.city || "",
              },
            })
          }
        >
          <Text style={styles.bookBtnText}>Reserve</Text>
        </TouchableOpacity>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: ExploreColors.surface },
  loader: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: ExploreColors.background },
  muted: { color: ExploreColors.textSecondary },
  hero: { height: 280 },
  heroImage: { width: "100%", height: "100%" },
  backBtn: {
    position: "absolute",
    left: 16,
    backgroundColor: ExploreColors.surface,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  gallery: { paddingHorizontal: Layout.pad, paddingTop: Layout.gap, gap: Layout.gap },
  galleryImg: { width: 120, height: 80, borderRadius: Layout.radiusSm },
  content: { padding: Layout.pad },
  title: { fontSize: 24, fontWeight: "800", color: ExploreColors.text },
  location: { color: ExploreColors.textSecondary, marginTop: 6, fontSize: 14 },
  statsRow: { flexDirection: "row", flexWrap: "wrap", gap: 16, marginTop: 16 },
  stat: { flexDirection: "row", alignItems: "center", gap: 6 },
  statText: { color: ExploreColors.text, fontWeight: "600", fontSize: 13 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 22,
    marginBottom: 8,
    color: ExploreColors.text,
  },
  description: { color: ExploreColors.textSecondary, lineHeight: 22, fontSize: 14 },
  amenities: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  amenityChip: {
    backgroundColor: ExploreColors.primarySoft,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  amenityText: { color: ExploreColors.primary, fontWeight: "600", fontSize: 12 },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Layout.pad,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: ExploreColors.border,
    backgroundColor: ExploreColors.surface,
  },
  price: { fontSize: 22, fontWeight: "800", color: ExploreColors.primary },
  perNight: { color: ExploreColors.textSecondary, fontSize: 12 },
  bookBtn: {
    backgroundColor: ExploreColors.primary,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: Layout.radiusSm,
  },
  bookBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});