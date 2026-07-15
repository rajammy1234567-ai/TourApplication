import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { apiFetch } from "../constants/api";

export default function RootLayout() {
  // Wake production API early (Render free tier cold starts)
  useEffect(() => {
    apiFetch("/health", { timeoutMs: 15000 }).catch(() => {});
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />

      <Stack
        screenOptions={{
          headerShown: false,
          animation: "fade",
        }}
      />
    </SafeAreaProvider>
  );
}