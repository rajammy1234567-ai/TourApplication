import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

type CustomTour = {
  id: string;
  title: string;
  image: string;
  duration: string;
  people: string;
  rating: number;
  location: string;
  price: string;
  basePrice: number;
};

const DATA: CustomTour[] = [
  {
    id: "1",
    title: "Northern Lights Experience in Norway",
    image: "https://images.unsplash.com/photo-1501785888041-af3ef285b470",
    duration: "2 Days",
    people: "12 People",
    rating: 4.9,
     location: "Norway",
    price: "$1200",
    basePrice: 1200,
  },
  {
    id: "2",
    title: "Dubai Desert Safari Adventure",
    image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee",
    duration: "1 Day",
    people: "20 People",
    rating: 4.7,
  location: "Dubai",
    price: "$300",
    basePrice: 300,
  },
  {
    id: "3",
    title: "Bali Beach Relax Tour",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
    duration: "5 Days",
    people: "10 People",
    rating: 4.8,
    location: "Bali, Indonesia",
    price: "$800",
    basePrice: 800,
  },
  {
    id: "4",
    title: "Manali Snow Adventure",
    image: "https://images.unsplash.com/photo-1519681393784-d120267933ba",
    duration: "3 Days",
    people: "8 People",
    rating: 4.6,
     location: "Manali, India",
    price: "$250",
    basePrice: 250,
  },
  {
    id: "5",
    title: "Thailand Island Trip",
    image: "https://images.unsplash.com/photo-1493558103817-58b2924bce98",
    duration: "4 Days",
    people: "15 People",
    rating: 4.9,
 location: "Thailand",
    price: "$600",
    basePrice: 600,
  },
];

