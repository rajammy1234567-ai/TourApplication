import { BrandLogo } from "./BrandLogo";
import { TopBar } from "./TopBar";
import {
  IconFile,
  IconGrid,
  IconList,
  IconLogout,
  IconPlane,
  IconStore,
  IconTicket,
  IconUsers,
} from "./ui/Icons";

type Page =
  | "dashboard"
  | "applications"
  | "vendors"
  | "users"
  | "listings"
  | "bookings";

const navItems: { id: Page; label: string; icon: React.ReactNode; section?: string }[] = [
  { id: "dashboard", label: "Overview", icon: <IconGrid size={18} />, section: "Platform" },
  { id: "bookings", label: "Trip Bookings", icon: <IconTicket size={18} /> },
  { id: "listings", label: "Tours & Stays", icon: <IconList size={18} />, section: "Content" },
  { id: "applications", label: "Partner Requests", icon: <IconFile size={18} />, section: "Partners" },
  { id: "vendors", label: "Tour Partners", icon: <IconStore size={18} /> },
  { id: "users", label: "Travelers", icon: <IconUsers size={18} /> },
];

export function Layout({
  page,
  onNavigate,
  onLogout,
  children,
}: {
  page: Page;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
  children: React.ReactNode;
}) {
  const admin = (() => {
    try {
      return JSON.parse(localStorage.getItem("adminData") || "{}");
    } catch {
      return {};
    }
  })();

  let lastSection = "";

  return (
    <div className="admin-shell">
      <aside className="sidebar">
        <div className="sidebar-bg" />
        <div className="sidebar-inner">
          <BrandLogo />

          <div className="sidebar-divider" />

          <nav>
            {navItems.map((item) => {
              const showSection = item.section && item.section !== lastSection;
              if (item.section) lastSection = item.section;
              return (
                <div key={item.id}>
                  {showSection && <p className="nav-section-label">{item.section}</p>}
                  <button
                    type="button"
                    className={`nav-link ${page === item.id ? "active" : ""}`}
                    onClick={() => onNavigate(item.id)}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                </div>
              );
            })}
          </nav>

          <div className="sidebar-travel-card">
            <strong className="sidebar-card-title">
              <IconPlane size={14} />
              VizTravel Tour & Travel
            </strong>
            <p>Official admin for the VizTravel app — tours, stays, partners & bookings.</p>
          </div>

          <div className="sidebar-footer">
            <div className="admin-profile">
              <div className="admin-avatar">
                {(admin.name || "A").charAt(0).toUpperCase()}
              </div>
              <div>
                <span>{admin.name || "Super Admin"}</span>
                <small>{admin.email || "admin@explore.com"}</small>
              </div>
            </div>
            <button type="button" className="logout-btn" onClick={onLogout}>
              <IconLogout size={16} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      <div className="main-content">
        <TopBar page={page} />
        <div className="page-body">{children}</div>
      </div>
    </div>
  );
}

export type { Page };