import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { ActivityItem } from "../../components/ui/ActivityItem";
import { BookingCard, BookingItem } from "../../components/ui/BookingCard";
import { Colors, Radius, Shadow, Spacing, cardStyle } from "../../constants/theme";
import { formatINR } from "../../lib/format";
import { fetchDashboard } from "../../lib/vendorApi";
import { useTabBarMetrics } from "../../lib/safeArea";

type Stats = {
  totalTours: number;
  totalHotels: number;
  totalBookings: number;
  upcomingBookings: number;
  tourBookings: number;
  hotelBookings: number;
  totalTravelers: number;
  totalRoomNights: number;
  totalRevenue: number;
  tourRevenue: number;
  hotelRevenue: number;
  pendingTours: number;
  pendingHotels: number;
};

type DashboardData = {
  stats: Stats;
  recentBookings: BookingItem[];
  upcomingBookings: BookingItem[];
  activity: any[];
};

export default function DashboardScreen() {
  const { contentBottomPad } = useTabBarMetrics();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [vendorName, setVendorName] = useState("Vendor");

  const loadDashboard = useCallback(async () => {
    try {
      const vendorData = await AsyncStorage.getItem("vendorData");
      if (vendorData) {
        const vendor = JSON.parse(vendorData);
        setVendorName(vendor.businessName || vendor.ownerName || "Vendor");
      }
      const data = await fetchDashboard();
      setDashboard(data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [loadDashboard])
  );

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={Colors.white} />
      </View>
    );
  }

  const stats = dashboard?.stats;

  return (
    <View style={styles.root}>
      <View style={styles.hero}>
        <SafeAreaView edges={["top"]}>
          <View style={styles.heroInner}>
            <View style={{ flex: 1 }}>
              <Text style={styles.greeting}>Vendor Dashboard</Text>
              <Text style={styles.vendorName} numberOfLines={1}>
                {vendorName}
              </Text>
            </View>
            <View style={styles.revenuePill}>
              <Text style={styles.revenueLabel}>Revenue</Text>
              <Text style={styles.revenueVal}>{formatINR(stats?.totalRevenue || 0)}</Text>
            </View>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={[styles.bodyContent, { paddingBottom: contentBottomPad }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadDashboard();
            }}
            tintColor={Colors.primary}
          />
        }
      >
        {/* Overview stats */}
        <View style={styles.statsGrid}>
          <View style={[styles.statBox, { backgroundColor: "#E0F2FE" }]}>
            <Ionicons name="calendar" size={18} color="#0369A1" />
            <Text style={styles.statNum}>{stats?.totalBookings || 0}</Text>
            <Text style={styles.statLbl}>Bookings</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: "#D1FAE5" }]}>
            <Ionicons name="time" size={18} color="#047857" />
            <Text style={styles.statNum}>{stats?.upcomingBookings || 0}</Text>
            <Text style={styles.statLbl}>Upcoming</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: "#EDE9FE" }]}>
            <Ionicons name="people" size={18} color="#6D28D9" />
            <Text style={styles.statNum}>{stats?.totalTravelers || 0}</Text>
            <Text style={styles.statLbl}>Travelers</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: "#FEF3C7" }]}>
            <Ionicons name="moon" size={18} color="#B45309" />
            <Text style={styles.statNum}>{stats?.totalRoomNights || 0}</Text>
            <Text style={styles.statLbl}>Room Nights</Text>
          </View>
        </View>

        {/* Tour vs Stay breakdown */}
        <View style={[styles.breakdown, cardStyle]}>
          <View style={styles.breakItem}>
            <View style={styles.breakIcon}>
              <Ionicons name="airplane" size={16} color="#0369A1" />
            </View>
            <View>
              <Text style={styles.breakTitle}>Tour Bookings</Text>
              <Text style={styles.breakSub}>
                {stats?.tourBookings || 0} trips · {formatINR(stats?.tourRevenue || 0)}
              </Text>
            </View>
          </View>
          <View style={styles.breakLine} />
          <View style={styles.breakItem}>
            <View style={[styles.breakIcon, { backgroundColor: "#EDE9FE" }]}>
              <Ionicons name="bed" size={16} color="#6D28D9" />
            </View>
            <View>
              <Text style={styles.breakTitle}>Room Bookings</Text>
              <Text style={styles.breakSub}>
                {stats?.hotelBookings || 0} stays · {formatINR(stats?.hotelRevenue || 0)}
              </Text>
            </View>
          </View>
        </View>

        {/* Recent bookings */}
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Recent Bookings</Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/bookings")}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>

        {(dashboard?.recentBookings || []).slice(0, 3).map((b) => (
          <BookingCard key={b._id} booking={b} compact />
        ))}

        {(dashboard?.recentBookings || []).length === 0 && (
          <Text style={styles.emptyHint}>No bookings yet</Text>
        )}

        {/* Activity feed */}
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Activity Feed</Text>
          <Ionicons name="pulse" size={18} color={Colors.primary} />
        </View>

        <View style={[styles.activityCard, cardStyle]}>
          {(dashboard?.activity || []).slice(0, 8).map((item) => (
            <ActivityItem key={item.id} item={item} />
          ))}
          {(dashboard?.activity || []).length === 0 && (
            <Text style={styles.emptyHint}>No recent activity</Text>
          )}
        </View>

        {/* Quick actions */}
        <Text style={[styles.sectionTitle, { marginTop: 8 }]}>Manage Listings</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionBtn, cardStyle]}
            onPress={() => router.push("/add-tour")}
          >
            <Ionicons name="add-circle" size={22} color={Colors.primary} />
            <Text style={styles.actionLbl}>Add Tour</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, cardStyle]}
            onPress={() => router.push("/add-hotel")}
          >
            <Ionicons name="add-circle" size={22} color="#6D28D9" />
            <Text style={styles.actionLbl}>Add Stay</Text>
          </TouchableOpacity>
        </View>

        {(stats?.pendingTours || 0) + (stats?.pendingHotels || 0) > 0 && (
          <View style={styles.pendingBanner}>
            <Ionicons name="alert-circle" size={18} color={Colors.warning} />
            <Text style={styles.pendingText}>
              {(stats?.pendingTours || 0) + (stats?.pendingHotels || 0)} listing(s) waiting for admin approval
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.primary,
  },
  hero: { backgroundColor: Colors.primary, paddingBottom: 40 },
  heroInner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    gap: 12,
  },
  greeting: { fontSize: 13, color: "rgba(255,255,255,0.75)" },
  vendorName: { fontSize: 22, fontWeight: "800", color: Colors.white, marginTop: 2 },
  revenuePill: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: "flex-end",
  },
  revenueLabel: { fontSize: 11, color: "rgba(255,255,255,0.7)" },
  revenueVal: { fontSize: 16, fontWeight: "800", color: Colors.white, marginTop: 2 },
  body: { flex: 1, marginTop: -24 },
  bodyContent: { paddingHorizontal: Spacing.md },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 12 },
  statBox: {
    width: "47%",
    flexGrow: 1,
    borderRadius: Radius.lg,
    padding: 14,
    gap: 4,
    ...Shadow.sm,
  },
  statNum: { fontSize: 22, fontWeight: "800", color: Colors.text },
  statLbl: { fontSize: 12, color: Colors.textSecondary },
  breakdown: { padding: Spacing.md, marginBottom: Spacing.md },
  breakItem: { flexDirection: "row", alignItems: "center", gap: 12 },
  breakIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#E0F2FE",
    alignItems: "center",
    justifyContent: "center",
  },
  breakTitle: { fontSize: 14, fontWeight: "700", color: Colors.text },
  breakSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  breakLine: { height: 1, backgroundColor: Colors.borderLight, marginVertical: 12 },
  sectionHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    marginTop: 4,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: Colors.text },
  seeAll: { fontSize: 13, fontWeight: "600", color: Colors.primary },
  activityCard: { paddingHorizontal: Spacing.md, paddingVertical: 4, marginBottom: 12 },
  emptyHint: {
    textAlign: "center",
    color: Colors.textMuted,
    paddingVertical: 20,
    fontSize: 13,
  },
  actionsRow: { flexDirection: "row", gap: 10, marginTop: 4 },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
  },
  actionLbl: { fontWeight: "600", color: Colors.text, fontSize: 14 },
  pendingBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.warningSoft,
    borderRadius: Radius.md,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  pendingText: { flex: 1, fontSize: 12, color: "#92400E", fontWeight: "500" },
});