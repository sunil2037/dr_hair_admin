"use client";

import { useCallback, useMemo, useState } from "react";
import { AdminUsers } from "../../admin-users/components/admin-users";
import { AuditLog } from "../../admin-users/components/audit-log";
import { AppManagement } from "../../app-management/components/app-management";
import { ProductManagement } from "../../commerce/components/product-management";
import { Dashboard } from "../../dashboard/components/dashboard";
import { HairTestsPage } from "../../operations/components/hair-tests-page";
import { OperationsPage } from "../../operations/components/operations-page";
import { admins as initialAdmins, auditEvents as initialAudit, initialFeatures, patients as demoPatients } from "../lib/demo-data";
import { adminPermissionCategories, getEffectivePermissions, getRoleTemplate } from "../lib/admin-permissions";
import { canAccessPage, type PanelFeatureAccess } from "../lib/permissions";
import { useSessionState } from "../lib/use-session-state";
import type { AdminRecord, AuditEventRecord, FeatureRecord, PageKey, Role } from "../types";
import { AdminShell } from "./admin-shell";
import { SignIn } from "./sign-in";
import { Toast } from "./ui";

const allPermissions = adminPermissionCategories.flatMap((category) => category.permissions.map((permission) => permission.id));
const initialAuditEvents = initialAudit.map((event) => ({ ...event, type: event.type as AuditEventRecord["type"] }));

