/**
 * Dynamic Expo config — injects production API for APK / release builds.
 */
const PROD_API = "https://tourapplication-api.onrender.com";

export default ({ config }) => {
  const apiBaseUrl =
    process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || PROD_API;

  return {
    ...config,
    name: "VizTravel Vendor",
    slug: "viztravel-vendor",
    owner: "apk_build_green",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    scheme: "viztravelvendor",
    userInterfaceStyle: "light",
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.viztravel.vendor",
    },
    android: {
      package: "com.viztravel.vendor",
      versionCode: 1,
      adaptiveIcon: {
        backgroundColor: "#003D82",
        foregroundImage: "./assets/android-icon-foreground.png",
        backgroundImage: "./assets/android-icon-background.png",
        monochromeImage: "./assets/android-icon-monochrome.png",
      },
      usesCleartextTraffic: true,
      predictiveBackGestureEnabled: false,
    },
    web: {
      favicon: "./assets/favicon.png",
    },
    plugins: [
      "expo-router",
      [
        "expo-image-picker",
        {
          photosPermission:
            "Allow VizTravel Vendor to access your photos for listing images.",
        },
      ],
    ],
    extra: {
      apiBaseUrl,
      eas: {
        projectId: process.env.EAS_PROJECT_ID || undefined,
      },
    },
  };
};
