import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../api";
import { Badge } from "../components/ui/Badge";
import { EmptyState } from "../components/ui/EmptyState";
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

type Listing = {
  _id: string;
  title: string;
  location?: string;
  city?: string;
  price?: number;
  pricePerNight?: number;
  status: string;
  vendorId?: string | { _id?: string; businessName?: string; ownerName?: string; phone?: string };
};

export function Listings() {
  const [tab, setTab] = useState<"tours" | "hotels">("tours");
  const [tours, setTours] = useState<Listing[]>([]);
  const [hotels, setHotels] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

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

  useEffect(() => { load(); }, []);

  const items = tab === "tours" ? tours : hotels;

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return items;
    return items.filter((i) => {
      const vendor =
        typeof i.vendorId === "object" && i.vendorId
          ? [i.vendorId.businessName, i.vendorId.ownerName, i.vendorId.phone].filter(Boolean).join(" ")
          : "";
      return (
        i.title.toLowerCase().includes(q) ||
        (i.city || i.location || "").toLowerCase().includes(q) ||
        vendor.toLowerCase().includes(q)
      );
    });
  }, [items, search]);

  const pendingTours = tours.filter((i) => i.status === "pending").length;
  const pendingHotels = hotels.filter((i) => i.status === "pending").length;
  const pendingCount = tab === "tours" ? pendingTours : pendingHotels;

  const updateStatus = async (type: "tour" | "hotel", id: string, status: string) => {
    try {
      await apiFetch(`/api/admin/listings/${type}/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      load();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div>
      <PageBanner
        page="listings"
        icon={<IconMap size={28} />}
        label="Tours & Stays Catalog"
        hint="Approve or reject packages that partners want to list on Explore"
        pills={[
          { value: tours.length, label: "Tour Packages" },
          { value: hotels.length, label: "Hotels & Stays" },
          { value: pendingTours + pendingHotels, label: "Need Review", gold: pendingTours + pendingHotels > 0 },
        ]}
      />

      <PageToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search package, destination, partner..."
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
          <span className="alert-icon"><IconClock size={18} /></span>
          <strong>{pendingCount}</strong> {tab === "tours" ? "tour package(s)" : "hotel stay(s)"} waiting for your approval on Explore
        </div>
      )}

      {loading ? (
        <div className="page-loading">Loading tours & stays</div>
      ) : (
        <div className="panel panel-travel">
          <div className="panel-head">
            <IconPanelTitle icon={tab === "tours" ? <IconPlane size={18} /> : <IconHotel size={18} />}>
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
                    <th>Price</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => {
                    const vendor =
                      typeof item.vendorId === "object" && item.vendorId ? item.vendorId : null;
                    return (
                    <tr key={item._id}>
                      <td>
                        <div className="row-user">
                          <div className="row-avatar listing-avatar">
                            {tab === "tours" ? <IconPlane size={16} /> : <IconHotel size={16} />}
                          </div>
                          <div className="cell-main">{item.title}</div>
                        </div>
                      </td>
                      <td>
                        <div className="cell-main">{vendor?.businessName || "—"}</div>
                        <div className="cell-sub">{vendor?.phone || vendor?.ownerName || "—"}</div>
                      </td>
                      <td>{item.city || item.location || "—"}</td>
                      <td className="cell-main">
                        <span>
                          {formatINR(item.pricePerNight || item.price || 0)}
                          {tab === "hotels" ? <span className="price-suffix"> /night</span> : null}
                        </span>
                      </td>
                      <td><Badge status={item.status} /></td>
                      <td>
                        <div className="actions">
                        {item.status !== "approved" && (
                          <button
                            type="button"
                            className="btn btn-success"
                            onClick={() => updateStatus(tab === "tours" ? "tour" : "hotel", item._id, "approved")}
                          >
                            Approve
                          </button>
                        )}
                        {item.status !== "rejected" && (
                          <button
                            type="button"
                            className="btn btn-danger"
                            onClick={() => updateStatus(tab === "tours" ? "tour" : "hotel", item._id, "rejected")}
                          >
                            Reject
                          </button>
                        )}
                        </div>
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}