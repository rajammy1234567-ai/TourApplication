import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { BookingCard, BookingItem } from "../../components/ui/BookingCard";
import { EmptyState } from "../../components/ui/EmptyState";
import { Colors, Radius, Spacing, cardStyle } from "../../constants/theme";
import { formatINR } from "../../lib/format";
import { fetchBookings } from "../../lib/vendorApi";
import { useTabBarMetrics } from "../../lib/safeArea";

type Filter = "all" | "upcoming" | "tours" | "stays" | "past";

export default function BookingsScreen() {
  const { contentBottomPad } = useTabBarMetrics();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [data, setData] = useState<{
    all: BookingItem[];
    upcoming: BookingItem[];
    past: BookingItem[];
    tourBookings: BookingItem[];
    hotelBookings: BookingItem[];
  } | null>(null);

  const load = useCallback(async () => {
    try {
      const bookings = await fetchBookings();
      setData(bookings);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const getFiltered = (): BookingItem[] => {
    if (!data) return [];
    switch (filter) {
      case "upcoming":
        return data.upcoming;
      case "tours":
        return data.tourBookings;
      case "stays":
        return data.hotelBookings;
      case "past":
        return data.past;
      default:
        return data.all;
    }
  };

  const filtered = getFiltered();
  const totalRevenue = data?.all.reduce((s, b) => s + (b.paidAmount || 0), 0) || 0;

  const FILTERS: { key: Filter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "upcoming", label: "Upcoming" },
    { key: "tours", label: "Tours" },
    { key: "stays", label: "Stays" },
    { key: "past", label: "Past" },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Bookings</Text>
        <Text style={styles.sub}>
          {data?.all.length || 0} total · {formatINR(totalRevenue)} earned
        </Text>
      </View>

      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.chip, filter === f.key && styles.chipActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.chipText, filter === f.key && styles.chipTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} size="large" color={Colors.primary} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item._id}
          contentContainerStyle={[styles.list, { paddingBottom: contentBottomPad }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
              tintColor={Colors.primary}
            />
          }
          ListHeaderComponent={
            filter === "all" && data ? (
              <View style={[styles.summary, cardStyle]}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryVal}>{data.upcoming.length}</Text>
                  <Text style={styles.summaryLbl}>Upcoming</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryVal}>{data.tourBookings.length}</Text>
                  <Text style={styles.summaryLbl}>Tour Trips</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryVal}>{data.hotelBookings.length}</Text>
                  <Text style={styles.summaryLbl}>Room Stays</Text>
                </View>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <EmptyState
              icon="calendar-outline"
              title="No bookings here"
              subtitle="Bookings will show who booked, which room/tour, dates & payment."
            />
          }
          renderItem={({ item }) => <BookingCard booking={item} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, paddingBottom: Spacing.sm },
  title: { fontSize: 26, fontWeight: "800", color: Colors.text },
  sub: { fontSize: 13, color: Colors.textSecondary, marginTop: 4 },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: Spacing.md,
    gap: 8,
    marginBottom: Spacing.sm,
    flexWrap: "wrap",
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 13, fontWeight: "600", color: Colors.textSecondary },
  chipTextActive: { color: Colors.white },
  loader: { marginTop: 60 },
  list: { paddingHorizontal: Spacing.md, flexGrow: 1 },
  summary: {
    flexDirection: "row",
    padding: Spacing.md,
    marginBottom: 12,
  },
  summaryItem: { flex: 1, alignItems: "center" },
  summaryVal: { fontSize: 20, fontWeight: "800", color: Colors.primary },
  summaryLbl: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  divider: { width: 1, backgroundColor: Colors.borderLight },
});