export function AdminApplication() {
  const [signedIn, setSignedIn] = useSessionState<boolean>("drhair-demo-signed-in", false);
  const [signedInRole, setSignedInRole] = useSessionState<Role>("drhair-demo-signed-in-role", "super-admin");
  const [role, setRole] = useSessionState<Role>("drhair-demo-role", "super-admin");
  const [actorEmail, setActorEmail] = useSessionState<string>("drhair-demo-actor-email", "jai.bansal@drhair.health");
  const [previewAdminId, setPreviewAdminId] = useState("ADM-001");
  const [page, setPage] = useState<PageKey>("overview");
  const [globalSearch, setGlobalSearch] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [adminRecords, setAdminRecords] = useSessionState<AdminRecord[]>("drhair-demo-admins", initialAdmins);
  const [features, setFeatures] = useSessionState<FeatureRecord[]>("drhair-demo-app-features", initialFeatures);
  const [panelAccess, setPanelAccess] = useSessionState<PanelFeatureAccess>("drhair-demo-panel-access", { patients: true, catalog: true, content: true, orders: true, bookings: true, tests: true });
  const [events, setEvents] = useSessionState<AuditEventRecord[]>("drhair-demo-audit", initialAuditEvents);
  const showToast = useCallback((message: string) => setToast(message), []);
  const closeToast = useCallback(() => setToast(""), []);
  const onMobileOpenChange = useCallback((open: boolean) => setMobileOpen(open), []);
  const isOwner = signedInRole === "super-admin";

  const accountAdmin = useMemo(() => adminRecords.find((item) => item.email.toLowerCase() === actorEmail.toLowerCase()), [adminRecords, actorEmail]);
  const previewAdmin = useMemo(() => adminRecords.find((item) => item.id === previewAdminId), [adminRecords, previewAdminId]);
  const effectiveAdmin = (isOwner ? previewAdmin : accountAdmin) ?? adminRecords[0];
  const permissions = useMemo(() => {
    if (role === "super-admin") return allPermissions;
    if (!effectiveAdmin || effectiveAdmin.status !== "Active") return [];
    return getEffectivePermissions(getRoleTemplate(effectiveAdmin), effectiveAdmin.permissionOverrides);
  }, [effectiveAdmin, role]);
  const visibleName = role === "super-admin" ? "Dr. Jai Bansal" : effectiveAdmin?.name ?? "Admin access suspended";
  const actorName = isOwner ? "Dr. Jai Bansal" : accountAdmin?.name ?? "Admin";

  const recordAudit = useCallback((action: string, target: string) => {
    const time = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date());
    setEvents((current) => [{ who: actorName, initials: actorName.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase(), action, target, time, type: action.match(/admin|access|permission|invitation|suspended|reactivated/i) ? "Access" : action.match(/app update|release policy|minimum version/i) ? "App updates" : action.match(/notification/i) ? "Notifications" : action.match(/feature|disabled|enabled/i) ? "Feature" : action.match(/hair test|report|file/i) ? "Testing" : action.match(/content|publish|draft|banner|home placement/i) ? "Content" : action.match(/booking/i) ? "Bookings" : action.match(/order/i) ? "Orders" : action.match(/commerce|product|coupon|referral/i) ? "Commerce" : "Clinical" }, ...current]);
  }, [actorName, setEvents]);

  const permissionsForRole = useCallback((nextRole: Role) => {
    if (nextRole === "super-admin") return allPermissions;
    const nextAdmin = isOwner ? previewAdmin : accountAdmin;
    if (!nextAdmin || nextAdmin.status !== "Active") return [];
    return getEffectivePermissions(getRoleTemplate(nextAdmin), nextAdmin.permissionOverrides);
  }, [accountAdmin, isOwner, previewAdmin]);

  const changeRole = useCallback((nextRole: Role) => {
    if (!isOwner) return;
    const nextPermissions = permissionsForRole(nextRole);
    setRole(nextRole);
    setGlobalSearch("");
    if (!canAccessPage(nextRole, page, panelAccess, nextPermissions)) {
      setPage("overview");
      showToast("That section is outside this admin preview account’s access.");
    } else {
      showToast(`Previewing ${nextRole === "super-admin" ? "Super Admin" : effectiveAdmin?.name ?? "Admin"} access.`);
    }
  }, [effectiveAdmin, isOwner, page, panelAccess, permissionsForRole, showToast]);

  const navigate = useCallback((nextPage: PageKey) => {
    if (!canAccessPage(role, nextPage, panelAccess, permissions)) {
      showToast("This account does not have access to that section.");
      return;
    }
    setPage(nextPage);
    setGlobalSearch("");
  }, [panelAccess, permissions, role, showToast]);

  const changePanelAccess = useCallback((id: string, enabled: boolean) => {
    setPanelAccess((current) => ({ ...current, [id]: enabled }));
  }, [setPanelAccess]);

  const changeAdminPreview = useCallback((id: string) => {
    setPreviewAdminId(id);
    const nextAdmin = adminRecords.find((item) => item.id === id);
    const nextPermissions = nextAdmin?.status === "Active"
      ? getEffectivePermissions(getRoleTemplate(nextAdmin), nextAdmin.permissionOverrides)
      : [];
    if (!canAccessPage("admin", page, panelAccess, nextPermissions)) setPage("overview");
    setGlobalSearch("");
  }, [adminRecords, page, panelAccess]);

  const content = useMemo(() => {
    switch (page) {
      case "overview": return <Dashboard role={role} userName={visibleName} onNavigate={navigate} permissions={permissions} events={events} admins={adminRecords} />;
      case "patients": return <OperationsPage kind="patients" globalSearch={globalSearch} onToast={showToast} permissions={permissions} onAudit={recordAudit} />;
      case "catalog": return <ProductManagement onToast={showToast} permissions={permissions} panelAccess={panelAccess} globalSearch={globalSearch} onAudit={recordAudit} />;
      case "content": return <AppManagement role={role} onToast={showToast} permissions={permissions} onAudit={recordAudit} features={features} onFeaturesChange={setFeatures} panelAccess={panelAccess} onPanelAccessChange={changePanelAccess} />;
      case "orders": return <OperationsPage kind="orders" globalSearch={globalSearch} onToast={showToast} permissions={permissions} onAudit={recordAudit} />;
      case "tests": return <HairTestsPage patients={demoPatients} permissions={permissions} actor={actorName} onToast={showToast} onAudit={recordAudit} />;
      case "bookings": return <OperationsPage kind="bookings" globalSearch={globalSearch} onToast={showToast} permissions={permissions} onAudit={recordAudit} />;
      case "team": return role === "super-admin" ? <AdminUsers records={adminRecords} onRecordsChange={setAdminRecords} onToast={showToast} onAudit={recordAudit} /> : <Denied />;
      case "activity": return role === "super-admin" ? <AuditLog globalSearch={globalSearch} onToast={showToast} events={events} /> : <Denied />;
    }
  }, [actorName, adminRecords, changePanelAccess, events, features, globalSearch, navigate, page, panelAccess, permissions, recordAudit, role, setAdminRecords, setFeatures, showToast, visibleName]);

  if (!signedIn) return <SignIn onSignIn={(selectedRole, email) => {
    setActorEmail(email);
    setSignedInRole(selectedRole);
    setRole(selectedRole);
    const matchingAdmin = adminRecords.find((item) => item.email.toLowerCase() === email.toLowerCase());
    if (matchingAdmin) setPreviewAdminId(matchingAdmin.id);
    else if (selectedRole === "admin") setPreviewAdminId("ADM-001");
    setPage("overview");
    setSignedIn(true);
    showToast(`Welcome to Dr. Jai Bansal’s ${selectedRole === "super-admin" ? "clinic owner (Super Admin)" : "admin"} workspace.`);
  }} />;

  return <>
    <AdminShell role={role} page={page} globalSearch={globalSearch} panelAccess={panelAccess} permissions={permissions} isOwner={isOwner} userName={visibleName} previewAdminId={previewAdminId} adminOptions={adminRecords.map(({ id, name, role, status }) => ({ id, name, role, status }))} mobileOpen={mobileOpen} onRoleChange={changeRole} onAdminPreviewChange={changeAdminPreview} onPageChange={navigate} onSearchChange={setGlobalSearch} onMobileOpenChange={onMobileOpenChange} onToast={showToast} onSignOut={() => { setSignedIn(false); setPage("overview"); setGlobalSearch(""); }}>
      {content}
    </AdminShell>
    {toast && <Toast message={toast} onClose={closeToast} />}
  </>;
}

function Denied() {
  return <main className="page-wrap"><section className="card empty-state">This section is available to Dr. Jai Bansal only.</section></main>;
}
