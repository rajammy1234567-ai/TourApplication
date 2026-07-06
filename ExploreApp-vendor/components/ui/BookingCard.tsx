import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Radius, Spacing, cardStyle } from "../../constants/theme";
import { formatDate, formatINR } from "../../lib/format";

export type BookingItem = {
  _id: string;
  type: "tour" | "hotel";
  customerName: string;
  customerPhone?: string;
  listingTitle: string;
  listingLocation?: string;
  startDate?: string;
  endDate?: string;
  checkIn?: string;
  checkOut?: string;
  travelers?: number;
  children?: number;
  rooms?: number;
  guests?: number;
  roomType?: string;
  room?: string;
  paidAmount: number;
  totalAmount?: number;
  bookingStatus: string;
  bookedAt?: string;
};

type Props = { booking: BookingItem; compact?: boolean };

export function BookingCard({ booking, compact }: Props) {
  const isTour = booking.type === "tour";
  const icon = isTour ? "airplane" : "bed";
  const iconBg = isTour ? "#E0F2FE" : "#EDE9FE";
  const iconColor = isTour ? "#0369A1" : "#6D28D9";

  return (
    <View style={[styles.card, cardStyle]}>
      <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>

      <View style={styles.body}>
        <View style={styles.row}>
          <Text style={styles.title} numberOfLines={1}>
            {booking.listingTitle}
          </Text>
          <View
            style={[
              styles.badge,
              booking.bookingStatus === "Completed" && styles.badgeDone,
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                booking.bookingStatus === "Completed" && styles.badgeTextDone,
              ]}
            >
              {booking.bookingStatus}
            </Text>
          </View>
        </View>

        <Text style={styles.customer}>
          {booking.customerName}
          {booking.customerPhone ? ` · ${booking.customerPhone}` : ""}
        </Text>

        {isTour ? (
          <Text style={styles.detail}>
            🗓 {formatDate(booking.startDate)} → {formatDate(booking.endDate)}
          </Text>
        ) : (
          <Text style={styles.detail}>
            🗓 {formatDate(booking.checkIn)} → {formatDate(booking.checkOut)}
          </Text>
        )}

        {isTour ? (
          <Text style={styles.meta}>
            👥 {booking.travelers} adults
            {(booking.children || 0) > 0 ? ` + ${booking.children} child` : ""}
            {booking.room ? ` · 🛏 ${booking.room}` : ""}
          </Text>
        ) : (
          <Text style={styles.meta}>
            🚪 {booking.rooms} room(s) · 👥 {booking.guests} guests
            {booking.roomType ? ` · ${booking.roomType}` : ""}
          </Text>
        )}

        {!compact && (
          <View style={styles.footer}>
            <Text style={styles.paid}>Paid {formatINR(booking.paidAmount)}</Text>
            {booking.totalAmount ? (
              <Text style={styles.total}>of {formatINR(booking.totalAmount)}</Text>
            ) : null}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    padding: Spacing.md,
    marginBottom: 10,
    gap: 12,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  body: { flex: 1 },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { flex: 1, fontSize: 15, fontWeight: "700", color: Colors.text },
  badge: {
    backgroundColor: Colors.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  badgeDone: { backgroundColor: Colors.successSoft },
  badgeText: { fontSize: 10, fontWeight: "700", color: Colors.primary },
  badgeTextDone: { color: "#047857" },
  customer: { fontSize: 13, color: Colors.textSecondary, marginTop: 4 },
  detail: { fontSize: 12, color: Colors.text, marginTop: 6, fontWeight: "500" },
  meta: { fontSize: 12, color: Colors.textMuted, marginTop: 4 },
  footer: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 },
  paid: { fontSize: 13, fontWeight: "700", color: Colors.success },
  total: { fontSize: 12, color: Colors.textMuted },
});