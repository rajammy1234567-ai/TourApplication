import React, { useCallback, useEffect, useMemo, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiUrl } from "../../constants/api";

const STORAGE_KEYS = {
  userData: "userData",
  wishlistTours: "wishlistTours",
} as const;

type Destination = {
  _id: string;
  name: string;
  location?: string;
  rating?: number;
  images?: string[];
  category?: string;
  price?: number;
};

type UserData = {
  fullname?: string;
  name?: string;
};

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e";

function safeParseJson<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export default function HomeScreen() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchText, setSearchText] = useState("");
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [userName, setUserName] = useState("User");
  const [wishlistTours, setWishlistTours] = useState<Destination[]>([]);
  const [loadingTours, setLoadingTours] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorText, setErrorText] = useState("");

  const categories = ["All", "Beach", "Mountain"];

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
    fetchTours();
  }, [fetchTours, syncLocalSessionData]);

  useFocusEffect(
    useCallback(() => {
      syncLocalSessionData();
    }, [syncLocalSessionData])
  );

  useEffect(() => {
    const id = setTimeout(() => {
      fetchTours(searchText.trim());
    }, 350);

    return () => clearTimeout(id);
  }, [searchText, fetchTours]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    syncLocalSessionData();
    fetchTours(searchText.trim());
  }, [fetchTours, searchText, syncLocalSessionData]);

  const filteredDestinations = useMemo(() => {
    if (activeCategory === "All") return destinations;
    return destinations.filter((item) =>
      (item.category || "").toLowerCase().includes(activeCategory.toLowerCase())
    );
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
        <Image source={{ uri: DEFAULT_IMAGE }} style={styles.headerImage} />
        <View style={styles.overlay} />
        <View style={styles.headerContent}>
          <Text style={styles.greeting}>Good Morning,</Text>
          <Text style={styles.username}>{userName}</Text>
          <Text style={styles.heading}>
            Where will your next adventure take you?
          </Text>

          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color="#666" />
            <TextInput
              placeholder="Search destinations..."
              value={searchText}
              onChangeText={setSearchText}
              style={{ flex: 1, marginLeft: 10 }}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Ionicons name="options" size={20} color="#003D82" />
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

      {loadingTours ? (
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
          ListEmptyComponent={
            <View style={styles.emptyList}>
              <Text style={styles.emptyListText}>No tours found.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() =>
                router.push({
                  pathname: "/tourDetails",
                  params: {
                    packageId: item._id,
                    title: item.name,
                    image: item.images?.[0] || "",
                    rating: String(item.rating ?? 4),
                    location: item.location || "",
                  },
                })
              }
              style={styles.card}
            >
              <Image
                source={{ uri: item.images?.[0] || DEFAULT_IMAGE }}
                style={styles.cardImage}
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
                <Text style={styles.cardTitle}>{item.name}</Text>
                <Text style={styles.cardSub}>{item.location}</Text>
                {renderStars(item.rating || 4)}
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      <View style={styles.featureSection}>
        <View style={styles.featureHeader}>
          <Text style={styles.featureTitle}>Featured Tours</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        {filteredDestinations.slice(0, 3).map((tour) => (
          <View key={tour._id} style={styles.tourCard}>
            <Image
              source={{ uri: tour.images?.[0] || DEFAULT_IMAGE }}
              style={styles.tourImage}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.tourTitle}>{tour.name}</Text>
              <Text style={styles.tourSub}>{tour.location}</Text>
              <View style={styles.priceRow}>
                <Text style={styles.newPrice}>₹{tour.price || 15000}</Text>
                <Text style={styles.per}>/pax</Text>
              </View>
            </View>

            <View style={styles.rightSection}>
              <Text style={styles.rating}>⭐ {tour.rating || 4}</Text>
            </View>

            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/BookNow",
                  params: {
                    packageId: tour._id,
                    title: tour.name,
                    image: tour.images?.[0] || DEFAULT_IMAGE,
                    price: String(tour.price || 15000),
                    location: tour.location || "",
                  },
                })
              }
              style={styles.bookBtn}
            >
              <Text style={styles.bookBtnText}>Book Now</Text>
            </TouchableOpacity>
          </View>
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
  headerImage: { width: "100%", height: "100%" },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
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
  cardContent: { position: "absolute", bottom: 10, left: 10 },
  cardTitle: { color: "#fff", fontWeight: "700" },
  cardSub: { color: "#ddd" },

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
    borderRadius: 15,
    padding: 10,
    marginBottom: 15,
    alignItems: "center",
    elevation: 3,
  },
  tourImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 10,
  },
  tourTitle: { fontWeight: "700" },
  tourSub: { color: "#777", fontSize: 12 },
  priceRow: { flexDirection: "row", alignItems: "center", marginTop: 5 },
  newPrice: { fontWeight: "700", color: "#003D82" },
  per: { fontSize: 12, color: "#777" },

  rightSection: { alignItems: "center", marginLeft: 10 },
  rating: { fontSize: 12, marginBottom: 5 },

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