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
import { HOTEL_AMENITIES, PROPERTY_TYPES } from "../../constants/listingOptions";
import { Colors, Radius, Shadow, Spacing } from "../../constants/theme";
import { createHotel, updateHotel } from "../../lib/vendorApi";

export type HotelFormInitial = {
  title?: string;
  description?: string;
  location?: string;
  city?: string;
  state?: string;
  propertyType?: string;
  pricePerNight?: number;
  bedrooms?: number;
  bathrooms?: number;
  maxGuests?: number;
  image?: string;
  gallery?: string[];
  amenities?: string[];
  checkInTime?: string;
  checkOutTime?: string;
};

type Props = {
  mode: "create" | "edit";
  hotelId?: string;
  initial?: HotelFormInitial;
};

export function HotelForm({ mode, hotelId, initial }: Props) {
  const [title, setTitle] = useState(initial?.title || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [location, setLocation] = useState(initial?.location || "");
  const [city, setCity] = useState(initial?.city || "");
  const [state, setState] = useState(initial?.state || "");
  const [propertyType, setPropertyType] = useState(initial?.propertyType || "hotel");
  const [pricePerNight, setPricePerNight] = useState(
    initial?.pricePerNight ? String(initial.pricePerNight) : ""
  );
  const [bedrooms, setBedrooms] = useState(String(initial?.bedrooms ?? 1));
  const [bathrooms, setBathrooms] = useState(String(initial?.bathrooms ?? 1));
  const [maxGuests, setMaxGuests] = useState(String(initial?.maxGuests ?? 2));
  const [checkInTime, setCheckInTime] = useState(initial?.checkInTime || "14:00");
  const [checkOutTime, setCheckOutTime] = useState(initial?.checkOutTime || "11:00");
  const [image, setImage] = useState(initial?.image || "");
  const [gallery, setGallery] = useState<string[]>(initial?.gallery || []);
  const [amenities, setAmenities] = useState<string[]>(initial?.amenities || []);
  const [submitting, setSubmitting] = useState(false);

  const toggleAmenity = (value: string) => {
    setAmenities((prev) =>
      prev.includes(value) ? prev.filter((a) => a !== value) : [...prev, value]
    );
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert("Missing info", "Property title is required.");
      return;
    }
    if (!city.trim()) {
      Alert.alert("Missing info", "City is required.");
      return;
    }
    if (!pricePerNight.trim() || Number(pricePerNight) <= 0) {
      Alert.alert("Missing info", "Enter a valid price per night.");
      return;
    }
    if (!description.trim()) {
      Alert.alert("Missing info", "Add a description for your property.");
      return;
    }

    const payload = {
      title: title.trim(),
      description: description.trim(),
      location: location.trim(),
      city: city.trim(),
      state: state.trim(),
      propertyType,
      pricePerNight: Number(pricePerNight),
      bedrooms: Number(bedrooms) || 1,
      bathrooms: Number(bathrooms) || 1,
      maxGuests: Number(maxGuests) || 2,
      checkInTime: checkInTime.trim(),
      checkOutTime: checkOutTime.trim(),
      image: image.trim(),
      gallery,
      amenities,
    };

    setSubmitting(true);
    try {
      if (mode === "edit" && hotelId) {
        await updateHotel(hotelId, payload);
        Alert.alert("Updated!", "Changes saved. Listing sent for admin re-approval.", [
          { text: "OK", onPress: () => router.back() },
        ]);
      } else {
        await createHotel(payload);
        Alert.alert("Submitted!", "Your stay is pending admin approval.", [
          { text: "OK", onPress: () => router.back() },
        ]);
      }
    } catch (err: any) {
      if (err.message?.includes("Session expired")) {
        router.replace("/(auth)/login");
        return;
      }
      Alert.alert("Error", err.message || "Could not save stay");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <FormScreenHeader
        title={mode === "edit" ? "Edit Stay" : "New Stay"}
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
          <FormSection title="Property Details" subtitle="Name, type & location" icon="home-outline">
            <FormField label="Property Title" value={title} onChangeText={setTitle} icon="text-outline" required />
            <Text style={styles.miniLabel}>Property Type</Text>
            <View style={styles.typeRow}>
              {PROPERTY_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[styles.typeChip, propertyType === type.value && styles.typeChipActive]}
                  onPress={() => setPropertyType(type.value)}
                >
                  <Text
                    style={[styles.typeText, propertyType === type.value && styles.typeTextActive]}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <FormField label="City" value={city} onChangeText={setCity} icon="business-outline" required />
            <FormField label="State" value={state} onChangeText={setState} icon="map-outline" />
            <FormField
              label="Address / Location"
              value={location}
              onChangeText={setLocation}
              icon="location-outline"
              hint="Street, area or landmark"
            />
            <FormField
              label="Price per Night (₹)"
              value={pricePerNight}
              onChangeText={setPricePerNight}
              icon="pricetag-outline"
              keyboardType="numeric"
              required
            />
          </FormSection>

          <FormSection title="Capacity & Timings" subtitle="Rooms, guests & check-in" icon="bed-outline">
            <View style={styles.row3}>
              <View style={{ flex: 1 }}>
                <FormField label="Bedrooms" value={bedrooms} onChangeText={setBedrooms} keyboardType="numeric" />
              </View>
              <View style={{ flex: 1 }}>
                <FormField label="Bathrooms" value={bathrooms} onChangeText={setBathrooms} keyboardType="numeric" />
              </View>
              <View style={{ flex: 1 }}>
                <FormField label="Max Guests" value={maxGuests} onChangeText={setMaxGuests} keyboardType="numeric" />
              </View>
            </View>
            <View style={styles.row2}>
              <View style={{ flex: 1 }}>
                <FormField
                  label="Check-in"
                  value={checkInTime}
                  onChangeText={setCheckInTime}
                  icon="log-in-outline"
                  placeholder="14:00"
                />
              </View>
              <View style={{ flex: 1 }}>
                <FormField
                  label="Check-out"
                  value={checkOutTime}
                  onChangeText={setCheckOutTime}
                  icon="log-out-outline"
                  placeholder="11:00"
                />
              </View>
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

          <FormSection title="Description" subtitle="Tell guests what makes your place special" icon="document-text-outline">
            <FormField
              label="About this property"
              value={description}
              onChangeText={setDescription}
              multiline
              required
              maxLength={2000}
              placeholder="Describe rooms, views, nearby attractions, house rules..."
            />
          </FormSection>

          <FormSection title="Amenities" subtitle="Facilities you offer" icon="sparkles-outline">
            <ChipSelector
              label="Select amenities"
              options={HOTEL_AMENITIES}
              selected={amenities}
              onToggle={toggleAmenity}
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
  miniLabel: { fontSize: 12, fontWeight: "600", color: Colors.textSecondary, marginBottom: 8 },
  typeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
  typeChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  typeChipActive: { backgroundColor: "#EDE9FE", borderColor: "#6D28D9" },
  typeText: { fontSize: 12, fontWeight: "500", color: Colors.textSecondary },
  typeTextActive: { color: "#6D28D9", fontWeight: "700" },
  row2: { flexDirection: "row", gap: 10 },
  row3: { flexDirection: "row", gap: 8 },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#6D28D9",
    paddingVertical: 16,
    borderRadius: Radius.md,
    marginTop: 4,
    ...Shadow.sm,
  },
  submitText: { color: Colors.white, fontWeight: "700", fontSize: 16 },
});