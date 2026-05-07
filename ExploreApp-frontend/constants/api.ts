export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "http://localhost:5000";

export const apiUrl = (path: string) =>
  `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;