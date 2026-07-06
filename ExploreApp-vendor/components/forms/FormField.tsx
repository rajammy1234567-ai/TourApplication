import { Platform, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Radius } from "../../constants/theme";

type Props = {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  icon?: keyof typeof Ionicons.glyphMap;
  placeholder?: string;
  required?: boolean;
  keyboardType?: "default" | "numeric" | "decimal-pad";
  multiline?: boolean;
  hint?: string;
  maxLength?: number;
};

export function FormField({
  label,
  value,
  onChangeText,
  icon,
  placeholder,
  required,
  keyboardType = "default",
  multiline,
  hint,
  maxLength,
}: Props) {
  return (
    <View style={styles.field}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>
          {label}
          {required ? " *" : ""}
        </Text>
        {maxLength ? (
          <Text style={styles.counter}>
            {value.length}/{maxLength}
          </Text>
        ) : null}
      </View>
      <View style={[styles.inputWrap, multiline && styles.inputWrapMultiline]}>
        {icon ? <Ionicons name={icon} size={18} color={Colors.textMuted} /> : null}
        <TextInput
          style={[styles.input, multiline && styles.textArea]}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          placeholder={placeholder || `Enter ${label.toLowerCase()}`}
          placeholderTextColor={Colors.textMuted}
          multiline={multiline}
          textAlignVertical={multiline ? "top" : "center"}
          maxLength={maxLength}
        />
      </View>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { marginBottom: 14 },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  label: { fontSize: 12, fontWeight: "600", color: Colors.textSecondary },
  counter: { fontSize: 11, color: Colors.textMuted },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 13 : 10,
  },
  inputWrapMultiline: { alignItems: "flex-start", paddingVertical: 12 },
  input: { flex: 1, fontSize: 15, color: Colors.text },
  textArea: { minHeight: 120, lineHeight: 22, paddingTop: 2 },
  hint: { fontSize: 11, color: Colors.textMuted, marginTop: 5 },
});