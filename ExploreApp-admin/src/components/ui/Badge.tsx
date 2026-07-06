export function Badge({ status }: { status: string }) {
  const s = status.toLowerCase();
  let cls = "badge badge-pending";
  if (["approved", "confirmed", "active", "paid"].includes(s)) cls = "badge badge-success";
  else if (["rejected", "inactive", "cancelled"].includes(s)) cls = "badge badge-error";
  else if (["completed", "tour", "hotel", "local", "google", "apple"].includes(s)) cls = "badge badge-info";

  return <span className={cls}>{status}</span>;
}