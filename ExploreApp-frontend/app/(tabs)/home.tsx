import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Modal,
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
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect } from "expo-router";
import { apiJson, apiFetch } from "../../constants/api";
import {
  DEFAULT_HOTEL_IMAGE,
  DEFAULT_TOUR_IMAGE,
  ExploreColors,
  Layout,
} from "../../constants/exploreTheme";
import { CategoryScroller, type CategoryItem } from "../../components/explore/CategoryScroller";
import { DestinationCard, type DestinationItem } from "../../components/explore/DestinationCard";
import { ListingCard } from "../../components/explore/ListingCard";
import { SearchBar } from "../../components/explore/SearchBar";
import { SearchPill } from "../../components/explore/SearchPill";
import { SafeImage } from "../../components/explore/SafeImage";
import { SectionHeader } from "../../components/explore/SectionHeader";
import { type TourItem } from "../../components/explore/TourHorizontalCard";
import type { HotelItem } from "../../components/explore/HotelCard";

const STORAGE_KEYS = { userData: "userData", wishlistTours: "wishlistTours", token: "token" } as const;

type AppNotification = {
  _id: string;
  type: string;
  title: string;
  body: string;
  link?: string;
  read: boolean;
  createdAt: string;
};

const NOTIFICATION_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  vendor_submitted: "document-text-outline",
  vendor_approved: "checkmark-circle-outline",
  vendor_rejected: "close-circle-outline",
  vendor_password: "key-outline",
  booking_tour: "airplane-outline",
  booking_hotel: "bed-outline",
  listing_approved: "checkmark-done-outline",
  listing_rejected: "close-circle-outline",
  general: "notifications-outline",
};

