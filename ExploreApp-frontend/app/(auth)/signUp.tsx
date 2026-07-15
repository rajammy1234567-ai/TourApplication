import React, { useEffect, useRef, useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
  ActivityIndicator,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { apiFetch, getApiBaseUrl } from "../../constants/api";

const { width } = Dimensions.get("window");

const STORAGE_KEYS = {
  token: "token",
  userData: "userData",
  wishlistTours: "wishlistTours",
} as const;

type RegisterResponse = {
  success?: boolean;
  token?: string;
  user?: {
    _id?: string;
    fullname?: string;
    name?: string;
    email?: string;
    phone?: string;
  };
  data?: {
    user?: RegisterResponse["user"];
    token?: string;
  };
  msg?: string;
  message?: string;
};

const normalizePhone = (value: string) => value.replace(/[\s\-()]/g, "").trim();

export default function SignupScreen() {
  const router = useRouter();

  const [tab, setTab] = useState<"email" | "phone">("email");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: tab === "email" ? 0 : 1,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [slideAnim, tab]);

  const validateForm = () => {
    if (!name.trim()) {
      Alert.alert("Validation", "Please enter your full name.");
      return false;
    }
    if (tab === "email") {
      const e = email.trim().toLowerCase();
      if (!e || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
        Alert.alert("Validation", "Please enter a valid email address.");
        return false;
      }
    } else {
      const p = normalizePhone(phone);
      if (p.length < 10) {
        Alert.alert("Validation", "Please enter a valid phone number (10+ digits).");
        return false;
      }
    }
    if (!password || !confirmPassword) {
      Alert.alert("Validation", "Please enter and confirm your password.");
      return false;
    }
    if (password.length < 6) {
      Alert.alert("Validation", "Password must be at least 6 characters.");
      return false;
    }
    if (password !== confirmPassword) {
      Alert.alert("Validation", "Passwords do not match.");
      return false;
    }
    return true;
  };

  const register = async () => {
    if (loading) return;
    if (!validateForm()) return;

    setLoading(true);
    try {
      const body: Record<string, string> = {
        fullname: name.trim(),
        password,
      };
      if (tab === "email") body.email = email.trim().toLowerCase();
      if (tab === "phone") body.phone = normalizePhone(phone);

      const res = await apiFetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        timeoutMs: 30000,
      });

      let data: RegisterResponse = {};
      try {
        data = (await res.json()) as RegisterResponse;
      } catch {
        throw new Error(`Server error (HTTP ${res.status})`);
      }

      if (!res.ok || data?.success === false) {
        Alert.alert(
          "Registration Failed",
          data?.msg || data?.message || "Please try again."
        );
        return;
      }

      const token = data?.token || data?.data?.token || "";
      const backendUser = data?.user || data?.data?.user;

      const normalizedUser = {
        _id: backendUser?._id || "",
        fullname:
          backendUser?.fullname?.trim() || backendUser?.name?.trim() || name.trim(),
        name:
          backendUser?.name?.trim() || backendUser?.fullname?.trim() || name.trim(),
        email: backendUser?.email || (tab === "email" ? email.trim().toLowerCase() : ""),
        phone: backendUser?.phone || (tab === "phone" ? normalizePhone(phone) : ""),
      };

      await AsyncStorage.multiSet([
        [STORAGE_KEYS.token, token],
        [STORAGE_KEYS.userData, JSON.stringify(normalizedUser)],
      ]);

      const existingWishlist = await AsyncStorage.getItem(STORAGE_KEYS.wishlistTours);
      if (!existingWishlist) {
        await AsyncStorage.setItem(STORAGE_KEYS.wishlistTours, JSON.stringify([]));
      }

      if (token) {
        router.replace("/(tabs)/home");
      } else {
        Alert.alert("Success", "Account created. Please sign in.");
        router.replace("/(auth)/login");
      }
    } catch (err: any) {
      Alert.alert(
        "Could not register",
        err?.message ||
          `Cannot reach server (${getApiBaseUrl()}). Check your internet and try again.`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={["#F0F7FF", "#E8F4FF", "#F5F5F5"]} style={styles.gradient}>
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.header}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <Ionicons name="chevron-back" size={28} color="#003D82" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.replace("/(tabs)/home")}>
                <Text style={styles.skipButton}>Skip</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.brandSection}>
              <Text style={styles.brandText}>Create Account</Text>
              <Text style={styles.brandSubText}>
                Join VizTravel and start planning your next adventure.
              </Text>
            </View>

            <View style={styles.toggleContainer}>
              <Animated.View
                style={[
                  styles.toggleButtonActive,
                  {
                    transform: [
                      {
                        translateX: slideAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, (width - 54) / 2],
                        }),
                      },
                    ],
                  },
                ]}
              />
              <TouchableOpacity style={styles.toggleButton} onPress={() => setTab("email")}>
                <Text
                  style={[
                    styles.toggleButtonText,
                    tab === "email" && styles.toggleButtonTextActive,
                  ]}
                >
                  Email
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.toggleButton} onPress={() => setTab("phone")}>
                <Text
                  style={[
                    styles.toggleButtonText,
                    tab === "phone" && styles.toggleButtonTextActive,
                  ]}
                >
                  Phone
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color="#9CA3AF" />
                <TextInput
                  style={styles.input}
                  placeholder="John Doe"
                  placeholderTextColor="#C9CDD3"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>
                {tab === "email" ? "Email Address" : "Phone Number"}
              </Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name={tab === "email" ? "mail-outline" : "call-outline"}
                  size={20}
                  color="#9CA3AF"
                />
                <TextInput
                  style={styles.input}
                  placeholder={tab === "email" ? "hello@example.com" : "+91 98765 43210"}
                  placeholderTextColor="#C9CDD3"
                  value={tab === "email" ? email : phone}
                  onChangeText={tab === "email" ? setEmail : setPhone}
                  keyboardType={tab === "email" ? "email-address" : "phone-pad"}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" />
                <TextInput
                  style={styles.input}
                  placeholder="Min. 6 characters"
                  placeholderTextColor="#C9CDD3"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword((p) => !p)}
                  style={styles.eyeButton}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name={showPassword ? "eye" : "eye-off"}
                    size={20}
                    color="#9CA3AF"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Confirm Password</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="shield-checkmark-outline" size={20} color="#9CA3AF" />
                <TextInput
                  style={styles.input}
                  placeholder="Re-enter password"
                  placeholderTextColor="#C9CDD3"
                  secureTextEntry={!showConfirm}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowConfirm((p) => !p)}
                  style={styles.eyeButton}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name={showConfirm ? "eye" : "eye-off"}
                    size={20}
                    color="#9CA3AF"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
              onPress={register}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>Create Account</Text>
              )}
            </TouchableOpacity>

            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.replace("/(auth)/login")}>
                <Text style={styles.footerLink}>Sign in</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safeArea: { flex: 1 },
  container: { flex: 1, backgroundColor: "transparent" },
  content: { paddingBottom: 36 },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 28,
  },
  backButton: { width: 40, height: 40, justifyContent: "center" },
  skipButton: { color: "#0077A8", fontSize: 17, fontWeight: "600" },

  brandSection: {
    paddingHorizontal: 22,
    marginBottom: 28,
  },
  brandText: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "900",
    color: "#06458A",
  },
  brandSubText: {
    marginTop: 8,
    color: "#374151",
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 320,
  },

  toggleContainer: {
    flexDirection: "row",
    marginHorizontal: 22,
    marginBottom: 26,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 5,
    position: "relative",
    overflow: "hidden",
    height: 56,
  },
  toggleButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    zIndex: 2,
  },
  toggleButtonActive: {
    position: "absolute",
    width: (width - 54) / 2,
    height: 46,
    backgroundColor: "#E8F0F7",
    borderRadius: 12,
    top: 5,
    left: 5,
    zIndex: 1,
  },
  toggleButtonText: {
    fontSize: 15,
    color: "#9B9B9B",
    fontWeight: "700",
  },
  toggleButtonTextActive: { color: "#06458A" },

  inputSection: {
    marginHorizontal: 22,
    marginBottom: 18,
  },
  inputLabel: {
    fontSize: 12,
    color: "#6E6E6E",
    fontWeight: "700",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  inputContainer: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: "#E8EEF5",
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#111827",
    minHeight: 44,
    paddingVertical: 10,
  },
  eyeButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },

  primaryButton: {
    height: 56,
    marginHorizontal: 22,
    marginTop: 10,
    marginBottom: 24,
    backgroundColor: "#074B93",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonDisabled: { opacity: 0.7 },
  primaryButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
  },

  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  footerText: { fontSize: 14, color: "#666" },
  footerLink: { fontSize: 14, color: "#003D82", fontWeight: "800" },
});
