import { IconPlane } from "./ui/Icons";

export function BrandLogo({
  size = "md",
  variant = "dark",
}: {
  size?: "sm" | "md" | "lg";
  variant?: "dark" | "light";
}) {
  const iconSize = size === "lg" ? 28 : size === "sm" ? 18 : 22;
  return (
    <div className={`explore-brand explore-brand-${size} explore-brand-${variant}`}>
      <div className="explore-brand-mark">
        <IconPlane size={iconSize} />
      </div>
      <div className="explore-brand-text">
        <span className="explore-brand-name">
          Explore<span className="explore-dot">.</span>
        </span>
        <span className="explore-brand-tag">Tour & Travel Admin</span>
      </div>
    </div>
  );
}