function timeAgo(value: string) {
  const diff = Date.now() - new Date(value).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

const CATEGORIES: CategoryItem[] = [
  { id: "All", label: "All", icon: "compass-outline" },
  { id: "Beach", label: "Beach", icon: "sunny-outline" },
  { id: "Mountain", label: "Mountains", icon: "trail-sign-outline" },
  { id: "City", label: "Cities", icon: "business-outline" },
  { id: "Adventure", label: "Adventure", icon: "bicycle-outline" },
  { id: "Culture", label: "Culture", icon: "color-palette-outline" },
];

const DESTINATIONS: DestinationItem[] = [
  {
    id: "goa",
    name: "Goa",
    tagline: "Beaches & nightlife",
    image: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=600&q=80&auto=format",
  },
  {
    id: "manali",
    name: "Manali",
    tagline: "Snow peaks & valleys",
    image: "https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=600&q=80&auto=format",
  },
  {
    id: "jaipur",
    name: "Jaipur",
    tagline: "Royal heritage",
    image: "https://images.unsplash.com/photo-1477587458883-47145ed94245?w=600&q=80&auto=format",
  },
  {
    id: "kerala",
    name: "Kerala",
    tagline: "Backwaters & greens",
    image: "https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=600&q=80&auto=format",
  },
  {
    id: "ladakh",
    name: "Ladakh",
    tagline: "High-altitude escape",
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80&auto=format",
  },
  {
    id: "udaipur",
    name: "Udaipur",
    tagline: "City of lakes",
    image: "https://images.unsplash.com/photo-1599669454699-248893623440?w=600&q=80&auto=format",
  },
];

const INSPIRATION = [
  {
    title: "Weekend getaways",
    image: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&q=80&auto=format",
    route: "/(tabs)/tour" as const,
  },
  {
    title: "Unique stays",
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80&auto=format",
    route: "/(tabs)/hotels" as const,
  },
  {
    title: "Local events",
    image: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&q=80&auto=format",
    route: "/(tabs)/events" as const,
  },
  {
    title: "Become a host",
    image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80&auto=format",
    route: "/becomeVendor" as const,
  },
];

function safeParse<T>(v: string | null, fb: T): T {
  if (!v) return fb;
  try {
    return JSON.parse(v) as T;
  } catch {
    return fb;
  }
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function tourParams(item: TourItem, imageUri: string, title: string) {
  return {
    packageId: item.packageId || item._id,
    tourId: item._id,
    title,
    image: imageUri,
    rating: String(item.rating ?? 4),
    locationName: item.location || "",
    price: String(item.price || ""),
    duration: item.duration || "",
    people: item.people || "",
    latitude: String(item.latitude || ""),
    longitude: String(item.longitude || ""),
  };
}

export default function HomeScreen() {
  const { scrollBottomPad, headerTopPad } = useAppInsets();
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [tours, setTours] = useState<TourItem[]>([]);
  const [hotels, setHotels] = useState<HotelItem[]>([]);
  const [userName, setUserName] = useState("Explorer");
  const [wishlist, setWishlist] = useState<TourItem[]>([]);
  const [loadingTours, setLoadingTours] = useState(true);
  const [loadingHotels, setLoadingHotels] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const fetched = useRef(false);
  const searchAnim = useRef(new Animated.Value(0)).current;
  const notifyAnim = useRef(new Animated.Value(0)).current;

  const wishlistIds = useMemo(() => new Set(wishlist.map((t) => t._id)), [wishlist]);

  const loadLocal = useCallback(async () => {
    const data = await AsyncStorage.multiGet([
      STORAGE_KEYS.userData,
      STORAGE_KEYS.wishlistTours,
      STORAGE_KEYS.token,
    ]);
    const map = Object.fromEntries(data);
    const user = safeParse<{ fullname?: string; name?: string } | null>(map[STORAGE_KEYS.userData], null);
    setUserName(user?.fullname || user?.name || "Explorer");
    setWishlist(safeParse<TourItem[]>(map[STORAGE_KEYS.wishlistTours], []));
    setToken(map[STORAGE_KEYS.token] || null);
  }, []);

  const fetchNotifications = useCallback(async (authToken?: string | null) => {
    const activeToken = authToken ?? token;
    if (!activeToken) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    try {
      setLoadingNotifications(true);
      const res = await apiFetch("/api/users/notifications", {
        headers: { Authorization: `Bearer ${activeToken}` },
      });
      const data = await res.json();
      if (res.ok && data?.success) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {
      // keep previous notifications on transient errors
    } finally {
      setLoadingNotifications(false);
    }
  }, [token]);

  const markNotificationRead = useCallback(
    async (id: string) => {
      if (!token) return;
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      try {
        await apiFetch(`/api/users/notifications/${id}/read`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {
        fetchNotifications();
      }
    },
    [token, fetchNotifications]
  );

  const markAllNotificationsRead = useCallback(async () => {
    if (!token) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    try {
      await apiFetch("/api/users/notifications/read-all", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      fetchNotifications();
    }
  }, [token, fetchNotifications]);

  const openNotification = useCallback(
    async (item: AppNotification) => {
      if (!item.read) await markNotificationRead(item._id);
      setNotificationsOpen(false);
      if (item.link) router.push(item.link as never);
    },
    [markNotificationRead]
  );

  const fetchTours = useCallback(async (q = "") => {
    setError("");
    try {
      setLoadingTours(true);
      const path = q ? `/api/tours?search=${encodeURIComponent(q)}` : "/api/tours";
      const data = await apiJson<{ tours?: TourItem[] }>(path);
      setTours(Array.isArray(data.tours) ? data.tours : []);
    } catch (err: any) {
      setTours([]);
      setError(err?.message || "Could not load tours");
    } finally {
      setLoadingTours(false);
    }
  }, []);

  const fetchHotels = useCallback(async () => {
    try {
      setLoadingHotels(true);
      const data = await apiJson<{ hotels?: HotelItem[] }>("/api/hotels");
      setHotels(Array.isArray(data.hotels) ? data.hotels : []);
    } catch {
      setHotels([]);
    } finally {
      setLoadingHotels(false);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    setRefreshing(true);
    const data = await AsyncStorage.multiGet([STORAGE_KEYS.token]);
    const map = Object.fromEntries(data);
    const activeToken = map[STORAGE_KEYS.token] || null;
    setToken(activeToken);
    await Promise.all([
      loadLocal(),
      fetchTours(search.trim()),
      fetchHotels(),
      fetchNotifications(activeToken),
    ]);
    setRefreshing(false);
  }, [loadLocal, fetchTours, fetchHotels, search, fetchNotifications]);

  useEffect(() => {
    loadLocal();
  }, [loadLocal]);

  useFocusEffect(
    useCallback(() => {
      if (!fetched.current) {
        fetched.current = true;
        fetchTours("");
        fetchHotels();
      }
      (async () => {
        await loadLocal();
        const storedToken = await AsyncStorage.getItem(STORAGE_KEYS.token);
        fetchNotifications(storedToken);
      })();
    }, [fetchTours, fetchHotels, loadLocal, fetchNotifications])
  );

  useEffect(() => {
    if (!search.trim()) return;
    const id = setTimeout(() => fetchTours(search.trim()), 400);
    return () => clearTimeout(id);
  }, [search, fetchTours]);

  useEffect(() => {
    Animated.spring(searchAnim, {
      toValue: searchOpen ? 1 : 0,
      useNativeDriver: true,
      friction: 8,
    }).start();
  }, [searchOpen, searchAnim]);

  useEffect(() => {
    Animated.spring(notifyAnim, {
      toValue: notificationsOpen ? 1 : 0,
      useNativeDriver: true,
      friction: 8,
    }).start();
  }, [notificationsOpen, notifyAnim]);

  const filteredTours = useMemo(() => {
    if (category === "All") return tours;
    return tours.filter((t) => (t.category || "").toLowerCase().includes(category.toLowerCase()));
  }, [category, tours]);

  const topTours = useMemo(() => filteredTours.slice(0, 8), [filteredTours]);
  const topHotels = useMemo(() => hotels.slice(0, 8), [hotels]);
  const wishlistPreview = useMemo(() => wishlist.slice(0, 6), [wishlist]);

  const toggleWishlist = useCallback(
    async (tour: TourItem) => {
      const next = wishlistIds.has(tour._id)
        ? wishlist.filter((t) => t._id !== tour._id)
        : [tour, ...wishlist];
      setWishlist(next);
      await AsyncStorage.setItem(STORAGE_KEYS.wishlistTours, JSON.stringify(next));
    },
    [wishlist, wishlistIds]
  );

  const openSearch = () => setSearchOpen(true);
  const closeSearch = () => setSearchOpen(false);

  const searchSubtitle = search.trim()
    ? search.trim()
    : category !== "All"
      ? `${category} · Any dates`
      : "Anywhere · Any week · Add guests";

  return (
    <AppScreen variant="tab" style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        style={styles.screen}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refreshAll} tintColor={ExploreColors.primary} />
        }
      >
        {/* Top bar */}
        <View style={styles.topBar}>
          <View style={styles.brandWrap}>
            <View style={styles.brandIcon}>
              <Ionicons name="compass" size={18} color={ExploreColors.primary} />
            </View>
            <View>
              <Text style={styles.brandName}>Explore</Text>
              <Text style={styles.greet}>
                {greeting()}, {userName.split(" ")[0]}
              </Text>
            </View>
          </View>
          <View style={styles.topActions}>
            <TouchableOpacity
              style={styles.iconBtn}
              activeOpacity={0.8}
              onPress={() => {
                setNotificationsOpen(true);
                fetchNotifications();
              }}
            >
              <Ionicons name="notifications-outline" size={20} color={ExploreColors.text} />
              {unreadCount > 0 ? (
                <View style={styles.bellBadge}>
                  <Text style={styles.bellBadgeText}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
                </View>
              ) : null}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconBtn}
              activeOpacity={0.8}
              onPress={() => router.push("/(tabs)/profile")}
            >
              <Ionicons name="person-circle-outline" size={22} color={ExploreColors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search pill */}
        <View style={styles.searchWrap}>
          <SearchPill
            onPress={openSearch}
            title="Where to?"
            subtitle={searchSubtitle}
          />
        </View>

        {/* Categories */}
        <View style={styles.categoryWrap}>
          <CategoryScroller items={CATEGORIES} active={category} onChange={setCategory} />
        </View>

        {/* Popular destinations */}
        <View style={styles.section}>
          <SectionHeader
            title="Popular destinations"
            subtitle="Trending places across India"
            actionLabel="Explore"
            onAction={() => router.push("/(tabs)/tour")}
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {DESTINATIONS.map((d, i) => (
              <DestinationCard
                key={d.id}
                item={d}
                isFirst={i === 0}
                onPress={() => {
                  setSearch(d.name);
                  setCategory("All");
                  fetchTours(d.name);
                }}
              />
            ))}
          </ScrollView>
        </View>

        {/* Stays */}
        <View style={styles.section}>
          <SectionHeader
            title="Stays guests love"
            subtitle="Handpicked hotels & homestays"
            actionLabel="See all"
            onAction={() => router.push("/(tabs)/hotels")}
          />
          {loadingHotels && hotels.length === 0 ? (
            <ActivityIndicator color={ExploreColors.primary} style={styles.loader} />
          ) : topHotels.length === 0 ? (
            <Text style={styles.empty}>No stays available yet</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {topHotels.map((h, i) => (
                <ListingCard
                  key={h._id}
                  id={h._id}
                  image={h.image || h.gallery?.[0] || DEFAULT_HOTEL_IMAGE}
                  title={h.title}
                  subtitle={`${h.city || h.location || "India"} · ${h.propertyType || "Stay"}`}
                  price={h.pricePerNight}
                  priceSuffix=" /night"
                  rating={h.rating}
                  badge={i === 0 ? "Guest favourite" : undefined}
                  isFirst={i === 0}
                  onPress={() => router.push({ pathname: "/hotelDetails", params: { hotelId: h._id } })}
                />
              ))}
            </ScrollView>
          )}
        </View>

        {/* Tours */}
        <View style={styles.section}>
          <SectionHeader
            title="Top-rated tours"
            subtitle="Curated trips for every traveller"
            actionLabel="See all"
            onAction={() => router.push("/(tabs)/tour")}
          />
          {loadingTours && tours.length === 0 ? (
            <ActivityIndicator color={ExploreColors.primary} style={styles.loader} />
          ) : topTours.length === 0 ? (
            <Text style={styles.empty}>No tours found</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {topTours.map((t, i) => {
                const imageUri = t.image || t.images?.[0] || t.gallery?.[0] || DEFAULT_TOUR_IMAGE;
                const title = t.title || t.name || "Tour";
                return (
                  <ListingCard
                    key={t._id}
                    id={t._id}
                    image={imageUri}
                    title={title}
                    subtitle={`${t.location || "India"} · ${t.duration || "Flexible"}`}
                    price={t.price || 15000}
                    rating={t.rating}
                    isWishlisted={wishlistIds.has(t._id)}
                    onToggleWishlist={() => toggleWishlist(t)}
                    isFirst={i === 0}
                    onPress={() =>
                      router.push({ pathname: "/tourDetails", params: tourParams(t, imageUri, title) })
                    }
                  />
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* Inspiration grid */}
        <View style={styles.section}>
          <SectionHeader title="Get inspired" subtitle="Discover something new" />
          <View style={styles.inspireGrid}>
            {INSPIRATION.map((item) => (
              <TouchableOpacity
                key={item.title}
                style={styles.inspireCard}
                activeOpacity={0.9}
                onPress={() => router.push(item.route as any)}
              >
                <SafeImage uri={item.image} fallback={DEFAULT_TOUR_IMAGE} style={styles.inspireImg} contentFit="cover" />
                <View style={styles.inspireOverlay} />
                <Text style={styles.inspireTitle}>{item.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Wishlist */}
        {wishlistPreview.length > 0 ? (
          <View style={styles.section}>
            <SectionHeader
              title="Your wishlist"
              subtitle={`${wishlist.length} saved ${wishlist.length === 1 ? "trip" : "trips"}`}
              actionLabel="View all"
              onAction={() => router.push("/(tabs)/tour")}
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {wishlistPreview.map((t, i) => {
                const imageUri = t.image || t.images?.[0] || t.gallery?.[0] || DEFAULT_TOUR_IMAGE;
                const title = t.title || t.name || "Tour";
                return (
                  <ListingCard
                    key={t._id}
                    id={t._id}
                    image={imageUri}
                    title={title}
                    subtitle={t.location || "India"}
                    price={t.price || 15000}
                    rating={t.rating}
                    isWishlisted
                    onToggleWishlist={() => toggleWishlist(t)}
                    isFirst={i === 0}
                    onPress={() =>
                      router.push({ pathname: "/tourDetails", params: tourParams(t, imageUri, title) })
                    }
                  />
                );
              })}
            </ScrollView>
          </View>
        ) : null}

        {/* Host CTA */}
        <TouchableOpacity
          style={styles.hostBanner}
          activeOpacity={0.9}
          onPress={() => router.push("/becomeVendor")}
        >
          <View style={styles.hostText}>
            <Text style={styles.hostTitle}>Earn by hosting on Explore</Text>
            <Text style={styles.hostSub}>
              List your property or tour — it's easy to start and you control your availability.
            </Text>
            <Text style={styles.hostLink}>Get started →</Text>
          </View>
          <View style={styles.hostIcon}>
            <Ionicons name="home" size={28} color={ExploreColors.primary} />
          </View>
        </TouchableOpacity>

        {error ? <Text style={styles.err}>{error}</Text> : null}
        <View style={{ height: scrollBottomPad }} />
      </ScrollView>

      {/* Notifications modal */}
      <Modal
        visible={notificationsOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setNotificationsOpen(false)}
      >
        <View style={[styles.modalBackdrop, { paddingTop: headerTopPad + 12 }]}>
          <Animated.View
            style={[
              styles.notifySheet,
              {
                transform: [
                  {
                    translateY: notifyAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [30, 0],
                    }),
                  },
                ],
                opacity: notifyAnim,
              },
            ]}
          >
            <View style={styles.modalHead}>
              <View>
                <Text style={styles.modalTitle}>Notifications</Text>
                {unreadCount > 0 ? (
                  <Text style={styles.modalHint}>{unreadCount} unread</Text>
                ) : null}
              </View>
              <View style={styles.notifyHeadActions}>
                {unreadCount > 0 ? (
                  <TouchableOpacity onPress={markAllNotificationsRead} hitSlop={8}>
                    <Text style={styles.markAllText}>Mark all read</Text>
                  </TouchableOpacity>
                ) : null}
                <TouchableOpacity onPress={() => setNotificationsOpen(false)} hitSlop={12}>
                  <Ionicons name="close" size={24} color={ExploreColors.text} />
                </TouchableOpacity>
              </View>
            </View>

            {!token ? (
              <View style={styles.notifyEmpty}>
                <Ionicons name="log-in-outline" size={36} color={ExploreColors.textMuted} />
                <Text style={styles.notifyEmptyTitle}>Sign in for updates</Text>
                <Text style={styles.notifyEmptySub}>
                  Login to see booking confirmations, partner application status, and more.
                </Text>
                <TouchableOpacity
                  style={styles.notifyLoginBtn}
                  onPress={() => {
                    setNotificationsOpen(false);
                    router.push("/(auth)/login");
                  }}
                >
                  <Text style={styles.notifyLoginBtnText}>Login</Text>
                </TouchableOpacity>
              </View>
            ) : loadingNotifications && notifications.length === 0 ? (
              <View style={styles.notifyLoader}>
                <ActivityIndicator color={ExploreColors.primary} />
              </View>
            ) : notifications.length === 0 ? (
              <View style={styles.notifyEmpty}>
                <Ionicons name="notifications-off-outline" size={36} color={ExploreColors.textMuted} />
                <Text style={styles.notifyEmptyTitle}>No notifications yet</Text>
                <Text style={styles.notifyEmptySub}>
                  Bookings, vendor updates, and admin replies will show up here.
                </Text>
              </View>
            ) : (
              <ScrollView style={styles.notifyList} showsVerticalScrollIndicator={false}>
                {notifications.map((item) => {
                  const icon = NOTIFICATION_ICONS[item.type] || "notifications-outline";
                  return (
                    <TouchableOpacity
                      key={item._id}
                      style={[styles.notifyItem, !item.read && styles.notifyItemUnread]}
                      activeOpacity={0.75}
                      onPress={() => openNotification(item)}
                    >
                      <View style={[styles.notifyIcon, !item.read && styles.notifyIconUnread]}>
                        <Ionicons name={icon} size={18} color={!item.read ? ExploreColors.primary : ExploreColors.textSecondary} />
                      </View>
                      <View style={styles.notifyBody}>
                        <View style={styles.notifyTitleRow}>
                          <Text style={[styles.notifyTitle, !item.read && styles.notifyTitleUnread]} numberOfLines={1}>
                            {item.title}
                          </Text>
                          <Text style={styles.notifyTime}>{timeAgo(item.createdAt)}</Text>
                        </View>
                        <Text style={styles.notifyText} numberOfLines={3}>
                          {item.body}
                        </Text>
                      </View>
                      {!item.read ? <View style={styles.unreadDot} /> : null}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </Animated.View>
        </View>
      </Modal>

      {/* Search modal */}
      <Modal visible={searchOpen} animationType="fade" transparent onRequestClose={closeSearch}>
        <View style={[styles.modalBackdrop, { paddingTop: headerTopPad + 12 }]}>
          <Animated.View
            style={[
              styles.modalSheet,
              {
                transform: [
                  {
                    translateY: searchAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [40, 0],
                    }),
                  },
                ],
                opacity: searchAnim,
              },
            ]}
          >
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>Search trips</Text>
              <TouchableOpacity onPress={closeSearch} hitSlop={12}>
                <Ionicons name="close" size={24} color={ExploreColors.text} />
              </TouchableOpacity>
            </View>
            <SearchBar
              value={search}
              onChangeText={setSearch}
              placeholder="Search destinations, cities..."
            />
            <Text style={styles.modalHint}>Try Goa, Manali, Jaipur...</Text>
            <View style={styles.quickDest}>
              {DESTINATIONS.slice(0, 4).map((d) => (
                <TouchableOpacity
                  key={d.id}
                  style={styles.quickChip}
                  onPress={() => {
                    setSearch(d.name);
                    closeSearch();
                  }}
                >
                  <Text style={styles.quickChipText}>{d.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.searchBtn} onPress={closeSearch}>
              <Ionicons name="search" size={18} color="#fff" />
              <Text style={styles.searchBtnText}>Search</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </AppScreen>
  );
}

const CARD_GAP = 10;
const INSPIRE_W = (Layout.screenWidth - Layout.pad * 2 - CARD_GAP) / 2;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: ExploreColors.surface },
  screen: { flex: 1, backgroundColor: ExploreColors.surface },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Layout.pad,
    paddingBottom: 4,
  },
  brandWrap: { flexDirection: "row", alignItems: "center", gap: 10 },
  brandIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: ExploreColors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  brandName: {
    fontSize: 18,
    fontWeight: "800",
    color: ExploreColors.text,
    letterSpacing: -0.3,
  },
  greet: { fontSize: 12, color: ExploreColors.textSecondary, marginTop: 1 },
  topActions: { flexDirection: "row", gap: 8 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: ExploreColors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: ExploreColors.surface,
    position: "relative",
  },
  bellBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: ExploreColors.error,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: ExploreColors.surface,
  },
  bellBadgeText: { color: "#fff", fontSize: 10, fontWeight: "800" },
  notifySheet: {
    backgroundColor: ExploreColors.surface,
    borderRadius: Layout.radius,
    padding: Layout.pad,
    maxHeight: "78%",
    gap: 12,
  },
  notifyHeadActions: { flexDirection: "row", alignItems: "center", gap: 12 },
  markAllText: { fontSize: 13, fontWeight: "700", color: ExploreColors.primary },
  notifyList: { maxHeight: 420 },
  notifyItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: ExploreColors.borderLight,
  },
  notifyItemUnread: { backgroundColor: ExploreColors.primarySoft, borderRadius: Layout.radiusSm },
  notifyIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: ExploreColors.borderLight,
    alignItems: "center",
    justifyContent: "center",
  },
  notifyIconUnread: { backgroundColor: "#DBEAFE" },
  notifyBody: { flex: 1 },
  notifyTitleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  notifyTitle: { flex: 1, fontSize: 14, fontWeight: "600", color: ExploreColors.text },
  notifyTitleUnread: { fontWeight: "800" },
  notifyTime: { fontSize: 11, color: ExploreColors.textMuted },
  notifyText: { fontSize: 13, color: ExploreColors.textSecondary, lineHeight: 19, marginTop: 4 },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: ExploreColors.primary,
    marginTop: 6,
  },
  notifyEmpty: { alignItems: "center", paddingVertical: 28, paddingHorizontal: 12, gap: 8 },
  notifyEmptyTitle: { fontSize: 16, fontWeight: "700", color: ExploreColors.text, marginTop: 4 },
  notifyEmptySub: { fontSize: 13, color: ExploreColors.textSecondary, textAlign: "center", lineHeight: 20 },
  notifyLoginBtn: {
    marginTop: 8,
    backgroundColor: ExploreColors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: Layout.radiusSm,
  },
  notifyLoginBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  notifyLoader: { paddingVertical: 40, alignItems: "center" },
  searchWrap: {
    paddingHorizontal: Layout.pad,
    paddingTop: 12,
    paddingBottom: 4,
  },
  categoryWrap: {
    marginTop: 16,
  },
  section: {
    marginTop: Layout.sectionGap,
  },
  loader: { height: Layout.listingImgH + 60, alignSelf: "center" },
  empty: {
    color: ExploreColors.textSecondary,
    textAlign: "center",
    paddingVertical: 32,
    paddingHorizontal: Layout.pad,
    fontSize: 14,
  },
  inspireGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: Layout.pad,
    gap: CARD_GAP,
  },
  inspireCard: {
    width: INSPIRE_W,
    height: INSPIRE_W * 0.72,
    borderRadius: Layout.radius,
    overflow: "hidden",
    backgroundColor: ExploreColors.borderLight,
  },
  inspireImg: { width: "100%", height: "100%" },
  inspireOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  inspireTitle: {
    position: "absolute",
    left: 12,
    bottom: 12,
    right: 12,
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  hostBanner: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: Layout.pad,
    marginTop: Layout.sectionGap,
    padding: Layout.pad,
    borderRadius: Layout.radius,
    backgroundColor: ExploreColors.primarySoft,
    borderWidth: 1,
    borderColor: ExploreColors.border,
    gap: 12,
  },
  hostText: { flex: 1 },
  hostTitle: { fontSize: 16, fontWeight: "700", color: ExploreColors.text },
  hostSub: { fontSize: 13, color: ExploreColors.textSecondary, marginTop: 4, lineHeight: 18 },
  hostLink: { fontSize: 14, fontWeight: "700", color: ExploreColors.primary, marginTop: 8 },
  hostIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: ExploreColors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  err: {
    color: ExploreColors.error,
    fontSize: 12,
    marginTop: 12,
    textAlign: "center",
    paddingHorizontal: Layout.pad,
  },
  footer: { height: 24 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-start",
    paddingHorizontal: Layout.pad,
  },
  modalSheet: {
    backgroundColor: ExploreColors.surface,
    borderRadius: Layout.radius,
    padding: Layout.pad,
    gap: 14,
  },
  modalHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalTitle: { fontSize: 20, fontWeight: "700", color: ExploreColors.text },
  modalHint: { fontSize: 13, color: ExploreColors.textMuted },
  quickDest: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  quickChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: ExploreColors.primarySoft,
    borderWidth: 1,
    borderColor: ExploreColors.border,
  },
  quickChipText: { fontSize: 13, fontWeight: "600", color: ExploreColors.primary },
  searchBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: ExploreColors.primary,
    paddingVertical: 14,
    borderRadius: Layout.radiusSm,
    marginTop: 4,
  },
  searchBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});