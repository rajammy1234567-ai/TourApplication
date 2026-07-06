import { StyleSheet, Text, View } from "react-native";
import { statusColors } from "../../constants/theme";

type Props = { status: string };

export function StatusBadge({ status }: Props) {
  const colors = statusColors(status);
  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <Text style={[styles.text, { color: colors.text }]}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  text: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "capitalize",
  },
});