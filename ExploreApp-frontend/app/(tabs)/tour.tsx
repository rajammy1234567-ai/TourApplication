import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { AppScreen } from "../../components/explore/AppScreen";
import { useAppInsets } from "../../hooks/use-app-insets";
import { Ionicons } from "@expo/vector-icons";
import { apiUrl } from "../../constants/api";
import { ExploreColors, Layout } from "../../constants/exploreTheme";
import { ScreenHeader } from "../../components/explore/ScreenHeader";
import { TourListCard } from "../../components/explore/TourListCard";
import type { TourItem } from "../../components/explore/TourHorizontalCard";

export default function DiscoverTours() {
  const { scrollBottomPad } = useAppInsets();
  const [tours, setTours] = useState<TourItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchTours = useCallback(async () => {
    try {
      setError("");
      const res = await fetch(apiUrl("/api/tours"));
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to load");
      setTours(data.tours || []);
    } catch (e: any) {
      setError(e.message || "Failed to load tours");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchTours(); }, [fetchTours]);

  return (
    <AppScreen variant="tab" style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <ScreenHeader title="Tours" subtitle="Discover packages" icon="airplane" />

      {loading && tours.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={ExploreColors.primary} />
        </View>
      ) : error && tours.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.err}>{error}</Text>
          <TouchableOpacity style={styles.retry} onPress={fetchTours}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={tours}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => <TourListCard item={item} variant="full" />}
          contentContainerStyle={[styles.list, { paddingBottom: scrollBottomPad }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchTours(); }}
              tintColor={ExploreColors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="map-outline" size={36} color={ExploreColors.textMuted} />
              <Text style={styles.empty}>No tours available</Text>
            </View>
          }
        />
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: ExploreColors.background },
  list: { paddingHorizontal: Layout.pad },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 10 },
  err: { color: ExploreColors.error, fontWeight: "600", textAlign: "center" },
  retry: {
    backgroundColor: ExploreColors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: Layout.radiusSm,
    marginTop: 8,
  },
  retryText: { color: "#fff", fontWeight: "700" },
  empty: { color: ExploreColors.textSecondary },
});