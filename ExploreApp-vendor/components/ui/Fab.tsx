import { StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Radius, Shadow } from "../../constants/theme";
import { useTabBarMetrics } from "../../lib/safeArea";

type Props = { onPress: () => void };

export function Fab({ onPress }: Props) {
  const { fabBottom } = useTabBarMetrics();

  return (
    <TouchableOpacity
      style={[styles.fab, { bottom: fabBottom }]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <Ionicons name="add" size={28} color={Colors.white} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    zIndex: 20,
    right: 20,
    width: 58,
    height: 58,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...Shadow.fab,
  },
});