import React, { useMemo } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";

const fallbackImage =
  "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4";

const formatDateTime = (date?: string, time?: string) => {
  if (!date) return "Date not available";

  const formattedDate = new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return time ? `${formattedDate} at ${time.slice(0, 5)}` : formattedDate;
};

export default function EventDetailsScreen() {
  const params = useLocalSearchParams();

  const event = useMemo(() => {
    try {
      return JSON.parse(String(params.event || "{}"));
    } catch {
      return {};
    }
  }, [params.event]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Image
            source={{ uri: event.image || fallbackImage }}
            style={styles.image}
          />
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={23} color="#111827" />
          </TouchableOpacity>
        </View>

        <View style={styles.body}>
          <Text style={styles.title}>{event.title || "Event details"}</Text>

          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={19} color="#0F3B82" />
            <Text style={styles.infoText}>
              {formatDateTime(event.date, event.time)}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={19} color="#0F3B82" />
            <Text style={styles.infoText}>
              {event.location || "Venue not available"}
              {event.city ? `, ${event.city}` : ""}
            </Text>
          </View>

          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>
            {event.description || "No description"}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  content: { paddingBottom: 32 },
  hero: { height: 310, backgroundColor: "#E2E8F0" },
  image: { width: "100%", height: "100%" },
  backButton: {
    position: "absolute",
    top: 16,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  body: { padding: 18 },
  title: {
    fontSize: 25,
    lineHeight: 32,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 18,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  infoText: { flex: 1, color: "#334155", fontSize: 15 },
  sectionTitle: {
    marginTop: 18,
    marginBottom: 8,
    color: "#0F172A",
    fontSize: 18,
    fontWeight: "800",
  },
  description: { color: "#475569", fontSize: 15, lineHeight: 23 },
});