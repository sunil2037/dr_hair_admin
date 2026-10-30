"use client";

import { BellRing, LayoutGrid, Megaphone, RefreshCw, SlidersHorizontal, Video, type LucideIcon } from "lucide-react";
import { useMemo, useState } from "react";
import type { AdminPermissionId, FeatureRecord, Role } from "../../shared/types";
import type { PanelFeatureAccess } from "../../shared/lib/permissions";
import { initialCoupons } from "../../commerce/lib/demo-data";
import type { CouponRecord } from "../../commerce/types";
import { useSessionState } from "../../shared/lib/use-session-state";
import { PageHeader } from "../../shared/components/ui";
import { ContentManagement } from "../../content/components/content-management";
import { FeatureControls } from "../../feature-controls/components/feature-controls";
import { AppUpdatesPanel } from "./app-updates-panel";
import { NotificationsPanel } from "./notifications-panel";

type AppManagementTab = "content" | "home" | "notifications" | "updates" | "features";
const tabMeta: { id: AppManagementTab; label: string; icon: LucideIcon; description: string }[] = [
  { id: "content", label: "Content & media", icon: Video, description: "Educational videos and approved patient stories." },
  { id: "home", label: "Home screen", icon: Megaphone, description: "Control banners, placements, and app destinations." },
  { id: "notifications", label: "Notifications", icon: BellRing, description: "Draft and schedule privacy-safe app messages." },
  { id: "updates", label: "App updates", icon: RefreshCw, description: "Manage Android and iOS release policies." },
  { id: "features", label: "Feature availability", icon: SlidersHorizontal, description: "Control app and admin-panel feature access." },
];

export function AppManagement({
  role, onToast, permissions, onAudit, features, onFeaturesChange, panelAccess, onPanelAccessChange,
}: {
  role: Role;
  onToast: (message: string) => void;
  permissions: AdminPermissionId[];
  onAudit: (action: string, target: string) => void;
  features: FeatureRecord[];
  onFeaturesChange: (features: FeatureRecord[]) => void;
  panelAccess: PanelFeatureAccess;
  onPanelAccessChange: (id: string, enabled: boolean) => void;
}) {
  const canManageContent = permissions.some((permission) => ["content.edit", "media.upload", "content.publish"].includes(permission));
  const canManageNotifications = permissions.includes("notifications.manage");
  const appFeatures = useMemo(() => features.filter((feature) => feature.id !== "booking"), [features]);
  const availableTabs = useMemo(() => tabMeta.filter(({ id }) => {
    if (id === "content" || id === "home") return canManageContent;
    if (id === "notifications") return canManageNotifications;
    return role === "super-admin";
  }), [canManageContent, canManageNotifications, role]);
  const [activeTab, setActiveTab] = useState<AppManagementTab>(availableTabs[0]?.id ?? "content");
  const [coupons] = useSessionState<CouponRecord[]>("drhair-commerce-coupons", initialCoupons);
  const resolvedTab = availableTabs.some((tab) => tab.id === activeTab) ? activeTab : availableTabs[0]?.id;

  const selectedMeta = tabMeta.find((tab) => tab.id === resolvedTab);
  return <main className="page-wrap mx-auto w-full max-w-[1420px] px-4 py-6 sm:px-6 lg:px-8">
    <PageHeader eyebrow="Dr. Hair · App experience" title="App Management" description="Manage what patients see, receive, and need to access the Dr. Hair app." />
    <div className="notice mb-4"><LayoutGrid size={14} /><span>App-facing changes are saved as local previews in this demo. Publishing, notifications, remote feature configuration, and update checks will work after the APIs are connected.</span></div>
    <div className="commerce-tabs app-management-tabs" role="tablist" aria-label="App management sections">
      {availableTabs.map(({ id, label, icon: Icon }) => <button key={id} type="button" role="tab" aria-selected={resolvedTab === id} className={`commerce-tab ${resolvedTab === id ? "selected" : ""}`} onClick={() => setActiveTab(id)}><Icon size={15} />{label}</button>)}
    </div>
    {selectedMeta && <p className="mb-4 mt-3 text-[11px] leading-5 text-slate-500">{selectedMeta.description}</p>}
    <section key={resolvedTab} aria-label={selectedMeta?.label ?? "App management"}>
      {resolvedTab === "content" && <ContentManagement mode="content" scope="content" embedded onToast={onToast} permissions={permissions} onAudit={onAudit} />}
      {resolvedTab === "home" && <ContentManagement mode="content" scope="home" embedded availableOffers={coupons} onToast={onToast} permissions={permissions} onAudit={onAudit} />}
      {resolvedTab === "notifications" && <NotificationsPanel onToast={onToast} onAudit={onAudit} />}
      {resolvedTab === "updates" && role === "super-admin" && <AppUpdatesPanel onToast={onToast} onAudit={onAudit} />}
      {resolvedTab === "features" && role === "super-admin" && <FeatureControls onToast={onToast} features={appFeatures} onFeaturesChange={onFeaturesChange} panelAccess={panelAccess} onPanelAccessChange={onPanelAccessChange} onAudit={onAudit} />}
      {!resolvedTab && <div className="card empty-state">Your account does not have access to an App Management section.</div>}
    </section>
  </main>;
}
