"use client";

import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  Plus,
  RefreshCw,
  Settings2,
  ShieldCheck,
  Trash2,
  UserCheck,
  UsersRound,
  UserX,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  adminPermissionCategories,
  getEffectivePermissions,
  getPermissionSummary,
  roleTemplates,
} from "../../shared/lib/admin-permissions";
import type {
  AdminPermissionId,
  AdminPermissionOverride,
  AdminRoleTemplate,
} from "../../shared/types";
import { Modal, PageHeader } from "../../shared/components/ui";

type Account = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "super_admin";
  roleTemplate?: AdminRoleTemplate;
  permissions?: AdminPermissionId[];
  permissionOverrides?: Partial<Record<AdminPermissionId, AdminPermissionOverride>>;
  effectivePermissions?: AdminPermissionId[];
  active: boolean;
  created_at: string | null;
};

type Credentials = { loginId: string; password: string };

function generateRandomPassword(): string {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%&*";
  let pass = "";
  for (let i = 0; i < 14; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
}

export function AdminAccountManagement() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Create account form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [passwordMode, setPasswordMode] = useState<"custom" | "auto">("custom");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [roleTemplate, setRoleTemplate] = useState<AdminRoleTemplate>("clinical-admin");
  const [permissionOverrides, setPermissionOverrides] = useState<
    Partial<Record<AdminPermissionId, AdminPermissionOverride>>
  >({});
  const [showPermissionsCustomizer, setShowPermissionsCustomizer] = useState(false);
  const [credentials, setCredentials] = useState<Credentials | null>(null);

  // Modal dialog states
  const [editingAccessAccount, setEditingAccessAccount] = useState<Account | null>(null);
  const [editRoleTemplate, setEditRoleTemplate] = useState<AdminRoleTemplate>("clinical-admin");
  const [editOverrides, setEditOverrides] = useState<
    Partial<Record<AdminPermissionId, AdminPermissionOverride>>
  >({});
  const [savingAccess, setSavingAccess] = useState(false);

  const [passwordTargetAccount, setPasswordTargetAccount] = useState<Account | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [rotatingPassword, setRotatingPassword] = useState(false);

  const [deletingAccount, setDeletingAccount] = useState<Account | null>(null);
  const [deletingBusy, setDeletingBusy] = useState(false);

  const [statusTogglingId, setStatusTogglingId] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/admin/accounts", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.message || "Could not load admin accounts.");
        return result;
      })
      .then((result) => {
        setAccounts(Array.isArray(result?.data?.items) ? (result.data.items as Account[]) : []);
      })
      .catch((loadError) => {
        if (!controller.signal.aborted) {
          setError(loadError instanceof Error ? loadError.message : "Could not load admin accounts.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  // Creation effective permissions preview
  const previewEffectivePermissions = useMemo(() => {
    return getEffectivePermissions(roleTemplate, permissionOverrides);
  }, [roleTemplate, permissionOverrides]);

  const previewSummary = useMemo(() => {
    return getPermissionSummary(previewEffectivePermissions);
  }, [previewEffectivePermissions]);

  function togglePermissionOverride(permId: AdminPermissionId) {
    const baseTemplate = roleTemplates[roleTemplate];
    const isBaseAllowed = baseTemplate.permissions.includes(permId);
    const currentOverride = permissionOverrides[permId];

    const updated = { ...permissionOverrides };
    if (!currentOverride) {
      updated[permId] = isBaseAllowed ? "deny" : "allow";
    } else {
      delete updated[permId];
    }
    setPermissionOverrides(updated);
  }

  function toggleEditPermissionOverride(permId: AdminPermissionId) {
    const baseTemplate = roleTemplates[editRoleTemplate];
    const isBaseAllowed = baseTemplate.permissions.includes(permId);
    const currentOverride = editOverrides[permId];

    const updated = { ...editOverrides };
    if (!currentOverride) {
      updated[permId] = isBaseAllowed ? "deny" : "allow";
    } else {
      delete updated[permId];
    }
    setEditOverrides(updated);
  }

  async function createAccount(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    setCredentials(null);

    if (passwordMode === "custom" && password.trim().length < 8) {
      setError("Custom password must be at least 8 characters long.");
      setBusy(false);
      return;
    }

    try {
      const payload: Record<string, unknown> = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        roleTemplate,
        permissionOverrides,
      };

      if (passwordMode === "custom" && password.trim()) {
        payload.password = password.trim();
      }

      const response = await fetch("/api/admin/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        cache: "no-store",
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message || "Could not create the admin account.");

      const created = result?.data?.admin as Account | undefined;
      const issued = result?.data?.credentials as { login_id?: unknown; password?: unknown } | undefined;
      if (!created || typeof issued?.login_id !== "string" || typeof issued.password !== "string") {
        throw new Error("The server did not return the new admin credentials.");
      }

      setAccounts((current) => [created, ...current.filter((item) => item.email !== created.email)]);
      setCredentials({ loginId: issued.login_id, password: issued.password });
      setName("");
      setEmail("");
      setPassword("");
      setPermissionOverrides({});
      setShowPermissionsCustomizer(false);
      setNotice(
        passwordMode === "custom"
          ? "Admin account created successfully with the provided credentials."
          : "Copy these credentials now. The generated temporary password is shown only once."
      );
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Could not create the admin account.");
    } finally {
      setBusy(false);
    }
  }

  async function copyCredentials() {
    if (!credentials) return;
    try {
      await navigator.clipboard.writeText(`Login ID: ${credentials.loginId}\nPassword: ${credentials.password}`);
      setNotice("Credentials copied to clipboard. Share them privately with the new admin.");
    } catch {
      setNotice("Clipboard copy unavailable. Please select and copy credentials manually.");
    }
  }

  // Open edit access modal
  function openEditAccess(account: Account) {
    setEditingAccessAccount(account);
    const currentTemplate = account.roleTemplate || "clinical-admin";
    setEditRoleTemplate(currentTemplate);
    setEditOverrides(account.permissionOverrides || {});
  }

  async function saveEditedAccess() {
    if (!editingAccessAccount) return;
    setSavingAccess(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/accounts/${encodeURIComponent(editingAccessAccount.id)}/access`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roleTemplate: editRoleTemplate,
          permissionOverrides: editOverrides,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message || "Could not update admin access.");

      const updated = result?.data as Account | undefined;
      if (updated) {
        setAccounts((current) =>
          current.map((item) => (item.id === updated.id ? { ...item, ...updated } : item))
        );
      }
      setNotice(`Feature access updated for ${editingAccessAccount.name}.`);
      setEditingAccessAccount(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update feature access.");
    } finally {
      setSavingAccess(false);
    }
  }

  // Toggle active / suspend status
  async function toggleAdminStatus(account: Account) {
    if (account.role === "super_admin") return;
    const nextActive = !account.active;
    const confirmMessage = nextActive
      ? `Reactivate admin access for ${account.name}? They will be able to log in again.`
      : `Suspend admin access for ${account.name}? All active sessions will be terminated and they will not be able to log in.`;

    if (!window.confirm(confirmMessage)) return;

    setStatusTogglingId(account.id);
    setError("");
    try {
      const response = await fetch(`/api/admin/accounts/${encodeURIComponent(account.id)}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: nextActive }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message || "Could not change account status.");

      setAccounts((current) =>
        current.map((item) => (item.id === account.id ? { ...item, active: nextActive } : item))
      );
      setNotice(nextActive ? `Admin access reactivated for ${account.name}.` : `Admin access suspended for ${account.name}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update admin status.");
    } finally {
      setStatusTogglingId(null);
    }
  }

  // Reset / Rotate password
  function openPasswordModal(account: Account) {
    setPasswordTargetAccount(account);
    setNewPassword("");
    setShowNewPassword(false);
  }

  async function submitPasswordRotation() {
    if (!passwordTargetAccount) return;
    if (newPassword.trim().length < 8) {
      setError("New password must be at least 8 characters long.");
      return;
    }
    setRotatingPassword(true);
    setError("");
    try {
      const response = await fetch(
        `/api/admin/accounts/${encodeURIComponent(passwordTargetAccount.id)}/rotate-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ newPassword: newPassword.trim() }),
        }
      );
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message || "Could not rotate password.");

      setNotice(`Password successfully rotated for ${passwordTargetAccount.name}.`);
      setPasswordTargetAccount(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to rotate password.");
    } finally {
      setRotatingPassword(false);
    }
  }

  // Remove Admin Permanently (Delete)
  async function submitDeleteAccount() {
    if (!deletingAccount) return;
    setDeletingBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/accounts/${encodeURIComponent(deletingAccount.id)}`, {
        method: "DELETE",
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message || "Could not remove admin account.");

      setAccounts((current) => current.filter((item) => item.id !== deletingAccount.id));
      setNotice(`Admin account for ${deletingAccount.name} (${deletingAccount.email}) has been permanently removed.`);
      setDeletingAccount(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove admin account.");
    } finally {
      setDeletingBusy(false);
    }
  }

  return (
    <div className="page-wrap w-full min-w-0">
      <PageHeader
        eyebrow="Management · Super Admin"
        title="Admin accounts"
        description="Create staff logins, set login passwords, configure feature access, and manage team permissions."
      />

      <div className="notice mb-4 rounded-2xl">
        <ShieldCheck size={14} />
        <span>
          Only a signed-in Super Admin can create or manage admin accounts. You can customize which feature areas each staff member can access.
        </span>
      </div>

      {/* CREATE ADMIN SECTION */}
      <section className="card mb-5 overflow-hidden rounded-[24px]">
        <div className="section-row border-b border-slate-100 px-4 py-4 sm:px-5">
          <div>
            <h2 className="card-title">Create an admin account</h2>
            <p className="card-note">
              Provide credentials, select which features this staff member can access, and share their login ID and password.
            </p>
          </div>
        </div>

        <form onSubmit={createAccount} className="p-4 sm:p-5">
          <div className="grid min-w-0 gap-4 sm:grid-cols-2">
            {/* Full Name */}
            <div className="field min-w-0">
              <label htmlFor="admin-account-name">Full name</label>
              <input
                id="admin-account-name"
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Dr. Aisha Khan"
                required
                maxLength={100}
              />
            </div>

            {/* Work Email / Login ID */}
            <div className="field min-w-0">
              <label htmlFor="admin-account-email">Work email / login ID</label>
              <input
                id="admin-account-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="aisha@drhair.in"
                required
              />
            </div>

            {/* Password Configuration */}
            <div className="sm:col-span-2 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
              <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-800">Admin Login Password</span>
                <div className="segmented-control inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
                  <button
                    type="button"
                    className={passwordMode === "custom" ? "active" : ""}
                    onClick={() => setPasswordMode("custom")}
                  >
                    Set custom password
                  </button>
                  <button
                    type="button"
                    className={passwordMode === "auto" ? "active" : ""}
                    onClick={() => {
                      setPasswordMode("auto");
                      setPassword("");
                    }}
                  >
                    Auto-generate
                  </button>
                </div>
              </div>

              {passwordMode === "custom" ? (
                <div className="mt-2">
                  <div className="relative flex items-center">
                    <input
                      id="admin-account-password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter login password (min. 8 characters)"
                      className="w-full pr-24"
                      required={passwordMode === "custom"}
                      minLength={8}
                    />
                    <div className="absolute right-2 flex items-center gap-1.5">
                      <button
                        type="button"
                        className="text-xs text-slate-500 hover:text-slate-800 px-1 py-1"
                        onClick={() => setPassword(generateRandomPassword())}
                        title="Generate strong random password"
                      >
                        <RefreshCw size={13} className="inline mr-1" />
                        Random
                      </button>
                      <button
                        type="button"
                        className="text-slate-500 hover:text-slate-800 p-1"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                  <p className="mt-1.5 text-[11px] text-slate-500">
                    Staff member will use this password to sign into the Dr. Hair clinic panel.
                  </p>
                </div>
              ) : (
                <p className="mt-2 text-xs text-slate-600 flex items-center gap-1.5">
                  <KeyRound size={14} className="text-teal-600 shrink-0" />
                  A strong temporary password will be generated automatically and shown on screen upon creation.
                </p>
              )}
            </div>

            {/* Feature Access / Role Template Selector */}
            <div className="sm:col-span-2 rounded-2xl border border-slate-200 bg-white p-4">
              <label className="mb-2 block text-xs font-semibold text-slate-800">
                Assigned Feature Access / Role
              </label>
              <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {(Object.entries(roleTemplates) as [AdminRoleTemplate, (typeof roleTemplates)[AdminRoleTemplate]][]).map(
                  ([key, template]) => {
                    const isSelected = roleTemplate === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          setRoleTemplate(key);
                          setPermissionOverrides({});
                        }}
                        className={`rounded-xl border p-3 text-left transition-all ${
                          isSelected
                            ? "border-teal-600 bg-teal-50/70 shadow-sm"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-bold ${isSelected ? "text-teal-900" : "text-slate-800"}`}>
                            {template.label}
                          </span>
                          {isSelected && <Check size={14} className="text-teal-600" />}
                        </div>
                        <p className="mt-1 text-[11px] leading-relaxed text-slate-500">{template.description}</p>
                      </button>
                    );
                  }
                )}
              </div>

              {/* Effective permissions preview */}
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs">
                <span className="text-slate-600">
                  <strong>Access Granted:</strong>{" "}
                  {previewSummary.length > 0 ? previewSummary.join(", ") : "No base permissions"} (
                  {previewEffectivePermissions.length} permissions)
                </span>
                <button
                  type="button"
                  onClick={() => setShowPermissionsCustomizer(!showPermissionsCustomizer)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-800"
                >
                  {showPermissionsCustomizer ? "Hide granular permissions" : "Customize individual permissions"}
                  {showPermissionsCustomizer ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              </div>

              {/* Granular Permission Checklist Drawer */}
              {showPermissionsCustomizer && (
                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 space-y-4">
                  <p className="text-xs text-slate-600">
                    Toggle individual permissions on or off to create tailored access for this administrator:
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {adminPermissionCategories.map((category) => (
                      <div key={category.id} className="rounded-lg border border-slate-200 bg-white p-3">
                        <h4 className="text-xs font-bold text-slate-800 border-b border-slate-100 pb-1.5 mb-2">
                          {category.title}
                        </h4>
                        <div className="space-y-1.5">
                          {category.permissions.map((perm) => {
                            const isAllowed = previewEffectivePermissions.includes(perm.id);
                            return (
                              <label
                                key={perm.id}
                                className="flex items-start gap-2 text-[11px] cursor-pointer hover:bg-slate-50 p-1 rounded"
                              >
                                <input
                                  type="checkbox"
                                  checked={isAllowed}
                                  onChange={() => togglePermissionOverride(perm.id)}
                                  className="mt-0.5 rounded text-teal-600 focus:ring-teal-500"
                                />
                                <span className={isAllowed ? "font-medium text-slate-900" : "text-slate-500"}>
                                  {perm.label}
                                  {perm.elevated && (
                                    <span className="ml-1 text-[9px] font-semibold text-amber-700 bg-amber-50 px-1 py-0.5 rounded">
                                      High
                                    </span>
                                  )}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Create Button */}
            <div className="sm:col-span-2 pt-2">
              <button className="button button-primary w-full sm:w-auto" type="submit" disabled={busy}>
                <Plus size={15} />
                {busy ? "Creating staff account…" : "Create admin account"}
              </button>
            </div>
          </div>

          {error && (
            <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">
              {error}
            </p>
          )}

          {notice && (
            <p className="mt-4 rounded-xl border border-teal-200 bg-teal-50 p-3 text-sm text-teal-900" role="status">
              {notice}
            </p>
          )}

          {/* Credentials Display Card */}
          {credentials && (
            <div
              className="mt-4 rounded-2xl border border-teal-200 bg-teal-50 p-4"
              aria-label="Generated admin credentials"
            >
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-teal-950">
                <KeyRound size={16} />
                New staff login credentials
              </div>
              <dl className="grid min-w-0 gap-3 text-sm sm:grid-cols-2">
                <div className="min-w-0">
                  <dt className="text-xs text-slate-600">Login ID / Work Email</dt>
                  <dd className="mt-1 break-all font-medium text-slate-900">{credentials.loginId}</dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-xs text-slate-600">Password</dt>
                  <dd className="mt-1 break-all font-mono font-medium text-slate-900 bg-white/70 px-2 py-1 rounded border border-teal-100">
                    {credentials.password}
                  </dd>
                </div>
              </dl>
              <button
                className="button button-secondary button-small mt-3 w-full sm:w-auto"
                type="button"
                onClick={() => void copyCredentials()}
              >
                <Copy size={13} />
                Copy credentials
              </button>
            </div>
          )}
        </form>
      </section>

      {/* TEAM ACCESS TABLE WITH FULL ACTIONS */}
      <section className="card overflow-hidden rounded-[24px]">
        <div className="section-row border-b border-slate-100 px-4 py-4 sm:px-5">
          <div>
            <h2 className="card-title">Team access</h2>
            <p className="card-note">Manage admin logins, view/edit assigned feature access, or remove admin privileges.</p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#F0F7FF] px-3 py-1.5 text-xs font-medium text-slate-600">
            <UsersRound size={13} />
            {accounts.length} accounts
          </span>
        </div>

        {/* Desktop Table View */}
        <div className="table-wrap hidden sm:block">
          <table>
            <thead>
              <tr>
                <th>Admin Staff</th>
                <th>Role & Template</th>
                <th>Feature Access</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((account) => {
                const isSuper = account.role === "super_admin";
                const template = account.roleTemplate && roleTemplates[account.roleTemplate];
                const effective = isSuper
                  ? ["All clinic workspace areas"]
                  : getPermissionSummary(account.effectivePermissions || []);

                return (
                  <tr key={account.id}>
                    <td>
                      <div>
                        <strong className="text-slate-900 block font-semibold">{account.name}</strong>
                        <span className="text-xs text-slate-500">{account.email}</span>
                      </div>
                    </td>
                    <td>
                      {isSuper ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">
                          <ShieldCheck size={12} />
                          Super Admin
                        </span>
                      ) : (
                        <div>
                          <span className="text-xs font-medium text-slate-800">
                            {template?.label || account.roleTemplate || "Clinical Admin"}
                          </span>
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {isSuper ? (
                          <span className="text-[11px] text-teal-800 font-medium">Full Clinic Access</span>
                        ) : effective.length > 0 ? (
                          effective.map((item) => (
                            <span
                              key={item}
                              className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-medium"
                            >
                              {item}
                            </span>
                          ))
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">No features</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`status ${account.active ? "status-active" : "status-inactive"}`}>
                        {account.active ? "Active" : "Suspended"}
                      </span>
                    </td>
                    <td className="text-right">
                      {isSuper ? (
                        <span className="text-[11px] text-slate-400 italic">Master Account</span>
                      ) : (
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Edit Access */}
                          <button
                            type="button"
                            className="button button-secondary button-small"
                            onClick={() => openEditAccess(account)}
                            title="Edit feature access and permissions"
                          >
                            <Settings2 size={13} />
                            Access
                          </button>

                          {/* Reset Password */}
                          <button
                            type="button"
                            className="button button-secondary button-small"
                            onClick={() => openPasswordModal(account)}
                            title="Reset admin login password"
                          >
                            <KeyRound size={13} />
                            Password
                          </button>

                          {/* Suspend / Reactivate */}
                          <button
                            type="button"
                            className={`button button-small ${
                              account.active ? "button-secondary text-amber-700 hover:text-amber-800" : "button-teal"
                            }`}
                            onClick={() => void toggleAdminStatus(account)}
                            disabled={statusTogglingId === account.id}
                            title={account.active ? "Suspend account" : "Reactivate account"}
                          >
                            {account.active ? <UserX size={13} /> : <UserCheck size={13} />}
                            {account.active ? "Suspend" : "Activate"}
                          </button>

                          {/* Remove Admin Permanently */}
                          <button
                            type="button"
                            className="button button-danger button-small"
                            onClick={() => setDeletingAccount(account)}
                            title="Remove admin account permanently"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {!loading && accounts.length === 0 && (
                <tr>
                  <td colSpan={5}>
                    <div className="empty-state">No admin accounts are configured.</div>
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td colSpan={5}>
                    <div className="empty-state">Loading admin accounts…</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="grid gap-3 p-3 pt-0 sm:hidden">
          {accounts.map((account) => {
            const isSuper = account.role === "super_admin";
            const template = account.roleTemplate && roleTemplates[account.roleTemplate];
            const effective = isSuper
              ? ["All clinic workspace areas"]
              : getPermissionSummary(account.effectivePermissions || []);

            return (
              <article key={account.id} className="min-w-0 rounded-2xl border border-slate-200 bg-[#FBFCFE] p-3.5">
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <div>
                    <strong className="min-w-0 break-words text-sm font-semibold text-[#1A365D]">
                      {account.name}
                    </strong>
                    <p className="break-all text-xs text-slate-500">{account.email}</p>
                  </div>
                  <span className={`status shrink-0 ${account.active ? "status-active" : "status-inactive"}`}>
                    {account.active ? "Active" : "Suspended"}
                  </span>
                </div>

                <div className="mt-2.5 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">
                    {isSuper ? "Super Admin" : template?.label || "Clinical Admin"}
                  </span>
                </div>

                <div className="mt-2 flex flex-wrap gap-1">
                  {effective.map((item) => (
                    <span
                      key={item}
                      className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-medium"
                    >
                      {item}
                    </span>
                  ))}
                </div>

                {!isSuper && (
                  <div className="mt-3.5 flex flex-wrap gap-1.5 border-t border-slate-100 pt-2.5">
                    <button
                      type="button"
                      className="button button-secondary button-small flex-1"
                      onClick={() => openEditAccess(account)}
                    >
                      <Settings2 size={13} />
                      Access
                    </button>
                    <button
                      type="button"
                      className="button button-secondary button-small flex-1"
                      onClick={() => openPasswordModal(account)}
                    >
                      <KeyRound size={13} />
                      Password
                    </button>
                    <button
                      type="button"
                      className={`button button-small flex-1 ${
                        account.active ? "button-secondary text-amber-700" : "button-teal"
                      }`}
                      onClick={() => void toggleAdminStatus(account)}
                    >
                      {account.active ? "Suspend" : "Activate"}
                    </button>
                    <button
                      type="button"
                      className="button button-danger button-small"
                      onClick={() => setDeletingAccount(account)}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>

      {/* EDIT FEATURE ACCESS MODAL */}
      {editingAccessAccount && (
        <Modal
          title={`Edit Feature Access: ${editingAccessAccount.name}`}
          description={`Select role template and configure individual permissions for ${editingAccessAccount.email}.`}
          submitLabel={savingAccess ? "Saving…" : "Save feature access"}
          submitDisabled={savingAccess}
          onClose={() => setEditingAccessAccount(null)}
          onSubmit={() => void saveEditedAccess()}
        >
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-xs font-semibold text-slate-800">Select Role Template</label>
              <div className="grid gap-2 sm:grid-cols-2">
                {(Object.entries(roleTemplates) as [AdminRoleTemplate, (typeof roleTemplates)[AdminRoleTemplate]][]).map(
                  ([key, template]) => {
                    const isSelected = editRoleTemplate === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          setEditRoleTemplate(key);
                          setEditOverrides({});
                        }}
                        className={`rounded-xl border p-2.5 text-left transition-all ${
                          isSelected
                            ? "border-teal-600 bg-teal-50/70"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900">{template.label}</span>
                          {isSelected && <Check size={14} className="text-teal-600" />}
                        </div>
                        <p className="mt-0.5 text-[10px] text-slate-500">{template.description}</p>
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            <div className="border-t border-slate-200 pt-3">
              <h4 className="text-xs font-semibold text-slate-800 mb-2">Granular Feature Permissions</h4>
              <div className="grid gap-3 sm:grid-cols-2">
                {adminPermissionCategories.map((category) => {
                  const effectiveForModal = getEffectivePermissions(editRoleTemplate, editOverrides);
                  return (
                    <div key={category.id} className="rounded-lg border border-slate-200 bg-slate-50/50 p-2.5">
                      <h5 className="text-[11px] font-bold text-slate-800 mb-1.5">{category.title}</h5>
                      <div className="space-y-1">
                        {category.permissions.map((perm) => {
                          const isAllowed = effectiveForModal.includes(perm.id);
                          return (
                            <label
                              key={perm.id}
                              className="flex items-start gap-1.5 text-[11px] cursor-pointer hover:bg-slate-100/80 p-0.5 rounded"
                            >
                              <input
                                type="checkbox"
                                checked={isAllowed}
                                onChange={() => toggleEditPermissionOverride(perm.id)}
                                className="mt-0.5 rounded text-teal-600 focus:ring-teal-500"
                              />
                              <span className={isAllowed ? "font-medium text-slate-900" : "text-slate-500"}>
                                {perm.label}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* RESET PASSWORD MODAL */}
      {passwordTargetAccount && (
        <Modal
          title={`Reset Password: ${passwordTargetAccount.name}`}
          description={`Set a new login password for ${passwordTargetAccount.email}.`}
          submitLabel={rotatingPassword ? "Updating…" : "Update password"}
          submitDisabled={rotatingPassword || newPassword.trim().length < 8}
          onClose={() => setPasswordTargetAccount(null)}
          onSubmit={() => void submitPasswordRotation()}
        >
          <div className="space-y-3">
            <p className="text-xs text-slate-600">
              The new password must be at least 8 characters long. The staff member&apos;s previous password will stop working immediately.
            </p>
            <div className="field">
              <label htmlFor="new-admin-password">New password</label>
              <div className="relative flex items-center">
                <input
                  id="new-admin-password"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min. 8 characters)"
                  className="w-full pr-24"
                  minLength={8}
                />
                <div className="absolute right-2 flex items-center gap-1">
                  <button
                    type="button"
                    className="text-xs text-slate-500 hover:text-slate-800 px-1 py-1"
                    onClick={() => setNewPassword(generateRandomPassword())}
                  >
                    <RefreshCw size={12} className="inline mr-1" />
                    Random
                  </button>
                  <button
                    type="button"
                    className="text-slate-500 hover:text-slate-800 p-1"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* PERMANENT DELETE ADMIN CONFIRMATION MODAL */}
      {deletingAccount && (
        <Modal
          title={`Remove Admin Account`}
          description={`Permanently remove admin access for ${deletingAccount.name}.`}
          submitLabel={deletingBusy ? "Removing…" : "Remove admin permanently"}
          submitVariant="danger"
          submitDisabled={deletingBusy}
          onClose={() => setDeletingAccount(null)}
          onSubmit={() => void submitDeleteAccount()}
        >
          <div className="space-y-3">
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-900 flex items-start gap-2.5">
              <AlertTriangle size={18} className="text-red-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">This action cannot be undone.</strong>
                <p className="mt-1">
                  Admin privileges for <strong>{deletingAccount.name}</strong> (<code>{deletingAccount.email}</code>) will
                  be permanently removed. All active login sessions will be terminated immediately.
                </p>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
