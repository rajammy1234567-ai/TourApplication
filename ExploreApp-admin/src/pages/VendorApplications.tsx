import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../api";
import { Badge } from "../components/ui/Badge";
import { EmptyState } from "../components/ui/EmptyState";
import { Modal } from "../components/ui/Modal";
import { PageBanner } from "../components/ui/PageBanner";
import { PageToolbar } from "../components/ui/PageToolbar";
import {
  IconCheckCircle,
  IconClipboard,
  IconClock,
  IconGlobe,
  IconHandshake,
  IconInbox,
  IconPanelTitle,
  IconXCircle,
} from "../components/ui/Icons";
import {
  businessTypeLabel,
  PartnerDetailView,
  type PartnerInfo,
} from "../components/partners/PartnerDetailView";
import { formatDate, initials } from "../utils/format";

type Application = {
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
  description?: string;
  status: string;
  adminNotes?: string;
  vendorLoginPassword?: string;
  createdAt: string;
  updatedAt?: string;
  reviewedAt?: string;
  userId?: { fullname?: string; email?: string; phone?: string };
  reviewedBy?: { name?: string; email?: string };
};

const FILTERS = [
  { key: "pending", label: "Pending", icon: <IconClock size={15} /> },
  { key: "approved", label: "Approved", icon: <IconCheckCircle size={15} /> },
  { key: "rejected", label: "Rejected", icon: <IconXCircle size={15} /> },
  { key: "", label: "All", icon: <IconGlobe size={15} /> },
];

function toPartnerInfo(app: Application): PartnerInfo {
  return {
    businessName: app.businessName,
    ownerName: app.ownerName,
    phone: app.phone,
    email: app.email,
    address: app.address,
    city: app.city,
    state: app.state,
    businessType: app.businessType,
    gstNumber: app.gstNumber,
    description: app.description,
    vendorLoginPassword: app.vendorLoginPassword,
    status: app.status,
    adminNotes: app.adminNotes,
    createdAt: app.createdAt,
    updatedAt: app.updatedAt,
    reviewedAt: app.reviewedAt,
    userId: app.userId,
    reviewedBy: app.reviewedBy,
  };
}

