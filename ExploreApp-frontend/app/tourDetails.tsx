import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Share,
} from "react-native";
import { Image } from "expo-image";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, router } from "expo-router";

import MapComponent from "../components/MapComponent";

const getParam = (value: string | string[] | undefined, fallback = "") =>
  Array.isArray(value) ? value[0] || fallback : value || fallback;

export default function TourDetails() {
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const [liked, setLiked] = useState(false);

  // 👇 NEW STATE FOR ITINERARY
  const [showAllItinerary, setShowAllItinerary] = useState(false);

  // ⭐ ADDED: share handler
  const onShare = async () => {
    try {
      await Share.share({
        message: `${tour.title} - ${tour.locationName} | Price: ${tour.price}`,
      });
    } catch (error) {
      console.log(error);
    }
  };

  const itineraryData = [
    {
      id: "1",
      title: "Arrival & Aurora Hunt",
      desc: "Arrive in Tromsø, settle into your cabin. Evening guided tour for Northern Lights.",
    },
    {
      id: "2",
      title: "Husky Safari & Departure",
      desc: "Morning husky sledding across snow. Afternoon transfer back to airport.",
    },
    {
      id: "3",
      title: "Snowmobile Adventure",
      desc: "Optional snowmobile ride through Arctic trails with expert guide.",
    },
  ];

  // ⭐ ADDED: Packages data (you can replace later)
  const packagesData = [
    {
      id: "p1",
      name: "Basic Package",
      desc: "Stay + Guide + Breakfast",
      price: "$199",
    },
    {
      id: "p2",
      name: "Standard Package",
      desc: "Stay + Guide + Meals + Transport",
      price: "$299",
    },
    {
      id: "p3",
      name: "Premium Package",
      desc: "Luxury Stay + All Inclusive + VIP Guide",
      price: "$499",
    },
  ];

  const getDynamicGallery = (title: string) => {
    const lowerTitle = (title || "").toLowerCase();
    
    const beachImages = [
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
      "https://images.unsplash.com/photo-1519046904884-53103b34b206",
      "https://images.unsplash.com/photo-1473119177891-7440fe9a00aa",
      "https://images.unsplash.com/photo-1506929662033-75393669402d",
    ];
    
    const mountainImages = [
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b",
      "https://images.unsplash.com/photo-1434394354979-a235cd36269d",
      "https://images.unsplash.com/photo-1454496522485-0a62b42a4f4c",
      "https://images.unsplash.com/photo-1486848538183-51076af7f0a7",
    ];

    const arcticImages = [
      "https://images.unsplash.com/photo-1531366930499-41f53c175731",
      "https://images.unsplash.com/photo-1483347756197-71ef80e95f73",
      "https://images.unsplash.com/photo-1579033461380-adb47c3eb938",
      "https://images.unsplash.com/photo-1502082553048-f009c37129b9",
    ];

    const generalImages = [
      "https://images.unsplash.com/photo-1533105079780-92b9be482077",
      "https://images.unsplash.com/photo-1517048676732-d65bc937f952",
      "https://images.unsplash.com/photo-1527631746610-bca00a040d60",
      "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9",
    ];

    if (lowerTitle.includes("beach") || lowerTitle.includes("ocean") || lowerTitle.includes("island")) return beachImages;
    if (lowerTitle.includes("mountain") || lowerTitle.includes("trek") || lowerTitle.includes("peak")) return mountainImages;
    if (lowerTitle.includes("aurora") || lowerTitle.includes("lights") || lowerTitle.includes("arctic") || lowerTitle.includes("norway")) return arcticImages;
    
    return generalImages;
  };

  const tour = useMemo(() => {
    let parsedGallery = null;
    try {
      if (params.gallery) {
        parsedGallery = typeof params.gallery === 'string' ? JSON.parse(params.gallery) : params.gallery;
      }
    } catch (e) {
      console.warn("Failed to parse gallery:", e);
      parsedGallery = null;
    }

    return {
      tourId: getParam(params.tourId, getParam(params.packageId)),
      packageId: getParam(params.packageId),
      title: getParam(params.title, "Tour Package"),
      image: getParam(params.image, "https://images.unsplash.com/photo-1501785888041-af3ef285b470"),
      rating: getParam(params.rating, "4.5"),
      reviews: getParam(params.reviews, "0"),
      duration: getParam(params.duration, "TBA"),
      people: getParam(params.people, "Contact for details"),
      language: "English",
      price: getParam(params.price, "15000"),
      locationName: getParam(params.locationName, "Location TBA"),
      latitude: parseFloat(getParam(params.latitude)) || 69.6492,
      longitude: parseFloat(getParam(params.longitude)) || 18.9553,
      gallery: Array.isArray(parsedGallery) ? parsedGallery : null,
    };
  }, [params]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

          {/* HERO IMAGE */}
          <View style={styles.imageWrap}>
            <Image source={{ uri: tour.image }} style={styles.image} contentFit="cover" transition={300} />

            <View style={styles.topRow}>
              <TouchableOpacity style={styles.circleBtn} onPress={() => router.back()}>
                <Ionicons name="chevron-back" size={20} />
              </TouchableOpacity>

              <View style={{ flexDirection: "row", gap: 10 }}>
                <TouchableOpacity style={styles.circleBtn} onPress={onShare}>
                  <Ionicons name="share-social-outline" size={18} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.circleBtn} onPress={() => setLiked(!liked)}>
                  <Ionicons
                    name={liked ? "heart" : "heart-outline"}
                    size={18}
                    color={liked ? "red" : "black"}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.thumbRow}>
              <Image source={{ uri: tour.image }} style={styles.thumb} contentFit="cover" transition={200} />
              <Image source={{ uri: tour.image }} style={styles.thumb} contentFit="cover" transition={200} />
              <View style={[styles.thumb, styles.more]}>
                <Text style={{ color: "#fff" }}>+5</Text>
              </View>
            </View>
          </View>

          {/* CONTENT */}
          <View style={styles.content}>

            <Text style={styles.title}>{tour.title}</Text>

            <View style={styles.ratingRow}>
              <Text style={styles.star}>⭐ {tour.rating}</Text>
              <Text style={styles.reviews}>{tour.reviews} Reviews</Text>
              <Text style={styles.location}>• {tour.locationName}</Text>
            </View>

            {/* INFO BOXES */}
            <View style={styles.infoRow}>
              <View style={styles.infoBox}>
                <Text style={styles.infoLabel}>Duration</Text>
                <Text style={styles.infoValue}>{tour.duration}</Text>
              </View>
              <View style={styles.infoBox}>
                <Text style={styles.infoLabel}>Group Size</Text>
                <Text style={styles.infoValue}>{tour.people}</Text>
              </View>
              <View style={styles.infoBox}>
                <Text style={styles.infoLabel}>Language</Text>
                <Text style={styles.infoValue}>{tour.language}</Text>
              </View>
            </View>

            {/* OVERVIEW */}
            <Text style={styles.section}>Overview</Text>
            <Text style={styles.desc}>
              Experience the magic of the Arctic in the heart of Northern Norway...
            </Text>

            {/* GALLERY SECTION */}
            <Text style={styles.section}>Traveller Experiences</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={styles.galleryScroll}
            >
              {(tour.gallery && tour.gallery.length > 0 ? tour.gallery : getDynamicGallery(tour.title)).map((img: string, index: number) => (
                <View key={index} style={styles.galleryItem}>
                  <Image source={{ uri: img }} style={styles.galleryImg} contentFit="cover" transition={200} />
                </View>
              ))}
            </ScrollView>

            {/* INCLUDED */}
            <Text style={styles.section}>What's Included</Text>
            <View style={styles.includeGrid}>
              <Text>✔ Accommodation</Text>
              <Text>✔ Expert Guide</Text>
              <Text>✔ Transport</Text>
              <Text>✔ Meals (Breakfast)</Text>
            </View>

            {/* ITINERARY */}
            <View style={styles.itineraryHeader}>
              <Text style={styles.section}>Itinerary</Text>
              <TouchableOpacity onPress={() => setShowAllItinerary(!showAllItinerary)}>
                <Text style={{ color: "#0F3B82", fontWeight: "600" }}>
                  {showAllItinerary ? "Show less" : "See all"}
                </Text>
              </TouchableOpacity>
            </View>

            {itineraryData.slice(0, showAllItinerary ? itineraryData.length : 2).map((item) => (
              <View key={item.id} style={styles.itineraryCard}>
                <View style={styles.circle}>
                  <Text style={{ color: "#fff", fontSize: 12 }}>{item.id}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.ititle}>{item.title}</Text>
                  <Text style={styles.idesc}>{item.desc}</Text>
                </View>
              </View>
            ))}

            {/* LOCATION */}
            <Text style={styles.section}>Location</Text>
            <Text style={{ marginBottom: 10 }}> {tour.locationName}</Text>

            <View style={styles.mapWrap}>
              <MapComponent latitude={tour.latitude} longitude={tour.longitude} />
            </View>

            {/* PACKAGES SECTION */}
            <Text style={styles.section}>Packages</Text>

            {packagesData.map((pkg) => (
              <TouchableOpacity key={pkg.id} style={styles.packageCard}>
                <View>
                  <Text style={styles.pkgTitle}>{pkg.name}</Text>
                  <Text style={styles.pkgDesc}>{pkg.desc}</Text>
                </View>
                <Text style={styles.pkgPrice}>{pkg.price}</Text>
              </TouchableOpacity>
            ))}

          </View>
        </ScrollView>

        {/* FOOTER */}
        <View style={[styles.footer, { paddingBottom: (insets?.bottom || 10) + 10 }]}>
          <View>
            <Text style={styles.total}>Total Price</Text>
            <Text style={styles.price}>₹{tour.price} <Text style={styles.per}>/person</Text></Text>
          </View>
          <TouchableOpacity
            style={styles.bookBtn}
            onPress={() =>{
              router.push({
                pathname: "/BookNow",
                params: {
                  packageId: tour.packageId, 
                  title: tour.title,
                  image: tour.image,
                  rating: tour.rating,
                  price: tour.price,
                  locationName: tour.locationName,
                },
              })}
            }
          >
            <Text style={{ color: "#fff", fontWeight: "bold" }}>Book Now</Text>
          </TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  container: { flex: 1 },

  imageWrap: { height: 300 },
  image: { width: "100%", height: "100%" },

  topRow: {
    position: "absolute",
    top: 20,
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  circleBtn: {
    backgroundColor: "#fff",
    padding: 8,
    borderRadius: 20,
  },

  thumbRow: {
    position: "absolute",
    bottom: -25,
    left: 16,
    flexDirection: "row",
    gap: 10,
  },

  thumb: {
    width: 60,
    height: 60,
    borderRadius: 15,
    borderWidth: 3,
    borderColor: "#fff",
  },

  more: {
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },

  content: { padding: 16, marginTop: 30 },

  title: { fontSize: 20, fontWeight: "bold" },

  ratingRow: {
    flexDirection: "row",
    marginTop: 6,
    alignItems: "center",
    gap: 6,
  },

  star: { color: "#f59e0b" },
  reviews: { color: "#6b7280" },
  location: { color: "#6b7280" },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },

  infoBox: {
    backgroundColor: "#f3f4f6",
    width: "30%",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
  },

  infoLabel: { fontSize: 12, color: "#6b7280" },
  infoValue: { fontWeight: "bold", marginTop: 4 },

  section: { fontSize: 16, fontWeight: "bold", marginTop: 20 },

  desc: { marginTop: 8, color: "#4b5563", lineHeight: 20 },

  includeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 10,
    gap: 8,
  },

  itineraryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
  },

  itineraryCard: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "#f9fafb",
    padding: 12,
    borderRadius: 12,
    marginTop: 10,
    alignItems: "flex-start",
  },

  circle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#0F3B82",
    justifyContent: "center",
    alignItems: "center",
  },

  ititle: { fontWeight: "bold" },
  idesc: { color: "#6b7280", fontSize: 12, marginTop: 2 },

  mapWrap: {
    height: 180,
    borderRadius: 15,
    overflow: "hidden",
    marginTop: 10,
    backgroundColor: "#f3f4f6",
  },
  
  packageCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#f3f4f6",
    padding: 14,
    borderRadius: 12,
    marginTop: 10,
    alignItems: "center",
  },

  pkgTitle: { fontWeight: "bold" },
  pkgDesc: { fontSize: 12, color: "#6b7280" },
  pkgPrice: { fontWeight: "bold", color: "#0F3B82" },

  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderColor: "#eee",
  },

  total: { color: "#6b7280", fontSize: 12 },
  price: { fontSize: 20, fontWeight: "bold" },
  per: { fontSize: 12, color: "#6b7280" },

  bookBtn: {
    backgroundColor: "#0F3B82",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },

  galleryScroll: {
    marginTop: 12,
    gap: 12,
    paddingRight: 20,
  },
  galleryItem: {
    width: 140,
    height: 140,
    borderRadius: 15,
    overflow: "hidden",
    backgroundColor: "#f3f4f6",
  },
  galleryImg: {
    width: "100%",
    height: "100%",
  },
});