import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../api";
import {
  ListingDetailView,
  type ListingDetail,
} from "../components/listings/ListingDetailView";
import { Badge } from "../components/ui/Badge";
import { EmptyState } from "../components/ui/EmptyState";
import { Modal } from "../components/ui/Modal";
import { PageBanner } from "../components/ui/PageBanner";
import { PageToolbar } from "../components/ui/PageToolbar";
import {
  IconClock,
  IconHotel,
  IconInbox,
  IconMap,
  IconPanelTitle,
  IconPlane,
} from "../components/ui/Icons";
import { formatINR } from "../utils/format";

type VendorRef = {
  _id?: string;
  businessName?: string;
  ownerName?: string;
  phone?: string;
  email?: string;
};

type Listing = {
  _id: string;
  title?: string;
  description?: string;
  location?: string;
  city?: string;
  state?: string;
  duration?: string;
  people?: string;
  packageId?: string;
  category?: string;
  propertyType?: string;
  price?: number;
  pricePerNight?: number;
  bedrooms?: number;
  bathrooms?: number;
  maxGuests?: number;
  checkInTime?: string;
  checkOutTime?: string;
  image?: string;
  gallery?: string[];
  amenities?: string[];
  rating?: number;
  status?: string;
  latitude?: number;
  longitude?: number;
  createdAt?: string;
  updatedAt?: string;
  vendorId?: string | VendorRef | null;
};

function toDetail(item: Listing, kind: "tour" | "hotel"): ListingDetail {
  return { ...item, kind };
}