export function VendorApplications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [search, setSearch] = useState("");
  const [detailApp, setDetailApp] = useState<Application | null>(null);
  const [passwordModal, setPasswordModal] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const load = () => {
    setLoading(true);
    const query = filter ? `?status=${filter}` : "";
    apiFetch(`/api/admin/vendor-applications${query}`)
      .then((data) => setApplications(data.applications || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [filter]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return applications;
    return applications.filter((a) =>
      [
        a.businessName,
        a.ownerName,
        a.phone,
        a.email,
        a.city,
        a.state,
        a.address,
        a.gstNumber,
        a.description,
        a.userId?.fullname,
        a.userId?.email,
        a.userId?.phone,
      ]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(q))
    );
  }, [applications, search]);

  const pendingCount = applications.filter((a) => a.status === "pending").length;

  const openApprove = (id: string) => {
    setPasswordModal(id);
    setPassword("");
    setDetailApp(null);
  };

  const approve = async (id: string) => {
    if (!password || password.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }
    setActionLoading(true);
    try {
      const data = await apiFetch(`/api/admin/vendor-applications/${id}/approve`, {
        method: "POST",
        body: JSON.stringify({ password }),
      });
      alert(`Approved! Vendor login — Phone: ${data.vendor.phone}, Password: (what you set)`);
      setPasswordModal(null);
      setPassword("");
      setDetailApp(null);
      load();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const reject = async (id: string) => {
    const notes = prompt("Rejection reason (optional):");
    if (notes === null) return;
    try {
      await apiFetch(`/api/admin/vendor-applications/${id}/reject`, {
        method: "POST",
        body: JSON.stringify({ adminNotes: notes }),
      });
      setDetailApp(null);
      load();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div>
      <PageBanner
        page="applications"
        icon={<IconClipboard size={28} />}
        label="Partner Onboarding"
        hint="Review businesses that want to list tours & stays on VizTravel"
        pills={[
          { value: pendingCount, label: "Awaiting Review", gold: pendingCount > 0 },
          { value: applications.length, label: "In This View" },
        ]}
      />

      <PageToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search business, owner, phone, city, GST..."
      />

      <div className="filter-row filter-row-travel">
        {FILTERS.map((s) => (
          <button
            key={s.key || "all"}
            type="button"
            className={`filter-btn filter-btn-icon ${filter === s.key ? "active" : ""}`}
            onClick={() => setFilter(s.key)}
          >
            {s.icon}
            {s.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="page-loading">Loading partner requests</div>
      ) : (
        <div className="panel panel-travel">
          <div className="panel-head">
            <IconPanelTitle icon={<IconHandshake size={18} />}>Partner Applications</IconPanelTitle>
          </div>
          <div className="panel-body table-wrap">
            {filtered.length === 0 ? (
              <EmptyState
                icon={<IconInbox size={40} />}
                title="No partner requests found"
                subtitle="When someone applies to become a tour partner on VizTravel, they'll appear here."
              />
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Business</th>
                    <th>Owner</th>
                    <th>Contact</th>
                    <th>Type</th>
                    <th>Location</th>
                    <th>Applied</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((app) => (
                    <tr
                      key={app._id}
                      className="table-row-clickable"
                      onClick={() => setDetailApp(app)}
                    >
                      <td>
                        <div className="row-user">
                          <div className="row-avatar">{initials(app.businessName)}</div>
                          <div>
                            <div className="cell-main">{app.businessName}</div>
                            <div className="cell-sub">{app.gstNumber ? `GST: ${app.gstNumber}` : "No GST"}</div>
                          </div>
                        </div>
                      </td>
                      <td className="cell-main">{app.ownerName}</td>
                      <td>
                        <div className="cell-main">{app.phone}</div>
                        <div className="cell-sub">{app.email || "—"}</div>
                      </td>
                      <td>{businessTypeLabel(app.businessType)}</td>
                      <td>
                        <div className="cell-main">{app.city || "—"}</div>
                        <div className="cell-sub">{app.state || "—"}</div>
                      </td>
                      <td className="cell-sub">{formatDate(app.createdAt)}</td>
                      <td>
                        <Badge status={app.status} />
                      </td>
                      <td className="actions" onClick={(e) => e.stopPropagation()}>
                        <button type="button" className="btn" onClick={() => setDetailApp(app)}>
                          View
                        </button>
                        {app.status === "pending" && (
                          <>
                            <button type="button" className="btn btn-success" onClick={() => openApprove(app._id)}>
                              Approve
                            </button>
                            <button type="button" className="btn btn-danger" onClick={() => reject(app._id)}>
                              Reject
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {detailApp ? (
        <Modal
          wide
          title={detailApp.businessName}
          description={`Full partner application · ${businessTypeLabel(detailApp.businessType)} · ${detailApp.status}`}
          onClose={() => setDetailApp(null)}
          actions={
            <>
              <button type="button" className="btn" onClick={() => setDetailApp(null)}>
                Close
              </button>
              {detailApp.status === "pending" ? (
                <>
                  <button type="button" className="btn btn-danger" onClick={() => reject(detailApp._id)}>
                    Reject
                  </button>
                  <button type="button" className="btn btn-success" onClick={() => openApprove(detailApp._id)}>
                    Approve
                  </button>
                </>
              ) : null}
            </>
          }
        >
          <PartnerDetailView
            data={toPartnerInfo(detailApp)}
            showLogin={detailApp.status === "approved"}
          />
        </Modal>
      ) : null}

      {passwordModal ? (
        <Modal
          title="Approve Tour Partner"
          description="Set a login password. The vendor will sign in to VizTravel Partner App with their phone and this password."
          onClose={() => setPasswordModal(null)}
          actions={
            <>
              <button type="button" className="btn" onClick={() => setPasswordModal(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={actionLoading}
                onClick={() => approve(passwordModal)}
              >
                {actionLoading ? "Approving..." : "Approve & Create Account"}
              </button>
            </>
          }
        >
          <input
            type="text"
            placeholder="Vendor password (min 6 chars)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Modal>
      ) : null}
    </div>
  );
}