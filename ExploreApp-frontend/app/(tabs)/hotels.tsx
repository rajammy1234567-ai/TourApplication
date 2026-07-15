import React, { useCallback, useEffect, useState } from "react";
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

  const fetchHotels = useCallback(async (q = "", t = "All") => {
    try {
      setError("");
      const params = new URLSearchParams();
      if (q) params.set("search", q);
      if (t && t !== "All") params.set("propertyType", t);
      const query = params.toString();
      const data = await apiJson<{ hotels?: HotelItem[] }>(
        `/api/hotels${query ? `?${query}` : ""}`
      );
      setHotels(Array.isArray(data.hotels) ? data.hotels : []);
    } catch (e: any) {
      setError(e?.message || "Could not load stays");
      setHotels([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    const id = setTimeout(() => fetchHotels(search.trim(), type), 300);
    return () => clearTimeout(id);
  }, [search, type, fetchHotels]);

  return (
    <AppScreen variant="tab" style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <ScreenHeader title="Stays" subtitle="Hotels & homestays" icon="bed" />

      <View style={styles.searchWrap}>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search city or stay..." />
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
          <Text style={styles.emptyTitle}>Couldn’t load stays</Text>
          <Text style={styles.emptySub}>{error}</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => {
              setLoading(true);
              fetchHotels(search.trim(), type);
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
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchHotels(search.trim(), type);
              }}
              tintColor={ExploreColors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <View style={styles.emptyIcon}>
                <Ionicons name="bed-outline" size={32} color={ExploreColors.primary} />
              </View>
              <Text style={styles.emptyTitle}>No stays found</Text>
              <Text style={styles.emptySub}>
                {type === "All"
                  ? "Approved partner stays will appear here"
                  : `No ${type} listings — try All`}
              </Text>
              {type !== "All" && (
                <TouchableOpacity style={styles.retryBtn} onPress={() => setType("All")}>
                  <Text style={styles.retryText}>Show all stays</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: ExploreColors.background },
  searchWrap: {
    paddingHorizontal: Layout.pad,
    marginBottom: 10,
  },
  chipBar: {
    marginBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: ExploreColors.border,
    backgroundColor: ExploreColors.background,
  },
  chipScroll: {
    flexGrow: 0,
  },
  chipRow: {
    paddingHorizontal: Layout.pad,
    paddingBottom: 12,
    gap: 8,
    alignItems: "center",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    minHeight: 38,
    borderRadius: 999,
    backgroundColor: ExploreColors.surface,
    borderWidth: 1.5,
    borderColor: ExploreColors.border,
  },
  chipOn: {
    backgroundColor: ExploreColors.primary,
    borderColor: ExploreColors.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "700",
    color: ExploreColors.text,
  },
  chipTextOn: {
    color: "#fff",
  },
  listFlex: { flex: 1 },
  list: {
    paddingHorizontal: Layout.pad,
    paddingTop: 4,
  },
  listEmpty: {
    flexGrow: 1,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingTop: 48,
    gap: 8,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 13,
    color: ExploreColors.textSecondary,
    fontWeight: "500",
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: ExploreColors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: ExploreColors.text,
    textAlign: "center",
  },
  emptySub: {
    fontSize: 13,
    color: ExploreColors.textSecondary,
    textAlign: "center",
    lineHeight: 18,
  },
  retryBtn: {
    marginTop: 12,
    backgroundColor: ExploreColors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  retryText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
});
