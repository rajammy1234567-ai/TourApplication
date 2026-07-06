import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../api";
import { Badge } from "../components/ui/Badge";
import { EmptyState } from "../components/ui/EmptyState";
import { PageBanner } from "../components/ui/PageBanner";
import { PageToolbar } from "../components/ui/PageToolbar";
import { IconInbox, IconLuggage, IconPanelTitle, IconUsers } from "../components/ui/Icons";
import { formatDate, initials } from "../utils/format";

type User = {
  _id: string;
  fullname: string;
  email?: string;
  phone?: string;
  authProvider?: string;
  createdAt: string;
};

export function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = () => {
    apiFetch("/api/admin/users")
      .then((data) => setUsers(data.users || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.fullname.toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q) ||
        (u.phone || "").includes(q)
    );
  }, [users, search]);

  const remove = async (id: string, name: string) => {
    if (!confirm(`Delete traveler "${name}"? This cannot be undone.`)) return;
    try {
      await apiFetch(`/api/admin/users/${id}`, { method: "DELETE" });
      load();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div>
      <PageBanner
        page="users"
        icon={<IconLuggage size={28} />}
        label="Explore Travelers"
        hint="People who sign up on the Explore app to book tours & adventures"
        pills={[
          { value: users.length, label: "Registered", gold: true },
          { value: filtered.length, label: "Showing" },
        ]}
      />

      <PageToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search traveler name, email, phone..."
      />

      {loading ? (
        <div className="page-loading">Loading travelers</div>
      ) : (
        <div className="panel panel-travel">
          <div className="panel-head">
            <IconPanelTitle icon={<IconUsers size={18} />}>Traveler Database</IconPanelTitle>
          </div>
          <div className="panel-body table-wrap">
            {filtered.length === 0 ? (
              <EmptyState
                icon={<IconInbox size={40} />}
                title="No travelers found"
                subtitle="When users sign up on the Explore app, their profiles appear here."
              />
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Traveler</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Sign-in</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => (
                    <tr key={u._id}>
                      <td>
                        <div className="row-user">
                          <div className="row-avatar">{initials(u.fullname)}</div>
                          <div className="cell-main">{u.fullname}</div>
                        </div>
                      </td>
                      <td>{u.email || "—"}</td>
                      <td>{u.phone || "—"}</td>
                      <td><Badge status={u.authProvider || "local"} /></td>
                      <td className="cell-sub">{formatDate(u.createdAt)}</td>
                      <td>
                        <button type="button" className="btn btn-danger" onClick={() => remove(u._id, u.fullname)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}