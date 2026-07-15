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
  Linking,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { AppScreen } from "../../components/explore/AppScreen";
import { useAppInsets } from "../../hooks/use-app-insets";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiFetch } from "../../constants/api";
import { ExploreColors, ExploreShadow, Layout } from "../../constants/exploreTheme";
import Constants from "expo-constants";

const KEYS = { token: "token", userData: "userData", wishlistTours: "wishlistTours" };
const APP_VERSION =
  Constants.expoConfig?.version || Constants.nativeAppVersion || "1.0.0";

type UserData = {
  fullname?: string;
  name?: string;
  email?: string;
  phone?: string;
  avatar?: string;
};

type VendorApplication = {
  status: "pending" | "approved" | "rejected";
  businessName?: string;
};

const VENDOR_STATUS = {
  pending: {
    label: "Under Review",
    color: "#D97706",
    bg: "#FEF3C7",
    icon: "time-outline" as const,
  },
  approved: {
    label: "Approved",
    color: "#16A34A",
    bg: "#DCFCE7",
    icon: "checkmark-circle-outline" as const,
  },
  rejected: {
    label: "Rejected",
    color: "#DC2626",
    bg: "#FEE2E2",
    icon: "close-circle-outline" as const,
  },
};

const ABOUT_POINTS = [
  {
    icon: "airplane-outline" as const,
    title: "Tours & packages",
    desc: "Curated trips from trusted local partners",
  },
  {
    icon: "bed-outline" as const,
    title: "Stays that fit",
    desc: "Hotels, villas & homestays across India",
  },
  {
    icon: "calendar-outline" as const,
    title: "Local events",
    desc: "Discover what’s happening near you",
  },
  {
    icon: "shield-checkmark-outline" as const,
    title: "Book with confidence",
    desc: "Secure bookings & partner-verified listings",
  },
];

function parse<T>(v: string | null, fb: T): T {
  if (!v) return fb;
  try {
    return JSON.parse(v) as T;
  } catch {
    return fb;
  }
}

