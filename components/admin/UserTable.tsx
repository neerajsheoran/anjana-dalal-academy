"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
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

const PAGE_SIZE = 20;

export default function UserTable({ users, readOnly = false }: { users: User[]; readOnly?: boolean }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [subFilter, setSubFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [showDeleted, setShowDeleted] = useState(false);
  const [page, setPage] = useState(1);

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
      router.refresh();
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
      router.refresh();
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

  // Reset to page 1 when filters change
  const filteredLength = filtered.length;
  const totalPages = Math.max(1, Math.ceil(filteredLength / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginatedUsers = useMemo(
    () => filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [filtered, safePage]
  );

  // Reset page when filters change
  useMemo(() => {
    setPage(1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, roleFilter, subFilter, showDeleted]);

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
              {!readOnly && deletedCount > 0 && (
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
                {totalPages > 1 && ` · Page ${safePage} of ${totalPages}`}
              </span>
              <button
                onClick={() => router.refresh()}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                title="Refresh users"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
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
              <option value="content-author">Content Author</option>
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
                      User
                      <SortArrow col="name" />
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
                    {!readOnly && !showDeleted && <th className="px-6 py-3">Extend</th>}
                    {!readOnly && <th className="px-3 py-3"></th>}
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers.map((user) => (
                    <tr
                      key={user.uid}
                      className="border-b border-gray-50 last:border-0"
                    >
                      <td className="px-6 py-3">
                        <a
                          href={`/admin/users/${user.uid}`}
                          className="group"
                        >
                          <span className="font-medium text-blue-600 group-hover:text-blue-800 group-hover:underline">
                            {user.name}
                          </span>
                          <span className="block text-xs text-gray-400">{user.email}</span>
                        </a>
                      </td>
                      <td className="px-6 py-3">
                        {user.role === "admin" ? (
                          <span className="text-sm font-medium text-blue-600">
                            Admin
                          </span>
                        ) : readOnly || showDeleted ? (
                          <span className="text-sm text-gray-400 capitalize">
                            {user.role === "content-author" ? "Content Author" : user.role}
                          </span>
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
                      {!readOnly && !showDeleted && (
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
                      {!readOnly && (
                        <td className="px-3 py-3">
                          {showDeleted ? (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleRestore(user.uid)}
                                className="text-gray-400 hover:text-green-600 transition-colors"
                                title="Restore user"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                              </button>
                              <button
                                onClick={() => setModalUser(user)}
                                className="text-gray-400 hover:text-red-500 transition-colors"
                                title="Delete permanently"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          ) : (
                            user.role !== "admin" && (
                              <button
                                onClick={() => setModalUser(user)}
                                className="text-gray-400 hover:text-red-500 transition-colors"
                                title="Delete user"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            )
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination — Desktop */}
            {totalPages > 1 && (
              <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage <= 1}
                  className="text-xs font-medium text-blue-600 hover:text-blue-800 disabled:text-gray-300 disabled:cursor-not-allowed"
                >
                  ← Previous
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 2)
                    .map((p, idx, arr) => (
                      <span key={p}>
                        {idx > 0 && arr[idx - 1] !== p - 1 && (
                          <span className="text-xs text-gray-300 px-1">...</span>
                        )}
                        <button
                          onClick={() => setPage(p)}
                          className={`text-xs font-medium px-2 py-1 rounded ${
                            p === safePage
                              ? "bg-blue-600 text-white"
                              : "text-gray-500 hover:bg-gray-100"
                          }`}
                        >
                          {p}
                        </button>
                      </span>
                    ))}
                </div>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage >= totalPages}
                  className="text-xs font-medium text-blue-600 hover:text-blue-800 disabled:text-gray-300 disabled:cursor-not-allowed"
                >
                  Next →
                </button>
              </div>
            )}

            {/* Mobile cards */}
            <div className="sm:hidden divide-y divide-gray-100">
              {paginatedUsers.map((user) => (
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
                    ) : readOnly || showDeleted ? (
                      <span className="text-sm text-gray-400 capitalize">
                        {user.role === "content-author" ? "Content Author" : user.role}
                      </span>
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
                  {!readOnly && !showDeleted &&
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
                  {!readOnly && (
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
                  )}
                </div>
              ))}
            </div>

            {/* Pagination — Mobile */}
            {totalPages > 1 && (
              <div className="sm:hidden px-6 py-3 border-t border-gray-100 flex items-center justify-between">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage <= 1}
                  className="text-xs font-medium text-blue-600 hover:text-blue-800 disabled:text-gray-300 disabled:cursor-not-allowed"
                >
                  ← Prev
                </button>
                <span className="text-xs text-gray-400">
                  {safePage} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage >= totalPages}
                  className="text-xs font-medium text-blue-600 hover:text-blue-800 disabled:text-gray-300 disabled:cursor-not-allowed"
                >
                  Next →
                </button>
              </div>
            )}
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
