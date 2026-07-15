import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { AppScreen } from "../../components/explore/AppScreen";
import { useAppInsets } from "../../hooks/use-app-insets";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { apiFetch } from "../../constants/api";
import { ExploreColors, Layout } from "../../constants/exploreTheme";
import { EventCard, type EventItem } from "../../components/explore/EventCard";
import { ScreenHeader } from "../../components/explore/ScreenHeader";
import { CacheKeys, readCache, writeCache } from "../../lib/listCache";

/** Instant offline/demo list — no GPS wait */
const FALLBACK: EventItem[] = [
  {
    id: "e1",
    title: "Mountain Music Festival 2026",
    date: "2026-06-15",
    time: "18:00",
    image:
      "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=600&q=70&auto=format",
    location: "Old Manali Ground",
    city: "Manali",
  },
  {
    id: "e2",
    title: "Desert Glow Night",
    date: "2026-07-10",
    time: "19:30",
    image:
      "https://images.unsplash.com/photo-1506461883276-594a12b11cf3?w=600&q=70&auto=format",
    location: "Safari Camp",
    city: "Jaisalmer",
  },
  {
    id: "e3",
    title: "Spices & Flavors Expo",
    date: "2026-08-05",
    time: "12:00",
    image:
      "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&q=70&auto=format",
    location: "City Market",
    city: "Jaipur",
  },
];

function normalizeEvents(raw: any[]): EventItem[] {
  return raw
    .map((e, i) => ({
      id: String(e.id || e._id || `ev-${i}`),
      title: e.title || e.name || "Event",
      date: e.date || "",
      time: e.time || "",
      image: e.image || FALLBACK[0].image,
      location: e.location || "",
      city: e.city || "",
      description: e.description,
    }))
    .filter((e) => e.title);
}

export default function EventsScreen() {
  const { scrollBottomPad } = useAppInsets();
  const [events, setEvents] = useState<EventItem[]>(FALLBACK);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      // No GPS — location permission was the main delay
      const res = await apiFetch("/api/events", { timeoutMs: 12000 });
      const data = await res.json();
      const list = Array.isArray(data)
        ? normalizeEvents(data)
        : Array.isArray(data?.events)
          ? normalizeEvents(data.events)
          : [];
      const next = list.length ? list : FALLBACK;
      setEvents(next);
      await writeCache(CacheKeys.events, next);
    } catch {
      // keep cache / fallback already on screen
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const cached = await readCache<EventItem[]>(CacheKeys.events);
      if (cancelled) return;
      if (cached?.length) {
        setEvents(cached);
        setLoading(false);
        load(false); // soft refresh
      } else {
        // Show fallback immediately, then fetch
        setEvents(FALLBACK);
        setLoading(false);
        load(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  return (
    <AppScreen variant="tab" style={styles.safe}>
      <ScreenHeader title="Events" subtitle="Happening around you" icon="calendar" />

      {loading && events.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={ExploreColors.primary} />
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.list, { paddingBottom: scrollBottomPad }]}
          initialNumToRender={5}
          maxToRenderPerBatch={6}
          windowSize={7}
          removeClippedSubviews
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(true)}
              tintColor={ExploreColors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="calendar-outline" size={36} color={ExploreColors.textMuted} />
              <Text style={styles.empty}>No events found</Text>
            </View>
          }
          renderItem={({ item }) => (
            <EventCard
              item={item}
              onPress={() =>
                router.push({
                  pathname: "/eventDetails",
                  params: { event: JSON.stringify(item) },
                })
              }
            />
          )}
        />
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: ExploreColors.background },
  list: { paddingHorizontal: Layout.pad },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 8,
  },
  empty: { color: ExploreColors.textSecondary },
});
