import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../api";
import { Badge } from "../components/ui/Badge";
import { EmptyState } from "../components/ui/EmptyState";
import { Modal } from "../components/ui/Modal";
import { PageBanner } from "../components/ui/PageBanner";
import { PageToolbar } from "../components/ui/PageToolbar";
import {
  PartnerDetailView,
  type PartnerInfo,
} from "../components/partners/PartnerDetailView";
import {
  PartnerPortfolioView,
  type VendorStats,
} from "../components/partners/PartnerPortfolioView";
import { IconHandshake, IconInbox, IconPanelTitle, IconStore } from "../components/ui/Icons";
import { formatINR, initials } from "../utils/format";

type Vendor = {
  _id: string;
  businessName: string;
  ownerName: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  businessType: string;
  gstNumber?: string;
  isActive: boolean;
  createdAt: string;
  approvedAt?: string;
  userId?: { fullname?: string; email?: string; phone?: string };
  approvedBy?: { name?: string; email?: string };
  stats?: VendorStats;
};

type VendorApplication = {
  description?: string;
  adminNotes?: string;
  vendorLoginPassword?: string;
  createdAt?: string;
  updatedAt?: string;
  reviewedAt?: string;
  reviewedBy?: { name?: string; email?: string };
};

type VendorDetailState = {
  partner: PartnerInfo;
  stats: VendorStats;
  tours: any[];
  hotels: any[];
  bookings: any[];
};

function mergePartnerInfo(vendor: Vendor, application?: VendorApplication | null): PartnerInfo {
  return {
    businessName: vendor.businessName,
    ownerName: vendor.ownerName,
    phone: vendor.phone,
    email: vendor.email,
    address: vendor.address,
    city: vendor.city,
    state: vendor.state,
    businessType: vendor.businessType,
    gstNumber: vendor.gstNumber,
    description: application?.description,
    vendorLoginPassword: application?.vendorLoginPassword,
    status: "approved",
    adminNotes: application?.adminNotes,
    isActive: vendor.isActive,
    createdAt: application?.createdAt || vendor.createdAt,
    updatedAt: application?.updatedAt,
    reviewedAt: application?.reviewedAt || vendor.approvedAt,
    approvedAt: vendor.approvedAt,
    userId: vendor.userId,
    reviewedBy: application?.reviewedBy,
    approvedBy: vendor.approvedBy,
  };
}

const emptyStats = (): VendorStats => ({
  tours: 0,
  hotels: 0,
  tourBookings: 0,
  hotelBookings: 0,
  totalBookings: 0,
  totalRevenue: 0,
});

