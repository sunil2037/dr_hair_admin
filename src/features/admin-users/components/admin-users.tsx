"use client";

import {
  AlertTriangle,
  CalendarDays,
  Clapperboard,
  FileCheck2,
  LockKeyhole,
  MoreHorizontal,
  Package,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  Stethoscope,
  UserPlus,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { AdminPermissionId, AdminPermissionOverride, AdminRecord, AdminRoleTemplate } from "../../shared/types";
import {
  adminPermissionCategories,
  getEffectivePermissions,
  getPermissionSummary,
  getRoleTemplate,
  ownerOnlyControls,
  roleTemplates,
} from "../../shared/lib/admin-permissions";
import { Avatar, Modal, PageHeader, StatusPill, TableToolbar, ToggleSwitch } from "../../shared/components/ui";

const categoryIcons = {
  clinical: Stethoscope,
  testing: FileCheck2,
  "app-content": Clapperboard,
  commerce: ShoppingBag,
  appointments: CalendarDays,
};

type DialogKind = "invite" | "edit" | "suspend" | null;

export function AdminUsers({ records, onRecordsChange, onToast, onAudit }: { records: AdminRecord[]; onRecordsChange: (records: AdminRecord[] | ((current: AdminRecord[]) => AdminRecord[])) => void; onToast: (message: string) => void; onAudit: (action: string, target: string) => void }) {
  const [query, setQuery] = useState("");
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [selected, setSelected] = useState<AdminRecord | null>(null);
  const [permissionOverrides, setPermissionOverrides] = useState<Partial<Record<AdminPermissionId, AdminPermissionOverride>>>({});
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [roleTemplate, setRoleTemplate] = useState<AdminRoleTemplate>("clinical-admin");

  const filtered = useMemo(() => records.filter((item) => {
    const template = getRoleTemplate(item);
    const effective = getEffectivePermissions(template, item.permissionOverrides);
    return `${item.name} ${item.email} ${item.role} ${item.access} ${getPermissionSummary(effective).join(" ")}`
      .toLowerCase().includes(query.toLowerCase());
  }), [records, query]);

  const openInvite = () => {
    setSelected(null);
    setName("");
    setEmail("");
    setRoleTemplate("clinical-admin");
    setPermissionOverrides({});
    setDialog("invite");
  };

  const openEdit = (admin: AdminRecord) => {
    setSelected(admin);
    setRoleTemplate(getRoleTemplate(admin));
    setPermissionOverrides(admin.permissionOverrides ?? {});
    setDialog("edit");
  };

  const changeRoleTemplate = (nextRole: AdminRoleTemplate) => {
    setRoleTemplate(nextRole);
    // Start the new role with its own defaults so old exceptions don't follow silently.
    setPermissionOverrides({});
  };

  const updatePermission = (permission: AdminPermissionId, enabled: boolean) => {
    const defaultEnabled = roleTemplates[roleTemplate].permissions.includes(permission);
    setPermissionOverrides((current) => {
      if (enabled === defaultEnabled) {
        const next = { ...current };
        delete next[permission];
        return next;
      }
      return { ...current, [permission]: enabled ? "allow" : "deny" };
    });
  };

  const makeAdminRecord = (base: Omit<AdminRecord, "role" | "roleTemplate" | "permissionOverrides" | "access" | "actions">): AdminRecord => {
    const effective = getEffectivePermissions(roleTemplate, permissionOverrides);
    const actions = adminPermissionCategories.flatMap((category) => category.permissions)
      .filter((permission) => effective.includes(permission.id))
      .map((permission) => permission.label);
    const categories = getPermissionSummary(effective);
    return {
      ...base,
      role: roleTemplates[roleTemplate].label,
      roleTemplate,
      permissionOverrides,
      access: categories.length ? categories.join(", ") : "No modules assigned",
      actions,
    };
  };

  const saveInvite = () => {
    if (!name.trim() || !email.includes("@")) {
      onToast("Enter an admin name and a valid work email.");
      return;
    }
    const initials = name.trim().split(/\s+/).slice(0, 2).map((word) => word[0]?.toUpperCase()).join("");
    const newAdmin = makeAdminRecord({
      id: `ADM-${String(records.length + 1).padStart(3, "0")}`,
      name: name.trim(),
      initials,
      email: email.trim(),
      lastActive: "Invitation sent",
      status: "Pending",
    });
    onRecordsChange((current) => [newAdmin, ...current]);
    onAudit("prepared admin invitation for", newAdmin.email);
    setDialog(null);
    onToast(`Invitation prepared for ${email.trim()}. Connect the invitation API to send it.`);
  };

  const savePermissions = () => {
    if (!selected) return;
    const updated = makeAdminRecord({
      id: selected.id,
      name: selected.name,
      initials: selected.initials,
      email: selected.email,
      lastActive: selected.lastActive,
      status: selected.status,
    });
    onRecordsChange((current) => current.map((item) => item.id === selected.id ? updated : item));
    onAudit("updated admin access for", updated.name);
    setDialog(null);
    onToast(`Access updated for ${selected.name}. Backend authorization is needed to enforce it on live data.`);
  };

  const toggleStatus = () => {
    if (!selected) return;
    const next = selected.status === "Suspended" ? "Active" : "Suspended";
    onRecordsChange((current) => current.map((item) => item.id === selected.id ? { ...item, status: next } : item));
    onAudit(`${next === "Active" ? "reactivated" : "suspended"} admin`, selected.name);
    setDialog(null);
    onToast(`${selected.name} ${next === "Active" ? "reactivated" : "suspended"} in this demo.`);
  };

  const activeCount = records.filter((item) => item.status === "Active").length;
  const suspendedCount = records.filter((item) => item.status === "Suspended").length;
  const editorTitle = dialog === "edit" ? "Edit admin access" : "Invite an admin";
  const editorDescription = dialog === "edit" && selected
    ? `Set ${selected.name}'s role defaults and individual access exceptions.`
    : "Choose a role template, then tailor access for this person if needed.";

  return <main className="page-wrap mx-auto w-full max-w-[1420px] px-4 py-6 sm:px-6 lg:px-8">
    <PageHeader eyebrow="Management · Super Admin" title="Admin users" description="Give each team member the access they need, with the doctor in control of exceptions." action={<button className="button button-primary" onClick={openInvite}><UserPlus size={15} />Invite admin</button>} />
    <div className="notice" style={{ marginBottom: 15 }}><ShieldCheck size={14} /><span>The doctor can add or restrict permissions for an individual without changing their role. Admin accounts, global feature switches, and the full audit log remain Super Admin only. These settings are currently a browser demo.</span></div>
    <section className="card">
      <div className="section-row"><div><h2 className="card-title">Team access</h2><p className="card-note">{activeCount} active · {suspendedCount} suspended</p></div><button className="button button-secondary button-small" onClick={() => onToast("Export is a demo action until the admin API is connected.")}>Export list</button></div>
      <TableToolbar value={query} onChange={setQuery} placeholder="Search admins, roles, or access..." right={<button className="filter-button" onClick={() => setQuery("")}><X size={13} />Clear</button>} />
      <div className="table-wrap"><table><thead><tr><th>Admin</th><th>Role template</th><th>Access categories</th><th>Last active</th><th>Status</th><th /></tr></thead><tbody>{filtered.map((admin) => {
        const effective = getEffectivePermissions(getRoleTemplate(admin), admin.permissionOverrides);
        const categories = getPermissionSummary(effective);
        const exceptionCount = Object.keys(admin.permissionOverrides ?? {}).length;
        return <tr key={admin.id}>
          <td><div className="person"><Avatar initials={admin.initials} /><div><div className="person-name">{admin.name}</div><div className="person-sub">{admin.email}</div></div></div></td>
          <td>{roleTemplates[getRoleTemplate(admin)].label}</td>
          <td><div className="access-category-summary">{categories.length ? categories.map((category) => <span className="access-chip" key={category}>{category}</span>) : <span className="person-sub">No categories assigned</span>}</div><div className="person-sub">{effective.length} permissions{exceptionCount > 0 ? ` · ${exceptionCount} doctor override${exceptionCount === 1 ? "" : "s"}` : " · role defaults"}</div></td>
          <td>{admin.lastActive}</td><td><StatusPill status={admin.status} /></td>
          <td><div className="admin-row-actions"><button className="button button-secondary button-small" onClick={() => openEdit(admin)}>Edit access</button><button className="row-action" aria-label={`Manage ${admin.name}`} onClick={() => { setSelected(admin); setDialog("suspend"); }}><MoreHorizontal size={16} /></button></div></td>
        </tr>;
      })}{filtered.length === 0 && <tr><td colSpan={6}><div className="empty-state">No admins match your search.</div></td></tr>}</tbody></table></div>
      <div className="table-footer"><span>Showing {filtered.length} of {records.length} admins</span><div className="pagination"><button className="page-number selected">1</button></div></div>
    </section>
    <div className="owner-control-note"><span className="owner-control-icon"><LockKeyhole size={16} /></span><div><strong>Owner controls stay protected</strong><p>Only the doctor / Super Admin can manage staff accounts, change global feature availability, or inspect the full audit log.</p><div>{ownerOnlyControls.map((control) => <span className="owner-control-chip" key={control}>{control}</span>)}</div></div></div>

    {(dialog === "invite" || dialog === "edit") && <Modal className="access-editor-modal" title={editorTitle} description={editorDescription} submitLabel={dialog === "edit" ? "Save access" : "Prepare invitation"} onClose={() => setDialog(null)} onSubmit={dialog === "edit" ? savePermissions : saveInvite}>
      {dialog === "invite" && <div className="access-identity-grid">
        <div className="field"><label htmlFor="invite-name">Full name</label><input id="invite-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Aisha Khan" /></div>
        <div className="field"><label htmlFor="invite-email">Work email</label><input id="invite-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@clinic.com" /></div>
      </div>}
      {dialog === "edit" && selected && <div className="access-person-summary"><Avatar initials={selected.initials} /><div><strong>{selected.name}</strong><span>{selected.email}</span></div><StatusPill status={selected.status} /></div>}
      <div className="field"><label htmlFor={dialog === "edit" ? "edit-role" : "invite-role"}>Role template</label><select id={dialog === "edit" ? "edit-role" : "invite-role"} value={roleTemplate} onChange={(event) => changeRoleTemplate(event.target.value as AdminRoleTemplate)}>{Object.entries(roleTemplates).map(([id, template]) => <option key={id} value={id}>{template.label}</option>)}</select><p className="field-hint">{roleTemplates[roleTemplate].description} Changing the role clears existing individual overrides so no old access carries over by surprise.</p></div>

      <div className="access-editor-heading"><div><h3>Category permissions</h3><p>Toggle access by action. Overrides apply to this person only.</p></div><span><SlidersHorizontal size={13} /> {getEffectivePermissions(roleTemplate, permissionOverrides).length} enabled</span></div>
      <PermissionEditor roleTemplate={roleTemplate} overrides={permissionOverrides} onChange={updatePermission} />

      <div className="owner-locked-box"><LockKeyhole size={15} /><div><strong>Super Admin only</strong><span>Admin user management, global feature controls, and the complete audit log cannot be delegated from this screen.</span></div></div>
      <div className="notice access-security-note"><AlertTriangle size={14} /><span>These settings are saved in this browser for preview. When APIs are connected, enforce every permission on the server—especially patient documents, report approval, exports, and sharing.</span></div>
    </Modal>}

    {dialog === "suspend" && selected && <Modal title={selected.status === "Suspended" ? "Reactivate admin?" : "Suspend admin access?"} description={selected.status === "Suspended" ? `${selected.name} will be able to sign in again.` : `${selected.name} will lose access to the admin panel. Their activity history will be retained.`} submitLabel={selected.status === "Suspended" ? "Reactivate access" : "Suspend access"} onClose={() => setDialog(null)} onSubmit={toggleStatus}><div className="notice"><ShieldCheck size={14} /><span>This updates the demo record only. Account suspension must also revoke active server sessions when authentication is connected.</span></div></Modal>}
  </main>;
}

function PermissionEditor({
  roleTemplate,
  overrides,
  onChange,
}: {
  roleTemplate: AdminRoleTemplate;
  overrides: Partial<Record<AdminPermissionId, AdminPermissionOverride>>;
  onChange: (permission: AdminPermissionId, enabled: boolean) => void;
}) {
  const defaults = new Set(roleTemplates[roleTemplate].permissions);

  return <div className="access-category-list">{adminPermissionCategories.map((category) => {
    const Icon = categoryIcons[category.id as keyof typeof categoryIcons] ?? Package;
    const categoryEnabledCount = category.permissions.filter((permission) => {
      const override = overrides[permission.id];
      return override ? override === "allow" : defaults.has(permission.id);
    }).length;
    return <section className="access-category-card" key={category.id}>
      <div className="access-category-head"><span className="access-category-icon"><Icon size={15} /></span><div><h4>{category.title}</h4><p>{category.description}</p></div><span className="access-category-count">{categoryEnabledCount}/{category.permissions.length}</span></div>
      <div className="access-permission-list">{category.permissions.map((permission) => {
        const override = overrides[permission.id];
        const inherited = defaults.has(permission.id);
        const enabled = override ? override === "allow" : inherited;
        const stateLabel = override === "allow" ? "Extra access" : override === "deny" ? "Restricted" : inherited ? "Role default" : "Not granted";
        return <div className={`access-permission-row ${enabled ? "is-enabled" : ""}`} key={permission.id}>
          <div className="access-permission-copy"><strong>{permission.label}{permission.elevated && <span className="elevated-tag"><AlertTriangle size={10} />Sensitive</span>}</strong><span>{permission.description}</span><small className={`permission-state ${override ? "custom" : ""}`}>{stateLabel}</small></div>
          <div className="access-permission-controls">{override && <button className="permission-reset" type="button" onClick={() => onChange(permission.id, inherited)} aria-label={`Use role default for ${permission.label}`} title="Use role default"><RotateCcw size={12} /></button>}<ToggleSwitch checked={enabled} label={`${enabled ? "Remove" : "Grant"} ${permission.label}`} onChange={() => onChange(permission.id, !enabled)} /></div>
        </div>;
      })}</div>
    </section>;
  })}</div>;
}
