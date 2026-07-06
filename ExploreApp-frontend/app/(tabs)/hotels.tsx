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
import { apiUrl } from "../../constants/api";
import { ExploreColors, Layout } from "../../constants/exploreTheme";
import { HotelCard, type HotelItem } from "../../components/explore/HotelCard";
import { ScreenHeader } from "../../components/explore/ScreenHeader";
import { SearchBar } from "../../components/explore/SearchBar";

const TYPES = ["All", "hotel", "apartment", "villa", "resort", "homestay"];

export default function HotelsScreen() {
  const { scrollBottomPad } = useAppInsets();
  const [hotels, setHotels] = useState<HotelItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [type, setType] = useState("All");

  const fetchHotels = useCallback(async (q = "", t = "") => {
    try {
      setError("");
      const params = new URLSearchParams();
      if (q) params.set("search", q);
      if (t && t !== "All") params.set("propertyType", t);
      const query = params.toString();
      const res = await fetch(apiUrl(`/api/hotels${query ? `?${query}` : ""}`));
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to load");
      setHotels(data.hotels || []);
    } catch (e: any) {
      setError(e.message);
      setHotels([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchHotels(); }, [fetchHotels]);
  useEffect(() => {
    const id = setTimeout(() => fetchHotels(search.trim(), type), 400);
    return () => clearTimeout(id);
  }, [search, type, fetchHotels]);

  return (
    <AppScreen variant="tab" style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <ScreenHeader title="Stays" subtitle="Hotels & homestays" icon="bed" />

      <View style={styles.searchWrap}>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search city..." />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {TYPES.map((t) => {
          const on = type === t;
          const label = t === "All" ? "All" : t.charAt(0).toUpperCase() + t.slice(1);
          return (
            <TouchableOpacity key={t} style={[styles.chip, on && styles.chipOn]} onPress={() => setType(t)}>
              <Text style={[styles.chipText, on && styles.chipTextOn]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={ExploreColors.primary} />
        </View>
      ) : (
        <FlatList
          data={hotels}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => <HotelCard item={item} />}
          contentContainerStyle={[styles.list, { paddingBottom: scrollBottomPad }]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchHotels(search.trim(), type); }}
              tintColor={ExploreColors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="bed-outline" size={36} color={ExploreColors.textMuted} />
              <Text style={styles.empty}>{error || "No stays found"}</Text>
            </View>
          }
        />
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: ExploreColors.background },
  searchWrap: { paddingHorizontal: Layout.pad, marginBottom: Layout.gap },
  chips: { paddingHorizontal: Layout.pad, gap: 8, marginBottom: Layout.gap },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: ExploreColors.surface,
    borderWidth: 1,
    borderColor: ExploreColors.border,
  },
  chipOn: { backgroundColor: ExploreColors.primary, borderColor: ExploreColors.primary },
  chipText: { fontSize: 13, fontWeight: "600", color: ExploreColors.textSecondary },
  chipTextOn: { color: "#fff" },
  list: { paddingHorizontal: Layout.pad },
  center: { alignItems: "center", paddingTop: 48, gap: 8 },
  empty: { color: ExploreColors.textSecondary },
});