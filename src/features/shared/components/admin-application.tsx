"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminAccountManagement } from "../../admin-users/components/admin-account-management";
import { AuditLog } from "../../admin-users/components/audit-log";
import { AppManagement } from "../../app-management/components/app-management";
import { ProductManagement } from "../../commerce/components/product-management";
import { Dashboard } from "../../dashboard/components/dashboard";
import { NotificationCenter } from "../../notifications/components/notification-center";
import { HairTestsPage } from "../../operations/components/hair-tests-page";
import { OperationsPage } from "../../operations/components/operations-page";
import { admins as initialAdmins, auditEvents as initialAudit, initialFeatures, patients as demoPatients } from "../lib/demo-data";
import { canAccessPage, type PanelFeatureAccess } from "../lib/permissions";
import { useSessionState } from "../lib/use-session-state";
import type { AdminRecord, AdminPermissionId, AuditEventRecord, FeatureRecord, PageKey, Role } from "../types";
import { AdminShell } from "./admin-shell";
import { SignIn, type AdminIdentity } from "./sign-in";
import { Toast } from "./ui";
import { PatientDetailPage } from "../../operations/components/patient-detail-page";
import { useRouter } from "next/navigation";

const initialAuditEvents = initialAudit.map((event) => ({ ...event, type: event.type as AuditEventRecord["type"] }));

const superAdminPermissions: AdminPermissionId[] = [
  "patients.view", "assessments.review", "care-plans.edit", "progress.review", "documents.view", "documents.upload", "documents.share", "patients.export", "patients.lookup",
  "hair-tests.view", "hair-tests.upload", "hair-tests.submit", "reports.approve", "reports.share", "content.edit", "media.upload", "content.publish", "notifications.manage",
  "products.manage", "orders.manage", "promotions.manage", "commerce.export", "bookings.manage",
];

export function AdminApplication({ initialPage = "overview", initialPatientId = null, initialBookingDate = "" }: { initialPage?: PageKey; initialPatientId?: string | null; initialBookingDate?: string }) {
  const router = useRouter();
  const [auth, setAuth] = useState<{ status: "checking" | "signed-out" | "signed-in"; admin?: AdminIdentity }>({ status: "checking" });
  const [actorEmail, setActorEmail] = useState("");
  const role: Role = auth.admin?.role === "super_admin" ? "super-admin" : "admin";
  const previewAdminId = "";
  const [page, setPage] = useState<PageKey>(initialPage);
  const [bookingDate, setBookingDate] = useState(initialBookingDate);
  const [dashboardAnchor, setDashboardAnchor] = useState("");
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
  const permissions = useMemo<AdminPermissionId[]>(() => role === "super-admin" ? superAdminPermissions : ["patients.view"], [role]);
  const visibleName = auth.admin?.name || actorEmail || "Admin";
  const actorName = visibleName;

  useEffect(() => {
    const syncRouteState = () => {
      const query = new URLSearchParams(window.location.search);
      const requestedPage = query.get("panel") as PageKey | null;
      setPage(initialPatientId ? "patients" : requestedPage && ["overview", "patients", "catalog", "content", "orders", "tests", "bookings", "team", "activity", "notifications"].includes(requestedPage) ? requestedPage : "overview");
      setBookingDate(query.get("date") ?? "");
      setDashboardAnchor(window.location.hash.slice(1));
    };
    window.addEventListener("popstate", syncRouteState);
    return () => window.removeEventListener("popstate", syncRouteState);
  }, [initialPatientId]);

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
    setEvents((current) => [{ who: actorName, initials: actorName.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase(), action, target, time, type: action.match(/admin|access|permission|invitation|suspended|reactivated/i) ? "Access" : action.match(/app update|release policy|minimum version/i) ? "App updates" : action.match(/notification/i) ? "Notifications" : action.match(/feature|disabled|enabled/i) ? "Feature" : action.match(/hair test|report|file/i) ? "Testing" : action.match(/content|publish|draft|banner|home placement/i) ? "Content" : action.match(/booking|appointment|OPD status/i) ? "Bookings" : action.match(/order/i) ? "Orders" : action.match(/commerce|product|coupon|referral/i) ? "Commerce" : "Clinical" }, ...current]);
  }, [actorName, setEvents]);

  const navigate = useCallback((nextPage: PageKey, options?: { bookingDate?: string; anchor?: string }) => {
    if (!canAccessPage(role, nextPage, panelAccess, permissions)) {
      showToast("This account does not have access to that section.");
      return;
    }
    if (nextPage === "patients") {
      setPage("overview");
      setGlobalSearch("");
      setBookingDate("");
      const anchor = options?.anchor ?? "registered-patients";
      setDashboardAnchor(anchor);
      router.push(`/?panel=overview#${anchor}`);
      return;
    }
    setPage(nextPage);
    setGlobalSearch("");
    setDashboardAnchor("");
    const selectedDate = nextPage === "bookings" ? options?.bookingDate ?? "" : "";
    setBookingDate(selectedDate);
    const query = new URLSearchParams({ panel: nextPage });
    if (selectedDate) query.set("date", selectedDate);
    router.push(`/?${query.toString()}`);
  }, [panelAccess, permissions, role, router, showToast]);

  const changePanelAccess = useCallback((id: string, enabled: boolean) => {
    setPanelAccess((current) => ({ ...current, [id]: enabled }));
  }, [setPanelAccess]);

  const content = useMemo(() => {
    switch (page) {
      case "overview": return <Dashboard role={role} userName={visibleName} onNavigate={navigate} onOpenPatient={(patientId) => router.push(`/patients/${encodeURIComponent(patientId)}`)} permissions={permissions} events={events} admins={adminRecords} onAudit={recordAudit} onToast={showToast} anchor={dashboardAnchor} />;
      case "patients": return initialPatientId
        ? <PatientDetailPage key={initialPatientId} patientId={initialPatientId} role={role} onToast={showToast} onAudit={recordAudit} />
        : <OperationsPage kind="patients" globalSearch={globalSearch} onToast={showToast} permissions={permissions} onAudit={recordAudit} />;
      case "catalog": return <ProductManagement onToast={showToast} permissions={permissions} panelAccess={panelAccess} globalSearch={globalSearch} onAudit={recordAudit} />;
      case "content": return <AppManagement role={role} onToast={showToast} permissions={permissions} onAudit={recordAudit} features={features} onFeaturesChange={setFeatures} panelAccess={panelAccess} onPanelAccessChange={changePanelAccess} />;
      case "orders": return <OperationsPage kind="orders" globalSearch={globalSearch} onToast={showToast} permissions={permissions} onAudit={recordAudit} />;
      case "tests": return <HairTestsPage patients={demoPatients} permissions={permissions} actor={actorName} onToast={showToast} onAudit={recordAudit} />;
      case "bookings": return <OperationsPage key={bookingDate} kind="bookings" globalSearch={globalSearch} onToast={showToast} permissions={permissions} onAudit={recordAudit} initialDateFilter={bookingDate} />;
      case "notifications": return <NotificationCenter role={role} userName={visibleName} permissions={permissions} events={events} onNavigate={navigate} />;
      case "team": return role === "super-admin" ? <AdminAccountManagement /> : <Denied />;
      case "activity": return role === "super-admin" ? <AuditLog globalSearch={globalSearch} onToast={showToast} events={events} /> : <Denied />;
    }
  }, [actorName, adminRecords, bookingDate, changePanelAccess, dashboardAnchor, events, features, globalSearch, initialPatientId, navigate, page, panelAccess, permissions, recordAudit, role, router, setFeatures, showToast, visibleName]);

  if (auth.status === "checking") return <AdminSessionSkeleton />;

  if (auth.status !== "signed-in") return <SignIn onAuthenticated={(admin) => {
    setActorEmail(admin.email);
    setAuth({ status: "signed-in", admin });
    setPage(initialPatientId ? "patients" : initialPage);
    showToast(`Welcome, ${admin.name || admin.email}.`);
  }} />;

  return <>
    <AdminShell role={role} page={page} globalSearch={globalSearch} panelAccess={panelAccess} permissions={permissions} isOwner={isOwner} userName={visibleName} previewAdminId={previewAdminId} adminOptions={[]} mobileOpen={mobileOpen} onRoleChange={() => {}} onAdminPreviewChange={() => {}} onPageChange={navigate} onSearchChange={setGlobalSearch} onMobileOpenChange={onMobileOpenChange} onSignOut={() => { void fetch("/api/auth/logout", { method: "POST" }); setAuth({ status: "signed-out" }); setPage("overview"); setGlobalSearch(""); }}>
      {content}
    </AdminShell>
    {toast && <Toast message={toast} onClose={closeToast} />}
  </>;
}

