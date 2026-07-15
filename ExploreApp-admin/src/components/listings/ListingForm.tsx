import { useEffect, useMemo, useState } from "react";

export type VendorOption = {
  _id: string;
  businessName?: string;
  ownerName?: string;
  phone?: string;
};

export type ListingFormKind = "tour" | "hotel";

export type ListingFormValues = {
  _id?: string;
  title: string;
  description: string;
  image: string;
  galleryText: string;
  amenitiesText: string;
  status: string;
  rating: string;
  vendorId: string;
  // tour
  packageId: string;
  location: string;
  duration: string;
  people: string;
  price: string;
  category: string;
  // hotel
  city: string;
  state: string;
  propertyType: string;
  pricePerNight: string;
  bedrooms: string;
  bathrooms: string;
  maxGuests: string;
  checkInTime: string;
  checkOutTime: string;
  latitude: string;
  longitude: string;
};

const TOUR_CATEGORIES = [
  "Beach",
  "Mountain",
  "City",
  "Adventure",
  "Cultural",
  "Wildlife",
  "Other",
];

const PROPERTY_TYPES = [
  "hotel",
  "apartment",
  "villa",
  "resort",
  "homestay",
  "hostel",
];

const TOUR_AMENITY_PRESETS = [
  "Guide",
  "Meals",
  "Transport",
  "Accommodation",
  "Insurance",
  "Equipment",
  "Photography",
  "Tickets",
  "Pickup & Drop",
  "First Aid",
];

const HOTEL_AMENITY_PRESETS = [
  "WiFi",
  "Parking",
  "Pool",
  "AC",
  "Breakfast",
  "Kitchen",
  "Pet Friendly",
  "Gym",
  "Spa",
  "Restaurant",
  "Room Service",
  "Laundry",
  "24/7 Reception",
  "Airport Shuttle",
];

/** Default empty form values (tour + hotel fields combined). */
function createEmptyFormValues(): ListingFormValues {
  return {
    title: "",
    description: "",
    image: "",
    galleryText: "",
    amenitiesText: "",
    status: "approved",
    rating: "0",
    vendorId: "",
    packageId: "",
    location: "",
    duration: "",
    people: "",
    price: "",
    category: "Other",
    city: "",
    state: "",
    propertyType: "hotel",
    pricePerNight: "",
    bedrooms: "1",
    bathrooms: "1",
    maxGuests: "2",
    checkInTime: "14:00",
    checkOutTime: "11:00",
    latitude: "",
    longitude: "",
  };
}

function fromListing(item?: Record<string, any> | null): ListingFormValues {
  const base = createEmptyFormValues();
  if (!item) return base;
  const vendorId =
    typeof item.vendorId === "object" && item.vendorId
      ? item.vendorId._id || ""
      : item.vendorId || "";
  const gallery = Array.isArray(item.gallery) ? item.gallery.join("\n") : "";
  const amenities = Array.isArray(item.amenities) ? item.amenities.join(", ") : "";

  return {
    ...base,
    _id: item._id,
    title: item.title || "",
    description: item.description || "",
    image: item.image || "",
    galleryText: gallery,
    amenitiesText: amenities,
    status: item.status || "approved",
    rating: item.rating != null ? String(item.rating) : "0",
    vendorId: String(vendorId || ""),
    packageId: item.packageId || "",
    location: item.location || "",
    duration: item.duration || "",
    people: item.people || "",
    price: item.price != null ? String(item.price) : "",
    category: item.category || "Other",
    city: item.city || "",
    state: item.state || "",
    propertyType: item.propertyType || "hotel",
    pricePerNight: item.pricePerNight != null ? String(item.pricePerNight) : "",
    bedrooms: item.bedrooms != null ? String(item.bedrooms) : "1",
    bathrooms: item.bathrooms != null ? String(item.bathrooms) : "1",
    maxGuests: item.maxGuests != null ? String(item.maxGuests) : "2",
    checkInTime: item.checkInTime || "14:00",
    checkOutTime: item.checkOutTime || "11:00",
    latitude: item.latitude != null ? String(item.latitude) : "",
    longitude: item.longitude != null ? String(item.longitude) : "",
  };
}

