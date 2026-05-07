import React, { useCallback, useEffect, useState } from "react";
import * as Location from "expo-location";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

const API_BASE_URL = "http://localhost:5000";

type EventItem = {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  image: string;
  location: string;
  city: string;
};

const fallbackImage =
  "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4";

  

const formatDate = (date: string) => {
  if (!date) return "Date not available";

  return new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export default function EventsScreen() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState("");

  const fetchEvents = useCallback(async () => {
    try {
      setMessage("");

      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") {
        setEvents([]);
        setMessage("Location permission is needed to find nearby events.");
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = currentLocation.coords;

      const response = await fetch(
        `${API_BASE_URL}/api/events?lat=${latitude}&lng=${longitude}`
      );
      const data = await response.json();

      setEvents(Array.isArray(data) ? data : []);
      if (!Array.isArray(data) || data.length === 0) {
        setMessage("No events found nearby right now.");
      }
    } catch (error) {
      console.log(error);
      setEvents([]);
      setMessage("Unable to load nearby events.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchEvents();
  };

  const openDetails = (event: EventItem) => {
    router.push({
      pathname: "/eventDetails",
      params: {
        event: JSON.stringify(event),
      },
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View>
          <Text style={styles.heading}>Nearby Events</Text>
          <Text style={styles.subheading}>Live events within 50 km</Text>
        </View>
        <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
          <Ionicons name="refresh" size={20} color="#0F3B82" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0F3B82" />
          <Text style={styles.loadingText}>Finding events near you...</Text>
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          contentContainerStyle={events.length ? styles.list : styles.emptyWrap}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="calendar-outline" size={38} color="#94A3B8" />
              <Text style={styles.emptyTitle}>Nothing to show</Text>
              <Text style={styles.emptyText}>{message}</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.86}
              onPress={() => openDetails(item)}
            >
              <Image
                source={{ uri: item.image || fallbackImage }}
                style={styles.image}
              />
              <View style={styles.cardBody}>
                <Text style={styles.title} numberOfLines={2}>
                  {item.title}
                </Text>
                <View style={styles.metaRow}>
                  <Ionicons name="calendar-outline" size={15} color="#0F3B82" />
                  <Text style={styles.metaText}>{formatDate(item.date)}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Ionicons name="location-outline" size={15} color="#0F3B82" />
                  <Text style={styles.metaText} numberOfLines={1}>
                    {item.location}
                    {item.city ? `, ${item.city}` : ""}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F6F8FC" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 14,
  },
  heading: { fontSize: 24, fontWeight: "800", color: "#0F172A" },
  subheading: { marginTop: 3, color: "#64748B" },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#E8F0FF",
    alignItems: "center",
    justifyContent: "center",
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { marginTop: 10, color: "#64748B" },
  list: { paddingHorizontal: 18, paddingBottom: 110 },
  emptyWrap: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 28 },
  empty: { alignItems: "center" },
  emptyTitle: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },
  emptyText: { marginTop: 6, textAlign: "center", color: "#64748B" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 16,
    overflow: "hidden",
    elevation: 2,
  },
  image: { width: "100%", height: 180, backgroundColor: "#E2E8F0" },
  cardBody: { padding: 14 },
  title: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 5,
  },
  metaText: { flex: 1, color: "#475569", fontSize: 13 },
});