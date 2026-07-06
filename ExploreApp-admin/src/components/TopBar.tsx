import { BrandLogo } from "./BrandLogo";
import type { Page } from "./Layout";
import {
  IconClipboard,
  IconGlobe,
  IconHandshake,
  IconLuggage,
  IconMap,
  IconTicket,
} from "./ui/Icons";

const PAGE_META: Record<Page, { title: string; sub: string; icon: React.ReactNode }> = {
  dashboard: { title: "Command Center", sub: "Your Explore travel platform at a glance", icon: <IconGlobe size={16} /> },
  applications: { title: "Partner Applications", sub: "New tour & stay vendors waiting to join Explore", icon: <IconClipboard size={16} /> },
  vendors: { title: "Tour Partners", sub: "Vendors listing trips & stays on Explore", icon: <IconHandshake size={16} /> },
  users: { title: "Travelers", sub: "Customers exploring & booking adventures", icon: <IconLuggage size={16} /> },
  listings: { title: "Tours & Stays", sub: "Approve tour packages & hotel listings", icon: <IconMap size={16} /> },
  bookings: { title: "Trip Bookings", sub: "Every tour booking on Explore — who, what & when", icon: <IconTicket size={16} /> },
};

export function TopBar({ page }: { page: Page }) {
  const meta = PAGE_META[page];
  const now = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <header className="top-bar">
      <div className="top-bar-left">
        <p className="top-bar-date">
          <span className="top-bar-page-icon">{meta.icon}</span>
          {now}
        </p>
        <h1 className="top-bar-title">{meta.title}</h1>
        <p className="top-bar-sub">{meta.sub}</p>
      </div>
      <div className="top-bar-right">
        <div className="top-bar-brand">
          <BrandLogo size="sm" variant="light" />
        </div>
        <div className="top-bar-badge">
          <span className="pulse-dot" />
          Explore Live
        </div>
      </div>
    </header>
  );
}