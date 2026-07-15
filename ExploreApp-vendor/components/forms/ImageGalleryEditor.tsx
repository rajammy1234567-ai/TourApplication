import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Radius } from "../../constants/theme";
import { MAX_GALLERY_IMAGES } from "../../constants/listingOptions";
import { uploadImage } from "../../lib/uploadImage";

const FALLBACK =
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=400&q=80&auto=format";

type Props = {
  coverImage: string;
  gallery: string[];
  onCoverChange: (url: string) => void;
  onGalleryChange: (urls: string[]) => void;
};

export function ImageGalleryEditor({
  coverImage,
  gallery,
  onCoverChange,
  onGalleryChange,
}: Props) {
  const [urlInput, setUrlInput] = useState("");
  const [uploading, setUploading] = useState(false);

  const totalImages = (coverImage ? 1 : 0) + gallery.length;

  const pickAndUpload = async (forCover: boolean) => {
    if (totalImages >= MAX_GALLERY_IMAGES + 1) {
      Alert.alert("Limit reached", `You can add up to ${MAX_GALLERY_IMAGES + 1} photos.`);
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Allow photo access to upload images.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: forCover,
      allowsMultipleSelection: !forCover,
      aspect: forCover ? [16, 9] : undefined,
      quality: 0.85,
    });

    if (result.canceled || !result.assets[0]?.uri) return;

    setUploading(true);
    try {
      if (forCover) {
        const asset = result.assets[0];
        const url = await uploadImage(asset.uri, asset.mimeType);
        onCoverChange(url);
      } else {
        const remainingSlots = MAX_GALLERY_IMAGES - gallery.length;
        const assetsToUpload = result.assets.slice(0, remainingSlots);
        
        const uploadedUrls = [];
        for (const asset of assetsToUpload) {
          const url = await uploadImage(asset.uri, asset.mimeType);
          uploadedUrls.push(url);
        }
        onGalleryChange([...gallery, ...uploadedUrls]);
      }
    } catch (err: any) {
      Alert.alert("Upload failed", err.message || "Could not upload image(s)");
    } finally {
      setUploading(false);
    }
  };

  const addUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    if (!/^https?:\/\//i.test(trimmed)) {
      Alert.alert("Invalid URL", "Image link must start with http:// or https://");
      return;
    }
    if (totalImages >= MAX_GALLERY_IMAGES + 1) {
      Alert.alert("Limit reached", `You can add up to ${MAX_GALLERY_IMAGES + 1} photos.`);
      return;
    }
    if (!coverImage) {
      onCoverChange(trimmed);
    } else {
      onGalleryChange([...gallery, trimmed]);
    }
    setUrlInput("");
  };

  const removeGallery = (index: number) => {
    onGalleryChange(gallery.filter((_, i) => i !== index));
  };

  return (
    <View>
      <Text style={styles.label}>Cover Photo</Text>
      <TouchableOpacity
        style={styles.coverWrap}
        onPress={() => pickAndUpload(true)}
        activeOpacity={0.9}
        disabled={uploading}
      >
        <Image
          source={{ uri: coverImage || FALLBACK }}
          style={styles.coverImage}
          contentFit="cover"
        />
        <View style={styles.coverOverlay}>
          {uploading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <>
              <Ionicons name="camera-outline" size={22} color={Colors.white} />
              <Text style={styles.coverOverlayText}>
                {coverImage ? "Change cover" : "Add cover photo"}
              </Text>
            </>
          )}
        </View>
      </TouchableOpacity>

      <Text style={[styles.label, { marginTop: 16 }]}>Gallery ({gallery.length}/{MAX_GALLERY_IMAGES})</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.galleryRow}>
        <TouchableOpacity
          style={styles.addThumb}
          onPress={() => pickAndUpload(false)}
          disabled={uploading || gallery.length >= MAX_GALLERY_IMAGES}
        >
          <Ionicons name="add" size={28} color={Colors.primary} />
          <Text style={styles.addThumbText}>Upload</Text>
        </TouchableOpacity>
        {gallery.map((uri, index) => (
          <View key={`${uri}-${index}`} style={styles.thumbWrap}>
            <Image source={{ uri }} style={styles.thumb} contentFit="cover" />
            <TouchableOpacity style={styles.removeBtn} onPress={() => removeGallery(index)}>
              <Ionicons name="close" size={14} color={Colors.white} />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      <Text style={styles.orText}>or paste image URL</Text>
      <View style={styles.urlRow}>
        <TextInput
          style={styles.urlInput}
          value={urlInput}
          onChangeText={setUrlInput}
          placeholder="https://example.com/photo.jpg"
          placeholderTextColor={Colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity style={styles.urlAddBtn} onPress={addUrl}>
          <Text style={styles.urlAddText}>Add</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 12, fontWeight: "600", color: Colors.textSecondary, marginBottom: 8 },
  coverWrap: {
    height: 180,
    borderRadius: Radius.md,
    overflow: "hidden",
    backgroundColor: Colors.primarySoft,
  },
  coverImage: { width: "100%", height: "100%" },
  coverOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  coverOverlayText: { color: Colors.white, fontWeight: "600", fontSize: 13 },
  galleryRow: { gap: 10, paddingVertical: 4 },
  addThumb: {
    width: 88,
    height: 88,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primarySoft,
  },
  addThumbText: { fontSize: 11, fontWeight: "600", color: Colors.primary, marginTop: 2 },
  thumbWrap: { position: "relative" },
  thumb: { width: 88, height: 88, borderRadius: Radius.md, backgroundColor: Colors.primarySoft },
  removeBtn: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  orText: { fontSize: 11, color: Colors.textMuted, marginTop: 12, marginBottom: 8 },
  urlRow: { flexDirection: "row", gap: 8 },
  urlInput: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.text,
  },
  urlAddBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  urlAddText: { color: Colors.white, fontWeight: "700", fontSize: 14 },
});