export default function ProfileScreen() {
  const { scrollBottomPad, headerTopPad } = useAppInsets();
  const router = useRouter();
  const [notifications, setNotifications] = useState(true);
  const [user, setUser] = useState<UserData | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [bookings, setBookings] = useState(0);
  const [wishlist, setWishlist] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [vendorApp, setVendorApp] = useState<VendorApplication | null>(null);
  const [aboutOpen, setAboutOpen] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await AsyncStorage.multiGet([
        KEYS.token,
        KEYS.userData,
        KEYS.wishlistTours,
      ]);
      const map = Object.fromEntries(data);
      const cachedUser = parse<UserData | null>(map[KEYS.userData], null);
      setUser(cachedUser);
      setWishlist(parse<unknown[]>(map[KEYS.wishlistTours], []).length);
      const authToken = map[KEYS.token];
      setToken(authToken);

      if (authToken) {
        try {
          const [profileRes, bookingsRes, vendorRes] = await Promise.all([
            apiFetch("/api/users/profile", {
              headers: { Authorization: `Bearer ${authToken}` },
              timeoutMs: 20000,
            }),
            apiFetch("/api/bookings/my-bookings", {
              headers: { Authorization: `Bearer ${authToken}` },
              timeoutMs: 20000,
            }),
            apiFetch("/api/vendor/application", {
              headers: { Authorization: `Bearer ${authToken}` },
              timeoutMs: 20000,
            }),
          ]);

          const profileJson = await profileRes.json();
          if (profileRes.ok && profileJson?.success && profileJson.user) {
            const serverUser = profileJson.user;
            setUser(serverUser);
            await AsyncStorage.setItem(KEYS.userData, JSON.stringify(serverUser));
          }

          const bookingsJson = await bookingsRes.json();
          setBookings(
            bookingsRes.ok && bookingsJson?.success
              ? bookingsJson.bookings?.length || 0
              : 0
          );

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

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const name = useMemo(
    () => user?.fullname || user?.name || (token ? "Traveller" : "Guest"),
    [user, token]
  );
  const contact = useMemo(
    () => user?.email || user?.phone || "Not signed in",
    [user]
  );
  const initial = name.charAt(0).toUpperCase();
  const isSignedIn = Boolean(token);

  const logout = () => {
    Alert.alert("Sign out", "Leave VizTravel on this device?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.multiRemove([
            KEYS.token,
            KEYS.userData,
            KEYS.wishlistTours,
          ]);
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  const MenuRow = ({
    icon,
    label,
    subtitle,
    onPress,
    right,
    isFirst,
    danger,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    subtitle?: string;
    onPress?: () => void;
    right?: React.ReactNode;
    isFirst?: boolean;
    danger?: boolean;
  }) => (
    <TouchableOpacity
      style={[styles.menuRow, !isFirst && styles.menuRowDivider]}
      onPress={onPress}
      disabled={!onPress && !right}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.menuIconWrap,
          danger && { backgroundColor: "#FEE2E2" },
        ]}
      >
        <Ionicons
          name={icon}
          size={18}
          color={danger ? ExploreColors.error : ExploreColors.primary}
        />
      </View>
      <View style={styles.menuTextCol}>
        <Text style={[styles.menuLabel, danger && { color: ExploreColors.error }]}>
          {label}
        </Text>
        {subtitle ? <Text style={styles.menuSub}>{subtitle}</Text> : null}
      </View>
      {right ?? (
        onPress ? (
          <Ionicons name="chevron-forward" size={18} color={ExploreColors.textMuted} />
        ) : null
      )}
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
        contentContainerStyle={{ paddingBottom: scrollBottomPad + 8 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            tintColor={ExploreColors.primary}
          />
        }
      >
        {/* Hero */}
        <LinearGradient
          colors={["#003D82", "#0A5BB5", "#1A7AD9"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.hero, { paddingTop: headerTopPad + 8 }]}
        >
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.brandMark}>VizTravel</Text>
              <Text style={styles.heroHint}>Your travel companion</Text>
            </View>
            <TouchableOpacity
              style={styles.heroBell}
              onPress={() => router.push("/(tabs)/home")}
              activeOpacity={0.85}
            >
              <Ionicons name="compass-outline" size={22} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.heroProfile}>
            <View style={styles.avatarRing}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initial}</Text>
              </View>
            </View>
            <View style={styles.heroInfo}>
              <Text style={styles.name} numberOfLines={1}>
                {name}
              </Text>
              <Text style={styles.email} numberOfLines={1}>
                {contact}
              </Text>
              {!isSignedIn ? (
                <TouchableOpacity
                  style={styles.signInChip}
                  onPress={() => router.push("/(auth)/login")}
                >
                  <Text style={styles.signInChipText}>Sign in to sync trips</Text>
                  <Ionicons name="arrow-forward" size={14} color="#003D82" />
                </TouchableOpacity>
              ) : (
                <View style={styles.memberChip}>
                  <Ionicons name="checkmark-circle" size={14} color="#86EFAC" />
                  <Text style={styles.memberChipText}>VizTravel member</Text>
                </View>
              )}
            </View>
          </View>
        </LinearGradient>

        {/* Stats */}
        <View style={styles.statsCard}>
          <TouchableOpacity
            style={styles.stat}
            onPress={() => router.push("/myBookings")}
            activeOpacity={0.8}
          >
            <Text style={styles.statN}>{bookings}</Text>
            <Text style={styles.statL}>Bookings</Text>
          </TouchableOpacity>
          <View style={styles.statDivider} />
          <TouchableOpacity
            style={styles.stat}
            onPress={() => router.push("/wishlist")}
            activeOpacity={0.8}
          >
            <Text style={styles.statN}>{wishlist}</Text>
            <Text style={styles.statL}>Wishlist</Text>
          </TouchableOpacity>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statN}>{isSignedIn ? "Pro" : "—"}</Text>
            <Text style={styles.statL}>Status</Text>
          </View>
        </View>

        {/* Partner banner */}
        {vendorApp ? (
          <TouchableOpacity
            style={[
              styles.vendorBanner,
              { backgroundColor: VENDOR_STATUS[vendorApp.status].bg },
            ]}
            activeOpacity={0.85}
            onPress={() => router.push("/becomeVendor")}
          >
            <View
              style={[
                styles.vendorBannerIcon,
                { backgroundColor: VENDOR_STATUS[vendorApp.status].color },
              ]}
            >
              <Ionicons
                name={VENDOR_STATUS[vendorApp.status].icon}
                size={22}
                color="#fff"
              />
            </View>
            <View style={styles.vendorBannerBody}>
              <Text style={styles.vendorBannerTitle}>Partner application</Text>
              <Text style={styles.vendorBannerSub} numberOfLines={2}>
                {vendorApp.status === "approved"
                  ? `${vendorApp.businessName || "Your business"} · Login ready`
                  : `${vendorApp.businessName || "Your business"} · Tap for status`}
              </Text>
            </View>
            <View
              style={[
                styles.vendorBadge,
                { borderColor: VENDOR_STATUS[vendorApp.status].color },
              ]}
            >
              <Text
                style={[
                  styles.vendorBadgeText,
                  { color: VENDOR_STATUS[vendorApp.status].color },
                ]}
              >
                {VENDOR_STATUS[vendorApp.status].label}
              </Text>
            </View>
          </TouchableOpacity>
        ) : null}

        {/* Account */}
        <Text style={styles.sectionLabel}>Account</Text>
        <View style={styles.menuCard}>
          <MenuRow
            isFirst
            icon="briefcase-outline"
            label="My Bookings"
            subtitle="Trips & stays you’ve booked"
            onPress={() => router.push("/myBookings")}
          />
          <MenuRow
            icon="heart-outline"
            label="Wishlist"
            subtitle="Saved tours & ideas"
            onPress={() => router.push("/wishlist")}
          />
          <MenuRow
            icon="storefront-outline"
            label={vendorApp ? "Partner Application" : "Become a Partner"}
            subtitle={
              vendorApp
                ? "View application & credentials"
                : "List hotels, tours & experiences"
            }
            onPress={() => router.push("/becomeVendor")}
            right={
              vendorApp ? (
                <View
                  style={[
                    styles.menuBadge,
                    { backgroundColor: VENDOR_STATUS[vendorApp.status].bg },
                  ]}
                >
                  <Text
                    style={[
                      styles.menuBadgeText,
                      { color: VENDOR_STATUS[vendorApp.status].color },
                    ]}
                  >
                    {VENDOR_STATUS[vendorApp.status].label}
                  </Text>
                </View>
              ) : undefined
            }
          />
          <View style={[styles.menuRow, styles.menuRowDivider]}>
            <View style={styles.menuIconWrap}>
              <Ionicons
                name="notifications-outline"
                size={18}
                color={ExploreColors.primary}
              />
            </View>
            <View style={styles.menuTextCol}>
              <Text style={styles.menuLabel}>Push notifications</Text>
              <Text style={styles.menuSub}>Booking updates & offers</Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: "#CBD5E1", true: ExploreColors.primary }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Support */}
        <Text style={styles.sectionLabel}>Support</Text>
        <View style={styles.menuCard}>
          <MenuRow
            isFirst
            icon="help-circle-outline"
            label="Help Centre"
            subtitle="FAQs & support"
            onPress={() => router.push("/help")}
          />
          <MenuRow
            icon="mail-outline"
            label="Contact us"
            subtitle="support@viztravel.app"
            onPress={() => Linking.openURL("mailto:support@viztravel.app")}
          />
          <MenuRow
            icon="document-text-outline"
            label="Terms & Privacy"
            subtitle="How we handle your data"
            onPress={() =>
              Alert.alert(
                "VizTravel",
                "We only use your details to manage bookings and improve your experience. Partner listings are verified by our admin team before going live."
              )
            }
          />
        </View>

        {/* About VizTravel */}
        <Text style={styles.sectionLabel}>About VizTravel</Text>
        <View style={styles.aboutCard}>
          <TouchableOpacity
            style={styles.aboutHeader}
            onPress={() => setAboutOpen((v) => !v)}
            activeOpacity={0.85}
          >
            <View style={styles.aboutLogo}>
              <Ionicons name="compass" size={22} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.aboutTitle}>VizTravel</Text>
              <Text style={styles.aboutTagline}>
                Discover. Book. Explore India.
              </Text>
            </View>
            <Ionicons
              name={aboutOpen ? "chevron-up" : "chevron-down"}
              size={20}
              color={ExploreColors.textMuted}
            />
          </TouchableOpacity>

          {aboutOpen ? (
            <View style={styles.aboutBody}>
              <Text style={styles.aboutPara}>
                VizTravel is your all-in-one travel app for tours, hotel stays and
                local events. We connect you with verified partners so every trip
                feels planned, personal and easy to book.
              </Text>

              {ABOUT_POINTS.map((item) => (
                <View key={item.title} style={styles.aboutPoint}>
                  <View style={styles.aboutPointIcon}>
                    <Ionicons
                      name={item.icon}
                      size={16}
                      color={ExploreColors.primary}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.aboutPointTitle}>{item.title}</Text>
                    <Text style={styles.aboutPointDesc}>{item.desc}</Text>
                  </View>
                </View>
              ))}

              <View style={styles.aboutMeta}>
                <Text style={styles.aboutMetaText}>Version {APP_VERSION}</Text>
                <Text style={styles.aboutMetaDot}>·</Text>
                <Text style={styles.aboutMetaText}>
                  {Platform.OS === "ios" ? "iOS" : "Android"}
                </Text>
              </View>
            </View>
          ) : null}
        </View>

        {/* Auth actions */}
        {isSignedIn ? (
          <TouchableOpacity style={styles.logout} onPress={logout} activeOpacity={0.85}>
            <Ionicons name="log-out-outline" size={18} color="#fff" />
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.authRow}>
            <TouchableOpacity
              style={styles.loginBtn}
              onPress={() => router.push("/(auth)/login")}
              activeOpacity={0.85}
            >
              <Text style={styles.loginBtnText}>Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.signupBtn}
              onPress={() => router.push("/(auth)/signUp")}
              activeOpacity={0.85}
            >
              <Text style={styles.signupBtnText}>Create Account</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.footerBrand}>Made for travellers · VizTravel</Text>
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: ExploreColors.background },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  hero: {
    paddingHorizontal: Layout.pad,
    paddingBottom: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 22,
  },
  brandMark: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
  heroHint: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 12,
    marginTop: 2,
    fontWeight: "500",
  },
  heroBell: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroProfile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  avatarRing: {
    padding: 3,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.45)",
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 28,
    fontWeight: "900",
    color: ExploreColors.primary,
  },
  heroInfo: { flex: 1 },
  name: {
    fontSize: 22,
    fontWeight: "900",
    color: "#fff",
  },
  email: {
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
    marginTop: 3,
  },
  signInChip: {
    marginTop: 10,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  signInChipText: {
    color: "#003D82",
    fontWeight: "800",
    fontSize: 12,
  },
  memberChip: {
    marginTop: 10,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  memberChipText: {
    color: "#E0F2FE",
    fontSize: 12,
    fontWeight: "700",
  },

  statsCard: {
    flexDirection: "row",
    backgroundColor: ExploreColors.surface,
    marginHorizontal: Layout.pad,
    marginTop: -18,
    borderRadius: 16,
    paddingVertical: 6,
    ...ExploreShadow.card,
  },
  stat: { flex: 1, alignItems: "center", paddingVertical: 14 },
  statDivider: {
    width: 1,
    backgroundColor: ExploreColors.borderLight,
    marginVertical: 12,
  },
  statN: { fontSize: 20, fontWeight: "900", color: ExploreColors.primary },
  statL: {
    fontSize: 11,
    color: ExploreColors.textSecondary,
    marginTop: 2,
    fontWeight: "600",
  },

  vendorBanner: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: Layout.pad,
    marginTop: 14,
    padding: 14,
    borderRadius: 16,
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
  vendorBannerTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: ExploreColors.text,
  },
  vendorBannerSub: {
    fontSize: 12,
    color: ExploreColors.textSecondary,
    marginTop: 2,
  },
  vendorBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: ExploreColors.surface,
  },
  vendorBadgeText: { fontSize: 11, fontWeight: "800" },

  sectionLabel: {
    marginTop: 22,
    marginBottom: 8,
    marginHorizontal: Layout.pad + 4,
    fontSize: 12,
    fontWeight: "800",
    color: ExploreColors.textMuted,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },

  menuCard: {
    backgroundColor: ExploreColors.surface,
    marginHorizontal: Layout.pad,
    borderRadius: 16,
    overflow: "hidden",
    ...ExploreShadow.card,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 12,
  },
  menuRowDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: ExploreColors.borderLight,
  },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: ExploreColors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  menuTextCol: { flex: 1 },
  menuLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: ExploreColors.text,
  },
  menuSub: {
    fontSize: 12,
    color: ExploreColors.textSecondary,
    marginTop: 2,
  },
  menuBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  menuBadgeText: { fontSize: 11, fontWeight: "700" },

  aboutCard: {
    backgroundColor: ExploreColors.surface,
    marginHorizontal: Layout.pad,
    borderRadius: 16,
    overflow: "hidden",
    ...ExploreShadow.card,
  },
  aboutHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
  },
  aboutLogo: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: ExploreColors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  aboutTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: ExploreColors.text,
  },
  aboutTagline: {
    fontSize: 12,
    color: ExploreColors.textSecondary,
    marginTop: 2,
    fontWeight: "500",
  },
  aboutBody: {
    paddingHorizontal: 14,
    paddingBottom: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: ExploreColors.borderLight,
  },
  aboutPara: {
    marginTop: 12,
    fontSize: 13,
    lineHeight: 20,
    color: ExploreColors.textSecondary,
  },
  aboutPoint: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
    alignItems: "flex-start",
  },
  aboutPointIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: ExploreColors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  aboutPointTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: ExploreColors.text,
  },
  aboutPointDesc: {
    fontSize: 12,
    color: ExploreColors.textSecondary,
    marginTop: 1,
  },
  aboutMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 16,
  },
  aboutMetaText: {
    fontSize: 11,
    color: ExploreColors.textMuted,
    fontWeight: "600",
  },
  aboutMetaDot: { color: ExploreColors.textMuted },

  logout: {
    marginHorizontal: Layout.pad,
    marginTop: 22,
    backgroundColor: ExploreColors.error,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  logoutText: { color: "#fff", fontWeight: "800", fontSize: 15 },

  authRow: {
    flexDirection: "row",
    marginHorizontal: Layout.pad,
    marginTop: 20,
    gap: 10,
  },
  loginBtn: {
    flex: 1,
    backgroundColor: ExploreColors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  loginBtnText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  signupBtn: {
    flex: 1,
    backgroundColor: ExploreColors.surface,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: ExploreColors.primary,
  },
  signupBtnText: {
    color: ExploreColors.primary,
    fontWeight: "800",
    fontSize: 15,
  },

  footerBrand: {
    textAlign: "center",
    marginTop: 20,
    marginBottom: 8,
    fontSize: 12,
    color: ExploreColors.textMuted,
    fontWeight: "600",
  },
});
