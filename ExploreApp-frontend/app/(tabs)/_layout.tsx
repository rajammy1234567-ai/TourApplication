import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ExploreColors } from "../../constants/exploreTheme";

const TAB_BAR_CONTENT_HEIGHT = Platform.OS === "ios" ? 50 : 56;

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: ExploreColors.primary,
        tabBarInactiveTintColor: ExploreColors.textMuted,
        tabBarStyle: {
          backgroundColor: ExploreColors.surface,
          borderTopColor: ExploreColors.borderLight,
          borderTopWidth: 1,
          height: TAB_BAR_CONTENT_HEIGHT + insets.bottom,
          paddingBottom: Math.max(insets.bottom, Platform.OS === "android" ? 8 : 4),
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "home" : "home-outline"} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="hotels"
        options={{
          title: "Stays",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "bed" : "bed-outline"} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="tour"
        options={{
          title: "Tours",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "airplane" : "airplane-outline"} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: "Events",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "calendar" : "calendar-outline"} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "person" : "person-outline"} size={22} color={color} />
          ),
        }}
      />
      {/* Hidden — customization still accessible via direct route if needed */}
      <Tabs.Screen name="customization" options={{ href: null }} />
    </Tabs>
  );
}