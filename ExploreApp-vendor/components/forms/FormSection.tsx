import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, cardStyle } from "../../constants/theme";

type Props = {
  title: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  children: React.ReactNode;
};

export function FormSection({ title, subtitle, icon, children }: Props) {
  return (
    <View style={[styles.section, cardStyle]}>
      <View style={styles.header}>
        {icon ? (
          <View style={styles.iconWrap}>
            <Ionicons name={icon} size={16} color={Colors.primary} />
          </View>
        ) : null}
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { padding: Spacing.md, marginBottom: 12 },
  header: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: Spacing.sm },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 15, fontWeight: "700", color: Colors.text },
  subtitle: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
});