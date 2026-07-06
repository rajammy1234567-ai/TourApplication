import { SearchInput } from "./SearchInput";

export function PageToolbar({
  search,
  onSearchChange,
  searchPlaceholder = "Search...",
  children,
}: {
  search?: string;
  onSearchChange?: (v: string) => void;
  searchPlaceholder?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="page-toolbar">
      {onSearchChange && (
        <SearchInput
          value={search || ""}
          onChange={onSearchChange}
          placeholder={searchPlaceholder}
        />
      )}
      {children && <div className="page-toolbar-actions">{children}</div>}
    </div>
  );
}