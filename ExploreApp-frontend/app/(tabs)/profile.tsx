import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { AppScreen } from "../../components/explore/AppScreen";
import { useAppInsets } from "../../hooks/use-app-insets";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiUrl } from "../../constants/api";
import { ExploreColors, ExploreShadow, Layout } from "../../constants/exploreTheme";

const KEYS = { token: "token", userData: "userData", wishlistTours: "wishlistTours" };

type UserData = { fullname?: string; name?: string; email?: string; phone?: string };

type VendorApplication = {
  status: "pending" | "approved" | "rejected";
  businessName?: string;
};

const VENDOR_STATUS = {
  pending: { label: "Under Review", color: "#D97706", bg: "#FEF3C7", icon: "time-outline" as const },
  approved: { label: "Approved", color: "#16A34A", bg: "#DCFCE7", icon: "checkmark-circle-outline" as const },
  rejected: { label: "Rejected", color: "#DC2626", bg: "#FEE2E2", icon: "close-circle-outline" as const },
};

function parse<T>(v: string | null, fb: T): T {
  if (!v) return fb;
  try { return JSON.parse(v) as T; } catch { return fb; }
}

export default function ProfileScreen() {
  const { scrollBottomPad } = useAppInsets();
  const router = useRouter();
  const [notifications, setNotifications] = useState(true);
  const [user, setUser] = useState<UserData | null>(null);
  const [bookings, setBookings] = useState(0);
  const [wishlist, setWishlist] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [vendorApp, setVendorApp] = useState<VendorApplication | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await AsyncStorage.multiGet([KEYS.token, KEYS.userData, KEYS.wishlistTours]);
      const map = Object.fromEntries(data);
      const cachedUser = parse<UserData | null>(map[KEYS.userData], null);
      setUser(cachedUser);
      setWishlist(parse<unknown[]>(map[KEYS.wishlistTours], []).length);
      const token = map[KEYS.token];
      if (token) {
        try {
          const [profileRes, bookingsRes, vendorRes] = await Promise.all([
            fetch(apiUrl("/api/users/profile"), {
              headers: { Authorization: `Bearer ${token}` },
            }),
            fetch(apiUrl("/api/bookings/my-bookings"), {
              headers: { Authorization: `Bearer ${token}` },
            }),
            fetch(apiUrl("/api/vendor/application"), {
              headers: { Authorization: `Bearer ${token}` },
            }),
          ]);

          const profileJson = await profileRes.json();
          if (profileRes.ok && profileJson?.success && profileJson.user) {
            const serverUser = profileJson.user;
            setUser(serverUser);
            await AsyncStorage.setItem(KEYS.userData, JSON.stringify(serverUser));
          }
          const bookingsJson = await bookingsRes.json();
          setBookings(bookingsRes.ok && bookingsJson?.success ? (bookingsJson.bookings?.length || 0) : 0);

          const vendorJson = await vendorRes.json();
          setVendorApp(
            vendorRes.ok && vendorJson?.success && vendorJson.application
              ? vendorJson.application
              : null
          );
        } catch {
          setBookings(0);
          setVendorApp(null);
        }
      } else {
        setBookings(0);
        setVendorApp(null);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const name = useMemo(() => user?.fullname || user?.name || "Explorer", [user]);
  const email = useMemo(() => user?.email || user?.phone || "Not signed in", [user]);
  const initial = name.charAt(0).toUpperCase();

  const logout = () => {
    Alert.alert("Sign out", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.multiRemove([KEYS.token, KEYS.userData, KEYS.wishlistTours]);
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  const MenuRow = ({
    icon,
    label,
    onPress,
    right,
    isFirst,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    onPress?: () => void;
    right?: React.ReactNode;
    isFirst?: boolean;
  }) => (
    <TouchableOpacity
      style={[styles.menuRow, !isFirst && styles.menuRowDivider]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.7}
    >
      <Ionicons name={icon} size={20} color={ExploreColors.primary} />
      <Text style={styles.menuLabel}>{label}</Text>
      {right ?? <Ionicons name="chevron-forward" size={18} color={ExploreColors.textMuted} />}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <AppScreen variant="tab" style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={ExploreColors.primary} />
        </View>
      </AppScreen>
    );
  }

  return (
    <AppScreen variant="tab" style={styles.safe}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: scrollBottomPad }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={ExploreColors.primary} />}
      >
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.email}>{email}</Text>
        </View>

        {vendorApp ? (
          <TouchableOpacity
            style={[styles.vendorBanner, { backgroundColor: VENDOR_STATUS[vendorApp.status].bg }]}
            activeOpacity={0.85}
            onPress={() => router.push("/becomeVendor")}
          >
            <View style={[styles.vendorBannerIcon, { backgroundColor: VENDOR_STATUS[vendorApp.status].color }]}>
              <Ionicons name={VENDOR_STATUS[vendorApp.status].icon} size={22} color="#fff" />
            </View>
            <View style={styles.vendorBannerBody}>
              <Text style={styles.vendorBannerTitle}>Partner application</Text>
              <Text style={styles.vendorBannerSub} numberOfLines={2}>
                {vendorApp.status === "approved"
                  ? `${vendorApp.businessName || "Your business"} · Login credentials ready`
                  : `${vendorApp.businessName || "Your business"} · Tap to view status`}
              </Text>
            </View>
            <View style={[styles.vendorBadge, { borderColor: VENDOR_STATUS[vendorApp.status].color }]}>
              <Text style={[styles.vendorBadgeText, { color: VENDOR_STATUS[vendorApp.status].color }]}>
                {VENDOR_STATUS[vendorApp.status].label}
              </Text>
            </View>
          </TouchableOpacity>
        ) : null}

        <View style={styles.stats}>
          {[
            { n: bookings, l: "Bookings" },
            { n: wishlist, l: "Wishlist" },
          ].map((s, i) => (
            <View key={s.l} style={[styles.stat, i === 0 && styles.statBorder]}>
              <Text style={styles.statN}>{s.n}</Text>
              <Text style={styles.statL}>{s.l}</Text>
            </View>
          ))}
        </View>

        <View style={styles.menuCard}>
          {[
            { icon: "briefcase-outline" as const, label: "My Bookings", onPress: () => router.push("/myBookings") },
            { icon: "heart-outline" as const, label: "Wishlist", onPress: () => router.push("/wishlist") },
            {
              icon: "storefront-outline" as const,
              label: vendorApp ? "Partner Application Status" : "Become a Vendor",
              onPress: () => router.push("/becomeVendor"),
              right: vendorApp ? (
                <View style={[styles.menuBadge, { backgroundColor: VENDOR_STATUS[vendorApp.status].bg }]}>
                  <Text style={[styles.menuBadgeText, { color: VENDOR_STATUS[vendorApp.status].color }]}>
                    {VENDOR_STATUS[vendorApp.status].label}
                  </Text>
                </View>
              ) : undefined,
            },
            { icon: "help-circle-outline" as const, label: "Help", onPress: () => router.push("/help") },
          ].map((item, index) => (
            <MenuRow
              key={item.label}
              icon={item.icon}
              label={item.label}
              onPress={item.onPress}
              right={"right" in item ? item.right : undefined}
              isFirst={index === 0}
            />
          ))}
          <View style={[styles.menuRow, styles.menuRowDivider]}>
            <Ionicons name="notifications-outline" size={20} color={ExploreColors.primary} />
            <Text style={styles.menuLabel}>Notifications</Text>
            <Switch value={notifications} onValueChange={setNotifications} trackColor={{ true: ExploreColors.primary }} />
          </View>
        </View>

        <TouchableOpacity style={styles.logout} onPress={logout}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: ExploreColors.background },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  profileCard: {
    backgroundColor: ExploreColors.surface,
    margin: Layout.pad,
    borderRadius: Layout.radius,
    padding: 24,
    alignItems: "center",
    ...ExploreShadow.card,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: ExploreColors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  avatarText: { fontSize: 28, fontWeight: "800", color: ExploreColors.primary },
  name: { fontSize: 20, fontWeight: "800", color: ExploreColors.text },
  email: { fontSize: 13, color: ExploreColors.textSecondary, marginTop: 4 },
  stats: {
    flexDirection: "row",
    backgroundColor: ExploreColors.surface,
    marginHorizontal: Layout.pad,
    borderRadius: Layout.radius,
    ...ExploreShadow.card,
  },
  stat: { flex: 1, alignItems: "center", paddingVertical: 16 },
  statBorder: { borderRightWidth: 1, borderRightColor: ExploreColors.borderLight },
  statN: { fontSize: 20, fontWeight: "800", color: ExploreColors.primary },
  statL: { fontSize: 12, color: ExploreColors.textSecondary, marginTop: 2 },
  vendorBanner: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: Layout.pad,
    marginTop: Layout.gap,
    padding: 14,
    borderRadius: Layout.radius,
    gap: 12,
    ...ExploreShadow.card,
  },
  vendorBannerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  vendorBannerBody: { flex: 1 },
  vendorBannerTitle: { fontSize: 15, fontWeight: "700", color: ExploreColors.text },
  vendorBannerSub: { fontSize: 12, color: ExploreColors.textSecondary, marginTop: 2 },
  vendorBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: ExploreColors.surface,
  },
  vendorBadgeText: { fontSize: 11, fontWeight: "800" },
  menuBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  menuBadgeText: { fontSize: 11, fontWeight: "700" },
  menuCard: {
    backgroundColor: ExploreColors.surface,
    marginHorizontal: Layout.pad,
    marginTop: Layout.gap,
    borderRadius: Layout.radius,
    overflow: "hidden",
    ...ExploreShadow.card,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Layout.pad,
    paddingVertical: 14,
    gap: 12,
  },
  menuRowDivider: {
    borderTopWidth: 1,
    borderTopColor: ExploreColors.borderLight,
  },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: "600", color: ExploreColors.text },
  logout: {
    marginHorizontal: Layout.pad,
    marginTop: 20,
    backgroundColor: ExploreColors.error,
    paddingVertical: 14,
    borderRadius: Layout.radiusSm,
    alignItems: "center",
  },
  logoutText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});