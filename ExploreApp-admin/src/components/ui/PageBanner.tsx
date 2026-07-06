const PAGE_IMAGES: Record<string, string> = {
  applications:
    "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&q=80&auto=format",
  vendors:
    "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200&q=80&auto=format",
  users:
    "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1200&q=80&auto=format",
  listings:
    "https://images.unsplash.com/photo-1476514529935-07fb3bf4b417?w=1200&q=80&auto=format",
  bookings:
    "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1200&q=80&auto=format",
};

export function PageBanner({
  page,
  icon,
  label,
  hint,
  pills,
}: {
  page: keyof typeof PAGE_IMAGES;
  icon: React.ReactNode;
  label: string;
  hint: string;
  pills?: { value: string | number; label: string; gold?: boolean }[];
}) {
  return (
    <div className="page-banner">
      <div
        className="page-banner-bg"
        style={{ backgroundImage: `url("${PAGE_IMAGES[page]}")` }}
      />
      <div className="page-banner-content">
        <div className="page-banner-left">
          <span className="page-banner-icon">{icon}</span>
          <div>
            <p className="page-banner-label">{label}</p>
            <p className="page-banner-hint">{hint}</p>
          </div>
        </div>
        {pills && pills.length > 0 && (
          <div className="page-banner-pills">
            {pills.map((p) => (
              <div key={p.label} className={`page-banner-pill ${p.gold ? "gold" : ""}`}>
                <strong>{p.value}</strong>
                <span>{p.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}