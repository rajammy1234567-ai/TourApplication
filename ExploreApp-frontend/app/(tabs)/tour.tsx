import React, { useCallback, useEffect, useRef, useState } from "react";
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
import {
  CacheKeys,
  isCacheFresh,
  readCache,
  writeCache,
} from "../../lib/listCache";

export default function DiscoverTours() {
  const { scrollBottomPad } = useAppInsets();
  const [tours, setTours] = useState<TourItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const inflight = useRef<Promise<void> | null>(null);

  const fetchTours = useCallback(async (opts?: { force?: boolean }) => {
    if (inflight.current && !opts?.force) return inflight.current;

    const run = async () => {
      try {
        setError("");
        // Skip network if cache is still fresh (tab revisit)
        if (!opts?.force && isCacheFresh(CacheKeys.tours) && tours.length > 0) {
          setLoading(false);
          setRefreshing(false);
          return;
        }

        const data = await apiJson<{ tours?: TourItem[] }>("/api/tours", {
          timeoutMs: 20000,
        });
        const next = Array.isArray(data.tours) ? data.tours : [];
        setTours(next);
        await writeCache(CacheKeys.tours, next);
      } catch (e: any) {
        if (tours.length === 0) {
          setError(e?.message || "Could not load tours");
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
        inflight.current = null;
      }
    };

    inflight.current = run();
    return inflight.current;
  }, [tours.length]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const cached = await readCache<TourItem[]>(CacheKeys.tours);
      if (cancelled) return;
      if (cached?.length) {
        setTours(cached);
        setLoading(false);
        // Background revalidate
        fetchTours({ force: !isCacheFresh(CacheKeys.tours) });
      } else {
        fetchTours({ force: true });
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          <Text style={styles.errTitle}>Couldn&apos;t load tours</Text>
          <Text style={styles.err}>{error}</Text>
          <TouchableOpacity
            style={styles.retry}
            onPress={() => {
              setLoading(true);
              fetchTours({ force: true });
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
          initialNumToRender={6}
          maxToRenderPerBatch={8}
          windowSize={7}
          removeClippedSubviews
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchTours({ force: true });
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
    borderRadius: 32,
    backgroundColor: ExploreColors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  errTitle: { fontSize: 16, fontWeight: "800", color: ExploreColors.text },
  err: { color: ExploreColors.textSecondary, textAlign: "center", fontSize: 13 },
  retry: {
    marginTop: 10,
    backgroundColor: ExploreColors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  retryText: { color: "#fff", fontWeight: "800" },
  empty: { color: ExploreColors.textSecondary, fontWeight: "600" },
  emptySub: { color: ExploreColors.textMuted, fontSize: 12 },
});
