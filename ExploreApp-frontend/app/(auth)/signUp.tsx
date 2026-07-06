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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { apiUrl } from "../../constants/api";

const STORAGE_KEYS = {
  token: "token",
  userData: "userData",
  wishlistTours: "wishlistTours",
} as const;

type RegisterResponse = {
  token?: string;
  user?: {
    _id?: string;
    fullname?: string;
    name?: string;
    email?: string;
    phone?: string;
  };
  data?: {
    user?: {
      _id?: string;
      fullname?: string;
      name?: string;
      email?: string;
      phone?: string;
    };
    token?: string;
  };
  msg?: string;
  message?: string;
};

export default function SignupScreen() {
  const router = useRouter();

  const [tab, setTab] = useState<"email" | "phone">("email");
  const [containerWidth, setContainerWidth] = useState(0);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: tab === "email" ? 0 : 1,
      duration: 280,
      useNativeDriver: false,
    }).start();
  }, [slideAnim, tab]);

  const validateForm = () => {
    if (!name.trim() || !password || !confirmPassword) {
      Alert.alert("Validation", "Please fill all required fields.");
      return false;
    }

    if (tab === "email" && !email.trim()) {
      Alert.alert("Validation", "Please enter email.");
      return false;
    }

    if (tab === "phone" && !phone.trim()) {
      Alert.alert("Validation", "Please enter phone number.");
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert("Validation", "Passwords do not match.");
      return false;
    }

    if (password.length < 6) {
      Alert.alert("Validation", "Password must be at least 6 characters.");
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

      if (tab === "email") body.email = email.trim();
      if (tab === "phone") body.phone = phone.trim();

      const res = await fetch(apiUrl("/api/auth/register"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = (await res.json()) as RegisterResponse;

      if (!res.ok) {
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
        email: backendUser?.email || (tab === "email" ? email.trim() : ""),
        phone: backendUser?.phone || (tab === "phone" ? phone.trim() : ""),
      };

      await AsyncStorage.multiSet([
        [STORAGE_KEYS.token, token],
        [STORAGE_KEYS.userData, JSON.stringify(normalizedUser)],
      ]);

      const existingWishlist = await AsyncStorage.getItem(STORAGE_KEYS.wishlistTours);
      if (!existingWishlist) {
        await AsyncStorage.setItem(STORAGE_KEYS.wishlistTours, JSON.stringify([]));
      }

      Alert.alert("Success", "Registered successfully.");
      router.replace(token ? "/(tabs)/home" : "/(auth)/login");
    } catch {
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={["#F0F7FF", "#E8F4FF", "#F5F5F5"]} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join & explore the world ✈️</Text>
          </View>

          <View
            style={styles.toggleContainer}
            onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
          >
            <Animated.View
              style={[
                styles.slider,
                {
                  width: containerWidth / 2,
                  transform: [
                    {
                      translateX: slideAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, containerWidth / 2],
                      }),
                    },
                  ],
                },
              ]}
            />

            <TouchableOpacity onPress={() => setTab("email")} style={styles.toggleBtn}>
              <Text style={tab === "email" ? styles.activeText : styles.text}>Email</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setTab("phone")} style={styles.toggleBtn}>
              <Text style={tab === "phone" ? styles.activeText : styles.text}>Phone</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Full Name</Text>
            <View style={styles.inputBox}>
              <Ionicons name="person" size={18} color="#999" />
              <TextInput
                placeholder="John Doe"
                style={styles.input}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.label}>
              {tab === "email" ? "Email Address" : "Phone Number"}
            </Text>
            <View style={styles.inputBox}>
              <Ionicons name={tab === "email" ? "mail" : "call"} size={18} color="#999" />
              <TextInput
                placeholder={tab === "email" ? "Enter Email" : "Enter Phone"}
                style={styles.input}
                value={tab === "email" ? email : phone}
                onChangeText={tab === "email" ? setEmail : setPhone}
                keyboardType={tab === "email" ? "email-address" : "phone-pad"}
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputBox}>
              <Ionicons name="lock-closed" size={18} color="#999" />
              <TextInput
                secureTextEntry
                placeholder="Password"
                style={styles.input}
                value={password}
                onChangeText={setPassword}
              />
            </View>
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Confirm Password</Text>
            <View style={styles.inputBox}>
              <Ionicons name="lock-closed" size={18} color="#999" />
              <TextInput
                secureTextEntry
                placeholder="confirmPassword"
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            </View>
          </View>

          <TouchableOpacity onPress={register} disabled={loading} style={{ margin: 20 }}>
            <LinearGradient colors={["#003D82", "#2563eb"]} style={styles.button}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnText}>Create Account</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: { padding: 20 },
  title: { fontSize: 28, fontWeight: "800", color: "#003D82" },
  subtitle: { color: "#666", marginTop: 5 },

  toggleContainer: {
    flexDirection: "row",
    margin: 20,
    backgroundColor: "#EEF3F8",
    borderRadius: 14,
    padding: 4,
    position: "relative",
  },
  slider: {
    position: "absolute",
    height: "100%",
    backgroundColor: "#fff",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    zIndex: 1,
  },
  text: { color: "#888", fontWeight: "500" },
  activeText: { color: "#003D82", fontWeight: "700" },

  inputWrapper: { marginHorizontal: 20, marginBottom: 15 },
  label: {
    fontSize: 12,
    color: "#666",
    marginBottom: 6,
    fontWeight: "600",
  },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  input: { flex: 1, padding: 14 },

  button: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});