import { formatDateTime } from "../../utils/format";

export type PartnerInfo = {
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
  vendorLoginPassword?: string;
  status?: string;
  adminNotes?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  reviewedAt?: string;
  approvedAt?: string;
  userId?: { fullname?: string; email?: string; phone?: string };
  reviewedBy?: { name?: string; email?: string };
  approvedBy?: { name?: string; email?: string };
};

export function businessTypeLabel(type?: string) {
  if (type === "hotel") return "Hotels / Stays";
  if (type === "tour") return "Tours";
  return "Hotels & Tours";
}

function DetailField({
  label,
  value,
  full,
  muted,
}: {
  label: string;
  value?: string | null;
  full?: boolean;
  muted?: boolean;
}) {
  return (
    <div className={full ? "detail-grid-full" : undefined}>
      <span className="detail-label">{label}</span>
      <span className={`detail-value${muted ? " detail-value-muted" : ""}`}>{value?.trim() ? value : "—"}</span>
    </div>
  );
}

export function PartnerDetailView({
  data,
  showLogin = false,
  showPartnerStatus = false,
}: {
  data: PartnerInfo;
  showLogin?: boolean;
  showPartnerStatus?: boolean;
}) {
  return (
    <>
      <div className="detail-section">
        <div className="detail-section-title">Business</div>
        <div className="detail-grid">
          <DetailField label="Business name" value={data.businessName} />
          <DetailField label="Business type" value={businessTypeLabel(data.businessType)} />
          <DetailField label="GST number" value={data.gstNumber} />
          <div className="detail-grid-full">
            <span className="detail-label">About business</span>
            <p className="detail-description">{data.description?.trim() || "—"}</p>
          </div>
        </div>
      </div>

      <div className="detail-section">
        <div className="detail-section-title">Owner & contact</div>
        <div className="detail-grid">
          <DetailField label="Owner name" value={data.ownerName} />
          <DetailField label="Login phone" value={data.phone} />
          <DetailField label="Email" value={data.email} />
          <DetailField label="Address" value={data.address} full />
          <DetailField label="City" value={data.city} />
          <DetailField label="State" value={data.state} />
        </div>
      </div>

      <div className="detail-section">
        <div className="detail-section-title">Applicant account</div>
        <div className="detail-grid">
          <DetailField label="User name" value={data.userId?.fullname} />
          <DetailField label="User phone" value={data.userId?.phone} />
          <DetailField label="User email" value={data.userId?.email} full />
        </div>
      </div>

      {showPartnerStatus ? (
        <div className="detail-section">
          <div className="detail-section-title">Partner account</div>
          <div className="detail-grid">
            <DetailField
              label="Account status"
              value={data.isActive === false ? "Inactive" : "Active"}
            />
            <DetailField label="Partner since" value={formatDateTime(data.createdAt)} />
            <DetailField label="Approved at" value={formatDateTime(data.approvedAt)} />
            <DetailField
              label="Approved by"
              value={data.approvedBy?.name || data.approvedBy?.email}
              muted
            />
          </div>
        </div>
      ) : null}

      <div className="detail-section">
        <div className="detail-section-title">Application & review</div>
        <div className="detail-grid">
          {data.status ? <DetailField label="Application status" value={data.status} /> : null}
          <DetailField label="Submitted" value={formatDateTime(data.createdAt)} />
          <DetailField label="Last updated" value={formatDateTime(data.updatedAt)} />
          <DetailField label="Reviewed at" value={formatDateTime(data.reviewedAt)} />
          <DetailField
            label="Reviewed by"
            value={data.reviewedBy?.name || data.reviewedBy?.email}
            muted
          />
          <div className="detail-grid-full">
            <span className="detail-label">Admin notes</span>
            <p className="detail-description">{data.adminNotes?.trim() || "—"}</p>
          </div>
        </div>
      </div>

      {showLogin ? (
        <div className="detail-section">
          <div className="detail-section-title">Vendor login</div>
          <div className="detail-grid">
            <DetailField label="Login ID (Phone)" value={data.phone} />
            <DetailField label="Password" value={data.vendorLoginPassword || "Not saved"} />
          </div>
        </div>
      ) : null}
    </>
  );
}