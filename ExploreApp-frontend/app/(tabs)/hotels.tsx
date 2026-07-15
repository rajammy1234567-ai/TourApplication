import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
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
import { HotelCard, type HotelItem } from "../../components/explore/HotelCard";
import { ScreenHeader } from "../../components/explore/ScreenHeader";
import { SearchBar } from "../../components/explore/SearchBar";
import {
  CacheKeys,
  isCacheFresh,
  readCache,
  writeCache,
} from "../../lib/listCache";

type PropertyFilter = {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const PROPERTY_FILTERS: PropertyFilter[] = [
  { id: "All", label: "All", icon: "grid-outline" },
  { id: "hotel", label: "Hotel", icon: "business-outline" },
  { id: "apartment", label: "Apartment", icon: "home-outline" },
  { id: "villa", label: "Villa", icon: "home" },
  { id: "resort", label: "Resort", icon: "sunny-outline" },
  { id: "homestay", label: "Homestay", icon: "people-outline" },
  { id: "hostel", label: "Hostel", icon: "bed-outline" },
];

export default function HotelsScreen() {
  const { scrollBottomPad } = useAppInsets();
  const [hotels, setHotels] = useState<HotelItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [type, setType] = useState("All");
  const requestId = useRef(0);

  const fetchHotels = useCallback(async (q = "", t = "All", opts?: { force?: boolean }) => {
    const key = CacheKeys.hotels(q, t);
    const id = ++requestId.current;

    try {
      setError("");
      if (!opts?.force && isCacheFresh(key) && hotels.length > 0 && !q) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const params = new URLSearchParams();
      if (q) params.set("search", q);
      if (t && t !== "All") params.set("propertyType", t);
      const query = params.toString();
      const data = await apiJson<{ hotels?: HotelItem[] }>(
        `/api/hotels${query ? `?${query}` : ""}`,
        { timeoutMs: 20000 }
      );
      if (id !== requestId.current) return;
      const next = Array.isArray(data.hotels) ? data.hotels : [];
      setHotels(next);
      await writeCache(key, next);
    } catch (e: any) {
      if (id !== requestId.current) return;
      if (hotels.length === 0) {
        setError(e?.message || "Could not load stays");
        setHotels([]);
      }
    } finally {
      if (id === requestId.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [hotels.length]);

  // Instant cache for default list
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const cached = await readCache<HotelItem[]>(CacheKeys.hotels("", "All"));
      if (cancelled) return;
      if (cached?.length) {
        setHotels(cached);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Debounced fetch on search / type
  useEffect(() => {
    const hasData = hotels.length > 0;
    if (!hasData) setLoading(true);
    const id = setTimeout(() => {
      fetchHotels(search.trim(), type, { force: true });
    }, search.trim() ? 350 : 0);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, type]);

  return (
    <AppScreen variant="tab" style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <ScreenHeader title="Stays" subtitle="Hotels & homestays" icon="bed" />

      <View style={styles.searchWrap}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Search city or stay..."
        />
      </View>

      <View style={styles.chipBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
          style={styles.chipScroll}
        >
          {PROPERTY_FILTERS.map((item) => {
            const on = type === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.chip, on && styles.chipOn]}
                onPress={() => setType(item.id)}
                activeOpacity={0.85}
              >
                <Ionicons
                  name={item.icon}
                  size={15}
                  color={on ? "#fff" : ExploreColors.primary}
                />
                <Text style={[styles.chipText, on && styles.chipTextOn]} numberOfLines={1}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {loading && hotels.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={ExploreColors.primary} />
          <Text style={styles.loadingText}>Loading stays…</Text>
        </View>
      ) : error && hotels.length === 0 ? (
        <View style={styles.center}>
          <View style={styles.emptyIcon}>
            <Ionicons name="cloud-offline-outline" size={30} color={ExploreColors.primary} />
          </View>
          <Text style={styles.errTitle}>Couldn&apos;t load stays</Text>
          <Text style={styles.err}>{error}</Text>
          <TouchableOpacity
            style={styles.retry}
            onPress={() => {
              setLoading(true);
              fetchHotels(search.trim(), type, { force: true });
            }}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          style={styles.listFlex}
          data={hotels}
          keyExtractor={(item) => String(item._id)}
          renderItem={({ item }) => <HotelCard item={item} />}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: scrollBottomPad },
            hotels.length === 0 && styles.listEmpty,
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
                fetchHotels(search.trim(), type, { force: true });
              }}
              tintColor={ExploreColors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="bed-outline" size={36} color={ExploreColors.textMuted} />
              <Text style={styles.empty}>No stays found</Text>
            </View>
          }
        />
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: ExploreColors.background },
  searchWrap: { paddingHorizontal: Layout.pad, marginBottom: 8 },
  chipBar: { marginBottom: 8 },
  chipScroll: { flexGrow: 0 },
  chipRow: { paddingHorizontal: Layout.pad, gap: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: ExploreColors.surface,
    borderWidth: 1,
    borderColor: ExploreColors.border,
  },
  chipOn: {
    backgroundColor: ExploreColors.primary,
    borderColor: ExploreColors.primary,
  },
  chipText: { fontSize: 13, fontWeight: "700", color: ExploreColors.primary },
  chipTextOn: { color: "#fff" },
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
  empty: { color: ExploreColors.textSecondary },
});
