import { Badge } from "../ui/Badge";
import { formatDateTime, formatINR } from "../../utils/format";

export type VendorRef = {
  _id?: string;
  businessName?: string;
  ownerName?: string;
  phone?: string;
  email?: string;
  city?: string;
  state?: string;
  address?: string;
  businessType?: string;
};

export type ListingDetail = {
  _id: string;
  kind: "tour" | "hotel";
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

function Field({
  label,
  value,
  full,
}: {
  label: string;
  value?: string | number | null;
  full?: boolean;
}) {
  const display =
    value === null || value === undefined || value === ""
      ? "—"
      : String(value);

  return (
    <div className={full ? "detail-grid-full" : undefined}>
      <span className="detail-label">{label}</span>
      <span className="detail-value">{display}</span>
    </div>
  );
}

function asVendor(vendorId: ListingDetail["vendorId"]): VendorRef | null {
  if (vendorId && typeof vendorId === "object") return vendorId;
  return null;
}

function mediaList(item: ListingDetail): string[] {
  const urls: string[] = [];
  if (item.image?.trim()) urls.push(item.image.trim());
  for (const g of item.gallery || []) {
    const u = (g || "").trim();
    if (u && !urls.includes(u)) urls.push(u);
  }
  return urls;
}

export function ListingDetailView({ item }: { item: ListingDetail }) {
  const vendor = asVendor(item.vendorId);
  const photos = mediaList(item);
  const isTour = item.kind === "tour";
  const amenities = (item.amenities || []).filter(Boolean);

  return (
    <>
      <div className="detail-section">
        <div className="detail-section-title">Overview</div>
        <div className="listing-detail-header">
          <div className="listing-detail-title-row">
            <h4 className="listing-detail-title">{item.title || "Untitled listing"}</h4>
            <Badge status={item.status || "pending"} />
          </div>
          <p className="listing-detail-meta">
            {isTour ? "Tour package" : "Hotel / stay"}
            {item.packageId ? ` · ID ${item.packageId}` : ""}
            {item.rating != null && item.rating > 0 ? ` · ★ ${item.rating}` : ""}
          </p>
        </div>
      </div>

      {photos.length > 0 ? (
        <div className="detail-section">
          <div className="detail-section-title">Photos ({photos.length})</div>
          <div className="listing-photo-grid">
            {photos.map((url, index) => (
              <a
                key={`${url}-${index}`}
                href={url}
                target="_blank"
                rel="noreferrer"
                className={`listing-photo ${index === 0 ? "listing-photo-cover" : ""}`}
                title={index === 0 ? "Cover photo" : `Gallery ${index}`}
              >
                <img src={url} alt={`${item.title || "Listing"} ${index + 1}`} />
                {index === 0 ? <span className="listing-photo-badge">Cover</span> : null}
              </a>
            ))}
          </div>
        </div>
      ) : (
        <div className="detail-section">
          <div className="detail-section-title">Photos</div>
          <p className="detail-value-muted">No photos uploaded by partner.</p>
        </div>
      )}

      <div className="detail-section">
        <div className="detail-section-title">
          {isTour ? "Package details" : "Property details"}
        </div>
        <div className="detail-grid">
          {isTour ? (
            <>
              <Field label="Destination / location" value={item.location} />
              <Field label="Category" value={item.category} />
              <Field label="Duration" value={item.duration} />
              <Field label="Group size" value={item.people} />
              <Field label="Price (per person / package)" value={formatINR(item.price)} />
              <Field label="Package ID" value={item.packageId} />
            </>
          ) : (
            <>
              <Field label="Property type" value={item.propertyType} />
              <Field label="City" value={item.city} />
              <Field label="State" value={item.state} />
              <Field label="Address / area" value={item.location} full />
              <Field label="Price per night" value={formatINR(item.pricePerNight)} />
              <Field label="Bedrooms" value={item.bedrooms} />
              <Field label="Bathrooms" value={item.bathrooms} />
              <Field label="Max guests" value={item.maxGuests} />
              <Field label="Check-in" value={item.checkInTime} />
              <Field label="Check-out" value={item.checkOutTime} />
            </>
          )}
          {(item.latitude != null || item.longitude != null) && (
            <Field
              label="Coordinates"
              value={
                item.latitude != null && item.longitude != null
                  ? `${item.latitude}, ${item.longitude}`
                  : undefined
              }
              full
            />
          )}
          <div className="detail-grid-full">
            <span className="detail-label">Description</span>
            <p className="detail-description">
              {item.description?.trim() || "—"}
            </p>
          </div>
        </div>
      </div>

      <div className="detail-section">
        <div className="detail-section-title">
          Amenities / inclusions ({amenities.length})
        </div>
        {amenities.length > 0 ? (
          <div className="listing-chip-row">
            {amenities.map((a) => (
              <span key={a} className="listing-chip">
                {a}
              </span>
            ))}
          </div>
        ) : (
          <p className="detail-value-muted">None listed.</p>
        )}
      </div>

      <div className="detail-section">
        <div className="detail-section-title">Partner</div>
        <div className="detail-grid">
          <Field label="Business" value={vendor?.businessName} />
          <Field label="Owner" value={vendor?.ownerName} />
          <Field label="Phone" value={vendor?.phone} />
          <Field label="Email" value={vendor?.email} />
          <Field label="City" value={vendor?.city} />
          <Field label="State" value={vendor?.state} />
          <Field label="Address" value={vendor?.address} full />
          <Field label="Business type" value={vendor?.businessType} />
        </div>
      </div>

      <div className="detail-section">
        <div className="detail-section-title">Review meta</div>
        <div className="detail-grid">
          <div>
            <span className="detail-label">Status</span>
            <div style={{ marginTop: 4 }}>
              <Badge status={item.status || "pending"} />
            </div>
          </div>
          <Field label="Listing ID" value={item._id} />
          <Field label="Submitted" value={formatDateTime(item.createdAt)} />
          <Field label="Last updated" value={formatDateTime(item.updatedAt)} />
        </div>
      </div>
    </>
  );
}
