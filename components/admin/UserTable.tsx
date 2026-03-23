"use client";

import { useState, useMemo, useCallback } from "react";
import RoleSelector from "@/components/admin/RoleSelector";
import SubscriptionExtender from "@/components/admin/SubscriptionExtender";

interface User {
  uid: string;
  name: string;
  email: string;
  role: string;
  subStatus: string;
  createdAt: string;
  isDeleted?: boolean;
}

type SortKey = "name" | "email" | "role" | "subStatus";
type SortDir = "asc" | "desc";

export default function UserTable({ users }: { users: User[] }) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [subFilter, setSubFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [showDeleted, setShowDeleted] = useState(false);

  // Delete modal state
  const [modalUser, setModalUser] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Track client-side changes
  const [deletedUids, setDeletedUids] = useState<Set<string>>(new Set());
  const [restoredUids, setRestoredUids] = useState<Set<string>>(new Set());
  const [permanentlyDeletedUids, setPermanentlyDeletedUids] = useState<Set<string>>(new Set());

  const handleDelete = async (uid: string, permanent = false) => {
    setDeleting(true);
    try {
      const res = await fetch("/api/admin/delete-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, permanent }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to delete user");
        return;
      }
      if (permanent) {
        setPermanentlyDeletedUids((prev) => new Set(prev).add(uid));
      } else {
        setDeletedUids((prev) => new Set(prev).add(uid));
        setRestoredUids((prev) => {
          const next = new Set(prev);
          next.delete(uid);
          return next;
        });
      }
      setModalUser(null);
    } catch {
      alert("Failed to delete user");
    } finally {
      setDeleting(false);
    }
  };

  const handleRestore = async (uid: string) => {
    try {
      const res = await fetch("/api/admin/restore-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to restore user");
        return;
      }
      setRestoredUids((prev) => new Set(prev).add(uid));
      setDeletedUids((prev) => {
        const next = new Set(prev);
        next.delete(uid);
        return next;
      });
    } catch {
      alert("Failed to restore user");
    }
  };

  const isUserDeleted = useCallback(
    (u: User) => {
      if (permanentlyDeletedUids.has(u.uid)) return false; // gone entirely
      if (restoredUids.has(u.uid)) return false;
      if (deletedUids.has(u.uid)) return true;
      return u.isDeleted === true;
    },
    [deletedUids, restoredUids, permanentlyDeletedUids]
  );

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const filtered = useMemo(() => {
    let result = users.filter((u) => !permanentlyDeletedUids.has(u.uid));

    // Split active vs deleted
    if (showDeleted) {
      result = result.filter((u) => isUserDeleted(u));
    } else {
      result = result.filter((u) => !isUserDeleted(u));
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q)
      );
    }

    if (roleFilter !== "all") {
      result = result.filter((u) => u.role === roleFilter);
    }

    if (subFilter !== "all") {
      if (subFilter === "active") {
        result = result.filter(
          (u) => u.subStatus === "active" || u.subStatus === "extended"
        );
      } else {
        result = result.filter((u) => u.subStatus === subFilter);
      }
    }

    if (sortKey) {
      result = [...result].sort((a, b) => {
        const aVal = a[sortKey].toLowerCase();
        const bVal = b[sortKey].toLowerCase();
        if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
        if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [users, search, roleFilter, subFilter, sortKey, sortDir, showDeleted, isUserDeleted, permanentlyDeletedUids]);

  const activeCount = useMemo(
    () => users.filter((u) => !isUserDeleted(u) && !permanentlyDeletedUids.has(u.uid)).length,
    [users, isUserDeleted, permanentlyDeletedUids]
  );
  const deletedCount = useMemo(
    () => users.filter((u) => isUserDeleted(u) && !permanentlyDeletedUids.has(u.uid)).length,
    [users, isUserDeleted, permanentlyDeletedUids]
  );

  const downloadCSV = () => {
    const headers = ["Name", "Email", "Role", "Subscription", "Created At"];
    const rows = filtered.map((u) => [u.name, u.email, u.role, u.subStatus, u.createdAt]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users-${showDeleted ? "deleted" : "active"}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const SortArrow = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return null;
    return <span className="ml-1">{sortDir === "asc" ? "▲" : "▼"}</span>;
  };

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {/* Header + Controls */}
        <div className="px-6 py-4 border-b border-gray-100 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest">
                {showDeleted ? "Deleted Users" : "All Users"}
              </h2>
              {deletedCount > 0 && (
                <button
                  onClick={() => setShowDeleted(!showDeleted)}
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    showDeleted
                      ? "bg-gray-100 text-gray-600"
                      : "bg-red-50 text-red-500"
                  }`}
                >
                  {showDeleted
                    ? `Active (${activeCount})`
                    : `Deleted (${deletedCount})`}
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400">
                {filtered.length === (showDeleted ? deletedCount : activeCount)
                  ? `${filtered.length} users`
                  : `${filtered.length} of ${showDeleted ? deletedCount : activeCount} users`}
              </span>
              <button
                onClick={downloadCSV}
                className="text-xs font-medium text-blue-500 hover:text-blue-700"
              >
                Export CSV
              </button>
            </div>
          </div>

          {/* Search */}
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
          />

          {/* Filters */}
          <div className="flex gap-3">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="all">All Roles</option>
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="partner">Partner</option>
              <option value="admin">Admin</option>
            </select>

            <select
              value={subFilter}
              onChange={(e) => setSubFilter(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="all">All Subscriptions</option>
              <option value="trial">Trial</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="none">None</option>
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <p className="text-sm text-gray-400">
              {showDeleted ? "No deleted users." : "No users match your filters."}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-gray-400 text-xs uppercase tracking-wider">
                    <th
                      className="px-6 py-3 cursor-pointer hover:text-gray-600 select-none"
                      onClick={() => handleSort("name")}
                    >
                      Name
                      <SortArrow col="name" />
                    </th>
                    <th
                      className="px-6 py-3 cursor-pointer hover:text-gray-600 select-none"
                      onClick={() => handleSort("email")}
                    >
                      Email
                      <SortArrow col="email" />
                    </th>
                    <th
                      className="px-6 py-3 cursor-pointer hover:text-gray-600 select-none"
                      onClick={() => handleSort("role")}
                    >
                      Role
                      <SortArrow col="role" />
                    </th>
                    <th
                      className="px-6 py-3 cursor-pointer hover:text-gray-600 select-none"
                      onClick={() => handleSort("subStatus")}
                    >
                      Subscription
                      <SortArrow col="subStatus" />
                    </th>
                    {!showDeleted && <th className="px-6 py-3">Extend</th>}
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((user) => (
                    <tr
                      key={user.uid}
                      className="border-b border-gray-50 last:border-0"
                    >
                      <td className="px-6 py-3 font-medium text-gray-800">
                        <a
                          href={`/admin/users/${user.uid}`}
                          className="hover:text-blue-600 hover:underline"
                        >
                          {user.name}
                        </a>
                      </td>
                      <td className="px-6 py-3 text-gray-500">{user.email}</td>
                      <td className="px-6 py-3">
                        {user.role === "admin" ? (
                          <span className="text-sm font-medium text-blue-600">
                            Admin
                          </span>
                        ) : showDeleted ? (
                          <span className="text-sm text-gray-400 capitalize">{user.role}</span>
                        ) : (
                          <RoleSelector
                            uid={user.uid}
                            currentRole={user.role}
                          />
                        )}
                      </td>
                      <td className="px-6 py-3">
                        <SubBadge status={user.subStatus} />
                      </td>
                      {!showDeleted && (
                        <td className="px-6 py-3">
                          {user.role !== "admin" &&
                            user.subStatus !== "active" &&
                            user.subStatus !== "extended" && (
                            <SubscriptionExtender
                              uid={user.uid}
                              userName={user.name}
                            />
                          )}
                        </td>
                      )}
                      <td className="px-6 py-3">
                        {showDeleted ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleRestore(user.uid)}
                              className="text-xs font-medium text-green-500 hover:text-green-700"
                            >
                              Restore
                            </button>
                            <button
                              onClick={() => setModalUser(user)}
                              className="text-xs font-medium text-red-400 hover:text-red-600"
                            >
                              Permanent
                            </button>
                          </div>
                        ) : (
                          user.role !== "admin" && (
                            <button
                              onClick={() => setModalUser(user)}
                              className="text-xs font-medium text-red-400 hover:text-red-600"
                            >
                              Delete
                            </button>
                          )
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden divide-y divide-gray-100">
              {filtered.map((user) => (
                <div key={user.uid} className="px-6 py-4">
                  <div className="flex items-start justify-between mb-1">
                    <a
                      href={`/admin/users/${user.uid}`}
                      className="font-medium text-gray-800 hover:text-blue-600 hover:underline"
                    >
                      {user.name}
                    </a>
                    <SubBadge status={user.subStatus} />
                  </div>
                  <p className="text-xs text-gray-400 mb-2">{user.email}</p>
                  <div className="flex items-center justify-between">
                    {user.role === "admin" ? (
                      <span className="text-sm font-medium text-blue-600">
                        Admin
                      </span>
                    ) : showDeleted ? (
                      <span className="text-sm text-gray-400 capitalize">{user.role}</span>
                    ) : (
                      <RoleSelector
                        uid={user.uid}
                        currentRole={user.role}
                      />
                    )}
                    <span className="text-xs text-gray-400">
                      {user.createdAt}
                    </span>
                  </div>
                  {!showDeleted &&
                    user.role !== "admin" &&
                    user.subStatus !== "active" &&
                    user.subStatus !== "extended" && (
                    <div className="mt-2">
                      <SubscriptionExtender
                        uid={user.uid}
                        userName={user.name}
                      />
                    </div>
                  )}
                  <div className="mt-2 flex justify-end">
                    {showDeleted ? (
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleRestore(user.uid)}
                          className="text-xs font-medium text-green-500 hover:text-green-700"
                        >
                          Restore
                        </button>
                        <button
                          onClick={() => setModalUser(user)}
                          className="text-xs font-medium text-red-400 hover:text-red-600"
                        >
                          Permanent Delete
                        </button>
                      </div>
                    ) : (
                      user.role !== "admin" && (
                        <button
                          onClick={() => setModalUser(user)}
                          className="text-xs font-medium text-red-400 hover:text-red-600"
                        >
                          Delete
                        </button>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {modalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-lg max-w-sm w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              {showDeleted ? "Permanently Delete User?" : "Delete User?"}
            </h3>
            <p className="text-sm text-gray-500 mb-1">
              <span className="font-medium text-gray-700">{modalUser.name}</span>{" "}
              ({modalUser.email})
            </p>
            <p className="text-sm text-gray-400 mb-5">
              {showDeleted
                ? "This will permanently remove the user and all their data. This action cannot be undone."
                : "The user will be hidden from all lists. You can restore them later from the Deleted Users view."}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setModalUser(null)}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(modalUser.uid, showDeleted)}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg disabled:opacity-50"
              >
                {deleting
                  ? "Deleting..."
                  : showDeleted
                  ? "Delete Permanently"
                  : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function SubBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    admin: "bg-blue-50 text-blue-600",
    active: "bg-green-50 text-green-600",
    extended: "bg-green-50 text-green-600",
    trial: "bg-amber-50 text-amber-600",
    expired: "bg-red-50 text-red-500",
    none: "bg-gray-50 text-gray-400",
  };
  const labels: Record<string, string> = {
    admin: "Admin",
    active: "Active",
    extended: "Extended",
    trial: "Trial",
    expired: "Expired",
    none: "—",
  };
  return (
    <span
      className={`text-xs font-medium px-2 py-0.5 rounded-full ${styles[status] || styles.none}`}
    >
      {labels[status] || "—"}
    </span>
  );
}
