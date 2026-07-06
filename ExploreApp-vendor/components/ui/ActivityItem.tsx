import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Radius, Spacing } from "../../constants/theme";
import { formatINR, timeAgo } from "../../lib/format";

type Activity = {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  amount?: number;
  status?: string;
  timestamp: string;
  icon: string;
};

const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
  airplane: "airplane",
  bed: "bed",
  map: "map",
  home: "home",
};

export function ActivityItem({ item }: { item: Activity }) {
  const iconName = iconMap[item.icon] || "notifications";
  const isBooking = item.type.includes("booking");

  return (
    <View style={styles.row}>
      <View style={[styles.dot, isBooking ? styles.dotBooking : styles.dotListing]}>
        <Ionicons name={iconName} size={14} color={isBooking ? Colors.primary : "#6D28D9"} />
      </View>
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.sub}>{item.subtitle}</Text>
        <View style={styles.meta}>
          <Text style={styles.time}>{timeAgo(item.timestamp)}</Text>
          {item.amount ? <Text style={styles.amount}>{formatINR(item.amount)}</Text> : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 12,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  dot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  dotBooking: { backgroundColor: Colors.primarySoft },
  dotListing: { backgroundColor: "#EDE9FE" },
  content: { flex: 1 },
  title: { fontSize: 13, fontWeight: "600", color: Colors.text, lineHeight: 18 },
  sub: { fontSize: 12, color: Colors.textSecondary, marginTop: 3 },
  meta: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  time: { fontSize: 11, color: Colors.textMuted },
  amount: { fontSize: 12, fontWeight: "700", color: Colors.success },
});