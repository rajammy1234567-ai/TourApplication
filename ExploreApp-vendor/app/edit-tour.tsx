import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { TourForm } from "../components/listing/TourForm";
import { Colors } from "../constants/theme";
import { fetchTourById } from "../lib/vendorApi";

export default function EditTourScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [initial, setInitial] = useState<any>(null);

  useEffect(() => {
    if (!id) {
      router.back();
      return;
    }

    fetchTourById(id)
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
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loaderText}>Loading tour...</Text>
      </View>
    );
  }

  if (!initial) return null;

  return <TourForm mode="edit" tourId={id} initial={initial} />;
}

const styles = StyleSheet.create({
  loader: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: Colors.background },
  loaderText: { marginTop: 12, color: Colors.textSecondary, fontSize: 14 },
});