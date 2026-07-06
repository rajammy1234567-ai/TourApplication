import { Platform, TextStyle, ViewStyle } from "react-native";

export const Colors = {
  primary: "#003D82",
  primaryDark: "#002B5C",
  primarySoft: "#E8EEF7",
  accent: "#0EA5E9",
  background: "#F4F6FA",
  surface: "#FFFFFF",
  text: "#0F172A",
  textSecondary: "#64748B",
  textMuted: "#94A3B8",
  border: "#E2E8F0",
  borderLight: "#F1F5F9",
  success: "#10B981",
  successSoft: "#D1FAE5",
  warning: "#F59E0B",
  warningSoft: "#FEF3C7",
  error: "#EF4444",
  errorSoft: "#FEE2E2",
  white: "#FFFFFF",
  overlay: "rgba(0, 61, 130, 0.08)",
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
};

export const Radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  full: 999,
};

export const Shadow = {
  sm: {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  } satisfies ViewStyle,
  md: {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 5,
  } satisfies ViewStyle,
  fab: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 8,
  } satisfies ViewStyle,
};

export const Typography = {
  h1: { fontSize: 28, fontWeight: "800" as const, color: Colors.text },
  h2: { fontSize: 22, fontWeight: "800" as const, color: Colors.text },
  h3: { fontSize: 18, fontWeight: "700" as const, color: Colors.text },
  body: { fontSize: 15, fontWeight: "500" as const, color: Colors.text },
  caption: { fontSize: 13, fontWeight: "500" as const, color: Colors.textSecondary },
  label: { fontSize: 13, fontWeight: "600" as const, color: Colors.textSecondary },
};

export const statusColors = (status: string) => {
  switch (status) {
    case "approved":
      return { bg: Colors.successSoft, text: "#047857" };
    case "rejected":
      return { bg: Colors.errorSoft, text: "#B91C1C" };
    default:
      return { bg: Colors.warningSoft, text: "#B45309" };
  }
};

export const cardStyle: ViewStyle = {
  backgroundColor: Colors.surface,
  borderRadius: Radius.lg,
  borderWidth: 1,
  borderColor: Colors.borderLight,
  ...Shadow.sm,
};

export const inputStyle: ViewStyle & TextStyle = {
  backgroundColor: Colors.surface,
  borderRadius: Radius.md,
  borderWidth: 1,
  borderColor: Colors.border,
  paddingHorizontal: 14,
  paddingVertical: Platform.OS === "ios" ? 14 : 12,
  fontSize: 15,
  color: Colors.text,
};