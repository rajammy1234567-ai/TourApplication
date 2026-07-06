import React, { useCallback, useEffect, useState } from "react";
import * as Location from "expo-location";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { AppScreen } from "../../components/explore/AppScreen";
import { useAppInsets } from "../../hooks/use-app-insets";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { apiUrl } from "../../constants/api";
import { ExploreColors, Layout } from "../../constants/exploreTheme";
import { EventCard, type EventItem } from "../../components/explore/EventCard";
import { ScreenHeader } from "../../components/explore/ScreenHeader";

const DUMMY: EventItem[] = [
  { id: "e1", title: "Mountain Music Festival 2026", date: "2026-06-15", time: "18:00", image: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&q=80&auto=format", location: "Old Manali Ground", city: "Manali" },
  { id: "e2", title: "Dubai Desert Glow Night", date: "2026-07-10", time: "19:30", image: "https://images.unsplash.com/photo-1506461883276-594a12b11cf3", location: "Safari Camp", city: "Dubai" },
  { id: "e3", title: "Bali Spices & Flavors Expo", date: "2026-08-05", time: "12:00", image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1", location: "Ubud Market", city: "Bali" },
];

export default function EventsScreen() {
  const { scrollBottomPad } = useAppInsets();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      let apiEvents: EventItem[] = [];
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status === "granted") {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const res = await fetch(apiUrl(`/api/events?lat=${loc.coords.latitude}&lng=${loc.coords.longitude}`));
        const data = await res.json();
        if (Array.isArray(data)) apiEvents = data;
      }
      const merged = [...apiEvents, ...DUMMY];
      setEvents(merged.filter((v, i, a) => a.findIndex((t) => t.title === v.title) === i));
    } catch {
      setEvents(DUMMY);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <AppScreen variant="tab" style={styles.safe}>
      <ScreenHeader title="Events" subtitle="Near you" icon="calendar" />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={ExploreColors.primary} />
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.list, { paddingBottom: scrollBottomPad }]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={ExploreColors.primary} />
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
              onPress={() => router.push({ pathname: "/eventDetails", params: { event: JSON.stringify(item) } })}
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
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 8 },
  empty: { color: ExploreColors.textSecondary },
});