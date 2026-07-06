import { useEffect, useState } from "react";
import { apiFetch } from "../api";
import { StatCard } from "../components/ui/StatCard";
import { Badge } from "../components/ui/Badge";
import { EmptyState } from "../components/ui/EmptyState";
import {
  IconBell,
  IconClipboard,
  IconHandshake,
  IconHotel,
  IconInbox,
  IconLuggage,
  IconMap,
  IconPanelTitle,
  IconPlane,
  IconStore,
  IconTicket,
  IconUsers,
} from "../components/ui/Icons";
import { formatDate, formatINR, initials } from "../utils/format";
import type { Page } from "../components/Layout";

type Stats = {
  users: number;
  vendors: number;
  pendingApplications: number;
  tours: number;
  hotels: number;
  pendingTours: number;
  pendingHotels: number;
  bookings: number;
  hotelBookings?: number;
  events: number;
};

type Booking = {
  _id: string;
  packageName: string;
  paidAmount: number;
  totalAmount: number;
  bookingStatus: string;
  createdAt: string;
  userId?: { fullname?: string; phone?: string };
};

export function Dashboard({ onNavigate }: { onNavigate: (p: Page) => void }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch("/api/admin/dashboard"),
      apiFetch("/api/admin/bookings"),
    ])
      .then(([dash, book]) => {
        setStats(dash.stats);
        setBookings((book.bookings || []).slice(0, 6));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-loading">Loading your travel platform</div>;

  const pendingListings = (stats?.pendingTours || 0) + (stats?.pendingHotels || 0);

  return (
    <div>
      <div className="travel-hero">
        <div className="travel-hero-bg" />
        <div className="travel-hero-content">
          <div>
            <h2>
              Explore<span style={{ color: "var(--gold)" }}>.</span> Admin
            </h2>
            <p>
              The official control panel for your tour & travel app — manage
              packages, stays, partners & every booking in one place.
            </p>
          </div>
          <div className="travel-hero-stats">
            <div className="hero-pill gold">
              <strong>{stats?.bookings ?? 0}</strong>
              <span>Trips Booked</span>
            </div>
            <div className="hero-pill">
              <strong>{stats?.tours ?? 0}</strong>
              <span>Tour Packages</span>
            </div>
            <div className="hero-pill">
              <strong>{stats?.hotels ?? 0}</strong>
              <span>Stays Listed</span>
            </div>
          </div>
        </div>
      </div>

      {(stats?.pendingApplications || 0) > 0 && (
        <div className="alert-banner">
          <span className="alert-icon"><IconBell size={18} /></span>
          <strong>{stats?.pendingApplications}</strong> new partner(s) want to list tours/stays on Explore —{" "}
          <button type="button" className="btn-ghost" onClick={() => onNavigate("applications")}>
            Review applications →
          </button>
        </div>
      )}

      {pendingListings > 0 && (
        <div className="alert-banner">
          <span className="alert-icon"><IconClipboard size={18} /></span>
          <strong>{pendingListings}</strong> tour package(s) or stay(s) need your approval —{" "}
          <button type="button" className="btn-ghost" onClick={() => onNavigate("listings")}>
            Review listings →
          </button>
        </div>
      )}

      <div className="stats-grid">
        <StatCard label="Travelers" value={stats?.users ?? 0} tone="blue" icon={<IconLuggage size={22} />} sub="Registered users" />
        <StatCard label="Tour Partners" value={stats?.vendors ?? 0} tone="green" icon={<IconHandshake size={22} />} sub="Active vendors" />
        <StatCard label="Partner Requests" value={stats?.pendingApplications ?? 0} tone="amber" icon={<IconClipboard size={22} />} />
        <StatCard label="Tour Packages" value={stats?.tours ?? 0} tone="purple" icon={<IconPlane size={22} />} sub={`${stats?.pendingTours || 0} pending`} />
        <StatCard label="Hotels & Stays" value={stats?.hotels ?? 0} tone="rose" icon={<IconHotel size={22} />} sub={`${stats?.pendingHotels || 0} pending`} />
        <StatCard label="Trip Bookings" value={stats?.bookings ?? 0} tone="cyan" icon={<IconTicket size={22} />} />
      </div>

      <div className="quick-grid">
        {[
          { page: "bookings" as Page, label: "Trip Bookings", sub: "Who booked what", icon: <IconTicket size={20} /> },
          { page: "listings" as Page, label: "Tours & Stays", sub: "Approve packages", icon: <IconMap size={20} /> },
          { page: "applications" as Page, label: "Partner Requests", sub: "New vendors", icon: <IconClipboard size={20} /> },
          { page: "vendors" as Page, label: "Tour Partners", sub: "Manage vendors", icon: <IconStore size={20} /> },
          { page: "users" as Page, label: "Travelers", sub: "Customer database", icon: <IconUsers size={20} /> },
        ].map((q) => (
          <button key={q.page} type="button" className="quick-card" onClick={() => onNavigate(q.page)}>
            <div className="quick-icon">{q.icon}</div>
            <strong>{q.label}</strong>
            <span>{q.sub}</span>
          </button>
        ))}
      </div>

      <div className="panel panel-travel">
        <div className="panel-head">
          <IconPanelTitle icon={<IconTicket size={18} />}>Latest Trip Bookings</IconPanelTitle>
          <button type="button" className="panel-link" onClick={() => onNavigate("bookings")}>
            View all bookings →
          </button>
        </div>
        <div className="panel-body table-wrap">
          {bookings.length === 0 ? (
            <EmptyState
              icon={<IconInbox size={40} />}
              title="No trip bookings yet"
              subtitle="When travelers book tours on Explore, they'll show up here."
            />
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Traveler</th>
                  <th>Tour Package</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Booked On</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b._id}>
                    <td>
                      <div className="row-user">
                        <div className="row-avatar">{initials(b.userId?.fullname)}</div>
                        <div>
                          <div className="cell-main">{b.userId?.fullname || "Traveler"}</div>
                          <div className="cell-sub">{b.userId?.phone || "—"}</div>
                        </div>
                      </div>
                    </td>
                    <td className="cell-main">{b.packageName}</td>
                    <td>
                      <div className="cell-main">{formatINR(b.paidAmount)}</div>
                      <div className="cell-sub">of {formatINR(b.totalAmount)}</div>
                    </td>
                    <td><Badge status={b.bookingStatus} /></td>
                    <td className="cell-sub">{formatDate(b.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}