function Denied() {
  return <main className="page-wrap"><section className="card empty-state">Super Admin access is required for this section.</section></main>;
}

function AdminSessionSkeleton() {
  return <main className="min-h-screen w-full overflow-x-clip bg-[#F7F9FC]" aria-label="Loading admin workspace" aria-busy="true">
    <aside aria-hidden="true" className="fixed inset-y-0 left-0 z-10 hidden w-[84px] flex-col items-center justify-between py-5 px-3 lg:flex">
      <div className="h-10 w-10 animate-pulse rounded-full bg-slate-200" />
      <div className="flex flex-col items-center gap-2 rounded-[34px] bg-white p-2 shadow-sm">
        {Array.from({ length: 6 }, (_, index) => <div key={index} className="h-11 w-11 animate-pulse rounded-full bg-slate-100" />)}
      </div>
      <div className="flex flex-col items-center gap-2 rounded-[34px] bg-white p-2 shadow-sm">
        <div className="h-11 w-11 animate-pulse rounded-full bg-slate-100" />
        <div className="h-10 w-10 animate-pulse rounded-full bg-slate-200" />
      </div>
    </aside>
    <section className="min-h-screen min-w-0 lg:ml-[88px]" aria-hidden="true">
      <header className="flex h-[76px] items-center justify-between border-b border-slate-200/70 bg-[#F7F9FC]/90 px-4 sm:px-8">
        <div className="space-y-2"><div className="h-5 w-32 animate-pulse rounded bg-slate-200" /><div className="h-3 w-56 animate-pulse rounded bg-slate-100" /></div>
        <div className="flex items-center gap-3"><div className="hidden h-10 w-52 animate-pulse rounded-full bg-white sm:block" /><div className="h-10 w-28 animate-pulse rounded-full bg-slate-200" /></div>
      </header>
      <div className="mx-auto max-w-[1460px] space-y-5 px-4 py-6 sm:px-8">
        <div className="h-40 animate-pulse rounded-[28px] border border-slate-200 bg-white" />
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]"><div className="h-80 animate-pulse rounded-[28px] border border-slate-200 bg-white" /><div className="h-80 animate-pulse rounded-[28px] border border-slate-200 bg-white" /></div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-28 animate-pulse rounded-2xl border border-slate-200 bg-white" />)}</div>
      </div>
    </section>
    <span className="sr-only">Checking your secure admin session…</span>
  </main>;
}
