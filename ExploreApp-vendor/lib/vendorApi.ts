import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiFetch } from "../constants/api";
import { MOCK_BOOKINGS, MOCK_DASHBOARD } from "../constants/mockData";

const isSkipMode = async () => {
  const token = await AsyncStorage.getItem("vendorToken");
  return token === "dev_skip";
};

type RequestOptions = {
  method?: string;
  body?: Record<string, unknown>;
};

const vendorFetch = async (path: string, options: RequestOptions = {}) => {
  if (await isSkipMode()) {
    throw new Error("Dev skip mode does not support this action");
  }

  const token = await AsyncStorage.getItem("vendorToken");
  const response = await apiFetch(path, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    timeoutMs: 55000,
  });

  let data: any = null;
  try {
    data = await response.json();
  } catch {
    throw new Error(`Server error (HTTP ${response.status})`);
  }

  if (response.status === 401) {
    await AsyncStorage.multiRemove(["vendorToken", "vendorData"]);
    throw new Error("Session expired. Please login again.");
  }

  if (!response.ok || !data.success) {
    throw new Error(data.message || data.msg || "Request failed");
  }
  return data;
};

export const fetchDashboard = async () => {
  if (await isSkipMode()) return MOCK_DASHBOARD;
  const data = await vendorFetch("/api/vendor/dashboard");
  return data.dashboard;
};

export const fetchBookings = async () => {
  if (await isSkipMode()) return MOCK_BOOKINGS;
  const data = await vendorFetch("/api/vendor/bookings");
  return data.bookings;
};

export const fetchTours = async () => {
  if (await isSkipMode()) return [];
  const data = await vendorFetch("/api/vendor/tours");
  return data.tours || [];
};

export const fetchTourById = async (tourId: string) => {
  const data = await vendorFetch(`/api/vendor/tours/${tourId}`);
  return data.tour;
};

export const fetchHotels = async () => {
  if (await isSkipMode()) return [];
  const data = await vendorFetch("/api/hotels/vendor/my-listings");
  return data.hotels || [];
};

export const fetchHotelById = async (hotelId: string) => {
  const data = await vendorFetch(`/api/hotels/vendor/${hotelId}`);
  return data.hotel;
};

export const createTour = async (body: Record<string, unknown>) => {
  const data = await vendorFetch("/api/vendor/tours", { method: "POST", body });
  return data.tour;
};

export const createHotel = async (body: Record<string, unknown>) => {
  const data = await vendorFetch("/api/hotels/vendor", { method: "POST", body });
  return data.hotel;
};

export const deleteTour = async (tourId: string) => {
  await vendorFetch(`/api/vendor/tours/${tourId}`, { method: "DELETE" });
};

export const deleteHotel = async (hotelId: string) => {
  await vendorFetch(`/api/hotels/vendor/${hotelId}`, { method: "DELETE" });
};

export const updateTour = async (tourId: string, body: Record<string, unknown>) => {
  const data = await vendorFetch(`/api/vendor/tours/${tourId}`, {
    method: "PUT",
    body,
  });
  return data.tour;
};

export const updateHotel = async (hotelId: string, body: Record<string, unknown>) => {
  const data = await vendorFetch(`/api/hotels/vendor/${hotelId}`, {
    method: "PUT",
    body,
  });
  return data.hotel;
};