export function toApiPayload(kind: ListingFormKind, values: ListingFormValues) {
  const gallery = values.galleryText
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);
  const amenities = values.amenitiesText
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (kind === "tour") {
    return {
      title: values.title.trim(),
      packageId: values.packageId.trim() || undefined,
      location: values.location.trim(),
      duration: values.duration.trim(),
      people: values.people.trim(),
      price: Number(values.price) || 0,
      image: values.image.trim() || gallery[0] || "",
      gallery,
      description: values.description.trim(),
      category: values.category,
      amenities,
      status: values.status,
      rating: Number(values.rating) || 0,
      vendorId: values.vendorId || undefined,
      latitude: values.latitude !== "" ? Number(values.latitude) : undefined,
      longitude: values.longitude !== "" ? Number(values.longitude) : undefined,
    };
  }

  return {
    title: values.title.trim(),
    description: values.description.trim(),
    location: values.location.trim(),
    city: values.city.trim(),
    state: values.state.trim(),
    propertyType: values.propertyType,
    image: values.image.trim() || gallery[0] || "",
    gallery,
    pricePerNight: Number(values.pricePerNight) || 0,
    bedrooms: Number(values.bedrooms) || 1,
    bathrooms: Number(values.bathrooms) || 1,
    maxGuests: Number(values.maxGuests) || 2,
    amenities,
    checkInTime: values.checkInTime.trim() || "14:00",
    checkOutTime: values.checkOutTime.trim() || "11:00",
    status: values.status,
    rating: Number(values.rating) || 0,
    vendorId: values.vendorId || undefined,
    latitude: values.latitude !== "" ? Number(values.latitude) : undefined,
    longitude: values.longitude !== "" ? Number(values.longitude) : undefined,
  };
}

type Props = {
  kind: ListingFormKind;
  initial?: Record<string, any> | null;
  vendors: VendorOption[];
  saving?: boolean;
  onSubmit: (payload: Record<string, unknown>) => void;
  onCancel: () => void;
};

