// In dev, Vite proxies /api → localhost:5000 (see vite.config.ts)
const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "";

export const apiUrl = (path: string) =>
  `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;

export const getToken = () => localStorage.getItem("adminToken");

export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(apiUrl(path), { ...options, headers });
  const data = await response.json().catch(() => ({}));

  if (response.status === 401) {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminData");
    window.location.reload();
    throw new Error("Session expired. Please login again.");
  }

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }
  return data;
}