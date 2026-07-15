import { useState } from "react";
import { apiUrl } from "../api";
import { BrandLogo } from "../components/BrandLogo";
import {
  IconHandshake,
  IconHotel,
  IconMap,
  IconTicket,
} from "../components/ui/Icons";

const FEATURES = [
  { icon: <IconMap size={18} />, text: "Approve tours & adventure packages" },
  { icon: <IconHotel size={18} />, text: "Manage hotel & homestay listings" },
  { icon: <IconHandshake size={18} />, text: "Onboard tour partners & vendors" },
  { icon: <IconTicket size={18} />, text: "Track traveler bookings & revenue" },
];

export function Login({ onSuccess }: { onSuccess: (token: string, admin: object) => void }) {
  const [email, setEmail] = useState("admin@explore.com");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 45000);
      let res: Response;
      try {
        res = await fetch(apiUrl("/api/admin/login"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            password: password.trim(),
          }),
          signal: controller.signal,
        });
      } catch (netErr: any) {
        if (netErr?.name === "AbortError") {
          throw new Error(
            "API is waking up (can take ~1 min on free plan). Wait a few seconds and login again."
          );
        }
        throw new Error(
          "Cannot reach live API. Open https://tourapplication-api.onrender.com/health then retry."
        );
      } finally {
        clearTimeout(timer);
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.message || `Login failed (${res.status})`);
      }
      onSuccess(data.token, data.admin);
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-hero">
        <div className="login-hero-bg" />
        <div className="login-hero-content">
          <BrandLogo size="lg" />
          <h1>
            Manage your <em>travel empire</em>
          </h1>
          <p>
            The official admin panel for VizTravel — approve tour packages, manage
            hotel stays, onboard vendors & track every booking.
          </p>
          <div className="login-features">
            {FEATURES.map((f) => (
              <div key={f.text} className="login-feature">
                <div className="login-feature-icon">{f.icon}</div>
                {f.text}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="login-form-side">
        <form className="login-card" onSubmit={handleSubmit}>
          <h2>VizTravel Admin</h2>
          <p className="sub">Tour & Travel App — Official Control Panel</p>
          {error && <div className="error-banner">{error}</div>}
          <div className="field">
            <label>Admin Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="admin@explore.com"
            />
          </div>
          <div className="field">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>
          <button type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Enter Admin Panel →"}
          </button>
        </form>
      </div>
    </div>
  );
}