export function ListingForm({ kind, initial, vendors, saving, onSubmit, onCancel }: Props) {
  const [values, setValues] = useState<ListingFormValues>(() => fromListing(initial));
  const presets = kind === "tour" ? TOUR_AMENITY_PRESETS : HOTEL_AMENITY_PRESETS;

  useEffect(() => {
    setValues(fromListing(initial));
  }, [kind, initial]);

  const selectedAmenities = useMemo(
    () =>
      new Set(
        values.amenitiesText
          .split(/[\n,]/)
          .map((s) => s.trim())
          .filter(Boolean)
      ),
    [values.amenitiesText]
  );

  const set = (key: keyof ListingFormValues, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const toggleAmenity = (name: string) => {
    const next = new Set(selectedAmenities);
    if (next.has(name)) next.delete(name);
    else next.add(name);
    set("amenitiesText", Array.from(next).join(", "));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!values.title.trim()) {
      alert("Title is required");
      return;
    }
    if (kind === "tour" && !(Number(values.price) > 0)) {
      alert("Enter a valid tour price");
      return;
    }
    if (kind === "hotel" && !(Number(values.pricePerNight) > 0)) {
      alert("Enter a valid price per night");
      return;
    }
    onSubmit(toApiPayload(kind, values));
  };

  const Field = ({
    label,
    children,
    full,
  }: {
    label: string;
    children: React.ReactNode;
    full?: boolean;
  }) => (
    <label className={full ? "form-field form-field-full" : "form-field"}>
      <span className="form-label">{label}</span>
      {children}
    </label>
  );

  return (
    <form className="listing-form" onSubmit={handleSubmit}>
      <div className="form-grid">
        <Field label="Title *" full>
          <input
            className="form-input"
            value={values.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder={kind === "tour" ? "Goa Beach Escape 3D/2N" : "Sea View Resort"}
            required
          />
        </Field>

        <Field label="Cover image URL">
          <input
            className="form-input"
            value={values.image}
            onChange={(e) => set("image", e.target.value)}
            placeholder="https://..."
          />
        </Field>

        <Field label="Status">
          <select
            className="form-input"
            value={values.status}
            onChange={(e) => set("status", e.target.value)}
          >
            <option value="approved">Approved (live)</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
        </Field>

        <Field label="Rating (0–5)">
          <input
            className="form-input"
            type="number"
            min={0}
            max={5}
            step={0.1}
            value={values.rating}
            onChange={(e) => set("rating", e.target.value)}
          />
        </Field>

        <Field label="Partner (optional)">
          <select
            className="form-input"
            value={values.vendorId}
            onChange={(e) => set("vendorId", e.target.value)}
          >
            <option value="">— Admin / no partner —</option>
            {vendors.map((v) => (
              <option key={v._id} value={v._id}>
                {v.businessName || v.ownerName || v.phone || v._id}
              </option>
            ))}
          </select>
        </Field>

        {kind === "tour" ? (
          <>
            <Field label="Destination / location">
              <input
                className="form-input"
                value={values.location}
                onChange={(e) => set("location", e.target.value)}
                placeholder="Manali, Himachal"
              />
            </Field>
            <Field label="Category">
              <select
                className="form-input"
                value={values.category}
                onChange={(e) => set("category", e.target.value)}
              >
                {TOUR_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Duration">
              <input
                className="form-input"
                value={values.duration}
                onChange={(e) => set("duration", e.target.value)}
                placeholder="3 Days / 2 Nights"
              />
            </Field>
            <Field label="Group size">
              <input
                className="form-input"
                value={values.people}
                onChange={(e) => set("people", e.target.value)}
                placeholder="2–10 people"
              />
            </Field>
            <Field label="Price (₹) *">
              <input
                className="form-input"
                type="number"
                min={0}
                value={values.price}
                onChange={(e) => set("price", e.target.value)}
                required
              />
            </Field>
            <Field label="Package ID">
              <input
                className="form-input"
                value={values.packageId}
                onChange={(e) => set("packageId", e.target.value)}
                placeholder="optional"
              />
            </Field>
          </>
        ) : (
          <>
            <Field label="Property type">
              <select
                className="form-input"
                value={values.propertyType}
                onChange={(e) => set("propertyType", e.target.value)}
              >
                {PROPERTY_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="City">
              <input
                className="form-input"
                value={values.city}
                onChange={(e) => set("city", e.target.value)}
                placeholder="Goa"
              />
            </Field>
            <Field label="State">
              <input
                className="form-input"
                value={values.state}
                onChange={(e) => set("state", e.target.value)}
              />
            </Field>
            <Field label="Address / area">
              <input
                className="form-input"
                value={values.location}
                onChange={(e) => set("location", e.target.value)}
              />
            </Field>
            <Field label="Price / night (₹) *">
              <input
                className="form-input"
                type="number"
                min={0}
                value={values.pricePerNight}
                onChange={(e) => set("pricePerNight", e.target.value)}
                required
              />
            </Field>
            <Field label="Bedrooms">
              <input
                className="form-input"
                type="number"
                min={0}
                value={values.bedrooms}
                onChange={(e) => set("bedrooms", e.target.value)}
              />
            </Field>
            <Field label="Bathrooms">
              <input
                className="form-input"
                type="number"
                min={0}
                value={values.bathrooms}
                onChange={(e) => set("bathrooms", e.target.value)}
              />
            </Field>
            <Field label="Max guests">
              <input
                className="form-input"
                type="number"
                min={1}
                value={values.maxGuests}
                onChange={(e) => set("maxGuests", e.target.value)}
              />
            </Field>
            <Field label="Check-in">
              <input
                className="form-input"
                value={values.checkInTime}
                onChange={(e) => set("checkInTime", e.target.value)}
              />
            </Field>
            <Field label="Check-out">
              <input
                className="form-input"
                value={values.checkOutTime}
                onChange={(e) => set("checkOutTime", e.target.value)}
              />
            </Field>
          </>
        )}

        <Field label="Latitude">
          <input
            className="form-input"
            value={values.latitude}
            onChange={(e) => set("latitude", e.target.value)}
            placeholder="optional"
          />
        </Field>
        <Field label="Longitude">
          <input
            className="form-input"
            value={values.longitude}
            onChange={(e) => set("longitude", e.target.value)}
            placeholder="optional"
          />
        </Field>

        <Field label="Description" full>
          <textarea
            className="form-input form-textarea"
            rows={4}
            value={values.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Full package / property description shown on user app"
          />
        </Field>

        <Field label="Gallery image URLs (one per line)" full>
          <textarea
            className="form-input form-textarea"
            rows={3}
            value={values.galleryText}
            onChange={(e) => set("galleryText", e.target.value)}
            placeholder={"https://...\nhttps://..."}
          />
        </Field>

        <div className="form-field form-field-full">
          <span className="form-label">
            {kind === "tour" ? "Inclusions / amenities" : "Amenities"}
          </span>
          <div className="amenity-chips">
            {presets.map((a) => (
              <button
                key={a}
                type="button"
                className={`amenity-chip ${selectedAmenities.has(a) ? "on" : ""}`}
                onClick={() => toggleAmenity(a)}
              >
                {a}
              </button>
            ))}
          </div>
          <input
            className="form-input"
            style={{ marginTop: 8 }}
            value={values.amenitiesText}
            onChange={(e) => set("amenitiesText", e.target.value)}
            placeholder="Or type custom, comma separated"
          />
        </div>
      </div>

      {(values.image || values.galleryText.split(/[\n,]/)[0]) && (
        <div className="form-preview">
          <span className="form-label">Preview</span>
          <img
            src={values.image || values.galleryText.split(/[\n,]/).map((s) => s.trim()).filter(Boolean)[0]}
            alt="preview"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
      )}

      <div className="form-actions">
        <button type="button" className="btn" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "Saving…" : initial?._id ? "Save changes" : "Create listing"}
        </button>
      </div>
    </form>
  );
}
