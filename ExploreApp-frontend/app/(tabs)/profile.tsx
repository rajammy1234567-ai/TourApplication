import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  StatusBar,
  ActivityIndicator,
  FlatList,
  Image,
  Alert,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiUrl } from "../../constants/api";

const STORAGE_KEYS = {
  token: "token",
  userData: "userData",
  wishlistTours: "wishlistTours",
} as const;

type UserData = {
  _id?: string;
  fullname?: string;
  name?: string;
  email?: string;
  phone?: string;
};

type WishlistTour = {
  _id: string;
  name: string;
  location?: string;
  rating?: number;
  images?: string[];
};

function safeParseJson<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export default function ProfileScreen() {
  const router = useRouter();

  const [notifications, setNotifications] = useState(true);
  const [user, setUser] = useState<UserData | null>(null);
  const [bookingCount, setBookingCount] = useState(0);
  const [wishlist, setWishlist] = useState<WishlistTour[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorText, setErrorText] = useState("");

  const wishlistCount = useMemo(() => wishlist.length, [wishlist.length]);

  const loadProfileData = useCallback(async () => {
    setErrorText("");
    try {
      const entries = await AsyncStorage.multiGet([
        STORAGE_KEYS.token,
        STORAGE_KEYS.userData,
        STORAGE_KEYS.wishlistTours,
      ]);

      const map = Object.fromEntries(entries);
      const token = map[STORAGE_KEYS.token] ?? null;
      const storedUser = safeParseJson<UserData | null>(
        map[STORAGE_KEYS.userData],
        null
      );
      const storedWishlist = safeParseJson<WishlistTour[]>(
        map[STORAGE_KEYS.wishlistTours],
        []
      );

      setUser(storedUser);
      setWishlist(Array.isArray(storedWishlist) ? storedWishlist : []);

      if (token) {
        try {
          const response = await fetch(apiUrl("/api/bookings/my-bookings"), {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          const data = await response.json();
          if (response.ok && data?.success && Array.isArray(data?.bookings)) {
            setBookingCount(data.bookings.length);
          } else {
            setBookingCount(0);
          }
        } catch {
          setBookingCount(0);
        }
      } else {
        setBookingCount(0);
      }
    } catch {
      setErrorText("Unable to load profile data. Pull to refresh.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProfileData();
    }, [loadProfileData])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadProfileData();
  }, [loadProfileData]);

  const handleLogout = useCallback(() => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await AsyncStorage.multiRemove([
              STORAGE_KEYS.token,
              STORAGE_KEYS.userData,
              STORAGE_KEYS.wishlistTours,
            ]);
            setUser(null);
            setWishlist([]);
            setBookingCount(0);
            router.replace("/(auth)/login");
          } catch {
            Alert.alert("Error", "Failed to logout. Please try again.");
          }
        },
      },
    ]);
  }, [router]);

  const displayName = useMemo(
    () => user?.fullname?.trim() || user?.name?.trim() || "User",
    [user]
  );

  const displayEmail = useMemo(
    () => user?.email?.trim() || "No Email",
    [user?.email]
  );

  const MenuItem = ({
    icon,
    title,
    right,
    onPress,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    right?: React.ReactNode;
    onPress?: () => void;
  }) => (
    <TouchableOpacity
      style={styles.menuItem}
      activeOpacity={0.75}
      onPress={onPress}
      disabled={!onPress}
    >
      <Ionicons name={icon} size={20} color="#1E3A8A" />
      <Text style={styles.menuText}>{title}</Text>
      {right ?? <Ionicons name="chevron-forward" size={18} color="#C7C7C7" />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#F6F8FC" />
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#1E3A8A" />
          </View>
        ) : (
          <>
            <View style={styles.headerCard}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={42} color="#1E3A8A" />
              </View>
              <Text style={styles.name}>{displayName}</Text>
              <Text style={styles.email}>{displayEmail}</Text>
            </View>

            <View style={styles.statsCard}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{bookingCount}</Text>
                <Text style={styles.statLabel}>Bookings</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{wishlistCount}</Text>
                <Text style={styles.statLabel}>Wishlist</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>1</Text>
                <Text style={styles.statLabel}>Online</Text>
              </View>
            </View>


            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Account</Text>

              {/* <MenuItem icon="person-circle-outline" title="Personal Info" />
              <MenuItem icon="lock-closed-outline" title="Change Password" />
              <MenuItem icon="card-outline" title="Payment Methods" /> */}
              <MenuItem
                icon="briefcase-outline"
                title="My Bookings"
                onPress={() => router.push("/myBookings")}
              />
              <MenuItem
                icon="heart-outline"
                title="My Wishlist"
                onPress={() => router.push("/wishlist")}
              />

              <View style={styles.menuItem}>
                <Ionicons name="notifications-outline" size={20} color="#1E3A8A" />
                <Text style={styles.menuText}>Notifications</Text>
                <Switch
                  value={notifications}
                  onValueChange={setNotifications}
                  trackColor={{ false: "#ccc", true: "#1E3A8A" }}
                />
              </View>

              <MenuItem
                icon="globe-outline"
                title="Language"
                right={<Text style={{ color: "#6B7280", marginRight: 5 }}>English</Text>}
                onPress={() => {
                  Alert.alert("Select Language", "Choose your preferred language", [
                    { text: "English", onPress: () => {} },
                    { text: "Hindi", onPress: () => {} },
                    { text: "Spanish", onPress: () => {} },
                    { text: "Cancel", style: "cancel" },
                  ]);
                }}
              />
              <MenuItem
                icon="help-circle-outline"
                title="Help & Support"
                onPress={() => router.push("/help")}
              />
            </View>

            {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}

            <TouchableOpacity
              style={styles.logoutBtn}
              onPress={handleLogout}
              activeOpacity={0.85}
            >
              <Ionicons name="log-out-outline" size={20} color="#fff" />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>

            <View style={{ height: 30 }} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F6F8FC" },
  container: { flex: 1 },

  loaderContainer: {
    height: 300,
    justifyContent: "center",
    alignItems: "center",
  },

  headerCard: {
    alignItems: "center",
    backgroundColor: "#fff",
    margin: 16,
    borderRadius: 18,
    paddingVertical: 22,
    elevation: 3,
  },
  avatar: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: "#EAF0FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  name: { fontSize: 20, fontWeight: "700", color: "#0F172A" },
  email: { fontSize: 13, color: "#6B7280", marginTop: 2 },

  statsCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    borderRadius: 18,
    paddingVertical: 14,
    elevation: 2,
  },
  statBox: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 18, fontWeight: "700", color: "#1E3A8A" },
  statLabel: { fontSize: 12, color: "#6B7280", marginTop: 3 },

  card: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 18,
    paddingBottom: 6,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1E3A8A",
    padding: 14,
  },

  wishlistHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  seeAllText: {
    color: "#1E3A8A",
    fontWeight: "600",
    paddingHorizontal: 14,
  },
  emptyWishlistWrap: {
    borderTopWidth: 1,
    borderTopColor: "#F1F1F1",
    padding: 16,
    alignItems: "center",
    gap: 8,
  },
  emptyWishlistText: {
    color: "#6B7280",
    fontSize: 13,
  },

  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F1F1",
  },
  menuText: { flex: 1, marginLeft: 10, fontSize: 14, color: "#111827" },

  wishlistItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F1F1",
  },
  wishlistImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
    marginRight: 12,
    backgroundColor: "#E5E7EB",
  },
  wishlistTextWrap: { flex: 1 },
  wishlistTitle: { fontSize: 14, fontWeight: "600", color: "#111827" },
  wishlistSub: { fontSize: 12, color: "#6B7280", marginTop: 2 },

  errorText: {
    color: "#DC2626",
    fontSize: 12,
    marginTop: 12,
    marginHorizontal: 16,
  },

  logoutBtn: {
    flexDirection: "row",
    backgroundColor: "#EF4444",
    marginHorizontal: 16,
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    elevation: 3,
  },
  logoutText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});