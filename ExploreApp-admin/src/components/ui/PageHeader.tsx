import { SearchInput } from "./SearchInput";

export function PageHeader({
  title,
  subtitle,
  search,
  onSearchChange,
  searchPlaceholder = "Search...",
  children,
}: {
  title: string;
  subtitle?: string;
  search?: string;
  onSearchChange?: (v: string) => void;
  searchPlaceholder?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="page-header">
      <div className="page-header-top">
        <div>
          <h2 className="page-title">{title}</h2>
          {subtitle && <p className="page-subtitle">{subtitle}</p>}
        </div>
        <div className="page-header-actions">
          {onSearchChange && (
            <SearchInput value={search || ""} onChange={onSearchChange} placeholder={searchPlaceholder} />
          )}
          {children}
        </div>
      </div>
    </div>
  );
}