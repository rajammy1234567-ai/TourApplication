import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { HotelForm } from "../components/listing/HotelForm";
import { Colors } from "../constants/theme";
import { fetchHotelById } from "../lib/vendorApi";

export default function EditHotelScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [initial, setInitial] = useState<any>(null);

  useEffect(() => {
    if (!id) {
      router.back();
      return;
    }

    fetchHotelById(id)
      .then(setInitial)
      .catch((err) => {
        if (err.message?.includes("Session expired")) {
          router.replace("/(auth)/login");
          return;
        }
        router.back();
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#6D28D9" />
        <Text style={styles.loaderText}>Loading stay...</Text>
      </View>
    );
  }

  if (!initial) return null;

  return <HotelForm mode="edit" hotelId={id} initial={initial} />;
}

const styles = StyleSheet.create({
  loader: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: Colors.background },
  loaderText: { marginTop: 12, color: Colors.textSecondary, fontSize: 14 },
});