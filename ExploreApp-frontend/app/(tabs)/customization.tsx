import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { AppScreen } from "../../components/explore/AppScreen";
import { useAppInsets } from "../../hooks/use-app-insets";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { apiUrl } from "../../constants/api";

const { width } = Dimensions.get("window");

type CustomTour = {
  _id: string;
  title: string;
  image: string;
  duration: string;
  people: string;
  rating: number;
  location: string;
  price: number;
};

export default function CustomizeTour() {
  const { scrollBottomPad, footerBottomPad } = useAppInsets();
  const [tours, setTours] = useState<CustomTour[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedTour, setSelectedTour] = useState<CustomTour | null>(null);

  const [flight, setFlight] = useState("Economy");
  const [food, setFood] = useState("Veg");
  const [car, setCar] = useState("Sedan");

  const fetchTours = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(apiUrl("/api/tours"));
      const data = await response.json();
      if (data.success) {
        setTours(data.tours || []);
      }
    } catch (error) {
      console.log("Error fetching tours:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTours();
  }, [fetchTours]);

  const totalPrice = useMemo(() => {
    if (!selectedTour) return 0;
    let total = Number(selectedTour.price || 0);
    if (flight === "Business") total += 20000;
    if (food === "Non-Veg") total += 2000;
    if (car === "SUV") total += 5000;
    if (car === "Luxury") total += 12000;
    return total;
  }, [selectedTour, flight, food, car]);

  const filteredData = tours.filter((item) =>
    item.title.toLowerCase().includes(search.toLowerCase())
  );

  const renderTourItem = ({ item }: { item: CustomTour }) => (
    <TouchableOpacity 
      style={styles.tourCard} 
      activeOpacity={0.9}
      onPress={() => setSelectedTour(item)}
    >
      <Image source={{ uri: item.image }} style={styles.tourThumb} />
      <View style={styles.tourInfo}>
        <Text style={styles.tourTitle} numberOfLines={1}>{item.title}</Text>
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={14} color="#64748B" />
          <Text style={styles.tourLoc}>{item.location}</Text>
        </View>
        <View style={styles.tourMeta}>
          <Text style={styles.tourPrice}>₹{item.price}</Text>
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={12} color="#F59E0B" />
            <Text style={styles.ratingText}>{item.rating || 4.5}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <AppScreen variant="tab" style={styles.safe}>
      <View style={styles.container}>
        {/* HEADER */}
        <View style={styles.topHeader}>
          {selectedTour ? (
            <TouchableOpacity onPress={() => setSelectedTour(null)} style={styles.iconBtn}>
              <Ionicons name="arrow-back" size={24} color="#0F172A" />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 40 }} />
          )}
          <Text style={styles.mainTitle}>{selectedTour ? "Customize Trip" : "Build Your Trip"}</Text>
          <View style={{ width: 40 }} />
        </View>

        {!selectedTour ? (
          <View style={{ flex: 1 }}>
            <View style={styles.searchContainer}>
              <Ionicons name="search-outline" size={20} color="#94A3B8" />
              <TextInput
                placeholder="Search for a destination..."
                value={search}
                onChangeText={setSearch}
                style={styles.searchBar}
              />
            </View>
            <FlatList
              data={filteredData}
              keyExtractor={(item) => item._id}
              renderItem={renderTourItem}
              contentContainerStyle={{ paddingBottom: scrollBottomPad }}
              ListEmptyComponent={
                loading ? (
                  <ActivityIndicator size="large" color="#1E3A8A" style={{ marginTop: 100 }} />
                ) : (
                  <View style={styles.emptyWrap}>
                    <Ionicons name="map-outline" size={60} color="#CBD5E1" />
                    <Text style={styles.emptyText}>No tours found</Text>
                  </View>
                )
              }
            />
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: scrollBottomPad + 80 }}>
              <Image source={{ uri: selectedTour.image }} style={styles.heroImage} />
              
              <View style={styles.detailsContent}>
                <Text style={styles.detailTitle}>{selectedTour.title}</Text>
                <Text style={styles.detailDesc}>
                  Tailor your journey to perfection. Select your preferred travel class, dining, and local transport options.
                </Text>

                {/* INCLUSIONS */}
                <Text style={styles.sectionHeading}>Standard Inclusions</Text>
                <View style={styles.inclusionGrid}>
                  <Inclusion icon="bed-outline" label="Luxury Stay" />
                  <Inclusion icon="cafe-outline" label="Breakfast" />
                  <Inclusion icon="shield-checkmark-outline" label="Insurance" />
                  <Inclusion icon="headset-outline" label="24/7 Support" />
                </View>

                {/* OPTIONS */}
                <OptionSection 
                  title="Travel Class" 
                  icon="airplane-outline"
                  options={[
                    { id: "Economy", label: "Economy", price: 0 },
                    { id: "Business", label: "Business", price: 20000 },
                  ]}
                  selected={flight}
                  onSelect={setFlight}
                />

                <OptionSection 
                  title="Dining Preference" 
                  icon="restaurant-outline"
                  options={[
                    { id: "Veg", label: "Veg Only", price: 0 },
                    { id: "Non-Veg", label: "Multi-Cuisine", price: 2000 },
                  ]}
                  selected={food}
                  onSelect={setFood}
                />

                <OptionSection 
                  title="Local Transport" 
                  icon="car-sport-outline"
                  options={[
                    { id: "Sedan", label: "Compact Sedan", price: 0 },
                    { id: "SUV", price: 5000, label: "Premium SUV" },
                    { id: "Luxury", price: 12000, label: "Luxury Sedan" },
                  ]}
                  selected={car}
                  onSelect={setCar}
                />
              </View>
            </ScrollView>

            {/* FLOATING FOOTER */}
            <View style={[styles.floatingFooter, { bottom: footerBottomPad }]}>
              <View>
                <Text style={styles.priceLabel}>Estimated Total</Text>
                <Text style={styles.finalPrice}>₹{totalPrice.toLocaleString()}</Text>
              </View>
              <TouchableOpacity 
                style={styles.confirmBtn}
                onPress={() => router.push({
                  pathname: "/BookNow",
                  params: {
                    packageId: selectedTour._id,
                    title: selectedTour.title,
                    image: selectedTour.image,
                    rating: String(selectedTour.rating || 0),
                    price: String(totalPrice),
                    locationName: selectedTour.location || "",
                  },
                })}
              >
                <Text style={styles.confirmText}>Confirm Plan</Text>
                <Ionicons name="chevron-forward" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </AppScreen>
  );
}

