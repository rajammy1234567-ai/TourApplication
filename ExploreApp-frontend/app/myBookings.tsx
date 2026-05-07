import React, { useCallback, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { apiUrl } from "../constants/api";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value || 0);

export default function MyBookings() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchBookings = async () => {
    try {
      setError("");
      const token = await AsyncStorage.getItem("token");

      if (!token) {
        router.replace("/(auth)/login");
        return;
      }

        const response = await fetch(apiUrl("/api/bookings/my-bookings"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load bookings");
      }

      setBookings(data.bookings || []);
    } catch (err: any) {
      setError(err.message || "Unable to load bookings");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchBookings();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={22} color="#111" />
        </TouchableOpacity>
        <Text style={styles.heading}>My Bookings</Text>
        <View style={styles.iconBtn} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#0F3B82" />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.error}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchBookings}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item) => item._id}
          contentContainerStyle={bookings.length ? styles.list : styles.emptyWrap}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="briefcase-outline" size={34} color="#94A3B8" />
              <Text style={styles.emptyTitle}>No bookings yet</Text>
              <Text style={styles.emptyText}>Confirmed bookings will appear here after payment.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.packageName}>{item.packageName}</Text>
                <Text style={styles.status}>{item.bookingStatus}</Text>
              </View>

              <View style={styles.amountRow}>
                <View>
                  <Text style={styles.label}>Paid Amount</Text>
                  <Text style={styles.value}>{formatCurrency(item.paidAmount)}</Text>
                </View>
                <View style={styles.rightAmount}>
                  <Text style={styles.label}>Remaining</Text>
                  <Text style={styles.remaining}>{formatCurrency(item.remainingAmount)}</Text>
                </View>
              </View>

              <View style={styles.footer}>
                <Text style={styles.paymentStatus}>Payment: {item.paymentStatus}</Text>
                <Text style={styles.date}>
                  {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ""}
                </Text>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F6F8FC" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  iconBtn: { width: 36, height: 36, justifyContent: "center" },
  heading: { fontSize: 18, fontWeight: "700", color: "#111827" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  error: { color: "#B91C1C", textAlign: "center", marginBottom: 14 },
  retryBtn: { backgroundColor: "#0F3B82", paddingHorizontal: 18, paddingVertical: 10, borderRadius: 8 },
  retryText: { color: "#fff", fontWeight: "700" },
  list: { padding: 16, paddingBottom: 32 },
  emptyWrap: { flexGrow: 1, justifyContent: "center", padding: 24 },
  empty: { alignItems: "center" },
  emptyTitle: { marginTop: 10, fontSize: 17, fontWeight: "700", color: "#111827" },
  emptyText: { marginTop: 6, textAlign: "center", color: "#64748B" },
  card: { backgroundColor: "#fff", borderRadius: 8, padding: 16, marginBottom: 14, elevation: 2 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  packageName: { flex: 1, fontSize: 16, fontWeight: "700", color: "#111827" },
  status: { color: "#047857", fontWeight: "700" },
  amountRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 18 },
  rightAmount: { alignItems: "flex-end" },
  label: { color: "#64748B", fontSize: 12 },
  value: { marginTop: 4, fontWeight: "700", color: "#0F3B82" },
  remaining: { marginTop: 4, fontWeight: "700", color: "#B45309" },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#EEF2F7",
    paddingTop: 12,
  },
  paymentStatus: { color: "#475569" },
  date: { color: "#64748B" },
});