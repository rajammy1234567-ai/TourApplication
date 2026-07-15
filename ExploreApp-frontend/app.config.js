/**
 * Dynamic Expo config — Expo Go + APK both get production API by default.
 */
const PROD_API = "https://tourapplication-api.onrender.com";

const rawApi = (process.env.EXPO_PUBLIC_API_BASE_URL || "").replace(/\/$/, "");
const apiBaseUrl =
  rawApi && !/localhost|127\.0\.0\.1|192\.168\./i.test(rawApi)
    ? rawApi
    : PROD_API;

// Default true so phone testing works without local backend
const forceProdApi =
  process.env.EXPO_PUBLIC_USE_LOCAL_API !== "1" &&
  process.env.EXPO_PUBLIC_USE_LOCAL_API !== "true";

export default ({ config }) => {
  return {
    ...config,
    name: "VizTravel",
    slug: "viztravel",
    owner: "apk_build_green",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icons/vizTravelicon.png",
    scheme: "viztravel",
    userInterfaceStyle: "automatic",
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.viztravel.app",
      infoPlist: {
        NSLocationWhenInUseUsageDescription:
          "VizTravel uses your location to find nearby events.",
      },
    },
    android: {
      package: "com.viztravel.app",
      permissions: ["ACCESS_COARSE_LOCATION", "ACCESS_FINE_LOCATION"],
      adaptiveIcon: {
        foregroundImage: "./assets/icons/vizTravelicon.png",
        backgroundColor: "#ffffff",
      },
      predictiveBackGestureEnabled: false,
      usesCleartextTraffic: true,
    },
    web: {
      output: "static",
      favicon: "./assets/images/favicon.png",
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/icons/vizTravelicon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff",
          dark: { backgroundColor: "#000000" },
        },
      ],
      "expo-web-browser",
      "expo-font",
      "expo-image",
      "expo-sharing",
      "expo-status-bar",
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    extra: {
      router: {},
      apiBaseUrl,
      forceProdApi,
      eas: {
        projectId: "bf51b900-9c2e-4059-a752-6070f3786cab",
      },
    },
  };
};
