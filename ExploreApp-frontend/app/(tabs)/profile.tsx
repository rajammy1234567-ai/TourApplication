import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function ProfileScreen() {
  const router = useRouter();

  const [notifications, setNotifications] = useState(true);

  // 👉 Mock state (future API se replace ho sakta hai)
  const [stats] = useState({
    bookings: 5,
    wishlist: 12,
    reviews: 7,
  });

  const handleLogout = () => {
    router.replace("/(auth)/login");
  };

 const MenuItem = ({ icon, title, right, onPress }: any) => (
    <TouchableOpacity style={styles.menuItem} activeOpacity={0.7} onPress={onPress}>
      <Ionicons name={icon} size={20} color="#1E3A8A" />
      <Text style={styles.menuText}>{title}</Text>
      {right ? right : <Ionicons name="chevron-forward" size={18} color="#C7C7C7" />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#F6F8FC" />

      <ScrollView showsVerticalScrollIndicator={false} style={styles.container}>
        {/* HEADER */}
        <View style={styles.headerCard}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={42} color="#1E3A8A" />
          </View>

          <Text style={styles.name}>John Doe</Text>
          <Text style={styles.email}>john@example.com</Text>

          <TouchableOpacity style={styles.editBtn} activeOpacity={0.8}>
            <Text style={styles.editText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* STATS */}
        <View style={styles.statsCard}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{stats.bookings}</Text>
            <Text style={styles.statLabel}>Bookings</Text>
          </View>

          <View style={styles.statBox}>
            <Text style={styles.statValue}>{stats.wishlist}</Text>
            <Text style={styles.statLabel}>Wishlist</Text>
          </View>

          <View style={styles.statBox}>
            <Text style={styles.statValue}>{stats.reviews}</Text>
            <Text style={styles.statLabel}>Reviews</Text>
          </View>
        </View>

        {/* ACCOUNT */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Account</Text>

          <MenuItem icon="person-circle-outline" title="Personal Info" />
          <MenuItem icon="lock-closed-outline" title="Change Password" />
          <MenuItem icon="card-outline" title="Payment Methods" />
          <MenuItem
            icon="briefcase-outline"
            title="My Bookings"
            onPress={() => router.push("/myBookings")}
          />
          <View style={styles.menuItem}>
            <Ionicons name="notifications-outline" size={20} color="#1E3A8A" />
            <Text style={styles.menuText}>Notifications</Text>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: "#ccc", true: "#1E3A8A" }}
            />
          </View>

          <MenuItem icon="globe-outline" title="Language" />
          <MenuItem icon="help-circle-outline" title="Help & Support" />
        </View>

        {/* LOGOUT */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          activeOpacity={0.85}
        >
          <Ionicons name="log-out-outline" size={20} color="#fff" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F6F8FC",
  },

  container: {
    flex: 1,
  },

  headerCard: {
    alignItems: "center",
    backgroundColor: "#fff",
    margin: 16,
    borderRadius: 18,
    paddingVertical: 22,
    elevation: 3,
  },

  avatar: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: "#EAF0FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },

  name: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
  },

  email: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
    marginBottom: 10,
  },

  editBtn: {
    backgroundColor: "#1E3A8A",
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: 6,
  },

  editText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },

  statsCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    borderRadius: 18,
    paddingVertical: 14,
    elevation: 2,
  },

  statBox: {
    flex: 1,
    alignItems: "center",
  },

  statValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E3A8A",
  },

  statLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 3,
  },

  card: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 18,
    paddingBottom: 6,
    elevation: 2,
  },

  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1E3A8A",
    padding: 14,
  },

  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F1F1",
  },

  menuText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: "#111827",
  },

  logoutBtn: {
    flexDirection: "row",
    backgroundColor: "#EF4444",
    marginHorizontal: 16,
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },

  logoutText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
});