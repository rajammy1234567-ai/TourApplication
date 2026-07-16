import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
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
import { apiJson } from "../constants/api";
import { SafeImage } from "../components/explore/SafeImage";
import {
  DEFAULT_HOTEL_IMAGE,
  ExploreColors,
  Layout,
  formatINR,
} from "../constants/exploreTheme";

const { width: SCREEN_W } = Dimensions.get("window");
const H_PAD = Layout.pad;
const HERO_H = Math.min(300, Math.round(SCREEN_W * 0.72));

type VendorInfo = {
  businessName?: string;
  ownerName?: string;
  phone?: string;
  email?: string;
  city?: string;
  state?: string;
  address?: string;
};

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
  vendorId?: string | VendorInfo | null;
};

export default function HotelDetailsScreen() {
  const { overlayTop, footerBottomPad } = useAppInsets();
  const { hotelId } = useLocalSearchParams<{ hotelId: string }>();
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!hotelId) {
      setLoading(false);
      setError("Missing hotel id");
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const data = await apiJson<{ hotel?: Hotel }>(`/api/hotels/${hotelId}`, {
          timeoutMs: 25000,
        });
        if (!cancelled) setHotel(data.hotel || null);
      } catch (err: any) {
        if (!cancelled) {
          setHotel(null);
          setError(err?.message || "Could not load hotel");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hotelId]);

  if (loading) {
    return (
      <AppScreen variant="stack" style={styles.safe}>
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={ExploreColors.primary} />
          <Text style={styles.muted}>Loading stay…</Text>
        </View>
      </AppScreen>
    );
  }

  if (!hotel) {
    return (
      <AppScreen variant="stack" style={styles.safe}>
        <View style={styles.loader}>
          <Text style={styles.muted}>{error || "Hotel not found"}</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
            <Text style={styles.backLinkText}>Go back</Text>
          </TouchableOpacity>
        </View>
      </AppScreen>
    );
  }

  const images = [hotel.image, ...(hotel.gallery || [])].filter(Boolean) as string[];
  const uniqueImages = images.filter((u, i, arr) => arr.indexOf(u) === i);
  const footerH = 76 + footerBottomPad;
  const vendor =
    hotel.vendorId && typeof hotel.vendorId === "object" ? hotel.vendorId : null;
  const amenities = (hotel.amenities || []).filter(Boolean);
  const placeLine = [hotel.city, hotel.state, hotel.location].filter(Boolean).join(", ");

  return (
    <AppScreen variant="hero" style={styles.safe}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: footerH + 20 }}
        bounces
      >
        <View style={[styles.hero, { height: HERO_H }]}>
          <SafeImage
            uri={uniqueImages[0]}
            fallback={DEFAULT_HOTEL_IMAGE}
            style={styles.heroImage}
            contentFit="cover"
            transition={150}
          />
          <TouchableOpacity
            style={[styles.backBtn, { top: overlayTop }]}
            onPress={() => router.back()}
            hitSlop={8}
          >
            <Ionicons name="arrow-back" size={22} color={ExploreColors.text} />
          </TouchableOpacity>
        </View>

        {uniqueImages.length > 1 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.gallery}
          >
            {uniqueImages.slice(1).map((uri, idx) => (
              <SafeImage
                key={`${uri}-${idx}`}
                uri={uri}
                fallback={DEFAULT_HOTEL_IMAGE}
                style={styles.galleryImg}
                contentFit="cover"
                transition={100}
              />
            ))}
          </ScrollView>
        ) : null}

        {/* Content below image — constrained for all phone widths */}
        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={3}>
            {hotel.title}
          </Text>

          {placeLine ? (
            <View style={styles.locationRow}>
              <Ionicons
                name="location-outline"
                size={15}
                color={ExploreColors.textSecondary}
                style={styles.locationIcon}
              />
              <Text style={styles.location} numberOfLines={2}>
                {placeLine}
              </Text>
            </View>
          ) : null}

          <View style={styles.metaRow}>
            {hotel.propertyType ? (
              <View style={styles.metaChip}>
                <Text style={styles.metaChipText} numberOfLines={1}>
                  {hotel.propertyType.charAt(0).toUpperCase() + hotel.propertyType.slice(1)}
                </Text>
              </View>
            ) : null}
            {hotel.rating != null && hotel.rating > 0 ? (
              <View style={styles.metaChip}>
                <Text style={styles.metaChipText}>⭐ {hotel.rating.toFixed(1)}</Text>
              </View>
            ) : (
              <View style={styles.metaChip}>
                <Text style={styles.metaChipText}>New stay</Text>
              </View>
            )}
          </View>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Ionicons name="bed-outline" size={17} color={ExploreColors.primary} />
              <Text style={styles.statText} numberOfLines={1}>
                {hotel.bedrooms || 1} Beds
              </Text>
            </View>
            <View style={styles.stat}>
              <Ionicons name="water-outline" size={17} color={ExploreColors.primary} />
              <Text style={styles.statText} numberOfLines={1}>
                {hotel.bathrooms || 1} Baths
              </Text>
            </View>
            <View style={styles.stat}>
              <Ionicons name="people-outline" size={17} color={ExploreColors.primary} />
              <Text style={styles.statText} numberOfLines={1}>
                {hotel.maxGuests || 2} Guests
              </Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>About this place</Text>
          <Text style={styles.description}>
            {hotel.description?.trim() ||
              "A comfortable stay with great amenities, perfect for your next trip."}
          </Text>

          <Text style={styles.sectionTitle}>
            Amenities{amenities.length ? ` (${amenities.length})` : ""}
          </Text>
          {amenities.length ? (
            <View style={styles.amenities}>
              {amenities.map((item) => (
                <View key={item} style={styles.amenityChip}>
                  <Ionicons name="checkmark" size={12} color={ExploreColors.primary} />
                  <Text style={styles.amenityText} numberOfLines={1}>
                    {item}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.description}>No amenities listed by the partner yet.</Text>
          )}

          <Text style={styles.sectionTitle}>Check-in / Check-out</Text>
          <View style={styles.checkRow}>
            <View style={styles.checkBox}>
              <Text style={styles.checkLabel}>Check-in</Text>
              <Text style={styles.checkValue}>{hotel.checkInTime || "14:00"}</Text>
            </View>
            <View style={styles.checkBox}>
              <Text style={styles.checkLabel}>Check-out</Text>
              <Text style={styles.checkValue}>{hotel.checkOutTime || "11:00"}</Text>
            </View>
          </View>

          {vendor ? (
            <>
              <Text style={styles.sectionTitle}>Hosted by</Text>
              <View style={styles.vendorCard}>
                <View style={styles.vendorIcon}>
                  <Ionicons name="storefront-outline" size={22} color={ExploreColors.primary} />
                </View>
                <View style={styles.vendorTextCol}>
                  <Text style={styles.vendorName} numberOfLines={2}>
                    {vendor.businessName || "Partner"}
                  </Text>
                  {vendor.ownerName ? (
                    <Text style={styles.vendorMeta} numberOfLines={1}>
                      {vendor.ownerName}
                    </Text>
                  ) : null}
                  {[vendor.city, vendor.state].filter(Boolean).length ? (
                    <Text style={styles.vendorMeta} numberOfLines={1}>
                      {[vendor.city, vendor.state].filter(Boolean).join(", ")}
                    </Text>
                  ) : null}
                  {vendor.phone ? (
                    <Text style={styles.vendorContact} numberOfLines={1}>
                      📞 {vendor.phone}
                    </Text>
                  ) : null}
                  {vendor.email ? (
                    <Text style={styles.vendorContact} numberOfLines={1}>
                      ✉️ {vendor.email}
                    </Text>
                  ) : null}
                </View>
              </View>
            </>
          ) : null}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: footerBottomPad }]}>
        <View style={styles.footerPriceCol}>
          <Text style={styles.price} numberOfLines={1}>
            {formatINR(hotel.pricePerNight)}
          </Text>
          <Text style={styles.perNight}>per night</Text>
        </View>
        <TouchableOpacity
          style={styles.bookBtn}
          activeOpacity={0.9}
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
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    backgroundColor: ExploreColors.background,
    paddingHorizontal: H_PAD,
  },
  muted: {
    color: ExploreColors.textSecondary,
    textAlign: "center",
    paddingHorizontal: 12,
  },
  backLink: { marginTop: 12 },
  backLinkText: { color: ExploreColors.primary, fontWeight: "700" },

  hero: {
    width: "100%",
    backgroundColor: ExploreColors.borderLight,
    overflow: "hidden",
  },
  heroImage: { width: "100%", height: "100%" },
  backBtn: {
    position: "absolute",
    left: H_PAD,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },

  gallery: {
    paddingHorizontal: H_PAD,
    paddingTop: 12,
    paddingRight: H_PAD + 4,
    gap: 10,
  },
  galleryImg: {
    width: 88,
    height: 72,
    borderRadius: 12,
    backgroundColor: ExploreColors.borderLight,
  },

  content: {
    width: "100%",
    maxWidth: SCREEN_W,
    paddingHorizontal: H_PAD,
    paddingTop: 16,
    overflow: "hidden",
  },
  title: {
    fontSize: Math.min(22, SCREEN_W * 0.055),
    fontWeight: "800",
    color: ExploreColors.text,
    lineHeight: 28,
    flexShrink: 1,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 8,
    gap: 4,
    maxWidth: "100%",
  },
  locationIcon: { marginTop: 2 },
  location: {
    flex: 1,
    flexShrink: 1,
    color: ExploreColors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },

  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  metaChip: {
    backgroundColor: "#EEF4FF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    maxWidth: "100%",
  },
  metaChipText: {
    color: ExploreColors.primary,
    fontWeight: "700",
    fontSize: 12,
  },

  statsRow: {
    flexDirection: "row",
    marginTop: 16,
    gap: 8,
    width: "100%",
  },
  stat: {
    flex: 1,
    minWidth: 0,
    backgroundColor: ExploreColors.background,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: "center",
    gap: 4,
  },
  statText: {
    fontSize: 11,
    fontWeight: "700",
    color: ExploreColors.text,
    textAlign: "center",
  },

  sectionTitle: {
    marginTop: 22,
    fontSize: 16,
    fontWeight: "800",
    color: ExploreColors.text,
  },
  description: {
    marginTop: 8,
    color: ExploreColors.textSecondary,
    lineHeight: 22,
    fontSize: 14,
    flexShrink: 1,
  },

  amenities: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
    width: "100%",
  },
  amenityChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#EEF4FF",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 20,
    maxWidth: SCREEN_W - H_PAD * 2,
  },
  amenityText: {
    color: ExploreColors.primary,
    fontWeight: "600",
    fontSize: 12,
    flexShrink: 1,
  },

  checkRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
    width: "100%",
  },
  checkBox: {
    flex: 1,
    minWidth: 0,
    backgroundColor: ExploreColors.background,
    borderRadius: 12,
    padding: 12,
  },
  checkLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: ExploreColors.textMuted,
    textTransform: "uppercase",
  },
  checkValue: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: "800",
    color: ExploreColors.text,
  },

  vendorCard: {
    marginTop: 10,
    flexDirection: "row",
    gap: 12,
    backgroundColor: "#f8fafc",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    width: "100%",
    maxWidth: "100%",
  },
  vendorIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#E8F0F7",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  vendorTextCol: {
    flex: 1,
    minWidth: 0,
  },
  vendorName: {
    fontWeight: "800",
    fontSize: 15,
    color: ExploreColors.text,
  },
  vendorMeta: {
    color: ExploreColors.textSecondary,
    marginTop: 2,
    fontSize: 13,
  },
  vendorContact: {
    color: ExploreColors.primary,
    marginTop: 4,
    fontSize: 13,
    fontWeight: "600",
  },

  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: H_PAD,
    paddingTop: 12,
    backgroundColor: "#fff",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#e5e7eb",
  },
  footerPriceCol: {
    flex: 1,
    minWidth: 0,
    paddingRight: 8,
  },
  price: {
    fontSize: 18,
    fontWeight: "800",
    color: ExploreColors.text,
  },
  perNight: {
    fontSize: 12,
    color: ExploreColors.textSecondary,
    marginTop: 2,
  },
  bookBtn: {
    backgroundColor: ExploreColors.primary,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 12,
    flexShrink: 0,
    minWidth: 110,
    alignItems: "center",
  },
  bookBtnText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 15,
  },
});
