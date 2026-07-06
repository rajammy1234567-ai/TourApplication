import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChipSelector } from "../forms/ChipSelector";
import { FormField } from "../forms/FormField";
import { FormScreenHeader } from "../forms/FormScreenHeader";
import { FormSection } from "../forms/FormSection";
import { ImageGalleryEditor } from "../forms/ImageGalleryEditor";
import { TOUR_AMENITIES, TOUR_CATEGORIES } from "../../constants/listingOptions";
import { Colors, Radius, Shadow, Spacing } from "../../constants/theme";
import { createTour, updateTour } from "../../lib/vendorApi";

export type TourFormInitial = {
  title?: string;
  location?: string;
  duration?: string;
  people?: string;
  price?: number;
  description?: string;
  image?: string;
  gallery?: string[];
  category?: string;
  amenities?: string[];
};

type Props = {
  mode: "create" | "edit";
  tourId?: string;
  initial?: TourFormInitial;
};

export function TourForm({ mode, tourId, initial }: Props) {
  const [title, setTitle] = useState(initial?.title || "");
  const [location, setLocation] = useState(initial?.location || "");
  const [duration, setDuration] = useState(initial?.duration || "");
  const [people, setPeople] = useState(initial?.people || "");
  const [price, setPrice] = useState(initial?.price ? String(initial.price) : "");
  const [description, setDescription] = useState(initial?.description || "");
  const [image, setImage] = useState(initial?.image || "");
  const [gallery, setGallery] = useState<string[]>(initial?.gallery || []);
  const [category, setCategory] = useState(initial?.category || "Other");
  const [amenities, setAmenities] = useState<string[]>(initial?.amenities || []);
  const [submitting, setSubmitting] = useState(false);

  const toggleAmenity = (value: string) => {
    setAmenities((prev) =>
      prev.includes(value) ? prev.filter((a) => a !== value) : [...prev, value]
    );
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert("Missing info", "Package title is required.");
      return;
    }
    if (!price.trim() || Number(price) <= 0) {
      Alert.alert("Missing info", "Enter a valid price.");
      return;
    }
    if (!description.trim()) {
      Alert.alert("Missing info", "Add a description so travelers know what to expect.");
      return;
    }

    const payload = {
      title: title.trim(),
      location: location.trim(),
      duration: duration.trim(),
      people: people.trim(),
      price: Number(price),
      description: description.trim(),
      image: image.trim(),
      gallery,
      category,
      amenities,
    };

    setSubmitting(true);
    try {
      if (mode === "edit" && tourId) {
        await updateTour(tourId, payload);
        Alert.alert("Updated!", "Changes saved. Listing sent for admin re-approval.", [
          { text: "OK", onPress: () => router.back() },
        ]);
      } else {
        await createTour(payload);
        Alert.alert("Submitted!", "Your tour is pending admin approval.", [
          { text: "OK", onPress: () => router.back() },
        ]);
      }
    } catch (err: any) {
      if (err.message?.includes("Session expired")) {
        router.replace("/(auth)/login");
        return;
      }
      Alert.alert("Error", err.message || "Could not save tour");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <FormScreenHeader
        title={mode === "edit" ? "Edit Tour" : "New Tour"}
        subtitle={mode === "edit" ? "Update & resubmit for review" : "Submit for admin review"}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.form}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <FormSection
            title="Basic Info"
            subtitle="Name, location & pricing"
            icon="information-circle-outline"
          >
            <FormField label="Package Title" value={title} onChangeText={setTitle} icon="text-outline" required />
            <FormField label="Location" value={location} onChangeText={setLocation} icon="location-outline" required hint="City, region or landmark" />
            <View style={styles.row2}>
              <View style={{ flex: 1 }}>
                <FormField label="Duration" value={duration} onChangeText={setDuration} icon="time-outline" placeholder="e.g. 3 Days / 2 Nights" />
              </View>
              <View style={{ flex: 1 }}>
                <FormField label="Group Size" value={people} onChangeText={setPeople} icon="people-outline" placeholder="e.g. 2-8 people" />
              </View>
            </View>
            <FormField
              label="Price (₹)"
              value={price}
              onChangeText={setPrice}
              icon="pricetag-outline"
              keyboardType="numeric"
              required
            />
          </FormSection>

          <FormSection title="Category" subtitle="Helps travelers find your package" icon="compass-outline">
            <View style={styles.categoryRow}>
              {TOUR_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.categoryChip, category === cat && styles.categoryChipActive]}
                  onPress={() => setCategory(cat)}
                >
                  <Text style={[styles.categoryText, category === cat && styles.categoryTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </FormSection>

          <FormSection title="Photos" subtitle="Cover + gallery images" icon="images-outline">
            <ImageGalleryEditor
              coverImage={image}
              gallery={gallery}
              onCoverChange={setImage}
              onGalleryChange={setGallery}
            />
          </FormSection>

          <FormSection title="Description" subtitle="Highlights, inclusions & itinerary" icon="document-text-outline">
            <FormField
              label="About this tour"
              value={description}
              onChangeText={setDescription}
              multiline
              required
              maxLength={2000}
              placeholder="Describe the experience, what's included, best time to visit, pickup details..."
            />
          </FormSection>

          <FormSection title="Inclusions" subtitle="What travelers get" icon="checkmark-done-outline">
            <ChipSelector
              label="Amenities & inclusions"
              options={TOUR_AMENITIES}
              selected={amenities}
              onToggle={toggleAmenity}
              hint="Tap to select all that apply"
            />
          </FormSection>

          <TouchableOpacity
            style={[styles.submitBtn, submitting && { opacity: 0.75 }]}
            onPress={handleSubmit}
            disabled={submitting}
            activeOpacity={0.9}
          >
            {submitting ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <>
                <Ionicons name="paper-plane-outline" size={18} color={Colors.white} />
                <Text style={styles.submitText}>
                  {mode === "edit" ? "Save Changes" : "Submit for Approval"}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  form: { padding: Spacing.md, paddingBottom: 40 },
  row2: { flexDirection: "row", gap: 10 },
  categoryRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryChipActive: { backgroundColor: Colors.primarySoft, borderColor: Colors.primary },
  categoryText: { fontSize: 13, fontWeight: "500", color: Colors.textSecondary },
  categoryTextActive: { color: Colors.primary, fontWeight: "700" },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: Radius.md,
    marginTop: 4,
    ...Shadow.sm,
  },
  submitText: { color: Colors.white, fontWeight: "700", fontSize: 16 },
});