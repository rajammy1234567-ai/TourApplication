import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiUrl } from "../constants/api";

type Destination = {
  _id: string;
  name: string;
  location?: string;
  rating?: number;
  images?: string[];
  price?: number;
};

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e";

export default function WishlistScreen() {
  const [wishlist, setWishlist] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadWishlist();
    }, []),
  );

  const loadWishlist = async () => {
    try {
      setLoading(true);
      const likedData = await AsyncStorage.getItem("likedTours");
      if (likedData) {
        const likedIds = JSON.parse(likedData);
        const likedTourIds = Object.keys(likedIds).filter((id) => likedIds[id]);

        if (likedTourIds.length > 0) {
          const response = await fetch(apiUrl("/api/tours"));
          const data = await response.json();
          if (data.success && data.tours) {
            const wishlistTours = data.tours.filter((tour: any) =>
              likedTourIds.includes(tour._id),
            );
            setWishlist(wishlistTours);
          }
        } else {
          setWishlist([]);
        }
      }
    } catch (error) {
      console.log("Error loading wishlist:", error);
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (tourId: string) => {
    try {
      const likedData = await AsyncStorage.getItem("likedTours");
      if (likedData) {
        const likedIds = JSON.parse(likedData);
        delete likedIds[tourId];
        await AsyncStorage.setItem("likedTours", JSON.stringify(likedIds));
        setWishlist(wishlist.filter((tour) => tour._id !== tourId));
      }
    } catch (error) {
      console.log("Error removing from wishlist:", error);
    }
  };

  const renderWishlistItem = ({ item }: { item: Destination }) => (
    <View style={styles.card}>
      <Image
        source={{
          uri: item.images?.[0] || DEFAULT_IMAGE,
        }}
        style={styles.image}
      />

      <View style={styles.content}>
        <Text style={styles.title}>{item.name}</Text>
        <Text style={styles.location}>{item.location}</Text>

        <View style={styles.ratingRow}>
          <Ionicons name="star" size={14} color="#FFD700" />
          <Text style={styles.rating}>{item.rating || 4}</Text>
        </View>

        <Text style={styles.price}>₹{item.price || 15000}/pax</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() =>
            router.push({
              pathname: "/tourDetails",
              params: {
                packageId: item._id.toString(),
                title: item.name,
                image: item.images?.[0] || DEFAULT_IMAGE,
                rating: item.rating?.toString() || "4",
                location: item.location || "",
              },
            })
          }
        >
          <Ionicons name="eye-outline" size={18} color="#003D82" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => removeFromWishlist(item._id)}
        >
          <Ionicons name="trash-outline" size={18} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Wishlist</Text>
        <View style={styles.backBtn} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#003D82" size="large" />
        </View>
      ) : wishlist.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="heart-outline" size={64} color="#CCC" />
          <Text style={styles.emptyTitle}>No Tours Yet</Text>
          <Text style={styles.emptyText}>
            Start adding your favorite tours to your wishlist!
          </Text>
          <TouchableOpacity
            style={styles.exploreBtn}
            onPress={() => router.push("/(tabs)/home")}
          >
            <Text style={styles.exploreBtnText}>Explore Tours</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={wishlist}
          keyExtractor={(item) => item._id}
          renderItem={renderWishlistItem}
          contentContainerStyle={styles.list}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F5F5F5" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },

  backBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  list: {
    padding: 12,
    paddingBottom: 20,
  },

  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 12,
    overflow: "hidden",
    elevation: 2,
  },

  image: {
    width: 100,
    height: 120,
  },

  content: {
    flex: 1,
    padding: 12,
    justifyContent: "space-between",
  },

  title: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111",
  },

  location: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },

  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },

  rating: {
    fontSize: 12,
    color: "#777",
    marginLeft: 4,
  },

  price: {
    fontSize: 13,
    fontWeight: "700",
    color: "#003D82",
    marginTop: 4,
  },

  actions: {
    flexDirection: "column",
    paddingRight: 10,
    justifyContent: "space-around",
    alignItems: "center",
  },

  actionBtn: {
    padding: 8,
  },

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
    marginTop: 16,
  },

  emptyText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginTop: 8,
  },

  exploreBtn: {
    backgroundColor: "#003D82",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },

  exploreBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
});
