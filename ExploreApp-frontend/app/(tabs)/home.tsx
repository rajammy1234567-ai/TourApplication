import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { Animated, Easing, Dimensions } from "react-native";
import { router, useFocusEffect } from "expo-router";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiUrl } from "../../constants/api";

const STORAGE_KEYS = {
  userData: "userData",
  wishlistTours: "wishlistTours",
} as const;

type Destination = {
  _id: string;
  packageId?: string;
  title?: string;
  name?: string; // fallback
  location?: string;
  rating?: number;
  image?: string;
  images?: string[]; // fallback
  duration?: string;
  people?: string;
  category?: string;
  price?: number;
  gallery?: string[];
};

type UserData = {
  fullname?: string;
  name?: string;
};

const BACKGROUND_IMAGES = [
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1000&q=80&auto=format",
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1000&q=80&auto=format",
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1000&q=80&auto=format",
  "https://images.unsplash.com/photo-1493558103817-58b2924bce98?w=1000&q=80&auto=format",
  "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1000&q=80&auto=format",
];

const DEFAULT_IMAGE = BACKGROUND_IMAGES[0];

function safeParseJson<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

const TourCard = React.memo(({ item, wishlistIds, toggleWishlist, router, DEFAULT_IMAGE }: any) => (
  <TouchableOpacity
    activeOpacity={0.8}
    onPress={() =>
      router.push({
        pathname: "/tourDetails",
        params: {
          packageId: item.packageId || item._id,
          tourId: item._id,
          title: item.title || item.name || "",
          image: item.image || item.images?.[0] || "",
          rating: String(item.rating ?? 4),
          locationName: item.location || "",
          price: String(item.price || ""),
          duration: item.duration || "",
          people: item.people || "",
          latitude: String(item.latitude || ""),
          longitude: String(item.longitude || ""),
        },
      })
    }
    style={styles.card}
  >
    <Image
      source={{ uri: item.image || item.images?.[0] || DEFAULT_IMAGE }}
      style={styles.cardImage}
      contentFit="cover"
      transition={200}
    />

    <TouchableOpacity
      style={styles.heart}
      onPress={() => toggleWishlist(item)}
    >
      <Ionicons
        name={wishlistIds.has(item._id) ? "heart" : "heart-outline"}
        size={20}
        color="red"
      />
    </TouchableOpacity>

    <View style={styles.cardContent}>
      <Text style={styles.cardTitle} numberOfLines={1}>{item.title || item.name}</Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: 160 }}>
        <View>
          <Text style={styles.cardSub}>{item.location}</Text>
          <View style={{ flexDirection: "row" }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <Ionicons
                key={i}
                name={i <= (item.rating || 4) ? "star" : "star-outline"}
                size={14}
                color="#FFD700"
              />
            ))}
          </View>
        </View>
        <Text style={styles.cardPrice}>₹{item.price || 15000}</Text>
      </View>
    </View>
  </TouchableOpacity>
));

const FeaturedTourCard = React.memo(({ tour, showAllFeatured, router, DEFAULT_IMAGE }: any) => (
  <TouchableOpacity
    activeOpacity={0.9}
    onPress={() =>
      router.push({
        pathname: "/tourDetails",
        params: {
          packageId: tour.packageId || tour._id,
          tourId: tour._id,
          title: tour.title || tour.name || "",
          image: tour.image || tour.images?.[0] || DEFAULT_IMAGE,
          rating: String(tour.rating ?? 4),
          locationName: tour.location || "",
          price: String(tour.price || ""),
          latitude: String(tour.latitude || ""),
          longitude: String(tour.longitude || ""),
          gallery: JSON.stringify(tour.gallery || []),
        },
      })
    }
    style={styles.tourCard}
  >
    <Image
      source={{ uri: tour.image || tour.images?.[0] || DEFAULT_IMAGE }}
      style={styles.tourImage}
      contentFit="cover"
      transition={200}
    />
    <View style={styles.tourCardInfo}>
      <Text style={styles.tourTitle} numberOfLines={1}>{tour.title || tour.name}</Text>
      
      <View style={styles.locRow}>
        <Ionicons name="location-outline" size={14} color="#6B7280" />
        <Text style={styles.tourSub}>{tour.location}</Text>
      </View>

      <View style={styles.cardBottomRow}>
        <View style={styles.priceRow}>
          <Text style={styles.newPrice}>₹{tour.price || 15000}</Text>
          <Text style={styles.per}>/person</Text>
        </View>
        
        <View style={styles.ratingBadge}>
          <Ionicons name="star" size={12} color="#F59E0B" />
          <Text style={styles.ratingText}>{tour.rating || 4.5}</Text>
        </View>
      </View>
    </View>
  </TouchableOpacity>
));

