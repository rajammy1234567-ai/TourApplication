import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { AppScreen } from "../components/explore/AppScreen";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiUrl } from "../constants/api";
import { ExploreColors, ExploreShadow, Layout } from "../constants/exploreTheme";

type Application = {
  _id: string;
  businessName: string;
  ownerName: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  businessType?: string;
  gstNumber?: string;
  description?: string;
  status: "pending" | "approved" | "rejected";
  adminNotes?: string;
  vendorLoginPassword?: string;
  createdAt: string;
  updatedAt?: string;
  reviewedAt?: string;
};

const BUSINESS_TYPES = [
  { id: "hotel", label: "Hotels / Stays" },
  { id: "tour", label: "Tours" },
  { id: "both", label: "Both" },
];

const STATUS_CONFIG = {
  pending: {
    title: "Under Review",
    subtitle: "Admin is reviewing your partner application",
    color: "#D97706",
    soft: "#FEF3C7",
    icon: "time-outline" as const,
  },
  approved: {
    title: "Approved",
    subtitle: "You're approved to host on Explore",
    color: "#16A34A",
    soft: "#DCFCE7",
    icon: "checkmark-circle-outline" as const,
  },
  rejected: {
    title: "Not Approved",
    subtitle: "Application needs changes or was declined",
    color: "#DC2626",
    soft: "#FEE2E2",
    icon: "close-circle-outline" as const,
  },
};

function formatDate(value?: string) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function businessTypeLabel(type?: string) {
  if (type === "hotel") return "Hotels / Stays";
  if (type === "tour") return "Tours";
  return "Hotels & Tours";
}

