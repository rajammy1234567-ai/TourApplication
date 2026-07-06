import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { deleteTour, fetchTours as loadTours } from "../../lib/vendorApi";
import { EmptyState } from "../../components/ui/EmptyState";
import { Fab } from "../../components/ui/Fab";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { Colors, Radius, Spacing, cardStyle } from "../../constants/theme";
import { useTabBarMetrics } from "../../lib/safeArea";

type Tour = {
  _id: string;
  title: string;
  location?: string;
  price: number;
  status: string;
  image?: string;
};

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=400&q=80&auto=format";

export default function VendorToursScreen() {
  const { contentBottomPad } = useTabBarMetrics();
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const refreshTours = useCallback(async () => {
    try {
      setTours(await loadTours());
    } catch (err: any) {
      if (err.message?.includes("Session expired")) {
        router.replace("/(auth)/login");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const handleDelete = (tour: Tour) => {
    Alert.alert("Delete tour?", tour.title, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteTour(tour._id);
            refreshTours();
          } catch (err: any) {
            Alert.alert("Error", err.message || "Could not delete tour");
          }
        },
      },
    ]);
  };

  useFocusEffect(
    useCallback(() => {
      refreshTours();
    }, [refreshTours])
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>My Tours</Text>
          <Text style={styles.subtitle}>
            {tours.length} package{tours.length !== 1 ? "s" : ""} listed
          </Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} size="large" color={Colors.primary} />
      ) : (
        <FlatList
          data={tours}
          keyExtractor={(item) => item._id}
          contentContainerStyle={[styles.list, { paddingBottom: contentBottomPad }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                refreshTours();
              }}
              tintColor={Colors.primary}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="airplane-outline"
              title="No tours yet"
              subtitle="Create your first tour package and submit it for admin approval."
              actionLabel="Add Tour"
              onAction={() => router.push("/add-tour")}
            />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.card, cardStyle]}
              activeOpacity={0.85}
              onPress={() => router.push({ pathname: "/edit-tour", params: { id: item._id } })}
            >
              <Image
                source={{ uri: item.image || FALLBACK_IMAGE }}
                style={styles.cardThumb}
                contentFit="cover"
              />
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <View style={styles.metaRow}>
                  <Ionicons name="location-outline" size={13} color={Colors.textMuted} />
                  <Text style={styles.cardSub} numberOfLines={1}>
                    {item.location || "Location not set"}
                  </Text>
                </View>
                <Text style={styles.price}>₹{item.price.toLocaleString("en-IN")}</Text>
              </View>
              <View style={styles.actions}>
                <StatusBadge status={item.status} />
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    onPress={() => router.push({ pathname: "/edit-tour", params: { id: item._id } })}
                    hitSlop={8}
                  >
                    <Ionicons name="create-outline" size={18} color={Colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(item)} hitSlop={8}>
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {tours.length > 0 && <Fab onPress={() => router.push("/add-tour")} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  title: { fontSize: 26, fontWeight: "800", color: Colors.text },
  subtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 4 },
  loader: { marginTop: 60 },
  list: { paddingHorizontal: Spacing.md, flexGrow: 1 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  cardThumb: {
    width: 56,
    height: 56,
    borderRadius: Radius.md,
    backgroundColor: Colors.primarySoft,
  },
  cardBody: { flex: 1 },
  cardTitle: { fontWeight: "700", fontSize: 15, color: Colors.text },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  cardSub: { fontSize: 12, color: Colors.textSecondary, flex: 1 },
  price: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.primary,
    marginTop: 6,
  },
  actions: { alignItems: "flex-end", gap: 10 },
  actionRow: { flexDirection: "row", alignItems: "center", gap: 12 },
});