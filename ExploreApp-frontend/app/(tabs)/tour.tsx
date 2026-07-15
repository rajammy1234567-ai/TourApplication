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
import { apiJson } from "../../constants/api";
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
      const data = await apiJson<{ tours?: TourItem[] }>("/api/tours");
      setTours(Array.isArray(data.tours) ? data.tours : []);
    } catch (e: any) {
      setTours([]);
      setError(e?.message || "Could not load tours");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTours();
  }, [fetchTours]);

  return (
    <AppScreen variant="tab" style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <ScreenHeader title="Tours" subtitle="Discover packages" icon="airplane" />

      {loading && tours.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={ExploreColors.primary} />
          <Text style={styles.loadingText}>Loading tours…</Text>
        </View>
      ) : error && tours.length === 0 ? (
        <View style={styles.center}>
          <View style={styles.emptyIcon}>
            <Ionicons name="cloud-offline-outline" size={30} color={ExploreColors.primary} />
          </View>
          <Text style={styles.errTitle}>Couldn’t load tours</Text>
          <Text style={styles.err}>{error}</Text>
          <TouchableOpacity
            style={styles.retry}
            onPress={() => {
              setLoading(true);
              fetchTours();
            }}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          style={styles.listFlex}
          data={tours}
          keyExtractor={(item) => String(item._id)}
          renderItem={({ item }) => <TourListCard item={item} variant="full" />}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: scrollBottomPad },
            tours.length === 0 && styles.listEmpty,
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchTours();
              }}
              tintColor={ExploreColors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="map-outline" size={36} color={ExploreColors.textMuted} />
              <Text style={styles.empty}>No tours available yet</Text>
              <Text style={styles.emptySub}>Approved packages will appear here</Text>
            </View>
          }
        />
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: ExploreColors.background },
  listFlex: { flex: 1 },
  list: { paddingHorizontal: Layout.pad },
  listEmpty: { flexGrow: 1 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 8,
  },
  loadingText: { marginTop: 8, color: ExploreColors.textSecondary, fontSize: 13 },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: ExploreColors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  errTitle: { fontSize: 16, fontWeight: "700", color: ExploreColors.text },
  err: {
    color: ExploreColors.textSecondary,
    fontWeight: "500",
    textAlign: "center",
    lineHeight: 20,
  },
  retry: {
    backgroundColor: ExploreColors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: Layout.radiusSm,
    marginTop: 10,
  },
  retryText: { color: "#fff", fontWeight: "700" },
  empty: { color: ExploreColors.text, fontWeight: "700", fontSize: 15 },
  emptySub: { color: ExploreColors.textSecondary, fontSize: 13 },
});
