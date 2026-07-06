export function StatCard({
  label,
  value,
  icon,
  tone = "blue",
  sub,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  tone?: "blue" | "green" | "amber" | "purple" | "rose" | "cyan";
  sub?: string;
}) {
  return (
    <div className={`stat-card stat-${tone}`}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-body">
        <span className="stat-value">{value}</span>
        <span className="stat-label">{label}</span>
        {sub && <span className="stat-sub">{sub}</span>}
      </div>
    </div>
  );
}