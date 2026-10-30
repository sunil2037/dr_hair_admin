"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminAccountManagement } from "../../admin-users/components/admin-account-management";
import { AuditLog } from "../../admin-users/components/audit-log";
import { AppManagement } from "../../app-management/components/app-management";
import { ProductManagement } from "../../commerce/components/product-management";
import { Dashboard } from "../../dashboard/components/dashboard";
import { HairTestsPage } from "../../operations/components/hair-tests-page";
import { OperationsPage } from "../../operations/components/operations-page";
import { admins as initialAdmins, auditEvents as initialAudit, initialFeatures, patients as demoPatients } from "../lib/demo-data";
import { canAccessPage, type PanelFeatureAccess } from "../lib/permissions";
import { useSessionState } from "../lib/use-session-state";
import type { AdminRecord, AdminPermissionId, AuditEventRecord, FeatureRecord, PageKey, Role } from "../types";
import { AdminShell } from "./admin-shell";
import { SignIn, type AdminIdentity } from "./sign-in";
import { Toast } from "./ui";

const initialAuditEvents = initialAudit.map((event) => ({ ...event, type: event.type as AuditEventRecord["type"] }));

export function AdminApplication() {
  const [auth, setAuth] = useState<{ status: "checking" | "signed-out" | "signed-in"; admin?: AdminIdentity }>({ status: "checking" });
  const [actorEmail, setActorEmail] = useState("");
  const role: Role = auth.admin?.role === "super_admin" ? "super-admin" : "admin";
  const previewAdminId = "";
  const [page, setPage] = useState<PageKey>("overview");
  const [globalSearch, setGlobalSearch] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [adminRecords] = useSessionState<AdminRecord[]>("drhair-demo-admins", initialAdmins);
  const [features, setFeatures] = useSessionState<FeatureRecord[]>("drhair-demo-app-features", initialFeatures);
  const [panelAccess, setPanelAccess] = useSessionState<PanelFeatureAccess>("drhair-demo-panel-access", { patients: true, catalog: true, content: true, orders: true, bookings: true, tests: true });
  const [events, setEvents] = useSessionState<AuditEventRecord[]>("drhair-demo-audit", initialAuditEvents);
  const showToast = useCallback((message: string) => setToast(message), []);
  const closeToast = useCallback(() => setToast(""), []);
  const onMobileOpenChange = useCallback((open: boolean) => setMobileOpen(open), []);
  const isOwner = false;
  const permissions = useMemo<AdminPermissionId[]>(() => ["patients.view"], []);
  const visibleName = auth.admin?.name || actorEmail || "Admin";
  const actorName = visibleName;

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/auth/session", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          setAuth({ status: "signed-out" });
          return;
        }
        const result = await response.json().catch(() => ({}));
        const admin = result?.admin as AdminIdentity | undefined;
        if (!result?.authenticated || !admin?.email || !["admin", "super_admin"].includes(admin.role)) {
          setAuth({ status: "signed-out" });
          return;
        }
        setActorEmail(admin.email);
        setAuth({ status: "signed-in", admin });
      })
      .catch(() => {
        if (!controller.signal.aborted) setAuth({ status: "signed-out" });
      });
    return () => controller.abort();
  }, []);

  const recordAudit = useCallback((action: string, target: string) => {
    const time = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date());
    setEvents((current) => [{ who: actorName, initials: actorName.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase(), action, target, time, type: action.match(/admin|access|permission|invitation|suspended|reactivated/i) ? "Access" : action.match(/app update|release policy|minimum version/i) ? "App updates" : action.match(/notification/i) ? "Notifications" : action.match(/feature|disabled|enabled/i) ? "Feature" : action.match(/hair test|report|file/i) ? "Testing" : action.match(/content|publish|draft|banner|home placement/i) ? "Content" : action.match(/booking/i) ? "Bookings" : action.match(/order/i) ? "Orders" : action.match(/commerce|product|coupon|referral/i) ? "Commerce" : "Clinical" }, ...current]);
  }, [actorName, setEvents]);

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

  const content = useMemo(() => {
    switch (page) {
      case "overview": return <Dashboard role={role} userName={visibleName} onNavigate={navigate} permissions={permissions} events={events} admins={adminRecords} />;
      case "patients": return <OperationsPage kind="patients" globalSearch={globalSearch} onToast={showToast} permissions={permissions} onAudit={recordAudit} />;
      case "catalog": return <ProductManagement onToast={showToast} permissions={permissions} panelAccess={panelAccess} globalSearch={globalSearch} onAudit={recordAudit} />;
      case "content": return <AppManagement role={role} onToast={showToast} permissions={permissions} onAudit={recordAudit} features={features} onFeaturesChange={setFeatures} panelAccess={panelAccess} onPanelAccessChange={changePanelAccess} />;
      case "orders": return <OperationsPage kind="orders" globalSearch={globalSearch} onToast={showToast} permissions={permissions} onAudit={recordAudit} />;
      case "tests": return <HairTestsPage patients={demoPatients} permissions={permissions} actor={actorName} onToast={showToast} onAudit={recordAudit} />;
      case "bookings": return <OperationsPage kind="bookings" globalSearch={globalSearch} onToast={showToast} permissions={permissions} onAudit={recordAudit} />;
      case "team": return role === "super-admin" ? <AdminAccountManagement /> : <Denied />;
      case "activity": return role === "super-admin" ? <AuditLog globalSearch={globalSearch} onToast={showToast} events={events} /> : <Denied />;
    }
  }, [actorName, adminRecords, changePanelAccess, events, features, globalSearch, navigate, page, panelAccess, permissions, recordAudit, role, setFeatures, showToast, visibleName]);

  if (auth.status === "checking") return <main className="signin-page grid min-h-screen place-items-center"><p className="text-sm text-slate-600">Checking secure admin session…</p></main>;

  if (auth.status !== "signed-in") return <SignIn onAuthenticated={(admin) => {
    setActorEmail(admin.email);
    setAuth({ status: "signed-in", admin });
    setPage("overview");
    showToast(`Welcome, ${admin.name || admin.email}.`);
  }} />;

  return <>
    <AdminShell role={role} page={page} globalSearch={globalSearch} panelAccess={panelAccess} permissions={permissions} isOwner={isOwner} userName={visibleName} previewAdminId={previewAdminId} adminOptions={[]} mobileOpen={mobileOpen} onRoleChange={() => {}} onAdminPreviewChange={() => {}} onPageChange={navigate} onSearchChange={setGlobalSearch} onMobileOpenChange={onMobileOpenChange} onToast={showToast} onSignOut={() => { void fetch("/api/auth/logout", { method: "POST" }); setAuth({ status: "signed-out" }); setPage("overview"); setGlobalSearch(""); }}>
      {content}
    </AdminShell>
    {toast && <Toast message={toast} onClose={closeToast} />}
  </>;
}

function Denied() {
  return <main className="page-wrap"><section className="card empty-state">Super Admin access is required for this section.</section></main>;
}
