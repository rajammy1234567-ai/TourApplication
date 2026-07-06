import React, { useCallback, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import { AppScreen } from "../components/explore/AppScreen";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { apiUrl } from "../constants/api";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value || 0);

export default function MyBookings() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const fetchBookings = async () => {
    try {
      setError("");
      const token = await AsyncStorage.getItem("token");

      if (!token) {
        router.replace("/(auth)/login");
        return;
      }

      const response = await fetch(apiUrl("/api/bookings/my-bookings"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load bookings");
      }

      setBookings(data.bookings || []);
    } catch (err: any) {
      setError(err.message || "Unable to load bookings");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchBookings();
    }, []),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  const handleDownloadInvoice = async (booking: any) => {
    try {
      setDownloadingId(booking._id);
      const token = await AsyncStorage.getItem("token");
      
      const res = await fetch(apiUrl(`/api/invoice/booking/${booking._id}`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.msg || "Invoice not ready yet. Please try again in a moment.");
      }

      const invoice = data.invoice;
      const html = `
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
            <style>
              body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 30px; color: #1e293b; background: #fff; }
              .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #0F3B82; padding-bottom: 25px; margin-bottom: 30px; }
              .logo-container { flex: 1; }
              .logo { font-size: 28px; font-weight: 900; color: #0F3B82; letter-spacing: -1px; }
              .logo-sub { font-size: 10px; color: #64748b; letter-spacing: 2px; text-transform: uppercase; margin-top: 2px; }
              .invoice-header { text-align: right; }
              .invoice-title { font-size: 24px; font-weight: 800; color: #1e293b; margin-bottom: 5px; }
              .invoice-number { font-size: 14px; color: #475569; font-weight: 600; }
              
              .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
              .info-section { }
              .info-label { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 0.5px; }
              .info-text { font-size: 14px; font-weight: 600; line-height: 1.5; }
              
              table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
              th { text-align: left; background: #f8fafc; padding: 12px; font-size: 12px; font-weight: 700; color: #475569; border-bottom: 2px solid #e2e8f0; text-transform: uppercase; }
              td { padding: 15px 12px; font-size: 14px; border-bottom: 1px solid #f1f5f9; }
              .item-desc { font-weight: 700; color: #1e293b; }
              .item-sub { font-size: 12px; color: #64748b; margin-top: 4px; }
              
              .totals-container { margin-left: auto; width: 300px; background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; }
              .total-row { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px; font-weight: 600; }
              .grand-total { margin-top: 15px; padding-top: 15px; border-top: 2px dashed #cbd5e1; font-size: 20px; font-weight: 800; color: #0F3B82; }
              
              .legal-notice { margin-top: 60px; padding: 20px; border-left: 4px solid #0F3B82; background: #f1f5f9; font-size: 11px; color: #475569; line-height: 1.6; }
              .stamp-container { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 60px; }
              .signature-line { border-top: 1px solid #1e293b; width: 180px; text-align: center; font-size: 10px; font-weight: 700; padding-top: 8px; }
              .official-stamp { border: 3px double #0F3B82; color: #0F3B82; padding: 8px 15px; font-weight: 900; font-size: 12px; transform: rotate(-5deg); border-radius: 8px; display: inline-block; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="logo-container">
                <div class="logo">VIZ TRAVEL</div>
                <div class="logo-sub">Exploring the Horizon</div>
              </div>
              <div class="invoice-header">
                <div class="invoice-title">TAX INVOICE</div>
                <div class="invoice-number">${invoice.invoiceNumber}</div>
                <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Date: ${new Date(invoice.issueDate).toLocaleDateString()}</div>
              </div>
            </div>

            <div class="info-grid">
              <div class="info-section">
                <div class="info-label">Billed To</div>
                <div class="info-text">${invoice.customerName}</div>
                <div class="info-text" style="font-weight: 400; color: #64748b;">${invoice.customerEmail}</div>
              </div>
              <div class="info-section">
                <div class="info-label">Payment Details</div>
                <div class="info-text">Razorpay: ${invoice.razorpayPaymentId}</div>
                <div class="info-text" style="color: #059669; text-transform: uppercase;">Status: ${invoice.paymentStatus}</div>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th style="text-align: right;">Quantity</th>
                  <th style="text-align: right;">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <div class="item-desc">${invoice.packageName}</div>
                    <div class="item-sub">Dates: ${new Date(invoice.details.startDate).toLocaleDateString()} - ${new Date(invoice.details.endDate).toLocaleDateString()}</div>
                  </td>
                  <td style="text-align: right;">${invoice.details.travelers} Adult(s)</td>
                  <td style="text-align: right;">₹${invoice.totalAmount.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>

            <div class="totals-container">
              <div class="total-row"><span>Sub Total</span> <span>₹${invoice.totalAmount.toLocaleString()}</span></div>
              <div class="total-row"><span>Taxes & Fees (Included)</span> <span>₹0.00</span></div>
              <div class="total-row" style="color: #059669;"><span>Advance Paid</span> <span>- ₹${invoice.paidAmount.toLocaleString()}</span></div>
              <div class="total-row grand-total"><span>Balance Due</span> <span>₹${invoice.remainingAmount.toLocaleString()}</span></div>
            </div>

            <div class="legal-notice">
              <strong>LEGAL NOTICE:</strong> This is a computer-generated tax invoice legally issued by <strong>VIZ TRAVEL (OPC) PVT LTD</strong>. No physical signature is required. This document serves as an official receipt of the advance payment received for the services mentioned above.
            </div>

            <div class="stamp-container">
              <div class="official-stamp">LEGALLY ISSUED<br>VIZ TRAVEL</div>
              <div class="signature-line">Authorized Signatory</div>
            </div>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { UTI: ".pdf", mimeType: "application/pdf" });

    } catch (err: any) {
      Alert.alert("Download Failed", err.message || "Could not generate invoice.");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <AppScreen variant="stack" style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={22} color="#111" />
        </TouchableOpacity>
        <Text style={styles.heading}>My Bookings ({bookings.length})</Text>
        <View style={styles.iconBtn} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#0F3B82" />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.error}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchBookings}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item) => item._id}
          contentContainerStyle={
            bookings.length ? styles.list : styles.emptyWrap
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="briefcase-outline" size={34} color="#94A3B8" />
              <Text style={styles.emptyTitle}>No bookings yet</Text>
              <Text style={styles.emptyText}>
                Confirmed bookings will appear here after payment.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const isHotel = item.type === "hotel";
            const peopleCount = isHotel
              ? item.guests || item.travelers || 1
              : (item.travelers || 0) + (item.children || 0);
            const balance = item.remainingAmount ?? Math.max(0, (item.totalAmount || 0) - (item.paidAmount || 0));

            return (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.packageName}>{item.packageName}</Text>
                    <Text style={styles.bookingType}>{isHotel ? "Hotel Stay" : "Tour Package"}</Text>
                  </View>
                  <View style={styles.statusBadge}>
                    <Text style={styles.status}>{item.bookingStatus}</Text>
                  </View>
                </View>

                <View style={styles.detailsRow}>
                  <View style={styles.detailItem}>
                    <Ionicons name="calendar-outline" size={14} color="#64748B" />
                    <Text style={styles.detailText}>
                      {item.startDate
                        ? `${new Date(item.startDate).toLocaleDateString()}${item.endDate ? ` → ${new Date(item.endDate).toLocaleDateString()}` : ""}`
                        : "Dates TBA"}
                    </Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Ionicons name={isHotel ? "bed-outline" : "people-outline"} size={14} color="#64748B" />
                    <Text style={styles.detailText}>
                      {isHotel ? `${item.rooms || 1} room(s) · ${peopleCount} guest(s)` : `${peopleCount} travelers`}
                    </Text>
                  </View>
                </View>

                <View style={styles.amountRow}>
                  <View>
                    <Text style={styles.label}>Paid Amount</Text>
                    <Text style={styles.value}>{formatCurrency(item.paidAmount)}</Text>
                  </View>
                  <View style={styles.rightAmount}>
                    <Text style={styles.label}>Balance Due</Text>
                    <Text style={styles.remaining}>{formatCurrency(balance)}</Text>
                  </View>
                </View>

                <View style={styles.footer}>
                  <View>
                    <Text style={styles.paymentStatus}>
                      {item.razorpayPaymentId
                        ? `Payment ID: ${item.razorpayPaymentId.slice(-8).toUpperCase()}`
                        : item.paymentStatus || "Confirmed"}
                    </Text>
                    <Text style={styles.date}>
                      Booked on {new Date(item.createdAt).toLocaleDateString()}
                    </Text>
                  </View>

                  {!isHotel ? (
                    <TouchableOpacity
                      style={[styles.downloadBtn, downloadingId === item._id && styles.downloadBtnDisabled]}
                      onPress={() => handleDownloadInvoice(item)}
                      disabled={downloadingId === item._id}
                    >
                      {downloadingId === item._id ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <>
                          <Ionicons name="download-outline" size={16} color="#fff" />
                          <Text style={styles.downloadText}>Invoice</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            );
          }}
        />
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F6F8FC" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#fff",
    elevation: 1,
  },
  iconBtn: { width: 36, height: 36, justifyContent: "center" },
  heading: { fontSize: 18, fontWeight: "700", color: "#111827" },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  error: { color: "#B91C1C", textAlign: "center", marginBottom: 14 },
  retryBtn: {
    backgroundColor: "#0F3B82",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: { color: "#fff", fontWeight: "700" },
  list: { padding: 16, paddingBottom: 32 },
  emptyWrap: { flexGrow: 1, justifyContent: "center", padding: 24 },
  empty: { alignItems: "center" },
  emptyTitle: {
    marginTop: 10,
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
  },
  emptyText: { marginTop: 6, textAlign: "center", color: "#64748B" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12,
  },
  packageName: { fontSize: 16, fontWeight: "700", color: "#111827" },
  bookingType: { fontSize: 12, color: "#64748B", marginTop: 2 },
  statusBadge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  status: { color: "#166534", fontSize: 12, fontWeight: "700" },
  detailsRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  detailText: {
    fontSize: 13,
    color: "#64748B",
  },
  amountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#F8FAFC",
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  rightAmount: { alignItems: "flex-end" },
  label: { color: "#64748B", fontSize: 11, textTransform: "uppercase", fontWeight: "600" },
  value: { marginTop: 4, fontWeight: "800", color: "#0F3B82", fontSize: 15 },
  remaining: { marginTop: 4, fontWeight: "800", color: "#B45309", fontSize: 15 },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 16,
  },
  paymentStatus: { color: "#64748B", fontSize: 11, fontWeight: "600" },
  date: { color: "#94A3B8", fontSize: 11, marginTop: 2 },
  downloadBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#0F3B82",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  downloadBtnDisabled: {
    opacity: 0.7,
  },
  downloadText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
});
