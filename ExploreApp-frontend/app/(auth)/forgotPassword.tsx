import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { AppScreen } from "../../components/explore/AppScreen";

export default function ForgotPasswordScreen() {
  return (
    <AppScreen variant="auth">
      <View style={styles.center}>
        <Text style={styles.text}>Forgot password</Text>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  text: { fontSize: 18, fontWeight: "600", color: "#0F172A" },
});