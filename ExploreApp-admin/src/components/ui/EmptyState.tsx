export function EmptyState({
  title,
  subtitle,
  icon,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="empty-state">
      {icon && <div className="empty-icon-svg">{icon}</div>}
      <h4>{title}</h4>
      {subtitle && <p>{subtitle}</p>}
    </div>
  );
}