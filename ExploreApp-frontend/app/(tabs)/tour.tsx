import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { apiUrl } from "../../constants/api";

type Tour = {
  _id: string;
  packageId?: string;
  title: string;
  image?: string;
  duration?: string;
  people?: string;
  rating?: number;
  location?: string;
  price: number;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);

const DiscoverTours = () => {
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchTours = useCallback(async () => {
    try {
      setError("");
      const response = await fetch(apiUrl("/api/tours"));
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load tours");
      }

      setTours(data.tours || []);
    } catch (err: any) {
      setError(err.message || "Unable to load tours");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTours();
  }, [fetchTours]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTours();
  };

  const renderItem = ({ item }: { item: Tour }) => (
    <View style={styles.card}>
      <Image
        source={{
          uri: item.image || "https://images.unsplash.com/photo-1501785888041-af3ef285b470",
        }}
        style={styles.image}
      />

      <View style={styles.overlayTop}>
        <View style={styles.rating}>
          <Text style={styles.ratingText}>Rating {Number(item.rating || 0).toFixed(1)}</Text>
        </View>
        <Ionicons name="heart-outline" size={20} color="#fff" />
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>

        <View style={styles.row}>
          <Text style={styles.meta}>{item.duration || "Flexible"}</Text>
          <Text style={styles.meta}>{item.people || "Group tour"}</Text>
        </View>

        <View style={styles.priceRow}>
          <Text style={styles.location}>{item.location || "Location available after booking"}</Text>
          <Text style={styles.price}>{formatCurrency(Number(item.price))}</Text>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={() =>
            router.push({
              pathname: "/tourDetails",
              params: {
                tourId: item._id,
                packageId: item.packageId || "",
                title: item.title,
                image: item.image || "",
                rating: String(item.rating || 0),
                duration: item.duration || "",
                people: item.people || "",
                price: String(item.price),
                locationName: item.location || "",
              },
            })
          }
        >
          <Text style={styles.buttonText}>View Details</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Discover Tours</Text>
          <Ionicons name="search" size={22} />
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color="#2F5AF3" />
          </View>
        ) : error ? (
          <View style={styles.center}>
            <Text style={styles.error}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={fetchTours}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={tours}
            keyExtractor={(item) => item._id}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={tours.length ? styles.list : styles.emptyWrap}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListEmptyComponent={
              <View style={styles.center}>
                <Text style={styles.emptyTitle}>No tours available</Text>
                <Text style={styles.emptyText}>Add tours in MongoDB to start accepting bookings.</Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
};

export default DiscoverTours;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F4F6FA",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  container: { flex: 1, paddingHorizontal: 16 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
    marginTop: 10,
  },
  headerTitle: { fontSize: 16, fontWeight: "700" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  error: { color: "#B91C1C", textAlign: "center", marginBottom: 14 },
  retryBtn: { backgroundColor: "#2F5AF3", paddingHorizontal: 18, paddingVertical: 10, borderRadius: 8 },
  retryText: { color: "#fff", fontWeight: "700" },
  list: { paddingBottom: 100 },
  emptyWrap: { flexGrow: 1, justifyContent: "center" },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: "#111827", textAlign: "center" },
  emptyText: { marginTop: 6, color: "#64748B", textAlign: "center" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 16,
    overflow: "hidden",
    elevation: 3,
  },
  image: { width: "100%", height: 210 },
  overlayTop: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rating: { backgroundColor: "#fff", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  ratingText: { fontSize: 12, fontWeight: "600" },
  cardBody: { padding: 14 },
  title: { fontSize: 14, fontWeight: "600", marginBottom: 8 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  meta: { fontSize: 12, color: "#555" },
  priceRow: { flexDirection: "row", justifyContent: "space-between", gap: 12, marginBottom: 12 },
  location: { flex: 1, color: "#555", fontSize: 12 },
  price: { color: "#003D82", fontWeight: "700" },
  button: {
    backgroundColor: "#2F5AF3",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "600" },
});