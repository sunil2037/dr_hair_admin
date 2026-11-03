"use client";

import {
  ArrowDownToLine,
  History,
  Users,
  ShieldAlert,
  Trash2,
  Lock,
  Unlock,
  ExternalLink,
  AlertTriangle,
  RefreshCw,
  Search,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Avatar, PageHeader, TableToolbar, Modal } from "../../shared/components/ui";
import type { AuditEventRecord, Role } from "../../shared/types";

const mapEventType = (type: string, action: string): AuditEventRecord["type"] => {
  const norm = `${type} ${action}`.toLowerCase();
  if (norm.includes("access") || norm.includes("account") || norm.includes("admin")) return "Access";
  if (norm.includes("feature")) return "Feature";
  if (norm.includes("content") || norm.includes("video")) return "Content";
  if (norm.includes("notification") || norm.includes("campaign")) return "Notifications";
  if (norm.includes("release") || norm.includes("update") || norm.includes("policy")) return "App updates";
  if (norm.includes("order")) return "Orders";
  if (norm.includes("commerce") || norm.includes("product") || norm.includes("inventory")) return "Commerce";
  if (norm.includes("appointment") || norm.includes("booking")) return "Bookings";
  if (norm.includes("test") || norm.includes("assessment")) return "Testing";
  return "Clinical";
};

export interface LoginUserRecord {
  id: number;
  patient_code?: string;
  name: string;
  email?: string;
  phone?: string;
  status?: string;
  is_blocked?: boolean;
  blocked_at?: string | null;
  blocked_reason?: string | null;
  last_login_at?: string | null;
  created_at?: string | null;
}

