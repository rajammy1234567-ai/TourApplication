/** Production API — always used on live static hosting */
const PROD_API = "https://tourapplication-api.onrender.com";

/**
 * Dev: empty base → Vite proxy to localhost:5000
 * Prod build: VITE_API_BASE_URL or hard fallback to Render
 */
const API_BASE = (
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ||
  (import.meta.env.DEV ? "" : PROD_API)
).replace(/\/$/, "");

export const apiUrl = (path: string) => {
  const p = path.startsWith("/") ? path : `/${path}`;
  // Safety: never hit admin domain for /api on production
  if (!API_BASE && typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host.includes("onrender.com") || host.includes("viztravel")) {
      return `${PROD_API}${p}`;
    }
  }
  return `${API_BASE}${p}`;
};

export const getToken = () => localStorage.getItem("adminToken");

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs = 45000
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const url = apiUrl(path);
  let response: Response;
  try {
    response = await fetchWithTimeout(url, { ...options, headers });
  } catch (err: any) {
    if (err?.name === "AbortError") {
      throw new Error(
        "Server is waking up (Render free plan can take ~1 min). Wait and try again."
      );
    }
    throw new Error(
      "Cannot reach API. Check internet or open https://tourapplication-api.onrender.com/health"
    );
  }

  const data = await response.json().catch(() => ({}));

  if (response.status === 401) {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminData");
    window.location.reload();
    throw new Error("Session expired. Please login again.");
  }

  if (!response.ok) {
    throw new Error(data.message || data.msg || `Request failed (${response.status})`);
  }
  return data;
}