export function Listings() {
  const [tab, setTab] = useState<"tours" | "hotels">("tours");
  const [tours, setTours] = useState<Listing[]>([]);
  const [hotels, setHotels] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<ListingDetail | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([apiFetch("/api/admin/tours"), apiFetch("/api/admin/hotels")])
      .then(([t, h]) => {
        setTours(t.tours || []);
        setHotels(h.hotels || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const items = tab === "tours" ? tours : hotels;

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return items;
    return items.filter((i) => {
      const vendor =
        typeof i.vendorId === "object" && i.vendorId
          ? [i.vendorId.businessName, i.vendorId.ownerName, i.vendorId.phone]
              .filter(Boolean)
              .join(" ")
          : "";
      return (
        (i.title || "").toLowerCase().includes(q) ||
        (i.city || i.location || "").toLowerCase().includes(q) ||
        (i.description || "").toLowerCase().includes(q) ||
        (i.category || "").toLowerCase().includes(q) ||
        (i.propertyType || "").toLowerCase().includes(q) ||
        vendor.toLowerCase().includes(q)
      );
    });
  }, [items, search]);

  const pendingTours = tours.filter((i) => (i.status || "").toLowerCase() === "pending").length;
  const pendingHotels = hotels.filter((i) => (i.status || "").toLowerCase() === "pending").length;
  const pendingCount = tab === "tours" ? pendingTours : pendingHotels;

  const updateStatus = async (type: "tour" | "hotel", id: string, status: string) => {
    setActionLoading(true);
    try {
      await apiFetch(`/api/admin/listings/${type}/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setSelected((prev) => (prev && prev._id === id ? { ...prev, status } : prev));
      load();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const openDetail = (item: Listing) => {
    setSelected(toDetail(item, tab === "tours" ? "tour" : "hotel"));
  };

  const selectedStatus = (selected?.status || "pending").toLowerCase();

  return (
    <div>
      <PageBanner
        page="listings"
        icon={<IconMap size={28} />}
        label="Tours & Stays Catalog"
        hint="Full package details from partners — review before going live on Explore"
        pills={[
          { value: tours.length, label: "Tour Packages" },
          { value: hotels.length, label: "Hotels & Stays" },
          {
            value: pendingTours + pendingHotels,
            label: "Need Review",
            gold: pendingTours + pendingHotels > 0,
          },
        ]}
      />

      <PageToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search package, destination, description, partner..."
      />

      <div className="filter-row filter-row-travel">
        <button
          type="button"
          className={`filter-btn filter-btn-icon ${tab === "tours" ? "active" : ""}`}
          onClick={() => setTab("tours")}
        >
          <IconPlane size={15} />
          Tour Packages ({tours.length})
        </button>
        <button
          type="button"
          className={`filter-btn filter-btn-icon ${tab === "hotels" ? "active" : ""}`}
          onClick={() => setTab("hotels")}
        >
          <IconHotel size={15} />
          Hotels & Stays ({hotels.length})
        </button>
      </div>

      {pendingCount > 0 && (
        <div className="alert-banner">
          <span className="alert-icon">
            <IconClock size={18} />
          </span>
          <strong>{pendingCount}</strong>{" "}
          {tab === "tours" ? "tour package(s)" : "hotel stay(s)"} waiting for your approval —
          open a row to review full details.
        </div>
      )}

      {loading ? (
        <div className="page-loading">Loading tours & stays</div>
      ) : (
        <div className="panel panel-travel">
          <div className="panel-head">
            <IconPanelTitle
              icon={tab === "tours" ? <IconPlane size={18} /> : <IconHotel size={18} />}
            >
              {tab === "tours" ? "Tour Packages" : "Hotel & Stay Listings"}
            </IconPanelTitle>
          </div>
          <div className="panel-body table-wrap">
            {filtered.length === 0 ? (
              <EmptyState
                icon={<IconInbox size={40} />}
                title={`No ${tab === "tours" ? "tour packages" : "stays"} found`}
                subtitle="When partners add listings on Explore, they'll appear here for your review."
              />
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Package</th>
                    <th>Partner</th>
                    <th>Destination</th>
                    <th>Highlights</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => {
                    const vendor =
                      typeof item.vendorId === "object" && item.vendorId
                        ? item.vendorId
                        : null;
                    const status = item.status || "pending";
                    const highlight =
                      tab === "tours"
                        ? [item.duration, item.people, item.category].filter(Boolean).join(" · ")
                        : [
                            item.propertyType,
                            item.bedrooms != null ? `${item.bedrooms} BR` : "",
                            item.maxGuests != null ? `${item.maxGuests} guests` : "",
                          ]
                            .filter(Boolean)
                            .join(" · ");

                    return (
                      <tr
                        key={item._id}
                        className="table-row-clickable"
                        onClick={() => openDetail(item)}
                      >
                        <td>
                          <div className="row-user">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt=""
                                className="row-thumb"
                              />
                            ) : (
                              <div className="row-avatar listing-avatar">
                                {tab === "tours" ? (
                                  <IconPlane size={16} />
                                ) : (
                                  <IconHotel size={16} />
                                )}
                              </div>
                            )}
                            <div>
                              <div className="cell-main">{item.title || "Untitled"}</div>
                              <div className="cell-sub">
                                {(() => {
                                  const photoCount =
                                    (item.image ? 1 : 0) + (item.gallery?.length || 0);
                                  return photoCount > 0
                                    ? `${photoCount} photo${photoCount === 1 ? "" : "s"} · open full details`
                                    : "No photos · open full details";
                                })()}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="cell-main">{vendor?.businessName || "—"}</div>
                          <div className="cell-sub">
                            {vendor?.phone || vendor?.ownerName || "—"}
                          </div>
                        </td>
                        <td>{item.city || item.location || "—"}</td>
                        <td className="cell-sub">{highlight || "—"}</td>
                        <td className="cell-main">
                          <span>
                            {formatINR(item.pricePerNight ?? item.price ?? 0)}
                            {tab === "hotels" ? (
                              <span className="price-suffix"> /night</span>
                            ) : null}
                          </span>
                        </td>
                        <td>
                          <Badge status={status} />
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <div className="actions">
                            <button
                              type="button"
                              className="btn"
                              onClick={() => openDetail(item)}
                            >
                              View
                            </button>
                            {status !== "approved" && (
                              <button
                                type="button"
                                className="btn btn-success"
                                onClick={() =>
                                  updateStatus(
                                    tab === "tours" ? "tour" : "hotel",
                                    item._id,
                                    "approved"
                                  )
                                }
                              >
                                Approve
                              </button>
                            )}
                            {status !== "rejected" && (
                              <button
                                type="button"
                                className="btn btn-danger"
                                onClick={() =>
                                  updateStatus(
                                    tab === "tours" ? "tour" : "hotel",
                                    item._id,
                                    "rejected"
                                  )
                                }
                              >
                                Reject
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {selected && (
        <Modal
          xl
          title={selected.kind === "tour" ? "Tour package details" : "Stay listing details"}
          description="Everything the partner submitted for this listing"
          onClose={() => setSelected(null)}
          actions={
            <>
              <button
                type="button"
                className="btn"
                onClick={() => setSelected(null)}
              >
                Close
              </button>
              {selectedStatus !== "rejected" && (
                <button
                  type="button"
                  className="btn btn-danger"
                  disabled={actionLoading}
                  onClick={() =>
                    updateStatus(selected.kind, selected._id, "rejected")
                  }
                >
                  Reject
                </button>
              )}
              {selectedStatus !== "approved" && (
                <button
                  type="button"
                  className="btn btn-success"
                  disabled={actionLoading}
                  onClick={() =>
                    updateStatus(selected.kind, selected._id, "approved")
                  }
                >
                  Approve
                </button>
              )}
            </>
          }
        >
          <ListingDetailView item={selected} />
        </Modal>
      )}
    </div>
  );
}