export default function BecomeVendorScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [application, setApplication] = useState<Application | null>(null);
  const [showReapplyForm, setShowReapplyForm] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  const [businessName, setBusinessName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [description, setDescription] = useState("");
  const [businessType, setBusinessType] = useState("both");

  const loadData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const storedToken = await AsyncStorage.getItem("token");
      const userData = await AsyncStorage.getItem("userData");

      if (!storedToken) {
        Alert.alert("Login Required", "Please login first to become a vendor.", [
          { text: "Login", onPress: () => router.replace("/(auth)/login") },
          { text: "Cancel", onPress: () => router.back() },
        ]);
        return;
      }

      setToken(storedToken);

      if (userData && !application) {
        const user = JSON.parse(userData);
        setOwnerName(user.fullname || user.name || "");
        setPhone(user.phone || "");
        setEmail(user.email || "");
      }

      const response = await fetch(apiUrl("/api/vendor/application"), {
        headers: { Authorization: `Bearer ${storedToken}` },
      });
      const data = await response.json();
      if (response.ok && data.success && data.application) {
        setApplication(data.application);
        setShowReapplyForm(false);
      } else {
        setApplication(null);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmit = async () => {
    if (!businessName.trim() || !ownerName.trim() || !phone.trim()) {
      Alert.alert("Missing Info", "Business name, owner name and phone are required.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(apiUrl("/api/vendor/apply"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          businessName: businessName.trim(),
          ownerName: ownerName.trim(),
          phone: phone.trim(),
          email: email.trim(),
          address: address.trim(),
          city: city.trim(),
          state: state.trim(),
          gstNumber: gstNumber.trim(),
          description: description.trim(),
          businessType,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to submit application");
      }

      setApplication(data.application);
      setShowReapplyForm(false);
      Alert.alert("Submitted", "Your application is now with the admin team for review.");
    } catch (err: any) {
      Alert.alert("Error", err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const renderTimeline = (status: Application["status"]) => {
    const steps = [
      { key: "submitted", label: "Application submitted", done: true },
      { key: "review", label: "Admin review", done: status !== "pending" ? true : false, active: status === "pending" },
      {
        key: "decision",
        label: status === "approved" ? "Approved — use Vendor App" : status === "rejected" ? "Rejected" : "Final decision",
        done: status === "approved" || status === "rejected",
        active: false,
      },
    ];

    return (
      <View style={styles.timelineCard}>
        <Text style={styles.sectionTitle}>Application progress</Text>
        {steps.map((step, index) => (
          <View key={step.key} style={styles.timelineRow}>
            <View style={styles.timelineLeft}>
              <View
                style={[
                  styles.timelineDot,
                  step.done && styles.timelineDotDone,
                  step.active && styles.timelineDotActive,
                ]}
              >
                {step.done ? (
                  <Ionicons name="checkmark" size={12} color="#fff" />
                ) : step.active ? (
                  <View style={styles.timelineDotInner} />
                ) : null}
              </View>
              {index < steps.length - 1 ? <View style={[styles.timelineLine, step.done && styles.timelineLineDone]} /> : null}
            </View>
            <Text style={[styles.timelineLabel, step.active && styles.timelineLabelActive]}>{step.label}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderStatusPanel = (app: Application) => {
    const cfg = STATUS_CONFIG[app.status];

    return (
      <ScrollView
        contentContainerStyle={styles.statusScroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} tintColor={ExploreColors.primary} />
        }
      >
        <View style={[styles.heroCard, { backgroundColor: cfg.soft }]}>
          <View style={[styles.heroIcon, { backgroundColor: cfg.color }]}>
            <Ionicons name={cfg.icon} size={34} color="#fff" />
          </View>
          <Text style={[styles.heroTitle, { color: cfg.color }]}>{cfg.title}</Text>
          <Text style={styles.heroSub}>{cfg.subtitle}</Text>
          <View style={[styles.statusPill, { borderColor: cfg.color }]}>
            <Text style={[styles.statusPillText, { color: cfg.color }]}>
              {app.status.toUpperCase()}
            </Text>
          </View>
        </View>

        {renderTimeline(app.status)}

        <View style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>Your application</Text>
          {[
            ["Business", app.businessName],
            ["Owner", app.ownerName],
            ["Phone (login ID)", app.phone],
            ["Email", app.email || "—"],
            ["Type", businessTypeLabel(app.businessType)],
            ["City", app.city || "—"],
            ["Submitted", formatDate(app.createdAt)],
            ["Last updated", formatDate(app.updatedAt || app.reviewedAt)],
          ].map(([label, value]) => (
            <View key={label} style={styles.detailRow}>
              <Text style={styles.detailLabel}>{label}</Text>
              <Text style={styles.detailValue}>{value}</Text>
            </View>
          ))}
        </View>

        {app.status === "pending" ? (
          <View style={styles.infoCard}>
            <Ionicons name="information-circle-outline" size={20} color={ExploreColors.primary} />
            <Text style={styles.infoText}>
              Review usually takes 1–2 business days. Pull down to refresh and check for updates.
            </Text>
          </View>
        ) : null}

        {app.status === "approved" ? (
          <>
            <View style={styles.credentialsCard}>
              <View style={styles.credentialsHeader}>
                <Ionicons name="key-outline" size={22} color="#16A34A" />
                <Text style={styles.credentialsTitle}>Vendor app login</Text>
              </View>
              <Text style={styles.credentialsHint}>
                Download the Explore Vendor app and sign in with these credentials:
              </Text>
              <View style={styles.credentialRow}>
                <Text style={styles.credentialLabel}>Login ID (Phone)</Text>
                <Text style={styles.credentialValue} selectable>
                  {app.phone}
                </Text>
              </View>
              <View style={styles.credentialRow}>
                <Text style={styles.credentialLabel}>Password</Text>
                {app.vendorLoginPassword ? (
                  <Text style={styles.credentialValue} selectable>
                    {app.vendorLoginPassword}
                  </Text>
                ) : (
                  <Text style={styles.credentialMissing}>
                    Not saved — ask admin to reset your vendor password
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.nextCard}>
              <Text style={styles.sectionTitle}>Next steps</Text>
              <Text style={styles.nextStep}>1. Download & open the Explore Vendor app</Text>
              <Text style={styles.nextStep}>2. Login with phone number above</Text>
              <Text style={styles.nextStep}>3. Use the password shown above</Text>
              <Text style={styles.nextStep}>4. Add tours or stays — admin will approve listings</Text>
            </View>
          </>
        ) : null}

        {app.status === "rejected" ? (
          <View style={[styles.infoCard, { backgroundColor: "#FEF2F2" }]}>
            <Ionicons name="alert-circle-outline" size={20} color="#DC2626" />
            <Text style={[styles.infoText, { color: "#991B1B" }]}>
              {app.adminNotes || "Admin did not add a reason. You can submit a new application with updated details."}
            </Text>
          </View>
        ) : null}

        {app.status === "rejected" && !showReapplyForm ? (
          <TouchableOpacity style={styles.primaryBtn} onPress={() => setShowReapplyForm(true)}>
            <Text style={styles.primaryBtnText}>Submit New Application</Text>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity style={styles.secondaryBtn} onPress={() => loadData(true)}>
          <Ionicons name="refresh-outline" size={18} color={ExploreColors.primary} />
          <Text style={styles.secondaryBtnText}>Refresh status</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={ExploreColors.primary} />
      </View>
    );
  }

  const showStatus = application && !(application.status === "rejected" && showReapplyForm);

  return (
    <AppScreen variant="stack" style={styles.safe}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="arrow-back" size={24} color={ExploreColors.text} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>
          {showStatus ? "Partner Application" : "Become a Vendor"}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {showStatus ? (
        renderStatusPanel(application)
      ) : (
        <ScrollView contentContainerStyle={styles.form} showsVerticalScrollIndicator={false}>
          {application?.status === "rejected" ? (
            <View style={styles.reapplyBanner}>
              <Text style={styles.reapplyTitle}>Apply again</Text>
              <Text style={styles.reapplySub}>Update your details and resubmit for admin review.</Text>
            </View>
          ) : (
            <Text style={styles.intro}>
              List your hotels, tours or experiences. Admin will verify and give you vendor login credentials.
            </Text>
          )}

          <Text style={styles.label}>Business Name *</Text>
          <TextInput style={styles.input} value={businessName} onChangeText={setBusinessName} placeholder="Your business name" />

          <Text style={styles.label}>Owner Name *</Text>
          <TextInput style={styles.input} value={ownerName} onChangeText={setOwnerName} placeholder="Full name" />

          <Text style={styles.label}>Phone (Login ID) *</Text>
          <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="10-digit mobile" />

          <Text style={styles.label}>Email</Text>
          <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />

          <Text style={styles.label}>Business Type</Text>
          <View style={styles.typeRow}>
            {BUSINESS_TYPES.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[styles.typeChip, businessType === type.id && styles.typeChipActive]}
                onPress={() => setBusinessType(type.id)}
              >
                <Text style={[styles.typeText, businessType === type.id && styles.typeTextActive]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Address</Text>
          <TextInput style={styles.input} value={address} onChangeText={setAddress} placeholder="Business address" />

          <View style={styles.row}>
            <View style={styles.half}>
              <Text style={styles.label}>City</Text>
              <TextInput style={styles.input} value={city} onChangeText={setCity} />
            </View>
            <View style={styles.half}>
              <Text style={styles.label}>State</Text>
              <TextInput style={styles.input} value={state} onChangeText={setState} />
            </View>
          </View>

          <Text style={styles.label}>GST Number (optional)</Text>
          <TextInput style={styles.input} value={gstNumber} onChangeText={setGstNumber} />

          <Text style={styles.label}>About your business</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            placeholder="Tell us about your services..."
          />

          <TouchableOpacity
            style={[styles.primaryBtn, submitting && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryBtnText}>Submit Application</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: ExploreColors.background },
  loader: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: ExploreColors.background },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Layout.pad,
    paddingVertical: 12,
    backgroundColor: ExploreColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: ExploreColors.borderLight,
  },
  topTitle: { fontSize: 18, fontWeight: "700", color: ExploreColors.text },
  statusScroll: { padding: Layout.pad, paddingBottom: 40, gap: Layout.gap },
  heroCard: {
    borderRadius: Layout.radius,
    padding: Layout.pad,
    alignItems: "center",
    ...ExploreShadow.card,
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  heroTitle: { fontSize: 22, fontWeight: "800" },
  heroSub: { fontSize: 14, color: ExploreColors.textSecondary, textAlign: "center", marginTop: 4 },
  statusPill: {
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: ExploreColors.surface,
  },
  statusPillText: { fontSize: 12, fontWeight: "800", letterSpacing: 0.5 },
  timelineCard: {
    backgroundColor: ExploreColors.surface,
    borderRadius: Layout.radius,
    padding: Layout.pad,
    ...ExploreShadow.card,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: ExploreColors.text, marginBottom: 12 },
  timelineRow: { flexDirection: "row", alignItems: "flex-start", minHeight: 44 },
  timelineLeft: { width: 28, alignItems: "center" },
  timelineDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: ExploreColors.border,
    backgroundColor: ExploreColors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  timelineDotDone: { backgroundColor: ExploreColors.primary, borderColor: ExploreColors.primary },
  timelineDotActive: { borderColor: ExploreColors.primary },
  timelineDotInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: ExploreColors.primary },
  timelineLine: { width: 2, flex: 1, minHeight: 18, backgroundColor: ExploreColors.borderLight, marginVertical: 2 },
  timelineLineDone: { backgroundColor: ExploreColors.primary },
  timelineLabel: { flex: 1, fontSize: 14, color: ExploreColors.textSecondary, paddingTop: 2, paddingBottom: 14 },
  timelineLabelActive: { color: ExploreColors.text, fontWeight: "600" },
  detailsCard: {
    backgroundColor: ExploreColors.surface,
    borderRadius: Layout.radius,
    padding: Layout.pad,
    ...ExploreShadow.card,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: ExploreColors.borderLight,
  },
  detailLabel: { fontSize: 13, color: ExploreColors.textSecondary, flex: 1 },
  detailValue: { fontSize: 13, fontWeight: "600", color: ExploreColors.text, flex: 1.2, textAlign: "right" },
  infoCard: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: ExploreColors.primarySoft,
    borderRadius: Layout.radiusSm,
    padding: 14,
    alignItems: "flex-start",
  },
  infoText: { flex: 1, fontSize: 13, color: ExploreColors.textSecondary, lineHeight: 20 },
  credentialsCard: {
    backgroundColor: "#F0FDF4",
    borderRadius: Layout.radius,
    padding: Layout.pad,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    ...ExploreShadow.card,
  },
  credentialsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  credentialsTitle: { fontSize: 16, fontWeight: "800", color: "#166534" },
  credentialsHint: { fontSize: 13, color: ExploreColors.textSecondary, lineHeight: 20, marginBottom: 14 },
  credentialRow: {
    backgroundColor: ExploreColors.surface,
    borderRadius: Layout.radiusSm,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#DCFCE7",
  },
  credentialLabel: { fontSize: 12, fontWeight: "600", color: ExploreColors.textSecondary, marginBottom: 6 },
  credentialValue: { fontSize: 18, fontWeight: "800", color: ExploreColors.text, letterSpacing: 0.3 },
  credentialMissing: { fontSize: 13, color: "#B45309", fontWeight: "600", lineHeight: 20 },
  nextCard: {
    backgroundColor: ExploreColors.surface,
    borderRadius: Layout.radius,
    padding: Layout.pad,
    ...ExploreShadow.card,
  },
  nextStep: { fontSize: 14, color: ExploreColors.text, lineHeight: 22, marginBottom: 6 },
  primaryBtn: {
    backgroundColor: ExploreColors.primary,
    paddingVertical: 16,
    borderRadius: Layout.radiusSm,
    alignItems: "center",
  },
  primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: Layout.radiusSm,
    borderWidth: 1,
    borderColor: ExploreColors.border,
    backgroundColor: ExploreColors.surface,
  },
  secondaryBtnText: { color: ExploreColors.primary, fontWeight: "700", fontSize: 14 },
  form: { padding: Layout.pad, paddingBottom: 40 },
  intro: { color: ExploreColors.textSecondary, marginBottom: 16, lineHeight: 20 },
  reapplyBanner: {
    backgroundColor: "#FEF3C7",
    borderRadius: Layout.radiusSm,
    padding: 14,
    marginBottom: 12,
  },
  reapplyTitle: { fontWeight: "700", color: "#92400E", fontSize: 15 },
  reapplySub: { color: "#B45309", fontSize: 13, marginTop: 4 },
  label: { fontWeight: "600", color: ExploreColors.text, marginBottom: 6, marginTop: 10 },
  input: {
    backgroundColor: ExploreColors.surface,
    borderRadius: Layout.radiusSm,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: ExploreColors.border,
    fontSize: 14,
    color: ExploreColors.text,
  },
  textArea: { minHeight: 100, textAlignVertical: "top" },
  row: { flexDirection: "row", gap: 10 },
  half: { flex: 1 },
  typeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  typeChip: {
    backgroundColor: ExploreColors.borderLight,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  typeChipActive: { backgroundColor: ExploreColors.primary },
  typeText: { color: ExploreColors.textSecondary, fontWeight: "600", fontSize: 13 },
  typeTextActive: { color: "#fff" },
});