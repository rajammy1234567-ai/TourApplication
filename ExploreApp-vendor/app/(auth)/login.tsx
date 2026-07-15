import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiFetch } from "../../constants/api";
import { Colors, Radius, Shadow, Spacing } from "../../constants/theme";

export default function VendorLogin() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSkip = async () => {
    Alert.alert(
      "Demo preview only",
      "Skip mode shows sample data. To add tours or stays, login with admin-approved vendor credentials (phone + password)."
    );
    await AsyncStorage.multiSet([
      ["vendorToken", "dev_skip"],
      [
        "vendorData",
        JSON.stringify({
          businessName: "Demo Travel Co.",
          ownerName: "Demo Vendor",
          phone: "9876543210",
          businessType: "both",
        }),
      ],
    ]);
    router.replace("/(tabs)/dashboard");
  };

  const handleLogin = async () => {
    if (!phone.trim() || !password) {
      Alert.alert("Error", "Phone and password are required");
      return;
    }

    setLoading(true);
    try {
      const response = await apiFetch("/api/vendor/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim(), password }),
        timeoutMs: 55000,
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || data.msg || "Login failed");
      }

      await AsyncStorage.multiSet([
        ["vendorToken", data.token],
        ["vendorData", JSON.stringify(data.vendor)],
      ]);

      router.replace("/(tabs)/dashboard");
    } catch (err: any) {
      Alert.alert("Login Failed", err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.hero}>
        <SafeAreaView edges={["top"]}>
          <View style={styles.heroContent}>
            <View style={styles.logoWrap}>
              <Ionicons name="storefront" size={32} color={Colors.primary} />
            </View>
            <Text style={styles.heroTitle}>VizTravel Vendor</Text>
            <Text style={styles.heroSub}>Manage tours, stays & bookings</Text>
          </View>
        </SafeAreaView>
        <View style={styles.decor1} />
        <View style={styles.decor2} />
      </View>

      <SafeAreaView style={styles.sheetArea} edges={["bottom"]}>
        <KeyboardAvoidingView
          style={styles.sheet}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <Text style={styles.sheetTitle}>Welcome back</Text>
          <Text style={styles.sheetSub}>Sign in with your vendor credentials</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Phone number</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="call-outline" size={18} color={Colors.textMuted} />
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholder="Your login ID"
                placeholderTextColor={Colors.textMuted}
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed-outline" size={18} color={Colors.textMuted} />
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                placeholder="Admin provided password"
                placeholderTextColor={Colors.textMuted}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={8}>
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={Colors.textMuted}
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.loginBtn, loading && { opacity: 0.75 }]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.9}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.loginBtnText}>Sign In</Text>
            )}
          </TouchableOpacity>

          {__DEV__ && (
            <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
              <Text style={styles.skipText}>Skip for now</Text>
              <Ionicons name="arrow-forward" size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}

          <Text style={styles.hint}>
            Credentials are shared by admin after your vendor application is approved.
          </Text>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.primary },
  hero: {
    flex: 0.38,
    backgroundColor: Colors.primary,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  heroContent: { paddingHorizontal: Spacing.xl, paddingBottom: 48, zIndex: 2 },
  logoWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
    ...Shadow.md,
  },
  heroTitle: { fontSize: 30, fontWeight: "800", color: Colors.white },
  heroSub: { fontSize: 15, color: "rgba(255,255,255,0.8)", marginTop: 6 },
  decor1: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(255,255,255,0.06)",
    top: -40,
    right: -30,
  },
  decor2: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.04)",
    bottom: 20,
    left: -20,
  },
  sheetArea: { flex: 1, backgroundColor: Colors.background },
  sheet: {
    flex: 1,
    marginTop: -28,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    ...Shadow.md,
  },
  sheetTitle: { fontSize: 24, fontWeight: "800", color: Colors.text },
  sheetSub: { fontSize: 14, color: Colors.textSecondary, marginTop: 4, marginBottom: Spacing.lg },
  field: { marginBottom: Spacing.md },
  label: { fontSize: 13, fontWeight: "600", color: Colors.textSecondary, marginBottom: 8 },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 14 : 10,
  },
  input: { flex: 1, fontSize: 15, color: Colors.text },
  loginBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: Radius.md,
    alignItems: "center",
    marginTop: Spacing.sm,
    ...Shadow.sm,
  },
  loginBtnText: { color: Colors.white, fontWeight: "700", fontSize: 16 },
  skipBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
    marginTop: 4,
  },
  skipText: { color: Colors.textSecondary, fontWeight: "600", fontSize: 14 },
  hint: {
    textAlign: "center",
    color: Colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: Spacing.md,
    paddingHorizontal: 8,
  },
});