export function Vendors() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState<VendorDetailState | null>(null);
  const [detailTitle, setDetailTitle] = useState("");
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailTab, setDetailTab] = useState<"overview" | "profile" | "listings" | "bookings">("overview");
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    apiFetch("/api/admin/vendors")
      .then((data) => setVendors(data.vendors || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return vendors;
    return vendors.filter((v) =>
      [
        v.businessName,
        v.ownerName,
        v.phone,
        v.email,
        v.city,
        v.state,
        v.address,
        v.gstNumber,
        v.userId?.fullname,
        v.userId?.email,
      ]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(q))
    );
  }, [vendors, search]);

  const activeCount = vendors.filter((v) => v.isActive).length;
  const totalTours = vendors.reduce((sum, vendor) => sum + (vendor.stats?.tours || 0), 0);
  const totalHotels = vendors.reduce((sum, vendor) => sum + (vendor.stats?.hotels || 0), 0);
  const totalBookings = vendors.reduce((sum, vendor) => sum + (vendor.stats?.totalBookings || 0), 0);

  const openPartnerDetail = async (vendor: Vendor) => {
    setDetailTitle(vendor.businessName);
    setDetailTab("overview");
    setSelectedVendorId(vendor._id);
    setDetailLoading(true);
    setDetail({
      partner: mergePartnerInfo(vendor),
      stats: vendor.stats || emptyStats(),
      tours: [],
      hotels: [],
      bookings: [],
    });

    try {
      const data = await apiFetch(`/api/admin/vendors/${vendor._id}`);
      setDetail({
        partner: mergePartnerInfo(data.vendor, data.application),
        stats: data.stats || emptyStats(),
        tours: data.tours || [],
        hotels: data.hotels || [],
        bookings: data.bookings || [],
      });
    } catch (err: any) {
      alert(err.message || "Could not load partner details");
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setDetail(null);
    setDetailTitle("");
    setDetailTab("overview");
    setSelectedVendorId(null);
  };

  const detailTabs = [
    { key: "overview" as const, label: "Overview" },
    { key: "profile" as const, label: "Profile" },
    { key: "listings" as const, label: "Tours & Stays" },
    { key: "bookings" as const, label: "Bookings" },
  ];

  const toggleStatus = async (id: string, isActive: boolean) => {
    try {
      await apiFetch(`/api/admin/vendors/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ isActive }),
      });
      load();
      if (detail && selectedVendorId === id) {
        setDetail({ ...detail, partner: { ...detail.partner, isActive } });
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const resetPassword = async (id: string, phone: string) => {
    const pwd = prompt(`Set new password for vendor ${phone}:`);
    if (!pwd) return;
    try {
      await apiFetch(`/api/admin/vendors/${id}/password`, {
        method: "PATCH",
        body: JSON.stringify({ password: pwd }),
      });
      alert("Password updated successfully");
      const current = vendors.find((v) => v._id === id);
      if (current) openPartnerDetail(current);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const selectedVendor = selectedVendorId
    ? vendors.find((vendor) => vendor._id === selectedVendorId)
    : null;

  return (
    <div>
      <PageBanner
        page="vendors"
        icon={<IconHandshake size={28} />}
        label="Tour Partners"
        hint="Vendor-wise tours, stays, bookings and revenue on VizTravel"
        pills={[
          { value: activeCount, label: "Active", gold: true },
          { value: totalTours + totalHotels, label: "Listings" },
          { value: totalBookings, label: "Bookings" },
        ]}
      />

      <PageToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search partner, owner, phone, city, GST..."
      />

      {loading ? (
        <div className="page-loading">Loading tour partners</div>
      ) : (
        <div className="panel panel-travel">
          <div className="panel-head">
            <IconPanelTitle icon={<IconStore size={18} />}>VizTravel Partner Directory</IconPanelTitle>
          </div>
          <div className="panel-body table-wrap">
            {filtered.length === 0 ? (
              <EmptyState
                icon={<IconInbox size={40} />}
                title="No tour partners found"
                subtitle="Approved vendors who list tours and stays on VizTravel will show up here."
              />
            ) : (
              <table className="vendors-table">
                <thead>
                  <tr>
                    <th>Partner</th>
                    <th>Login</th>
                    <th>Listings</th>
                    <th>Bookings</th>
                    <th>Revenue</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((vendor) => (
                    <tr
                      key={vendor._id}
                      className="table-row-clickable"
                      onClick={() => openPartnerDetail(vendor)}
                    >
                      <td>
                        <div className="row-user">
                          <div className="row-avatar">{initials(vendor.businessName)}</div>
                          <div>
                            <div className="cell-main">{vendor.businessName}</div>
                            <div className="cell-sub">{vendor.ownerName}</div>
                            <div className="cell-sub">
                              {[vendor.city, vendor.state].filter(Boolean).join(", ") || "—"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="cell-main">{vendor.phone}</td>
                      <td className="stat-cell">
                        <span className="count-pill">{(vendor.stats?.tours || 0) + (vendor.stats?.hotels || 0)}</span>
                        <div className="cell-sub">
                          {vendor.stats?.tours || 0} tours · {vendor.stats?.hotels || 0} stays
                        </div>
                      </td>
                      <td className="stat-cell">
                        <span className="count-pill">{vendor.stats?.totalBookings || 0}</span>
                        <div className="cell-sub">
                          {vendor.stats?.tourBookings || 0} tour · {vendor.stats?.hotelBookings || 0} hotel
                        </div>
                      </td>
                      <td className="cell-main">{formatINR(vendor.stats?.totalRevenue || 0)}</td>
                      <td>
                        <Badge status={vendor.isActive ? "active" : "inactive"} />
                      </td>
                      <td className="actions" onClick={(e) => e.stopPropagation()}>
                        <button type="button" className="btn btn-primary" onClick={() => openPartnerDetail(vendor)}>
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {detail ? (
        <Modal
          xl
          title={detailTitle}
          description={`Vendor profile, listings & bookings · ${
            detail.partner.isActive === false ? "Inactive" : "Active"
          }`}
          onClose={closeDetail}
          actions={
            selectedVendor ? (
              <>
                <button type="button" className="btn" onClick={closeDetail}>
                  Close
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={() => resetPassword(selectedVendor._id, selectedVendor.phone)}
                >
                  Reset Password
                </button>
                <button
                  type="button"
                  className={`btn ${selectedVendor.isActive ? "btn-danger" : "btn-success"}`}
                  onClick={() => toggleStatus(selectedVendor._id, !selectedVendor.isActive)}
                >
                  {selectedVendor.isActive ? "Deactivate" : "Activate"}
                </button>
              </>
            ) : (
              <button type="button" className="btn" onClick={closeDetail}>
                Close
              </button>
            )
          }
        >
          {detailLoading ? (
            <div className="page-loading" style={{ minHeight: 120 }}>
              Loading partner details...
            </div>
          ) : (
            <>
              <div className="partner-detail-tabs">
                {detailTabs.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    className={`partner-detail-tab ${detailTab === tab.key ? "active" : ""}`}
                    onClick={() => setDetailTab(tab.key)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {detailTab === "profile" ? (
                <PartnerDetailView data={detail.partner} showLogin showPartnerStatus />
              ) : (
                <PartnerPortfolioView
                  stats={detail.stats}
                  tours={detail.tours}
                  hotels={detail.hotels}
                  bookings={detail.bookings}
                  section={detailTab}
                />
              )}
            </>
          )}
        </Modal>
      ) : null}
    </div>
  );
}