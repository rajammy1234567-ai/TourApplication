import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Linking,
  Platform,
} from "react-native";
import { AppScreen } from "../components/explore/AppScreen";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

type FAQ = {
  question: string;
  answer: string;
  category: string;
};

const FAQs: FAQ[] = [
  {
    category: "Booking",
    question: "How do I book a tour?",
    answer: "Browse through our tours, select your favorite one, customize it if needed, and click 'Book Now'. Follow the payment steps to confirm your booking.",
  },
  {
    category: "Payment",
    question: "Is my payment secure?",
    answer: "Yes, we use Razorpay, which is one of the most secure payment gateways. We only take a 10% advance to secure your spot.",
  },
  {
    category: "Cancellation",
    question: "Can I cancel my booking?",
    answer: "Cancellations made 48 hours before the tour are eligible for a full refund of the advance payment.",
  },
  {
    category: "Account",
    question: "How do I reset my password?",
    answer: "Go to Profile > Account Settings > Change Password to update your security credentials.",
  },
];

export default function HelpSupport() {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);

  const filteredFAQs = FAQs.filter((f) =>
    f.question.toLowerCase().includes(search.toLowerCase())
  );

  const handleContact = (type: string) => {
    switch (type) {
      case "email":
        Linking.openURL("mailto:viztravel@viztravel.in");
        break;
      case "phone":
        Linking.openURL("tel:+919876543210");
        break;
      case "whatsapp":
        Linking.openURL("https://wa.me/919876543210");
        break;
    }
  };

  return (
    <AppScreen variant="stack" style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* HERO SECTION */}
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>How can we help you?</Text>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={20} color="#64748B" />
            <TextInput
              placeholder="Search help topics..."
              style={styles.input}
              value={search}
              onChangeText={setSearch}
            />
          </View>
        </View>

        {/* QUICK CONTACT */}
        <Text style={styles.sectionTitle}>Quick Contact</Text>
        <View style={styles.contactRow}>
          <ContactCard 
            icon="mail-outline" 
            label="Email" 
            onPress={() => handleContact("email")} 
          />
          <ContactCard 
            icon="logo-whatsapp" 
            label="WhatsApp" 
            onPress={() => handleContact("whatsapp")} 
          />
          <ContactCard 
            icon="call-outline" 
            label="Call" 
            onPress={() => handleContact("phone")} 
          />
        </View>

        {/* FAQs */}
        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        {filteredFAQs.map((faq, index) => (
          <TouchableOpacity 
            key={index} 
            style={styles.faqCard}
            onPress={() => setExpanded(expanded === index ? null : index)}
          >
            <View style={styles.faqHeader}>
              <Text style={styles.faqQuestion}>{faq.question}</Text>
              <Ionicons 
                name={expanded === index ? "chevron-up" : "chevron-down"} 
                size={20} 
                color="#64748B" 
              />
            </View>
            {expanded === index && (
              <Text style={styles.faqAnswer}>{faq.answer}</Text>
            )}
          </TouchableOpacity>
        ))}

        {/* FOOTER */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Available 24/7 for our premium travelers</Text>
          <Text style={styles.version}>Version 1.0.4 (Stable)</Text>
        </View>
      </ScrollView>
    </AppScreen>
  );
}

function ContactCard({ icon, label, onPress }: any) {
  return (
    <TouchableOpacity style={styles.contactCard} onPress={onPress}>
      <View style={styles.iconCircle}>
        <Ionicons name={icon} size={24} color="#1E3A8A" />
      </View>
      <Text style={styles.contactLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  backBtn: { marginRight: 12 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#0F172A" },
  
  content: { padding: 16 },
  
  hero: {
    backgroundColor: "#1E3A8A",
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 16,
    textAlign: "center",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  input: { flex: 1, marginLeft: 10, color: "#0F172A" },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 16,
    marginTop: 8,
  },

  contactRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  contactCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    width: "30%",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  contactLabel: { fontSize: 12, fontWeight: "600", color: "#1E3A8A" },

  faqCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
  },
  faqHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  faqQuestion: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0F172A",
    flex: 1,
    marginRight: 10,
  },
  faqAnswer: {
    marginTop: 12,
    fontSize: 13,
    color: "#64748B",
    lineHeight: 20,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 12,
  },

  footer: {
    alignItems: "center",
    marginTop: 32,
    marginBottom: 24,
  },
  footerText: { color: "#94A3B8", fontSize: 13 },
  version: { color: "#CBD5E1", fontSize: 11, marginTop: 4 },
});
