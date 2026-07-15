import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Share,
  ActivityIndicator,
} from "react-native";
import { AppScreen } from "../components/explore/AppScreen";
import { useAppInsets } from "../hooks/use-app-insets";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, router } from "expo-router";
import MapComponent from "../components/MapComponent";
import { SafeImage } from "../components/explore/SafeImage";
import { apiJson } from "../constants/api";
import { DEFAULT_TOUR_IMAGE, ExploreColors, formatINR } from "../constants/exploreTheme";

const getParam = (value: string | string[] | undefined, fallback = "") =>
  Array.isArray(value) ? value[0] || fallback : value || fallback;

type VendorInfo = {
  _id?: string;
  businessName?: string;
  ownerName?: string;
  phone?: string;
  email?: string;
  city?: string;
  state?: string;
  address?: string;
};

export default function TourDetails() {
  const params = useLocalSearchParams();
  const { overlayTop, footerBottomPad } = useAppInsets();
  const [liked, setLiked] = useState(false);
  const [apiTour, setApiTour] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const tourId = getParam(params.tourId, getParam(params.packageId));

  useEffect(() => {
    if (!tourId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError("");
      try {
        const data = await apiJson<{ tour?: any }>(`/api/tours/${tourId}`, {
          timeoutMs: 25000,
        });
        if (!cancelled && data?.tour) setApiTour(data.tour);
      } catch (err: any) {
        if (!cancelled) setLoadError(err?.message || "Could not load tour");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tourId]);

  const tour = useMemo(() => {
    const source = apiTour || {};
    const gallery: string[] = Array.isArray(source.gallery)
      ? source.gallery.filter(Boolean)
      : [];
    const cover =
      source.image || gallery[0] || getParam(params.image, DEFAULT_TOUR_IMAGE);
    const uniqueGallery = [cover, ...gallery].filter(
      (u, i, arr) => u && arr.indexOf(u) === i
    );

    const vendor: VendorInfo | null =
      source.vendorId && typeof source.vendorId === "object"
        ? source.vendorId
        : null;

    return {
      tourId: tourId || source._id || "",
      packageId: source.packageId || getParam(params.packageId),
      title: source.title || getParam(params.title, "Tour Package"),
      image: cover,
      rating: Number(source.rating ?? getParam(params.rating, "0")) || 0,
      duration: source.duration || getParam(params.duration, "TBA"),
      people: source.people || getParam(params.people, "Contact for details"),
      price: String(source.price ?? getParam(params.price, "0")),
      locationName:
        source.location ||
        getParam(params.locationName, getParam(params.location, "Location TBA")),
      latitude: Number(source.latitude ?? getParam(params.latitude)) || null,
      longitude: Number(source.longitude ?? getParam(params.longitude)) || null,
      description: (source.description || "").trim(),
      category: source.category || "",
      amenities: Array.isArray(source.amenities)
        ? source.amenities.filter(Boolean)
        : [],
      gallery: uniqueGallery,
      vendor,
    };
  }, [params, apiTour, tourId]);

  const onShare = async () => {
    try {
      await Share.share({
        message: `${tour.title} · ${tour.locationName} · ${formatINR(Number(tour.price) || 0)}`,
      });
    } catch {
      // ignore
    }
  };

  if (loading && !apiTour) {
    return (
      <AppScreen variant="stack" style={styles.safe}>
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={ExploreColors.primary} />
          <Text style={styles.muted}>Loading package…</Text>
        </View>
      </AppScreen>
    );
  }

  const hasMap =
    tour.latitude != null &&
    tour.longitude != null &&
    !Number.isNaN(tour.latitude) &&
    !Number.isNaN(tour.longitude);

  return (
    <AppScreen variant="hero" style={styles.safe}>
      <View style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 + footerBottomPad }}
          removeClippedSubviews
        >
          <View style={styles.imageWrap}>
            <SafeImage
              uri={tour.image}
              fallback={DEFAULT_TOUR_IMAGE}
              style={styles.image}
              contentFit="cover"
              transition={150}
            />

            <View style={[styles.topRow, { top: overlayTop }]}>
              <TouchableOpacity style={styles.circleBtn} onPress={() => router.back()}>
                <Ionicons name="chevron-back" size={20} />
              </TouchableOpacity>

              <View style={{ flexDirection: "row", gap: 10 }}>
                <TouchableOpacity style={styles.circleBtn} onPress={onShare}>
                  <Ionicons name="share-social-outline" size={18} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.circleBtn}
                  onPress={() => setLiked(!liked)}
                >
                  <Ionicons
                    name={liked ? "heart" : "heart-outline"}
                    size={18}
                    color={liked ? "red" : "black"}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {tour.gallery.length > 1 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.galleryScroll}
            >
              {tour.gallery.slice(1).map((img: string, index: number) => (
                <SafeImage
                  key={`${img}-${index}`}
                  uri={img}
                  fallback={DEFAULT_TOUR_IMAGE}
                  style={styles.galleryImg}
                  contentFit="cover"
                  transition={100}
                />
              ))}
            </ScrollView>
          ) : null}

          <View style={styles.content}>
            {loadError ? <Text style={styles.errorNote}>{loadError}</Text> : null}

            <Text style={styles.title}>{tour.title}</Text>

            <View style={styles.ratingRow}>
              {tour.rating > 0 ? (
                <Text style={styles.star}>⭐ {tour.rating.toFixed(1)}</Text>
              ) : (
                <Text style={styles.reviews}>New listing</Text>
              )}
              {tour.category ? (
                <Text style={styles.location}>· {tour.category}</Text>
              ) : null}
              <Text style={styles.location}>· {tour.locationName}</Text>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoBox}>
                <Text style={styles.infoLabel}>Duration</Text>
                <Text style={styles.infoValue}>{tour.duration || "—"}</Text>
              </View>
              <View style={styles.infoBox}>
                <Text style={styles.infoLabel}>Group Size</Text>
                <Text style={styles.infoValue}>{tour.people || "—"}</Text>
              </View>
              <View style={styles.infoBox}>
                <Text style={styles.infoLabel}>Price</Text>
                <Text style={styles.infoValue}>
                  {formatINR(Number(tour.price) || 0)}
                </Text>
              </View>
            </View>

            <Text style={styles.section}>Overview</Text>
            <Text style={styles.desc}>
              {tour.description ||
                `Discover ${tour.title} in ${tour.locationName}. Full details will appear once the partner adds a description.`}
            </Text>

            <Text style={styles.section}>
              What&apos;s Included
              {tour.amenities.length ? ` (${tour.amenities.length})` : ""}
            </Text>
            {tour.amenities.length ? (
              <View style={styles.chipRow}>
                {tour.amenities.map((item: string) => (
                  <View key={item} style={styles.chip}>
                    <Ionicons name="checkmark-circle" size={14} color={ExploreColors.primary} />
                    <Text style={styles.chipText}>{item}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.desc}>
                Partner has not listed inclusions yet. Contact them for package details.
              </Text>
            )}

            {tour.vendor ? (
              <>
                <Text style={styles.section}>Hosted by</Text>
                <View style={styles.vendorCard}>
                  <View style={styles.vendorIcon}>
                    <Ionicons name="storefront-outline" size={22} color={ExploreColors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.vendorName}>
                      {tour.vendor.businessName || "Partner"}
                    </Text>
                    {tour.vendor.ownerName ? (
                      <Text style={styles.vendorMeta}>{tour.vendor.ownerName}</Text>
                    ) : null}
                    {[tour.vendor.city, tour.vendor.state].filter(Boolean).length ? (
                      <Text style={styles.vendorMeta}>
                        {[tour.vendor.city, tour.vendor.state].filter(Boolean).join(", ")}
                      </Text>
                    ) : null}
                    {tour.vendor.phone ? (
                      <Text style={styles.vendorContact}>📞 {tour.vendor.phone}</Text>
                    ) : null}
                    {tour.vendor.email ? (
                      <Text style={styles.vendorContact}>✉️ {tour.vendor.email}</Text>
                    ) : null}
                  </View>
                </View>
              </>
            ) : null}

            <Text style={styles.section}>Location</Text>
            <Text style={{ marginBottom: 10, color: "#4b5563" }}>{tour.locationName}</Text>

            {hasMap ? (
              <View style={styles.mapWrap}>
                <MapComponent
                  latitude={tour.latitude as number}
                  longitude={tour.longitude as number}
                />
              </View>
            ) : null}

            <Text style={styles.section}>Package Price</Text>
            <View style={styles.packageCard}>
              <View>
                <Text style={styles.pkgTitle}>Standard Package</Text>
                <Text style={styles.pkgDesc}>Per person · taxes may apply</Text>
              </View>
              <Text style={styles.pkgPrice}>{formatINR(Number(tour.price) || 0)}</Text>
            </View>
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: footerBottomPad }]}>
          <View>
            <Text style={styles.total}>Total Price</Text>
            <Text style={styles.price}>
              {formatINR(Number(tour.price) || 0)}{" "}
              <Text style={styles.per}>/person</Text>
            </Text>
          </View>
          <TouchableOpacity
            style={styles.bookBtn}
            onPress={() => {
              router.push({
                pathname: "/BookNow",
                params: {
                  type: "tour",
                  tourId: tour.tourId,
                  packageId: tour.packageId,
                  title: tour.title,
                  image: tour.image,
                  rating: String(tour.rating || ""),
                  price: tour.price,
                  locationName: tour.locationName,
                },
              });
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "bold" }}>Book Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  container: { flex: 1 },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff",
  },
  muted: { color: "#6b7280" },
  errorNote: {
    color: "#b45309",
    backgroundColor: "#fffbeb",
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
    fontSize: 13,
  },

  imageWrap: { height: 280 },
  image: { width: "100%", height: "100%" },

  topRow: {
    position: "absolute",
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  circleBtn: {
    backgroundColor: "#fff",
    padding: 8,
    borderRadius: 20,
  },

  galleryScroll: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 10,
  },
  galleryImg: {
    width: 88,
    height: 72,
    borderRadius: 12,
  },

  content: { padding: 16 },
  title: { fontSize: 22, fontWeight: "800", color: "#111827" },
  ratingRow: {
    flexDirection: "row",
    marginTop: 8,
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
  },
  star: { color: "#f59e0b", fontWeight: "700" },
  reviews: { color: "#6b7280" },
  location: { color: "#6b7280" },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
    gap: 8,
  },
  infoBox: {
    backgroundColor: "#f3f4f6",
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  infoLabel: { fontSize: 11, color: "#6b7280", fontWeight: "600" },
  infoValue: { fontWeight: "700", marginTop: 4, textAlign: "center", fontSize: 13 },

  section: { fontSize: 16, fontWeight: "800", marginTop: 22, color: "#111827" },
  desc: { marginTop: 8, color: "#4b5563", lineHeight: 21 },

  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#EEF4FF",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 20,
  },
  chipText: { color: "#0F3B82", fontWeight: "600", fontSize: 13 },

  vendorCard: {
    marginTop: 10,
    flexDirection: "row",
    gap: 12,
    backgroundColor: "#f8fafc",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  vendorIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#E8F0F7",
    alignItems: "center",
    justifyContent: "center",
  },
  vendorName: { fontWeight: "800", fontSize: 15, color: "#111827" },
  vendorMeta: { color: "#6b7280", marginTop: 2, fontSize: 13 },
  vendorContact: { color: "#0F3B82", marginTop: 4, fontSize: 13, fontWeight: "600" },

  mapWrap: {
    height: 180,
    borderRadius: 15,
    overflow: "hidden",
    marginTop: 10,
    backgroundColor: "#f3f4f6",
  },

  packageCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#f3f4f6",
    padding: 14,
    borderRadius: 12,
    marginTop: 10,
    alignItems: "center",
  },
  pkgTitle: { fontWeight: "bold" },
  pkgDesc: { fontSize: 12, color: "#6b7280" },
  pkgPrice: { fontWeight: "bold", color: "#0F3B82", fontSize: 16 },

  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderColor: "#eee",
  },
  total: { color: "#6b7280", fontSize: 12 },
  price: { fontSize: 20, fontWeight: "bold" },
  per: { fontSize: 12, color: "#6b7280" },
  bookBtn: {
    backgroundColor: "#0F3B82",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
});