export function AuditLog({
  globalSearch,
  onToast,
  events,
  role = "super-admin",
  onOpenPatient,
  onAudit,
}: {
  globalSearch: string;
  onToast: (message: string) => void;
  events: AuditEventRecord[];
  role?: Role;
  onOpenPatient?: (patientId: string) => void;
  onAudit?: (action: string, target: string) => void;
}) {
  const isSuperAdmin = role === "super-admin";
  const [activeTab, setActiveTab] = useState<"users" | "system">("users");

  // System audit log state
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("All activity");
  const [serverEvents, setServerEvents] = useState<AuditEventRecord[]>([]);
  const [exporting, setExporting] = useState(false);

  // User management state
  const [users, setUsers] = useState<LoginUserRecord[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [userStatusFilter, setUserStatusFilter] = useState<"All" | "Active" | "Blocked">("All");

  // Modals state
  const [blockModalUser, setBlockModalUser] = useState<LoginUserRecord | null>(null);
  const [blockReason, setBlockReason] = useState("");
  const [isSubmittingBlock, setIsSubmittingBlock] = useState(false);

  const [deleteModalUser, setDeleteModalUser] = useState<LoginUserRecord | null>(null);
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false);

  // Load system audit logs
  useEffect(() => {
    const controller = new AbortController();
    const loadAuditLogs = async () => {
      try {
        const response = await fetch("/api/admin/audit-logs?limit=100", { cache: "no-store", signal: controller.signal });
        const result = await response.json().catch(() => ({}));
        if (response.ok && Array.isArray(result?.data?.items)) {
          const items: unknown[] = result.data.items;
          setServerEvents(
            items.map((item) => {
              const raw = item as Record<string, unknown>;
              const actor = String(raw.actor ?? "System");
              const action = String(raw.action ?? "");
              const target = String(raw.target ?? "");
              const targetType = String(raw.targetType || "System");
              return {
                who: actor,
                initials: actor.split(/\s+/).map((p) => p[0] || "").join("").slice(0, 2).toUpperCase() || "SY",
                action,
                target,
                type: mapEventType(targetType, action),
                time: raw.created_at ? new Date(String(raw.created_at)).toLocaleString() : new Date().toLocaleString(),
              };
            })
          );
        }
      } catch {
        // Fallback silently to parent events
      }
    };
    void loadAuditLogs();
    return () => controller.abort();
  }, []);

  // Load user login activity list
  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await fetch("/api/admin/users?limit=100", { cache: "no-store" });
      const result = await response.json().catch(() => ({}));
      if (response.ok && Array.isArray(result?.data?.items)) {
        setUsers(result.data.items as LoginUserRecord[]);
      }
    } catch {
      onToast("Could not load user accounts list.");
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  // Filtered system events
  const effectiveEvents = serverEvents.length > 0 ? serverEvents : events;
  const search = `${query} ${globalSearch}`.trim().toLowerCase();
  const rows = useMemo(
    () =>
      effectiveEvents.filter(
        (event) =>
          `${event.who} ${event.action} ${event.target} ${event.type}`.toLowerCase().includes(search) &&
          (kind === "All activity" || event.type === kind)
      ),
    [effectiveEvents, search, kind]
  );

  // Filtered users
  const filteredUsers = useMemo(() => {
    const q = `${userSearch} ${globalSearch}`.trim().toLowerCase();
    return users.filter((u) => {
      const isBlocked = Boolean(u.is_blocked || u.status === "blocked");
      if (userStatusFilter === "Active" && isBlocked) return false;
      if (userStatusFilter === "Blocked" && !isBlocked) return false;
      if (!q) return true;
      const haystack = `${u.name} ${u.email || ""} ${u.phone || ""} ${u.patient_code || ""}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [users, userSearch, globalSearch, userStatusFilter]);

  // Export audit logs
  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await fetch("/api/admin/audit-logs/export?format=json");
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error("Export failed");
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(result?.data || {}, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `drhair-audit-logs-${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      onToast("Audit log exported successfully.");
    } catch {
      onToast("Audit log export failed. Try again.");
    } finally {
      setExporting(false);
    }
  };

  // Block / Unblock user handler
  const handleConfirmBlock = async () => {
    if (!blockModalUser) return;
    setIsSubmittingBlock(true);
    const targetUserId = blockModalUser.id;
    const willBlock = !Boolean(blockModalUser.is_blocked || blockModalUser.status === "blocked");
    try {
      const response = await fetch(`/api/admin/users/${targetUserId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          is_blocked: willBlock,
          status: willBlock ? "blocked" : "active",
          reason: blockReason || (willBlock ? "Administrative suspension" : null),
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message || "Failed to update status");

      setUsers((prev) =>
        prev.map((u) =>
          u.id === targetUserId
            ? {
                ...u,
                is_blocked: willBlock,
                status: willBlock ? "blocked" : "active",
                blocked_at: willBlock ? new Date().toISOString() : null,
                blocked_reason: willBlock ? blockReason || "Administrative suspension" : null,
              }
            : u
        )
      );

      const msg = willBlock
        ? `User ${blockModalUser.name} has been blocked. Mobile app session revoked.`
        : `User ${blockModalUser.name} has been unblocked. Mobile access restored.`;
      onToast(msg);

      if (onAudit) {
        onAudit(willBlock ? "blocked account" : "unblocked account", blockModalUser.patient_code || `patient_${targetUserId}`);
      }
      setBlockModalUser(null);
      setBlockReason("");
    } catch (err: unknown) {
      onToast(err instanceof Error ? err.message : "Failed to change user status.");
    } finally {
      setIsSubmittingBlock(false);
    }
  };

  // Delete user handler
  const handleConfirmDelete = async () => {
    if (!deleteModalUser) return;
    setIsSubmittingDelete(true);
    const targetUserId = deleteModalUser.id;
    try {
      const response = await fetch(`/api/admin/users/${targetUserId}`, {
        method: "DELETE",
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message || "Failed to delete user account");

      setUsers((prev) => prev.filter((u) => u.id !== targetUserId));
      onToast(`User ${deleteModalUser.name} account permanently deleted.`);

      if (onAudit) {
        onAudit("permanently deleted user", deleteModalUser.patient_code || `patient_${targetUserId}`);
      }
      setDeleteModalUser(null);
    } catch (err: unknown) {
      onToast(err instanceof Error ? err.message : "Failed to delete account.");
    } finally {
      setIsSubmittingDelete(false);
    }
  };

  return (
    <main className="page-wrap mx-auto w-full max-w-[1420px] px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Management · Super Admin"
        title="Audit log & User accounts"
        description="Monitor user sessions, live activity, access controls, and administrative actions."
        action={
          <div className="flex items-center gap-2">
            <button className="button button-secondary" onClick={loadUsers} disabled={loadingUsers} title="Refresh records">
              <RefreshCw size={14} className={loadingUsers ? "animate-spin" : ""} />
              {loadingUsers ? "Refreshing..." : "Refresh"}
            </button>
            <button className="button button-secondary" disabled={exporting} onClick={handleExport}>
              <ArrowDownToLine size={14} />
              {exporting ? "Exporting…" : "Export log"}
            </button>
          </div>
        }
      />

      {/* Tabs Switcher */}
      <div className="mb-5 flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab("users")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition-colors ${
            activeTab === "users"
              ? "border-[#1A365D] text-[#1A365D]"
              : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800"
          }`}
        >
          <Users size={16} />
          <span>Logged-in users & accounts</span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">
            {users.length}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("system")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition-colors ${
            activeTab === "system"
              ? "border-[#1A365D] text-[#1A365D]"
              : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800"
          }`}
        >
          <History size={16} />
          <span>System audit trail</span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">
            {effectiveEvents.length}
          </span>
        </button>
      </div>

      {activeTab === "users" && (
        <section className="card">
          <div className="section-row flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="card-title">Registered & Active Patients</h2>
              <p className="card-note">
                View login users, inspect details, and perform Super Admin account actions (Block/Delete).
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select
                className="period-select"
                aria-label="Filter status"
                value={userStatusFilter}
                onChange={(e) => setUserStatusFilter(e.target.value as "All" | "Active" | "Blocked")}
              >
                <option value="All">All statuses</option>
                <option value="Active">Active only</option>
                <option value="Blocked">Blocked only</option>
              </select>
            </div>
          </div>

          <TableToolbar
            value={userSearch}
            onChange={setUserSearch}
            placeholder="Search patient by name, phone, email, or patient code..."
            right={<span style={{ color: "#8a95a4", fontSize: 11 }}>{filteredUsers.length} patients found</span>}
          />

          <div className="table-wrap overflow-x-auto">
            <table>
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Contact</th>
                  <th>Account Status</th>
                  <th>Last Active / Login</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => {
                  const isBlocked = Boolean(u.is_blocked || u.status === "blocked");
                  const initials = u.name
                    ? u.name
                        .split(/\s+/)
                        .map((p) => p[0] || "")
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()
                    : "PT";
                  const lastLoginStr = u.last_login_at
                    ? new Date(u.last_login_at).toLocaleString()
                    : u.created_at
                    ? `Registered ${new Date(u.created_at).toLocaleDateString()}`
                    : "Recently";

                  return (
                    <tr key={u.id}>
                      <td>
                        <div className="person flex items-center gap-2.5">
                          <Avatar initials={initials} />
                          <div>
                            <div className="person-name font-semibold text-slate-900">{u.name}</div>
                            <div className="text-xs text-slate-500 font-mono">{u.patient_code || `PT-${u.id}`}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="text-xs font-medium text-slate-800">{u.phone || "No phone"}</div>
                        <div className="text-xs text-slate-500">{u.email || "No email"}</div>
                      </td>
                      <td>
                        {isBlocked ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700 border border-red-200">
                            <span className="h-1.5 w-1.5 rounded-full bg-red-600"></span>
                            Blocked
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600"></span>
                            Active
                          </span>
                        )}
                        {isBlocked && u.blocked_reason && (
                          <div className="text-[10px] text-red-600 truncate max-w-[150px]" title={u.blocked_reason}>
                            {u.blocked_reason}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className="text-xs text-slate-700">{lastLoginStr}</span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div className="flex items-center justify-end gap-1.5">
                          {/* 1. Show Detail Page Option */}
                          <button
                            type="button"
                            className="button button-secondary button-small"
                            onClick={() => {
                              if (onOpenPatient) {
                                onOpenPatient(String(u.id));
                              } else {
                                window.location.href = `/patients/${encodeURIComponent(u.id)}`;
                              }
                            }}
                            title="Open patient profile and clinical file"
                          >
                            <ExternalLink size={12} />
                            Details
                          </button>

                          {/* 2. Block / Unblock User Option (Super Admin Only) */}
                          {isSuperAdmin ? (
                            <button
                              type="button"
                              className={`button button-small ${
                                isBlocked
                                  ? "button-secondary border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                                  : "button-secondary border-amber-300 text-amber-700 hover:bg-amber-50"
                              }`}
                              onClick={() => {
                                setBlockReason(u.blocked_reason || "");
                                setBlockModalUser(u);
                              }}
                              title={isBlocked ? "Unblock patient account" : "Suspend patient account"}
                            >
                              {isBlocked ? <Unlock size={12} /> : <Lock size={12} />}
                              {isBlocked ? "Unblock" : "Block"}
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400" title="Super Admin access required">
                              Super Admin only
                            </span>
                          )}

                          {/* 3. Delete Account of User Option (Super Admin Only) */}
                          {isSuperAdmin && (
                            <button
                              type="button"
                              className="button button-danger button-small"
                              onClick={() => setDeleteModalUser(u)}
                              title="Permanently delete user account from database"
                            >
                              <Trash2 size={12} />
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={5}>
                      <div className="empty-state py-8 text-center text-slate-500">
                        {loadingUsers ? "Loading user accounts..." : "No user accounts match those filters."}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="table-footer flex justify-between items-center text-xs text-slate-500 py-3 px-4">
            <span>
              Showing {filteredUsers.length} of {users.length} patient accounts
            </span>
            <span className="text-[11px] font-medium text-slate-400">
              {isSuperAdmin ? "Super Admin permissions enabled" : "Read-only access"}
            </span>
          </div>
        </section>
      )}

      {activeTab === "system" && (
        <section className="card">
          <div className="notice" style={{ marginBottom: 15 }}>
            <History size={14} />
            <span>
              {serverEvents.length > 0
                ? "Live audit stream connected. Sensitive credentials, OTPs, and authorization tokens are strictly redacted."
                : "Activity captured in this browser preview. Server-side audit history begins after the API is connected."}
            </span>
          </div>

          <div className="section-row">
            <div>
              <h2 className="card-title">Recent changes</h2>
              <p className="card-note">Content updates, access changes, and operational actions</p>
            </div>
            <select className="period-select" aria-label="Filter activity type" value={kind} onChange={(event) => setKind(event.target.value)}>
              <option>All activity</option>
              <option>Access</option>
              <option>Feature</option>
              <option>Content</option>
              <option>Notifications</option>
              <option>App updates</option>
              <option>Commerce</option>
              <option>Orders</option>
              <option>Testing</option>
              <option>Bookings</option>
              <option>Clinical</option>
            </select>
          </div>

          <TableToolbar
            value={query}
            onChange={setQuery}
            placeholder="Search people, actions, or records..."
            right={<span style={{ color: "#8a95a4", fontSize: 10 }}>{rows.length} events</span>}
          />

          <div className="table-wrap overflow-x-auto">
            <table>
              <thead>
                <tr>
                  <th>Person</th>
                  <th>Action</th>
                  <th>Area</th>
                  <th>Time</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((event, index) => (
                  <tr key={`${event.who}-${index}`}>
                    <td>
                      <div className="person flex items-center gap-2">
                        <Avatar initials={event.initials} />
                        <div className="person-name">{event.who}</div>
                      </div>
                    </td>
                    <td>
                      {event.action} <strong style={{ color: "#334258" }}>{event.target}</strong>
                    </td>
                    <td>
                      <span className="status status-inactive" style={{ textTransform: "capitalize" }}>
                        {event.type}
                      </span>
                    </td>
                    <td>{event.time}</td>
                    <td>
                      <button
                        className="button button-secondary button-small"
                        onClick={() => onToast(`Event detail: ${event.who} ${event.action} ${event.target}.`)}
                      >
                        View details
                      </button>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={5}>
                      <div className="empty-state">No activity matches those filters.</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="table-footer">
            <span>Showing {rows.length} of {effectiveEvents.length} events</span>
          </div>
        </section>
      )}

      {/* Block / Unblock Modal Dialog */}
      {blockModalUser && (
        <Modal
          title={
            blockModalUser.is_blocked || blockModalUser.status === "blocked"
              ? `Unblock Patient Account: ${blockModalUser.name}`
              : `Block Patient Account: ${blockModalUser.name}`
          }
          description={
            blockModalUser.is_blocked || blockModalUser.status === "blocked"
              ? "Restoring this patient account will re-enable mobile app access and login privileges."
              : "Suspending this user account immediately invalidates their active app sessions and prevents further logins."
          }
          submitLabel={
            isSubmittingBlock
              ? "Saving..."
              : blockModalUser.is_blocked || blockModalUser.status === "blocked"
              ? "Confirm & Unblock Account"
              : "Confirm & Block Account"
          }
          submitVariant={blockModalUser.is_blocked || blockModalUser.status === "blocked" ? "primary" : "danger"}
          submitDisabled={isSubmittingBlock}
          onClose={() => setBlockModalUser(null)}
          onSubmit={handleConfirmBlock}
        >
          <div className="space-y-4 py-2">
            {!(blockModalUser.is_blocked || blockModalUser.status === "blocked") && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 flex items-start gap-2.5">
                <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-semibold mb-1">Warning: Live App Suspension</strong>
                  The user will be immediately disconnected from the Dr. Hair mobile app. On their next screen load or app
                  open, they will see a clinical suspension warning screen with support contact instructions
                  (support@drhair.in, +91-9876543210).
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reason for {blockModalUser.is_blocked || blockModalUser.status === "blocked" ? "unblocking" : "suspension"} (optional audit trail):
              </label>
              <textarea
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1A365D]"
                rows={3}
                placeholder="e.g., Requested consultation pause, suspicious activity, or identity review..."
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
              />
            </div>
          </div>
        </Modal>
      )}

      {/* Delete User Account Modal Dialog */}
      {deleteModalUser && (
        <Modal
          title={`Permanently Delete Patient: ${deleteModalUser.name}`}
          description="Are you sure you want to delete this patient account from the database?"
          submitLabel={isSubmittingDelete ? "Deleting..." : "Permanently Delete Account"}
          submitVariant="danger"
          submitDisabled={isSubmittingDelete}
          onClose={() => setDeleteModalUser(null)}
          onSubmit={handleConfirmDelete}
        >
          <div className="space-y-4 py-2">
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-900 flex items-start gap-2.5">
              <ShieldAlert size={18} className="text-red-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold mb-1 text-red-800">Dangerous Administrative Action</strong>
                This action is irreversible. The patient profile ({deleteModalUser.patient_code || `PT-${deleteModalUser.id}`}),
                phone verification, and active sessions will be permanently purged from the database.
                <span className="block mt-1 font-semibold">
                  If the patient opens the Dr. Hair app, they will be automatically signed out and navigated to the login screen.
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600">
              Patient: <strong>{deleteModalUser.name}</strong> ({deleteModalUser.phone || deleteModalUser.email})
            </p>
          </div>
        </Modal>
      )}
    </main>
  );
}
