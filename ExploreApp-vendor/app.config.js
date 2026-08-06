const PROD_API = "https://tourapplication-api.onrender.com";

const rawApi = (process.env.EXPO_PUBLIC_API_BASE_URL || "").replace(/\/$/, "");
const apiBaseUrl =
  rawApi && !/localhost|127\.0\.0\.1|192\.168\./i.test(rawApi)
    ? rawApi
    : PROD_API;

const forceProdApi =
  process.env.EXPO_PUBLIC_USE_LOCAL_API !== "1" &&
  process.env.EXPO_PUBLIC_USE_LOCAL_API !== "true";

export default ({ config }) => {
  return {
    ...config,
    name: "VizTravel Vendor",
    slug: "viztravel-vendor",
    owner: "viz_eas001",
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
      "expo-font",
      "expo-image",
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
      forceProdApi,
      eas: {
        projectId: "fc924b67-8f82-4264-94bd-378bb7cbc6cb",
      },
    },
  };
};