export default function CustomizeTour() {
  const [search, setSearch] = useState("");
   const [selectedTour, setSelectedTour] = useState<CustomTour | null>(null);

  const [flight, setFlight] = useState("");
  const [food, setFood] = useState("");
  const [car, setCar] = useState("");

  const totalPrice = useMemo(() => {
    if (!selectedTour) return 0;

    let total = selectedTour.basePrice;

    if (flight === "Economy") total += 20000;
    if (flight === "Business") total += 40000;

    if (food === "Non-Veg") total += 2000;

    if (car === "SUV") total += 5000;
    if (car === "Luxury") total += 10000;

    return total;
  }, [selectedTour, flight, food, car]);

  const filteredData = DATA.filter((item) =>
    item.title.toLowerCase().includes(search.toLowerCase()),
  );

  const renderItem = ({ item }: { item: CustomTour }) => (
    <TouchableOpacity style={styles.card} onPress={() => setSelectedTour(item)}>
      <Image source={{ uri: item.image }} style={styles.image} />

      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.location}>{item.location}</Text>
        <Text style={styles.price}>₹ {item.basePrice}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* HEADER */}
        {selectedTour && (
          <View style={styles.header}>
            <TouchableOpacity onPress={() => setSelectedTour(null)}>
              <Ionicons name="arrow-back" size={24} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Customize</Text>
          </View>
        )}

        {!selectedTour && (
          <TextInput
            placeholder="Search Tours..."
            value={search}
            onChangeText={setSearch}
            style={styles.search}
          />
        )}

        {!selectedTour && (
          <FlatList
            data={filteredData}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
          />
        )}

        {selectedTour && (
          <>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ paddingBottom: 180 }}>
                <Image
                  source={{ uri: selectedTour.image }}
                  style={styles.bigImage}
                />

                <Text style={styles.heading}>{selectedTour.title}</Text>

                {/* DESCRIPTION */}
                <Text style={styles.description}>
                  Experience a premium holiday with luxury stays, guided tours,
                  and unforgettable memories. Perfect for couples, families, and
                  solo travelers.
                </Text>

                {/* SERVICES */}
                <Text style={styles.sectionTitle}>What&apos;s Included</Text>
                <View style={styles.serviceBox}>
                  <Text style={styles.serviceItem}>✔ 4-5 Star Hotel Stay</Text>
                  <Text style={styles.serviceItem}>✔ Daily Breakfast</Text>
                  <Text style={styles.serviceItem}>
                    ✔ Airport Pickup & Drop
                  </Text>
                  <Text style={styles.serviceItem}>✔ Guided Tours</Text>
                  <Text style={styles.serviceItem}>✔ 24/7 Support</Text>
                </View>

                {/* HIGHLIGHTS */}
                <Text style={styles.sectionTitle}>Highlights</Text>
                <View style={styles.highlightBox}>
                  <Text style={styles.highlightItem}>
                    🌍 Explore top attractions
                  </Text>
                  <Text style={styles.highlightItem}>
                    📸 Instagram-worthy spots
                  </Text>
                  <Text style={styles.highlightItem}>🚗 Private transport</Text>
                  <Text style={styles.highlightItem}>
                    🍽 Multi-cuisine dining
                  </Text>
                </View>

                {/* FLIGHT */}
                <Text style={styles.label}>Flight</Text>
                <View style={styles.row}>
                  {[
                    { name: "Economy", price: 20000 },
                    { name: "Business", price: 40000 },
                  ].map((item) => (
                    <TouchableOpacity
                      key={item.name}
                      style={[
                        styles.option,
                        flight === item.name && styles.selected,
                      ]}
                      onPress={() => setFlight(item.name)}
                    >
                      <Text>{item.name}</Text>
                      <Text style={styles.addon}>+ ₹{item.price}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* FOOD */}
                <Text style={styles.label}>Food</Text>
                <View style={styles.row}>
                  {["Veg", "Non-Veg"].map((item) => (
                    <TouchableOpacity
                      key={item}
                      style={[styles.option, food === item && styles.selected]}
                      onPress={() => setFood(item)}
                    >
                      <Text>{item}</Text>
                      {item === "Non-Veg" && (
                        <Text style={styles.addon}>+ ₹2000</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>

                {/* CAR */}
                <Text style={styles.label}>Car</Text>
                <View style={styles.row}>
                  {[
                    { name: "Sedan", price: 0 },
                    { name: "SUV", price: 5000 },
                    { name: "Luxury", price: 10000 },
                  ].map((item) => (
                    <TouchableOpacity
                      key={item.name}
                      style={[
                        styles.option,
                        car === item.name && styles.selected,
                      ]}
                      onPress={() => setCar(item.name)}
                    >
                      <Text>{item.name}</Text>
                      {item.price > 0 && (
                        <Text style={styles.addon}>+ ₹{item.price}</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            {/* FOOTER */}
            <View style={styles.footer}>
              <View>
                <Text style={styles.base}>Base ₹ {selectedTour.basePrice}</Text>
                <Text style={styles.total}>₹ {totalPrice}</Text>
              </View>

              <TouchableOpacity style={styles.button}>
                <Text style={styles.buttonText}>Confirm Booking</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
      
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F4F6FA" },
  container: { flex: 1, padding: 16 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },

  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
  },

  search: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 14,
    marginBottom: 12,
    elevation: 2,
  },

  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 10,
    marginBottom: 12,
    elevation: 3,
  },

  image: {
    width: 90,
    height: 90,
    borderRadius: 12,
    marginRight: 10,
  },

  title: { fontWeight: "700", fontSize: 14 },
  location: { color: "#777", marginTop: 4 },

  price: {
    marginTop: 6,
    fontWeight: "700",
    color: "#2F5AF3",
  },

  bigImage: {
    width: "100%",
    height: 200,
    borderRadius: 16,
    marginBottom: 10,
  },

  heading: {
    fontSize: 18,
    fontWeight: "700",
  },

  description: {
    marginTop: 8,
    color: "#555",
    lineHeight: 20,
  },

  sectionTitle: {
    marginTop: 18,
    marginBottom: 8,
    fontSize: 15,
    fontWeight: "700",
  },

  serviceBox: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 14,
    elevation: 2,
  },

  serviceItem: {
    marginBottom: 6,
    color: "#333",
  },

  highlightBox: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 14,
    elevation: 2,
  },

  highlightItem: {
    marginBottom: 6,
  },

  label: {
    marginTop: 15,
    marginBottom: 6,
    fontWeight: "600",
  },

  row: {
    flexDirection: "row",
    gap: 10,
  },

  option: {
    padding: 12,
    backgroundColor: "#eee",
    borderRadius: 12,
    flex: 1,
  },

  selected: {
    backgroundColor: "#DDE4FF",
  },

  addon: {
    fontSize: 12,
    color: "#2F5AF3",
    marginTop: 4,
  },

  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 10,
  },

  base: { fontSize: 12, color: "#777" },

  total:{
    fontSize: 18,
    fontWeight: "700",
  },

  button: {
    backgroundColor: "#2F5AF3",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },

  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
});
