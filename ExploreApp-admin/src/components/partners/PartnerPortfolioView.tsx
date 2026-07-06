import { Badge } from "../ui/Badge";
import { formatDate, formatINR } from "../../utils/format";

export type VendorStats = {
  tours: number;
  toursApproved?: number;
  toursPending?: number;
  toursRejected?: number;
  hotels: number;
  hotelsApproved?: number;
  hotelsPending?: number;
  hotelsRejected?: number;
  tourBookings: number;
  hotelBookings: number;
  totalBookings: number;
  upcomingBookings?: number;
  completedBookings?: number;
  tourRevenue?: number;
  hotelRevenue?: number;
  totalRevenue?: number;
};

type TourListing = {
  _id: string;
  title: string;
  location?: string;
  price?: number;
  status: string;
  duration?: string;
  createdAt?: string;
};

type HotelListing = {
  _id: string;
  title: string;
  city?: string;
  location?: string;
  pricePerNight?: number;
  status: string;
  propertyType?: string;
  createdAt?: string;
};

type VendorBooking = {
  _id: string;
  type: "tour" | "hotel";
  customerName?: string;
  customerPhone?: string;
  listingTitle?: string;
  listingLocation?: string;
  startDate?: string | null;
  endDate?: string | null;
  checkIn?: string | null;
  checkOut?: string | null;
  travelers?: number;
  children?: number;
  rooms?: number;
  guests?: number;
  paidAmount?: number;
  totalAmount?: number;
  bookingStatus?: string;
  paymentStatus?: string;
  bookedAt?: string | null;
};

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="vendor-stat-card">
      <span className="vendor-stat-label">{label}</span>
      <strong className="vendor-stat-value">{value}</strong>
      {sub ? <span className="vendor-stat-sub">{sub}</span> : null}
    </div>
  );
}

function MiniTable({
  headers,
  rows,
  empty,
}: {
  headers: string[];
  rows: React.ReactNode[][];
  empty: string;
}) {
  if (!rows.length) {
    return <p className="detail-value-muted">{empty}</p>;
  }

  return (
    <div className="mini-table-wrap">
      <table className="mini-table">
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PartnerPortfolioView({
  stats,
  tours,
  hotels,
  bookings,
  section = "all",
}: {
  stats: VendorStats;
  tours: TourListing[];
  hotels: HotelListing[];
  bookings: VendorBooking[];
  section?: "all" | "overview" | "listings" | "bookings";
}) {
  const showOverview = section === "all" || section === "overview";
  const showListings = section === "all" || section === "listings";
  const showBookings = section === "all" || section === "bookings";

  return (
    <>
      {showOverview ? (
      <div className="detail-section">
        <div className="detail-section-title">Listings & bookings overview</div>
        <div className="vendor-stat-grid">
          <StatCard
            label="Tours"
            value={stats.tours}
            sub={`${stats.toursApproved || 0} approved · ${stats.toursPending || 0} pending`}
          />
          <StatCard
            label="Hotels / stays"
            value={stats.hotels}
            sub={`${stats.hotelsApproved || 0} approved · ${stats.hotelsPending || 0} pending`}
          />
          <StatCard
            label="Tour bookings"
            value={stats.tourBookings}
            sub={stats.tourRevenue ? formatINR(stats.tourRevenue) + " collected" : undefined}
          />
          <StatCard
            label="Hotel bookings"
            value={stats.hotelBookings}
            sub={stats.hotelRevenue ? formatINR(stats.hotelRevenue) + " collected" : undefined}
          />
          <StatCard
            label="Total bookings"
            value={stats.totalBookings}
            sub={`${stats.upcomingBookings || 0} upcoming · ${stats.completedBookings || 0} completed`}
          />
          <StatCard
            label="Total revenue"
            value={formatINR(stats.totalRevenue || 0)}
            sub="Paid amount from bookings"
          />
        </div>
      </div>
      ) : null}

      {showListings ? (
      <>
      <div className="detail-section">
        <div className="detail-section-title">Tours ({tours.length})</div>
        <MiniTable
          headers={["Tour", "Location", "Price", "Status", "Added"]}
          empty="This partner has not added any tours yet."
          rows={tours.map((tour) => [
            <span className="cell-main" key={`${tour._id}-title`}>{tour.title}</span>,
            tour.location || "—",
            tour.price ? formatINR(tour.price) : "—",
            <Badge key={`${tour._id}-status`} status={tour.status} />,
            formatDate(tour.createdAt),
          ])}
        />
      </div>

      <div className="detail-section">
        <div className="detail-section-title">Hotels / stays ({hotels.length})</div>
        <MiniTable
          headers={["Property", "Location", "Per night", "Status", "Added"]}
          empty="This partner has not added any hotels or stays yet."
          rows={hotels.map((hotel) => [
            <span className="cell-main" key={`${hotel._id}-title`}>{hotel.title}</span>,
            [hotel.city, hotel.location].filter(Boolean).join(", ") || "—",
            hotel.pricePerNight ? formatINR(hotel.pricePerNight) : "—",
            <Badge key={`${hotel._id}-status`} status={hotel.status} />,
            formatDate(hotel.createdAt),
          ])}
        />
      </div>
      </>
      ) : null}

      {showBookings ? (
      <div className="detail-section">
        <div className="detail-section-title">Bookings ({bookings.length})</div>
        <MiniTable
          headers={["Type", "Customer", "Listing", "Dates", "Paid", "Status"]}
          empty="No bookings yet for this partner's listings."
          rows={bookings.map((booking) => [
            booking.type === "tour" ? "Tour" : "Hotel",
            <div key={`${booking._id}-customer`} className="mini-cell-stack">
              <div className="cell-main">{booking.customerName || "Guest"}</div>
              {booking.customerPhone ? <div className="cell-sub">{booking.customerPhone}</div> : null}
            </div>,
            <div key={`${booking._id}-listing`} className="mini-cell-stack">
              <div className="cell-main">{booking.listingTitle || "—"}</div>
              {booking.listingLocation ? <div className="cell-sub">{booking.listingLocation}</div> : null}
            </div>,
            booking.type === "tour"
              ? `${booking.startDate ? formatDate(booking.startDate) : "—"}${booking.endDate ? ` → ${formatDate(booking.endDate)}` : ""}`
              : `${booking.checkIn ? formatDate(booking.checkIn) : "—"}${booking.checkOut ? ` → ${formatDate(booking.checkOut)}` : ""}`,
            formatINR(booking.paidAmount || 0),
            <Badge key={`${booking._id}-status`} status={booking.bookingStatus || "pending"} />,
          ])}
        />
      </div>
      ) : null}
    </>
  );
}