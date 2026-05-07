import React, { useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Google from "expo-auth-session/providers/google";

import * as AppleAuthentication from "expo-apple-authentication";
// import * as AuthSession from "expo-auth-session";
import { LinearGradient } from "expo-linear-gradient";
import * as WebBrowser from "expo-web-browser";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { AntDesign, Ionicons } from "@expo/vector-icons";

WebBrowser.maybeCompleteAuthSession();

const { width } = Dimensions.get("window");
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL 
  // android: "http://10.0.2.2:5000", // emulator
  // ios: "http://localhost:5000",
  // default: "http://192.168.1.8:5000", //

  const googleClientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || "";

const googleRequestClientId = googleClientId || "missing-google-client-id";
// const redirectUri = AuthSession.makeRedirectUri();
// const googleDiscovery = {
//   authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
// };

export default function LoginScreen() {
  const router = useRouter();
  const [loginType, setLoginType] = useState<"email" | "phone">("email");
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<"google" | "apple" | null>(null);

  const slideAnim = useRef(new Animated.Value(0)).current;
 const [googleRequest, googleResponse, promptGoogleAsync] = Google.useAuthRequest({
    clientId: googleRequestClientId,
    webClientId: googleRequestClientId,
    scopes: ["openid", "profile", "email"],
    selectAccount: true,
  });
  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: loginType === "email" ? 0 : 1,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [loginType]);

  useEffect(() => {
    const finishGoogleLogin = async () => {
      if (googleResponse?.type !== "success") return;

      try {
        setSocialLoading("google");

        const accessToken = googleResponse.authentication?.accessToken;

        if (!accessToken) {
          throw new Error("Google login did not return an access token");
        }

        const profileRes = await fetch(
          "https://www.googleapis.com/oauth2/v3/userinfo",
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        const profile = await profileRes.json();
        if (!profileRes.ok) {
          throw new Error(profile.error_description || profile.error || "Unable to fetch Google profile");
        }


        await completeSocialLogin({
          provider: "google",
          providerId: profile.sub,
          fullname: profile.name,
          email: profile.email,
          avatar: profile.picture,
        });
      } catch (error: any) {
        Alert.alert("Google login failed", error.message || "Please try again");
      } finally {
        setSocialLoading(null);
      }
    };

    finishGoogleLogin();
  }, [googleResponse]);

  const persistSession = async (data: any) => {
      if (!data?.token || !data?.user) {
      throw new Error("Login response did not include a session");
    }

    await AsyncStorage.setItem("token", data.token);
    await AsyncStorage.setItem("user", JSON.stringify(data.user));
    router.replace("/(tabs)/home");
  };

  const completeSocialLogin = async (profile: any) => {
    const res = await fetch(`${API_BASE_URL}/api/auth/social-login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(profile),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.msg || "Social login failed");
    }

    await persistSession(data);
  };

  const handleSignIn = async () => {
    if (!emailOrPhone || !password) {
      Alert.alert("Error", "Fill all fields");
      return;
    }

    setLoading(true);

    try {
      const body = {
        password,
        ...(loginType === "email"
          ? { email: emailOrPhone }
          : { phone: emailOrPhone }),
      };

      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        Alert.alert("Error", data.msg || "Login failed");
        return;
      }

      await persistSession(data);
    } catch (error) {
      console.log(error);
      Alert.alert(
        "Network error",
        "Could not reach the server. For Expo Go on a real phone, set EXPO_PUBLIC_API_BASE_URL to your computer IP address."
      );
    } finally {
      setLoading(false);
    }
  };

  // const googleClientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
  const handleGoogleLogin = async () => {
    if (!googleClientId) {
      Alert.alert(
        "Google setup needed",
        "Add EXPO_PUBLIC_GOOGLE_CLIENT_ID in your frontend environment first."
      );
      return;
    }

   try {
      setSocialLoading("google");
      await promptGoogleAsync();
    } catch (error: any) {
      Alert.alert("Google login failed", error.message || "Please try again");
    } finally {
      setSocialLoading(null);
    }
  };

  const handleAppleLogin = async () => {
    try {
      if (Platform.OS !== "ios") {
        Alert.alert("Apple Login", "Apple login works only on iOS.");
        return;
      }

      const available = await AppleAuthentication.isAvailableAsync();

      if (!available) {
        Alert.alert(
          "Apple login unavailable",
          "This device does not support Apple login."
        );
        return;
      }

      setSocialLoading("apple");

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      const fullName = [
        credential.fullName?.givenName,
        credential.fullName?.familyName,
      ]
        .filter(Boolean)
        .join(" ");

      await completeSocialLogin({
        provider: "apple",
        providerId: credential.user,
        fullname: fullName || "Apple User",
        email: credential.email,
      });
    } catch (error: any) {
      if (error.code !== "ERR_REQUEST_CANCELED") {
        Alert.alert("Apple login failed", error.message || "Please try again");
      }
    } finally {
      setSocialLoading(null);
    }
  };

  return (
    <LinearGradient
      colors={["#F0F7FF", "#E8F4FF", "#F5F5F5"]}
      style={styles.gradient}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={28} color="#003D82" />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push("/(tabs)/home")}>
            <Text style={styles.skipButton}>Skip</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.brandSection}>
          <Text style={styles.brandText}>Welcome Back</Text>
          <Text style={styles.brandSubText}>
            Sign in to continue planning your next adventure.
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

          <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => setLoginType("email")}
          >
            <Text
              style={[
                styles.toggleButtonText,
                loginType === "email" && styles.toggleButtonTextActive,
              ]}
            >
              Email
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => setLoginType("phone")}
          >
            <Text
              style={[
                styles.toggleButtonText,
                loginType === "phone" && styles.toggleButtonTextActive,
              ]}
            >
              Phone
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>
            {loginType === "email" ? "Email Address" : "Phone Number"}
          </Text>

          <View style={styles.inputContainer}>
            <Ionicons
              name={loginType === "email" ? "mail" : "call"}
              size={20}
              color="#9CA3AF"
            />

            <TextInput
              style={styles.input}
              placeholder={
                loginType === "email"
                  ? "hello@example.com"
                  : "+91 98765 43210"
              }
              placeholderTextColor="#C9CDD3"
              keyboardType={
                loginType === "email" ? "email-address" : "phone-pad"
              }
              autoCapitalize="none"
              value={emailOrPhone}
              onChangeText={setEmailOrPhone}
            />
          </View>
        </View>

        <View style={styles.inputSection}>
          <View style={styles.labelRow}>
            <Text style={styles.inputLabelNoMargin}>Password</Text>

            <TouchableOpacity
              onPress={() => router.push("/(auth)/forgotPassword")}
            >
              <Text style={styles.forgotPassword}>Forgot?</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed" size={20} color="#9CA3AF" />

            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#C9CDD3"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />

            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeButton}
            >
              <Ionicons
                name={showPassword ? "eye" : "eye-off"}
                size={20}
                color="#9CA3AF"
              />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={styles.signInButton}
          onPress={handleSignIn}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.signInButtonText}>Sign In</Text>
          )}
        </TouchableOpacity>

        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity
          style={styles.socialButton}
          onPress={handleAppleLogin}
          disabled={!!socialLoading}
        >
          {socialLoading === "apple" ? (
            <ActivityIndicator color="#111" />
          ) : (
            <>
              <AntDesign name="apple" size={22} color="#000" />
              <Text style={styles.socialButtonText}>
                Continue with Apple
              </Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.socialButton}
          onPress={handleGoogleLogin}
          disabled={!googleRequest || !!socialLoading}
        >
          {socialLoading === "google" ? (
            <ActivityIndicator color="#111" />
          ) : (
            <>
              <AntDesign name="google" size={22} color="#EA4335" />
              <Text style={styles.socialButtonText}>
                Continue with Google
              </Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.securityBadge}>
          <Ionicons name="shield-checkmark" size={14} color="#00A651" />
          <Text style={styles.securityText}>Biometric Security</Text>
        </View>

        <View style={styles.signUpContainer}>
          <Text style={styles.signUpText}>Don't have an account? </Text>

          <TouchableOpacity onPress={() => router.push("/(auth)/signUp")}>
            <Text style={styles.signUpLink}>Sign up</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },

  container: {
    flex: 1,
    backgroundColor: "transparent",
  },

  content: {
    paddingBottom: 32,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 34,
  },

  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
  },

  skipButton: {
    color: "#0077A8",
    fontSize: 18,
    fontWeight: "600",
  },

  brandSection: {
    paddingHorizontal: 22,
    marginBottom: 38,
  },

  brandText: {
    fontSize: 38,
    lineHeight: 44,
    fontWeight: "900",
    color: "#06458A",
  },

  brandSubText: {
    marginTop: 6,
    color: "#111827",
    fontSize: 16,
    lineHeight: 23,
    maxWidth: 320,
  },

  toggleContainer: {
    flexDirection: "row",
    marginHorizontal: 22,
    marginBottom: 32,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 5,
    position: "relative",
    overflow: "hidden",
    height: 62,
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
    height: 52,
    backgroundColor: "#E8F0F7",
    borderRadius: 12,
    top: 5,
    left: 5,
    zIndex: 1,
  },

  toggleButtonText: {
    fontSize: 16,
    color: "#9B9B9B",
    fontWeight: "700",
  },

  toggleButtonTextActive: {
    color: "#06458A",
  },

  inputSection: {
    marginHorizontal: 22,
    marginBottom: 24,
  },

  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },

  inputLabel: {
    fontSize: 14,
    color: "#6E6E6E",
    fontWeight: "700",
    marginBottom: 10,
    textTransform: "uppercase",
  },

  inputLabelNoMargin: {
    fontSize: 14,
    color: "#6E6E6E",
    fontWeight: "700",
    textTransform: "uppercase",
  },

  forgotPassword: {
    color: "#0077A8",
    fontSize: 13,
    fontWeight: "700",
  },

  inputContainer: {
    height: 62,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 18,
    gap: 12,
  },

  input: {
    flex: 1,
    fontSize: 16,
    color: "#111827",
    minHeight: 44,
  },

  eyeButton: {
    width: 34,
    height: 34,
    justifyContent: "center",
    alignItems: "center",
  },

  signInButton: {
    height: 62,
    marginHorizontal: 22,
    marginTop: 4,
    marginBottom: 34,
    backgroundColor: "#074B93",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  signInButtonText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
  },

  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 22,
    marginBottom: 24,
  },

  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#D4D7DB",
  },

  dividerText: {
    marginHorizontal: 14,
    color: "#9A9A9A",
    fontSize: 13,
    fontWeight: "800",
  },

  socialButton: {
    height: 62,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    marginHorizontal: 22,
    marginBottom: 14,
    gap: 14,
  },

  socialButtonText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111",
  },

  securityBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    marginBottom: 24,
  },

  securityText: {
    marginLeft: 5,
    fontSize: 12,
    color: "#666",
    fontWeight: "600",
  },

  signUpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },

  signUpText: {
    fontSize: 14,
    color: "#666",
  },

  signUpLink: {
    fontSize: 14,
    color: "#003D82",
    fontWeight: "800",
  },
});
