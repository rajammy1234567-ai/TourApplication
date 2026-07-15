/**
 * Dynamic Expo config — injects production API for APK / release builds.
 */
const PROD_API = "https://tourapplication-api.onrender.com";

export default ({ config }) => {
  const apiBaseUrl =
    process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || PROD_API;

  return {
    ...config,
    name: "VizTravel",
    slug: "viztravel",
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
      versionCode: 1,
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
      eas: {
        projectId: "7a2b2ed4-c594-49de-a708-157976305ef2",
      },
    },
  };
};
