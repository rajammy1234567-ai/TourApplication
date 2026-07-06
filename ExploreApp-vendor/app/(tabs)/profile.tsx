import { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors, Radius, Shadow, Spacing, cardStyle } from "../../constants/theme";
import { useTabBarMetrics } from "../../lib/safeArea";

type Vendor = {
  businessName?: string;
  ownerName?: string;
  phone?: string;
  businessType?: string;
  email?: string;
};

const INFO_ROWS = [
  { key: "phone", icon: "call-outline" as const, label: "Login ID" },
  { key: "businessType", icon: "briefcase-outline" as const, label: "Business Type" },
  { key: "email", icon: "mail-outline" as const, label: "Email" },
];

export default function VendorProfileScreen() {
  const { contentBottomPad } = useTabBarMetrics();
  const [vendor, setVendor] = useState<Vendor | null>(null);

  useEffect(() => {
    AsyncStorage.getItem("vendorData").then((data) => {
      if (data) setVendor(JSON.parse(data));
    });
  }, []);

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.multiRemove(["vendorToken", "vendorData"]);
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  return (
    <View style={styles.root}>
      <View style={styles.hero}>
        <SafeAreaView edges={["top"]}>
          <Text style={styles.heroTitle}>Profile</Text>
        </SafeAreaView>
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <Ionicons name="storefront" size={36} color={Colors.primary} />
          </View>
          <Text style={styles.name}>{vendor?.businessName || "Vendor"}</Text>
          <Text style={styles.owner}>{vendor?.ownerName || "—"}</Text>
        </View>
        <View style={styles.heroDecor} />
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={[styles.bodyContent, { paddingBottom: contentBottomPad }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.infoCard, cardStyle]}>
          <Text style={styles.sectionTitle}>Account Details</Text>
          {INFO_ROWS.map((row, index) => {
            const value = vendor?.[row.key as keyof Vendor];
            if (!value) return null;
            return (
              <View
                key={row.key}
                style={[styles.infoRow, index > 0 && styles.infoRowBorder]}
              >
                <View style={styles.infoIcon}>
                  <Ionicons name={row.icon} size={18} color={Colors.primary} />
                </View>
                <View style={styles.infoText}>
                  <Text style={styles.infoLabel}>{row.label}</Text>
                  <Text style={styles.infoValue}>{String(value)}</Text>
                </View>
              </View>
            );
          })}
        </View>

        <View style={[styles.infoCard, cardStyle]}>
          <Text style={styles.sectionTitle}>Support</Text>
          <TouchableOpacity style={styles.menuRow} activeOpacity={0.7}>
            <View style={styles.infoIcon}>
              <Ionicons name="help-circle-outline" size={18} color={Colors.primary} />
            </View>
            <Text style={styles.menuText}>Help & Support</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.menuRow, styles.infoRowBorder]} activeOpacity={0.7}>
            <View style={styles.infoIcon}>
              <Ionicons name="document-text-outline" size={18} color={Colors.primary} />
            </View>
            <Text style={styles.menuText}>Terms & Policies</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
          <Ionicons name="log-out-outline" size={20} color={Colors.error} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  hero: {
    backgroundColor: Colors.primary,
    paddingBottom: 56,
    overflow: "hidden",
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.white,
    textAlign: "center",
    paddingVertical: Spacing.sm,
  },
  avatarWrap: { alignItems: "center", marginTop: Spacing.sm },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
    ...Shadow.md,
  },
  name: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.white,
    marginTop: 12,
  },
  owner: { fontSize: 14, color: "rgba(255,255,255,0.8)", marginTop: 2 },
  heroDecor: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(255,255,255,0.05)",
    left: -50,
    bottom: -40,
  },
  body: { flex: 1, marginTop: -32 },
  bodyContent: { paddingHorizontal: Spacing.md },
  infoCard: { padding: Spacing.md, marginBottom: 12 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.primary,
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
  },
  infoRowBorder: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  infoText: { flex: 1 },
  infoLabel: { fontSize: 11, color: Colors.textMuted, fontWeight: "600" },
  infoValue: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: "600",
    marginTop: 2,
    textTransform: "capitalize",
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
  },
  menuText: { flex: 1, fontSize: 14, color: Colors.text, fontWeight: "500" },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.errorSoft,
    paddingVertical: 14,
    borderRadius: Radius.md,
    marginTop: 8,
    ...Shadow.sm,
  },
  logoutText: { color: Colors.error, fontWeight: "700", fontSize: 15 },
});