function Inclusion({ icon, label }: any) {
  return (
    <View style={styles.incItem}>
      <Ionicons name={icon} size={20} color="#1E3A8A" />
      <Text style={styles.incLabel}>{label}</Text>
    </View>
  );
}

function OptionSection({ title, icon, options, selected, onSelect }: any) {
  return (
    <View style={styles.optionSection}>
      <View style={styles.sectionHeader}>
        <Ionicons name={icon} size={20} color="#1E3A8A" />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.optionGrid}>
        {options.map((opt: any) => (
          <TouchableOpacity
            key={opt.id}
            onPress={() => onSelect(opt.id)}
            style={[styles.optCard, selected === opt.id && styles.optSelected]}
          >
            <View style={styles.optTop}>
              <Text style={[styles.optLabel, selected === opt.id && styles.optTextSelected]}>{opt.label}</Text>
              {selected === opt.id && <Ionicons name="checkmark-circle" size={18} color="#1E3A8A" />}
            </View>
            {opt.price > 0 && <Text style={styles.optPrice}>+ ₹{opt.price.toLocaleString()}</Text>}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8FAFC" },
  container: { flex: 1 },
  
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#fff",
  },
  iconBtn: { padding: 5 },
  mainTitle: { fontSize: 20, fontWeight: "800", color: "#0F172A", flex: 1, textAlign: "center" },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    margin: 20,
    paddingHorizontal: 15,
    borderRadius: 15,
    height: 54,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  searchBar: { flex: 1, marginLeft: 10, fontSize: 15, color: "#0F172A" },

  tourCard: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 20,
    flexDirection: "row",
    padding: 12,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  tourThumb: { width: 90, height: 90, borderRadius: 15 },
  tourInfo: { flex: 1, marginLeft: 15, justifyContent: "space-between" },
  tourTitle: { fontSize: 16, fontWeight: "700", color: "#0F172A" },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  tourLoc: { fontSize: 12, color: "#64748B" },
  tourMeta: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  tourPrice: { fontSize: 16, fontWeight: "800", color: "#1E3A8A" },
  ratingBadge: { flexDirection: "row", alignItems: "center", backgroundColor: "#FEF3C7", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, gap: 3 },
  ratingText: { fontSize: 11, fontWeight: "700", color: "#B45309" },

  emptyWrap: { alignItems: "center", marginTop: 100 },
  emptyText: { marginTop: 15, color: "#94A3B8", fontSize: 16 },

  heroImage: { width: "100%", height: 260 },
  detailsContent: { padding: 20, borderTopLeftRadius: 30, borderTopRightRadius: 30, backgroundColor: "#F8FAFC", marginTop: -30 },
  detailTitle: { fontSize: 24, fontWeight: "800", color: "#0F172A", marginBottom: 10 },
  detailDesc: { fontSize: 14, color: "#64748B", lineHeight: 22, marginBottom: 25 },

  sectionHeading: { fontSize: 16, fontWeight: "700", color: "#0F172A", marginBottom: 15 },
  inclusionGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 30 },
  incItem: { backgroundColor: "#fff", paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, flexDirection: "row", alignItems: "center", gap: 8, elevation: 1 },
  incLabel: { fontSize: 12, color: "#475569", fontWeight: "600" },

  optionSection: { marginBottom: 25 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#1E3A8A" },
  optionGrid: { flexDirection: "row", gap: 12 },
  optCard: { flex: 1, backgroundColor: "#fff", padding: 12, borderRadius: 15, elevation: 1, borderWidth: 1, borderColor: "transparent" },
  optSelected: { borderColor: "#1E3A8A", backgroundColor: "#EFF6FF" },
  optTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  optLabel: { fontSize: 13, fontWeight: "700", color: "#475569" },
  optTextSelected: { color: "#1E3A8A" },
  optPrice: { fontSize: 11, color: "#64748B" },

  floatingFooter: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: "#fff",
    height: 90,
    borderRadius: 25,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 25,
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 15,
  },
  priceLabel: { fontSize: 12, color: "#64748B", fontWeight: "600" },
  finalPrice: { fontSize: 24, fontWeight: "800", color: "#0F172A" },
  confirmBtn: { backgroundColor: "#1E3A8A", paddingHorizontal: 20, paddingVertical: 14, borderRadius: 15, flexDirection: "row", alignItems: "center", gap: 8 },
  confirmText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