export default function HomeScreen() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchText, setSearchText] = useState("");
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [userName, setUserName] = useState("User");
  const [wishlistTours, setWishlistTours] = useState<Destination[]>([]);
  const [loadingTours, setLoadingTours] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorText, setErrorText] = useState("");

  const [showAllFeatured, setShowAllFeatured] = useState(false);
  const categories = ["All", "Beach", "Mountain"];

  const [currentBg, setCurrentBg] = useState(0);
  const [nextBg, setNextBg] = useState(1);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setInterval(() => {
      // Fade in the NEXT image on top of current
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 2000, // Slightly longer for premium feel
        useNativeDriver: true,
      }).start(() => {
        // Now that the next image is fully visible:
        // 1. Make it the current background
        setCurrentBg(nextBg);
        // 2. Prepare the next next background
        setNextBg((nextBg + 1) % BACKGROUND_IMAGES.length);
        // 3. Reset opacity of the top layer back to 0
        fadeAnim.setValue(0);
      });
    }, 6000);
    return () => clearInterval(timer);
  }, [nextBg, fadeAnim]);

  const wishlistIds = useMemo(
    () => new Set(wishlistTours.map((t) => t._id)),
    [wishlistTours]
  );

  const syncLocalSessionData = useCallback(async () => {
    const entries = await AsyncStorage.multiGet([
      STORAGE_KEYS.userData,
      STORAGE_KEYS.wishlistTours,
    ]);
    const map = Object.fromEntries(entries);

    const user = safeParseJson<UserData | null>(map[STORAGE_KEYS.userData], null);
    const storedWishlist = safeParseJson<Destination[]>(
      map[STORAGE_KEYS.wishlistTours],
      []
    );

    setUserName(user?.fullname?.trim() || user?.name?.trim() || "User");
    setWishlistTours(Array.isArray(storedWishlist) ? storedWishlist : []);
  }, []);

  const fetchTours = useCallback(async (search = "") => {
    setErrorText("");
    try {
      setLoadingTours(true);
      const url = search
        ? apiUrl(`/api/tours?search=${encodeURIComponent(search)}`)
        : apiUrl("/api/tours");

      const response = await fetch(url);
      const data = await response.json();

      if (response.ok && data?.success && Array.isArray(data?.tours)) {
        setDestinations(data.tours);
      } else {
        setDestinations([]);
        setErrorText(data?.message || "Unable to fetch tours.");
      }
    } catch {
      setDestinations([]);
      setErrorText("Unable to fetch tours. Please try again.");
    } finally {
      setLoadingTours(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    syncLocalSessionData();
  }, [syncLocalSessionData]);

  // Initial fetch and search with debounce
  useEffect(() => {
    // If it's the first render and searchText is empty, fetch immediately
    if (searchText.trim() === "") {
      fetchTours("");
      return;
    }

    const id = setTimeout(() => {
      fetchTours(searchText.trim());
    }, 400); // Slightly increased for better UX while typing

    return () => clearTimeout(id);
  }, [searchText, fetchTours]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    syncLocalSessionData();
    fetchTours(searchText.trim());
  }, [fetchTours, searchText, syncLocalSessionData]);

  const filteredDestinations = useMemo(() => {
    if (activeCategory === "All") return destinations;
    return destinations.filter((item) => {
      const cat = (item.category || "").toLowerCase();
      const active = activeCategory.toLowerCase();
      // If the item doesn't have a category, it only shows in "All"
      return cat.includes(active);
    });
  }, [activeCategory, destinations]);

  const toggleWishlist = useCallback(async (tour: Destination) => {
    try {
      const exists = wishlistTours.some((item) => item._id === tour._id);

      let updated: Destination[] = [];
      if (exists) {
        updated = wishlistTours.filter((item) => item._id !== tour._id);
      } else {
        updated = [tour, ...wishlistTours];
      }

      setWishlistTours(updated);
      await AsyncStorage.setItem(
        STORAGE_KEYS.wishlistTours,
        JSON.stringify(updated)
      );
    } catch {
      // keep UI responsive even if storage fails
    }
  }, [wishlistTours]);

  const renderStars = (rating: number) => (
    <View style={{ flexDirection: "row" }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Ionicons
          key={i}
          name={i <= rating ? "star" : "star-outline"}
          size={14}
          color="#FFD700"
        />
      ))}
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <View style={styles.headerWrapper}>
          {/* Static Bottom Layer (The "current" image) */}
          <Image 
            source={{ uri: BACKGROUND_IMAGES[currentBg] }} 
            style={styles.headerImage} 
          />
          {/* Animated Top Layer (The "next" image fading in) */}
          <Animated.Image
            source={{ uri: BACKGROUND_IMAGES[nextBg] }}
            style={[styles.headerImage, { position: 'absolute', opacity: fadeAnim }]}
          />
          <View style={styles.headerOverlay} />
        </View>

        <View style={styles.headerContent}>
          <Text style={styles.greeting}>Good Morning,</Text>
          <Text style={styles.username}>{userName}</Text>
          <Text style={styles.heading}>
            Where will your next adventure take you?
          </Text>

          <View style={styles.searchRow}>
            <View style={[styles.searchBar, { flex: 1 }]}>
              <Ionicons name="search" size={20} color="#9CA3AF" />
              <TextInput
                placeholder="Where do you want to go?"
                placeholderTextColor="#9CA3AF"
                value={searchText}
                onChangeText={setSearchText}
                style={{ flex: 1, marginLeft: 10 }}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[
              styles.categoryBtn,
              activeCategory === cat && styles.activeCategory,
            ]}
            onPress={() => setActiveCategory(cat)}
          >
            <Text
              style={[
                styles.categoryText,
                activeCategory === cat && { color: "#fff" },
              ]}
            >
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loadingTours && destinations.length === 0 ? (
        <View style={styles.loaderBox}>
          <ActivityIndicator size="large" color="#003D82" />
        </View>
      ) : (
        <FlatList
          horizontal
          data={filteredDestinations}
          keyExtractor={(item) => item._id}
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: 20 }}
          // Performance props
          initialNumToRender={5}
          maxToRenderPerBatch={5}
          windowSize={5}
          removeClippedSubviews={true}
          ListEmptyComponent={
            <View style={styles.emptyList}>
              <Text style={styles.emptyListText}>No tours found.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TourCard 
              item={item} 
              wishlistIds={wishlistIds} 
              toggleWishlist={toggleWishlist} 
              router={router} 
              DEFAULT_IMAGE={DEFAULT_IMAGE} 
            />
          )}
        />
      )}

      <View style={styles.featureSection}>
        <View style={styles.featureHeader}>
          <Text style={styles.featureTitle}>Featured Tours</Text>
          <TouchableOpacity onPress={() => setShowAllFeatured(!showAllFeatured)}>
            <Text style={styles.seeAll}>{showAllFeatured ? "Show Less" : "See All"}</Text>
          </TouchableOpacity>
        </View>

        {filteredDestinations.slice(0, showAllFeatured ? undefined : 3).map((tour) => (
          <FeaturedTourCard 
            key={tour._id} 
            tour={tour} 
            showAllFeatured={showAllFeatured} 
            router={router} 
            DEFAULT_IMAGE={DEFAULT_IMAGE} 
          />
        ))}

        {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" },
  header: {
    height: 300,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: "hidden",
  },
  headerWrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 300,
  },
  headerImage: {
    width: Dimensions.get("window").width,
    height: 300,
  },
  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.15)",
  },
  headerContent: { position: "absolute", top: 50, padding: 20 },
  greeting: { color: "#fff" },
  username: { color: "#fff", fontSize: 20, fontWeight: "700" },
  heading: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
    marginVertical: 10,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 15,
  },
  searchBar: {
    backgroundColor: "#fff",
    borderRadius: 25,
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
  },
  categoryBtn: {
    backgroundColor: "#eee",
    padding: 10,
    borderRadius: 20,
    margin: 10,
  },
  activeCategory: { backgroundColor: "#003D82" },
  categoryText: {},

  loaderBox: {
    height: 120,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyList: {
    marginLeft: 15,
    justifyContent: "center",
    alignItems: "center",
    width: 180,
  },
  emptyListText: { color: "#6B7280" },

  card: {
    marginLeft: 15,
    borderRadius: 20,
    overflow: "hidden",
  },
  cardImage: { width: 180, height: 220 },
  heart: { position: "absolute", top: 10, right: 10 },
  cardContent: { position: "absolute", bottom: 10, left: 10, right: 10 },
  cardTitle: { color: "#fff", fontWeight: "700", fontSize: 14 },
  cardSub: { color: "#ddd", fontSize: 11 },
  cardPrice: { color: "#fff", fontWeight: "700", fontSize: 14 },

  featureSection: { marginTop: 25, paddingHorizontal: 15 },
  featureHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  featureTitle: { fontSize: 18, fontWeight: "700" },
  seeAll: { color: "#003D82", fontWeight: "600" },

  tourCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 12,
    marginBottom: 16,
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  tourImage: {
    width: 100,
    height: 100,
    borderRadius: 16,
  },
  tourCardInfo: {
    flex: 1,
    marginLeft: 15,
    height: 100,
    justifyContent: "space-between",
    paddingVertical: 2,
  },
  tourTitle: { 
    fontSize: 16, 
    fontWeight: "700", 
    color: "#1F2937" 
  },
  locRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  tourSub: { 
    color: "#6B7280", 
    fontSize: 13 
  },
  cardBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  priceRow: { 
    flexDirection: "row", 
    alignItems: "baseline",
    gap: 2,
  },
  newPrice: { 
    fontSize: 17, 
    fontWeight: "800", 
    color: "#1E3A8A" 
  },
  per: { 
    fontSize: 11, 
    color: "#9CA3AF" 
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#B45309",
  },

  bookBtn: {
    backgroundColor: "#003D82",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 10,
  },
  bookBtnText: { color: "#fff", fontWeight: "600", fontSize: 12 },

  errorText: {
    color: "#DC2626",
    fontSize: 12,
    marginTop: 8,
    marginBottom: 20,
  },
});