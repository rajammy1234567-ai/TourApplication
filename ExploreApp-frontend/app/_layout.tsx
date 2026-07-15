import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { warmUpApi } from "../constants/api";

export default function RootLayout() {
  // Wake Render free-tier API as soon as app opens
  useEffect(() => {
    warmUpApi();
    const id = setInterval(() => warmUpApi(), 4 * 60 * 1000);
    return () => clearInterval(id);
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
