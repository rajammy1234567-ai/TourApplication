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

import { apiUrl } from "../../constants/api";

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

const DUMMY_EVENTS: EventItem[] = [
  {
    id: "e1",
    title: "Mountain Music Festival 2026",
    description: "Join us for a 3-day musical extravaganza in the heart of Manali. Featuring top indie artists and local folk music.",
    date: "2026-06-15",
    time: "18:00",
    image: "https://images.unsplash.com/photo-1459749411177-042180ce673b",
    location: "Old Manali Ground",
    city: "Manali",
  },
  {
    id: "e2",
    title: "Dubai Desert Glow Night",
    description: "Experience the magic of the desert under the starlit sky with traditional dance, BBQ, and fire shows.",
    date: "2026-07-10",
    time: "19:30",
    image: "https://images.unsplash.com/photo-1506461883276-594a12b11cf3",
    location: "Safari Camp Site",
    city: "Dubai",
  },
  {
    id: "e3",
    title: "Bali Spices & Flavors Expo",
    description: "A culinary journey through Indonesia. Taste authentic Balinese dishes prepared by master chefs.",
    date: "2026-08-05",
    time: "12:00",
    image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1",
    location: "Ubud Art Market",
    city: "Bali",
  },
  {
    id: "e4",
    title: "Arctic Aurora Photo Workshop",
    description: "Learn how to capture the perfect shot of the Northern Lights with professional landscape photographers.",
    date: "2026-11-20",
    time: "21:00",
    image: "https://images.unsplash.com/photo-1531366930477-4f85e80ad971",
    location: "Polar Base Camp",
    city: "Tromso",
  },
  {
    id: "e5",
    title: "Sunset Beats & Beach Party",
    description: "The ultimate beach party experience with world-class DJs, tropical drinks, and high-energy vibes.",
    date: "2026-09-12",
    time: "17:00",
    image: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3",
    location: "Seminyak Beach",
    city: "Bali",
  },
];

  

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
      setLoading(true);

      const permission = await Location.requestForegroundPermissionsAsync();
      let apiEvents: EventItem[] = [];

      if (permission.status === "granted") {
        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const { latitude, longitude } = currentLocation.coords;

        const response = await fetch(
          apiUrl(`/api/events?lat=${latitude}&lng=${longitude}`)
        );
        const data = await response.json();
        if (Array.isArray(data)) {
          apiEvents = data;
        }
      }

      // Merge API events with our featured dummy events
      const mergedEvents = [...apiEvents, ...DUMMY_EVENTS];
      
      // Remove duplicates if any (based on title)
      const uniqueEvents = mergedEvents.filter((v, i, a) => a.findIndex(t => (t.title === v.title)) === i);
      
      setEvents(uniqueEvents);
      
      if (uniqueEvents.length === 0) {
        setMessage("No events found nearby right now.");
      }
    } catch (error) {
      console.log("Fetch events error:", error);
      setEvents(DUMMY_EVENTS); // Fallback to dummy data on error
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