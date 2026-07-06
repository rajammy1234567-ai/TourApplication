import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../api";
import { Badge } from "../components/ui/Badge";
import { EmptyState } from "../components/ui/EmptyState";
import { PageBanner } from "../components/ui/PageBanner";
import { PageToolbar } from "../components/ui/PageToolbar";
import { StatCard } from "../components/ui/StatCard";
import {
  IconHotel,
  IconInbox,
  IconPanelTitle,
  IconTicket,
  IconWallet,
} from "../components/ui/Icons";
import { formatDate, formatINR, initials } from "../utils/format";

type Booking = {
  _id: string;
  type?: "tour" | "hotel";
  packageName: string;
  listingTitle?: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount?: number;
  bookingStatus: string;
  paymentStatus: string;
  travelers?: number;
  guests?: number;
  rooms?: number;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  userId?: { fullname?: string; email?: string; phone?: string };
};

export function Bookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"all" | "tour" | "hotel">("all");

  useEffect(() => {
    apiFetch("/api/admin/bookings")
      .then((data) => setBookings(data.bookings || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return bookings.filter((b) => {
      const matchesTab = tab === "all" || b.type === tab;
      if (!matchesTab) return false;
      if (!q) return true;
      return (
        (b.packageName || "").toLowerCase().includes(q) ||
        (b.listingTitle || "").toLowerCase().includes(q) ||
        (b.userId?.fullname || "").toLowerCase().includes(q) ||
        (b.userId?.phone || "").includes(q)
      );
    });
  }, [bookings, search, tab]);

  const tourBookings = bookings.filter((b) => b.type !== "hotel");
  const hotelBookings = bookings.filter((b) => b.type === "hotel");
  const totalRevenue = bookings.reduce((s, b) => s + (b.paidAmount || 0), 0);
  const confirmedCount = bookings.filter((b) => b.bookingStatus === "Confirmed").length;

  return (
    <div>
      <PageBanner
        page="bookings"
        icon={<IconTicket size={28} />}
        label="All Bookings"
        hint="Tour packages and hotel stays booked on Explore"
        pills={[
          { value: bookings.length, label: "Total", gold: true },
          { value: formatINR(totalRevenue), label: "Revenue" },
          { value: confirmedCount, label: "Confirmed" },
        ]}
      />

      <PageToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search booking, traveler, phone..."
      />

      <div className="filter-row filter-row-travel">
        {[
          { id: "all" as const, label: `All (${bookings.length})` },
          { id: "tour" as const, label: `Tours (${tourBookings.length})` },
          { id: "hotel" as const, label: `Stays (${hotelBookings.length})` },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            className={`filter-btn ${tab === item.id ? "active" : ""}`}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="stats-grid stats-grid-compact">
        <StatCard label="All Bookings" value={bookings.length} tone="cyan" icon={<IconTicket size={22} />} />
        <StatCard label="Tour Bookings" value={tourBookings.length} tone="blue" icon={<IconTicket size={22} />} />
        <StatCard label="Stay Bookings" value={hotelBookings.length} tone="purple" icon={<IconHotel size={22} />} />
        <StatCard label="Revenue Collected" value={formatINR(totalRevenue)} tone="green" icon={<IconWallet size={22} />} />
      </div>

      {loading ? (
        <div className="page-loading">Loading bookings</div>
      ) : (
        <div className="panel panel-travel">
          <div className="panel-head">
            <IconPanelTitle icon={<IconTicket size={18} />}>Booking Ledger</IconPanelTitle>
          </div>
          <div className="panel-body table-wrap">
            {filtered.length === 0 ? (
              <EmptyState
                icon={<IconInbox size={40} />}
                title="No bookings yet"
                subtitle="When travelers book tours or stays on Explore, details will show here."
              />
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Traveler</th>
                    <th>Type</th>
                    <th>Listing</th>
                    <th>Dates</th>
                    <th>Payment</th>
                    <th>Status</th>
                    <th>Booked On</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((b) => (
                    <tr key={b._id}>
                      <td>
                        <div className="row-user">
                          <div className="row-avatar">{initials(b.userId?.fullname)}</div>
                          <div>
                            <div className="cell-main">{b.userId?.fullname || "Traveler"}</div>
                            <div className="cell-sub">{b.userId?.phone || b.userId?.email || "—"}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <Badge status={b.type === "hotel" ? "hotel" : "tour"} />
                      </td>
                      <td>
                        <div className="cell-main">{b.packageName || b.listingTitle}</div>
                        {b.type === "hotel" ? (
                          <div className="cell-sub">{b.rooms || 1} room(s) · {b.guests || b.travelers || 1} guest(s)</div>
                        ) : (
                          b.travelers && <div className="cell-sub">{b.travelers} travelers</div>
                        )}
                      </td>
                      <td className="cell-sub">
                        {b.startDate ? `${formatDate(b.startDate)} → ${formatDate(b.endDate)}` : "—"}
                      </td>
                      <td>
                        <div className="cell-main">{formatINR(b.paidAmount)} paid</div>
                        <div className="cell-sub">of {formatINR(b.totalAmount)}</div>
                      </td>
                      <td>
                        <Badge status={b.bookingStatus} />
                        <div className="cell-sub" style={{ marginTop: 4 }}>{b.paymentStatus}</div>
                      </td>
                      <td className="cell-sub">{formatDate(b.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}