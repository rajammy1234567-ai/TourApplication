import React, { useMemo, useState } from "react";
// import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Image } from "expo-image";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppScreen } from "../components/explore/AppScreen";
import { useAppInsets } from "../hooks/use-app-insets";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Calendar } from "react-native-calendars";
import { apiUrl } from "../constants/api";

declare const document: any;
declare const require: any;
declare const window: any;

const showAlert = (title: string, message?: string) => {
  if (Platform.OS === "web") {
    alert(message ? `${title}\n${message}` : title);
    return;
  }

  Alert.alert(title, message);
};

const getStorageItem = async (key: string) => {
  try {
    if (Platform.OS === "web") {
      return localStorage.getItem(key);
    } else {
      return await AsyncStorage.getItem(key);
    }
  } catch (err) {
    console.log("Storage error:", err);
    return null;
  }
};
// const token = await getStorageItem("token");
// const userJson = await getStorageItem("user");

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);

const parsePrice = (price: unknown) => {
  const amount = Number(String(price || "0").replace(/[^0-9.]/g, ""));
  return Number.isFinite(amount) && amount > 0 ? amount : 0;
};

const loadRazorpayScript = () =>
  new Promise<boolean>((resolve) => {
    if (Platform.OS !== "web" || window?.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

export default function BookNow() {
  const params = useLocalSearchParams();
  const { footerBottomPad } = useAppInsets();
  const isHotel = String(params.type || "") === "hotel";
  const [travelers, setTravelers] = useState(1);
  const [children, setChildren] = useState(0);
  const [rooms, setRooms] = useState(1);
  const [guests, setGuests] = useState(2);
  const [meal, setMeal] = useState(false);
  const [photo, setPhoto] = useState(false);
  const [room, setRoom] = useState("1 Double Bed");
  const [dateModal, setDateModal] = useState(false);
  const [roomModal, setRoomModal] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [paying, setPaying] = useState(false);

  const listing = useMemo(
    () => ({
      tourId: String(params.tourId || params.packageId || params.id || ""),
      hotelId: String(params.hotelId || ""),
      title: String(params.title || (isHotel ? "Hotel Stay" : "Northern Lights Explorer")),
      image: String(
        params.image || "https://images.unsplash.com/photo-1501785888041-af3ef285b470"
      ),
      rating: String(params.rating || "4.9"),
      locationName: String(params.locationName || params.city || (isHotel ? "India" : "Tromso, Norway")),
      price: parsePrice(params.price || (isHotel ? "3000" : "15000")),
    }),
    [params, isHotel]
  );

  const nights = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T00:00:00`);
    const diff = Math.ceil((end.getTime() - start.getTime()) / 86400000);
    return diff > 0 ? diff : 0;
  }, [startDate, endDate]);

  const totalPeople = travelers + children;
  const adultsTotal = isHotel ? 0 : travelers * listing.price;
  const childTotal = isHotel ? 0 : children * (listing.price * 0.5);
  const mealTotal = !isHotel && meal ? totalPeople * 80 : 0;
  const photoTotal = !isHotel && photo ? totalPeople * 50 : 0;
  const stayTotal = isHotel ? nights * listing.price * rooms : 0;
  const taxes = isHotel ? stayTotal * 0.12 : (adultsTotal + childTotal) * 0.075;
  const total = isHotel
    ? stayTotal + taxes
    : adultsTotal + childTotal + mealTotal + photoTotal + taxes;
  const advance = total * 0.1;
  const remaining = total - advance;

  const getDates = () => {
    const dates: Record<string, any> = {};

    if (startDate && !endDate) {
      dates[startDate] = { 
        selected: true, 
        startingDay: true, 
        endingDay: true, 
        color: "#003D82", 
        textColor: "white" 
      };
      return dates;
    }

    if (startDate && endDate) {
      let current = new Date(startDate);
      const last = new Date(endDate);

      while (current <= last) {
        const date = current.toISOString().split("T")[0];
        const isStart = date === startDate;
        const isEnd = date === endDate;
        
        dates[date] = {
          color: isStart || isEnd ? "#003D82" : "#EAF0FF",
          textColor: isStart || isEnd ? "white" : "#003D82",
          startingDay: isStart,
          endingDay: isEnd,
        };
        current.setDate(current.getDate() + 1);
      }
    }

    return dates;
  };

  const onSelectDate = (day: any) => {
    const selected = day.dateString;

    if (!startDate || endDate) {
      setStartDate(selected);
      setEndDate("");
      return;
    }

    if (new Date(selected) < new Date(startDate)) {
      setStartDate(selected);
    } else {
      setEndDate(selected);
    }
  };

  const verifyPayment = async (paymentData: any, token: string, user: any) => {
     const response = await fetch(apiUrl("/api/payment/verify"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        razorpay_order_id: paymentData.razorpay_order_id,
        razorpay_payment_id: paymentData.razorpay_payment_id,
        razorpay_signature: paymentData.razorpay_signature,
        userId: user?._id,
        tourId: listing.tourId,
      }),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || "Payment verification failed");
    }

    return data;
  };

  const openRazorpayCheckout = async (order: any, token: string, user: any) => {
    const options = {
      key: order.keyId,
      amount: order.amount,
      currency: order.currency,
      name: "VizTravel",
      description: order.packageName || listing.title,
      order_id: order.orderId,
      prefill: {
        name: user?.fullname || "",
        email: user?.email || "",
        contact: user?.phone || "",
      },
      method: {
        upi: true,
        card: true,
        netbanking: true,
      },
      theme: { color: "#003D82" },
      handler: async (paymentData: any) => {
        await verifyPayment(paymentData, token, user);
        showAlert("Booking Confirmed", "Your 10% advance payment was successful.");
        router.replace("/myBookings");
      },
      modal: {
        ondismiss: () => showAlert("Payment cancelled"),
      },
    };

    if (Platform.OS === "web") {
      const ready = await loadRazorpayScript();
      if (!ready) throw new Error("Unable to load Razorpay Checkout");

      await new Promise<void>((resolve, reject) => {
        const checkout = new window.Razorpay({
          ...options,
          handler: async (paymentData: any) => {
            try {
              await verifyPayment(paymentData, token, user);
              showAlert("Booking Confirmed", "Your 10% advance payment was successful.");
              router.replace("/myBookings");
              resolve();
            } catch (error) {
              reject(error);
            }
          },
          modal: {
            ondismiss: () => {
              showAlert("Payment cancelled");
              resolve();
            },
          },
        });

        checkout.on("payment.failed", (response: any) => {
          reject(new Error(response?.error?.description || "Payment failed. Please try again."));
        });
        checkout.open();
      });
      return;
    }

    const RazorpayCheckout = (Platform.OS as any) !== "web" ? require("react-native-razorpay").default : null;
    if (RazorpayCheckout) {
      const paymentData = await RazorpayCheckout.open(options);
      await verifyPayment(paymentData, token, user);
      showAlert("Booking Confirmed", "Your 10% advance payment was successful.");
      router.replace("/myBookings");
    }
  };

  const handleHotelBooking = async (token: string) => {
    const response = await fetch(apiUrl("/api/bookings/hotel"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        hotelId: listing.hotelId,
        checkIn: startDate,
        checkOut: endDate,
        rooms,
        guests,
        roomType: room,
      }),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || "Unable to reserve stay");
    }

    showAlert("Reservation Confirmed", "Your hotel stay has been booked.");
    router.replace("/myBookings");
  };

  const handlePayment = async () => {
    try {
      if (paying) return;

      if (!startDate || !endDate) {
        showAlert(isHotel ? "Please select check-in and check-out dates" : "Please select travel dates");
        return;
      }

      if (isHotel && nights <= 0) {
        showAlert("Invalid stay", "Check-out must be after check-in.");
        return;
      }

      setPaying(true);

      const token = await getStorageItem("token");
      const userJson = await getStorageItem("userData");
      const user = userJson ? JSON.parse(userJson) : null;

      if (!token) {
        showAlert("Login required", "Please sign in before booking.");
        router.push("/(auth)/login");
        return;
      }

      if (isHotel) {
        await handleHotelBooking(token);
        return;
      }

      const response = await fetch(apiUrl("/api/payment/create-order"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          tourId: listing.tourId,
          userId: user?._id,
          bookingDetails: {
            startDate,
            endDate,
            travelers,
            children,
            meal,
            photo,
            room,
          },
        }),
      });

      const order = await response.json();
      if (!response.ok || !order.success) {
        throw new Error(order.message || "Unable to create payment order");
      }

      if (order.demoMode) {
        const demoRes = await fetch(apiUrl("/api/bookings/tour-demo"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            tourId: listing.tourId,
            bookingDetails: {
              startDate,
              endDate,
              travelers,
              children,
              meal,
              photo,
              room,
            },
          }),
        });
        const demoData = await demoRes.json();
        if (!demoRes.ok || !demoData.success) {
          throw new Error(demoData.message || "Demo booking failed");
        }
        showAlert("Booking Confirmed", "Tour booked successfully (demo mode).");
        router.replace("/myBookings");
        return;
      }

      await openRazorpayCheckout(order, token, user);
    } catch (err: any) {
      console.log(err);
      showAlert(isHotel ? "Booking failed" : "Payment failed", err.message || "Please try again.");
    } finally {
      setPaying(false);
    }
  };

  const rangeText =
    startDate && endDate ? `${startDate} to ${endDate}` : startDate || "Choose travel dates";

  return (
    <AppScreen variant="stackFooter" style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 + footerBottomPad }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color="#111" />
          </TouchableOpacity>
          <Text style={styles.heading}>{isHotel ? "Reserve Stay" : "Booking Details"}</Text>
          <View style={{ width: 22 }} />
        </View>

        <View style={styles.card}>
          <Image 
            source={{ uri: listing.image }} 
            style={styles.cardImg} 
            contentFit="cover"
            transition={200}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>{listing.title}</Text>
            <Text style={styles.location}>{listing.locationName}</Text>
            {!isHotel ? <Text style={styles.rating}>Rating {listing.rating}</Text> : null}
          </View>
        </View>

        <TouchableOpacity style={styles.box} onPress={() => setDateModal(true)}>
          <Ionicons name="calendar-outline" size={20} color="#003D82" />
          <View style={{ marginTop: 6 }}>
            <Text style={styles.label}>{isHotel ? "Check-in / Check-out" : "Select Date"}</Text>
            <Text style={styles.value}>{rangeText}</Text>
          </View>
        </TouchableOpacity>

        {isHotel ? (
          <>
            <Counter
              label="Rooms"
              value={rooms}
              onMinus={() => rooms > 1 && setRooms(rooms - 1)}
              onPlus={() => setRooms(rooms + 1)}
            />
            <Counter
              label="Guests"
              value={guests}
              onMinus={() => guests > 1 && setGuests(guests - 1)}
              onPlus={() => setGuests(guests + 1)}
            />
            <TouchableOpacity style={styles.box} onPress={() => setRoomModal(true)}>
              <Text style={styles.value}>Room type: {room}</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Counter
              label="Adults"
              value={travelers}
              onMinus={() => travelers > 1 && setTravelers(travelers - 1)}
              onPlus={() => setTravelers(travelers + 1)}
            />
            <Counter
              label="Children"
              value={children}
              onMinus={() => children > 0 && setChildren(children - 1)}
              onPlus={() => setChildren(children + 1)}
            />
            <TouchableOpacity style={styles.box} onPress={() => setRoomModal(true)}>
              <Text style={styles.value}>Room: {room}</Text>
            </TouchableOpacity>
            <Text style={styles.section}>Optional Add-ons</Text>
            <Addon title="Premium Meals (+80)" active={meal} onPress={() => setMeal(!meal)} />
            <Addon title="Photography (+50)" active={photo} onPress={() => setPhoto(!photo)} />
          </>
        )}

        <Text style={styles.section}>Price Summary</Text>
        <View style={styles.summary}>
          {isHotel ? (
            <>
              <Row label={`${nights || 0} night(s) x ${rooms} room(s)`} value={stayTotal} />
              <Row label="Taxes & fees" value={taxes} />
            </>
          ) : (
            <>
              <Row label="Adults" value={adultsTotal} />
              {children > 0 && <Row label="Children" value={childTotal} />}
              {meal && <Row label="Meals" value={mealTotal} />}
              {photo && <Row label="Photography" value={photoTotal} />}
              <Row label="Taxes" value={taxes} />
            </>
          )}
          <View style={styles.line} />
          <Row label="Total" value={total} big />
          {isHotel ? (
            <Row label="Due now" value={0} highlight />
          ) : (
            <>
              <Row label="Pay now (10%)" value={advance} highlight />
              <Row label="Remaining at trip" value={remaining} />
            </>
          )}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: footerBottomPad, height: 72 + footerBottomPad }]}>
        <View>
          <Text style={styles.footerLabel}>{isHotel ? "Total stay" : "Advance due"}</Text>
          <Text style={styles.total}>{formatCurrency(isHotel ? total : advance)}</Text>
        </View>
        <TouchableOpacity style={styles.payBtn} onPress={handlePayment} disabled={paying}>
          {paying ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.payText}>{isHotel ? "Reserve" : "Pay 10%"}</Text>
          )}
        </TouchableOpacity>
      </View>

      <Modal visible={dateModal} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Select Date Range</Text>
            <Calendar
              minDate={new Date().toISOString().split("T")[0]}
              markingType="period"
              markedDates={getDates()}
              onDayPress={onSelectDate}
              theme={{
                backgroundColor: "#ffffff",
                calendarBackground: "#ffffff",
                textSectionTitleColor: "#b6c1cd",
                selectedDayBackgroundColor: "#003D82",
                selectedDayTextColor: "#ffffff",
                todayTextColor: "#003D82",
                dayTextColor: "#2d4150",
                textDisabledColor: "#d9e1e8",
                dotColor: "#003D82",
                selectedDotColor: "#ffffff",
                arrowColor: "#003D82",
                disabledArrowColor: "#d9e1e8",
                monthTextColor: "#003D82",
                indicatorColor: "#003D82",
                textDayFontWeight: "400",
                textMonthFontWeight: "bold",
                textDayHeaderFontWeight: "600",
                textDayFontSize: 14,
                textMonthFontSize: 16,
                textDayHeaderFontSize: 12,
              }}
              style={styles.calendar}
            />
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => {
                setStartDate("");
                setEndDate("");
                setDateModal(false);
              }}>
                <Text style={styles.cancelText}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setDateModal(false)}>
                <Text style={styles.closeText}>Confirm Dates</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={roomModal} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Select Room</Text>
            {["1 Double Bed", "2 Single Beds", "Family Room", "Luxury Suite"].map((item) => (
              <TouchableOpacity
                key={item}
                style={styles.roomItem}
                onPress={() => {
                  setRoom(item);
                  setRoomModal(false);
                }}
              >
                <Text>{item}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.closeBtn} onPress={() => setRoomModal(false)}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </AppScreen>
  );
}

function Counter({ label, value, onMinus, onPlus }: any) {
  return (
    <View style={styles.counterRow}>
      <Text>{label}</Text>
      <View style={styles.counterWrap}>
        <TouchableOpacity style={styles.counterBtn} onPress={onMinus}>
          <Text style={styles.btnText}>-</Text>
        </TouchableOpacity>
        <Text>{value}</Text>
        <TouchableOpacity style={styles.counterBtn} onPress={onPlus}>
          <Text style={styles.btnText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function Addon({ title, active, onPress }: any) {
  return (
    <TouchableOpacity style={styles.addon} onPress={onPress}>
      <Text>{title}</Text>
      <Text>{active ? "Selected" : "Add"}</Text>
    </TouchableOpacity>
  );
}

function Row({ label, value, big = false, highlight = false }: any) {
  return (
    <View style={styles.row}>
      <Text style={[big && styles.bigText, highlight && styles.highlightText]}>{label}</Text>
      <Text style={[big && styles.bigPrice, highlight && styles.highlightText]}>
        {formatCurrency(Number(value))}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  heading: { fontSize: 18, fontWeight: "700" },
  card: {
    flexDirection: "row",
    margin: 16,
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 8,
    elevation: 3,
  },
  cardImg: { width: 72, height: 72, borderRadius: 8, marginRight: 10 },
  cardTitle: { fontWeight: "700", fontSize: 15 },
  location: { color: "#666", marginTop: 4 },
  rating: { color: "#f59e0b", marginTop: 4 },
  box: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 8,
    backgroundColor: "#f9fafb",
  },
  label: { fontSize: 12, color: "#777" },
  value: { fontWeight: "600", marginTop: 4 },
  counterRow: {
    marginHorizontal: 16,
    marginTop: 10,
    padding: 14,
    borderRadius: 8,
    backgroundColor: "#f9fafb",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  counterWrap: { flexDirection: "row", alignItems: "center" },
  counterBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: "#003D82",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 8,
  },
  btnText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  section: { margin: 16, fontSize: 16, fontWeight: "700" },
  addon: {
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 16,
    borderRadius: 8,
    backgroundColor: "#f9fafb",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  summary: {
    marginHorizontal: 16,
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 8,
    elevation: 3,
  },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  line: { height: 1, backgroundColor: "#eee", marginVertical: 8 },
  bigText: { fontWeight: "700" },
  bigPrice: { fontSize: 22, fontWeight: "700", color: "#003D82" },
  highlightText: { color: "#003D82", fontWeight: "700" },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderColor: "#eee",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerLabel: { color: "#666", fontSize: 12 },
  total: { fontSize: 22, fontWeight: "700", color: "#003D82" },
  payBtn: {
    minWidth: 120,
    backgroundColor: "#003D82",
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  payText: { color: "#fff", fontWeight: "700" },
  modalBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalBox: { backgroundColor: "#fff", borderRadius: 24, padding: 24, elevation: 10 },
  modalTitle: { fontSize: 20, fontWeight: "800", marginBottom: 20, color: "#111827", textAlign: "center" },
  calendar: { borderRadius: 12, marginBottom: 10 },
  modalFooter: { flexDirection: "row", gap: 12, marginTop: 15 },
  cancelBtn: { flex: 1, backgroundColor: "#F3F4F6", padding: 14, borderRadius: 14, alignItems: "center" },
  cancelText: { color: "#4B5563", fontWeight: "700" },
  closeBtn: { flex: 2, backgroundColor: "#003D82", padding: 14, borderRadius: 14, alignItems: "center" },
  closeText: { color: "#fff", fontWeight: "700" },
  roomItem: { paddingVertical: 16, borderBottomWidth: 1, borderColor: "#F3F4F6" },
});