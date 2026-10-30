"use client";

import { Activity, AlertCircle, CheckCircle2, CircleHelp, ClipboardCheck, FileCheck2, FileText, HeartPulse, Home, LockKeyhole, Package, ShoppingBag, Star, UsersRound, Video } from "lucide-react";
import { useMemo, useState } from "react";
import type { FeatureRecord } from "../../shared/types";
import { Modal, ToggleSwitch } from "../../shared/components/ui";

const iconFor: Record<string, React.ComponentType<{ size?: number }>> = {
  home: Home, assessment: ClipboardCheck, treatment: HeartPulse, shop: ShoppingBag,
  reviews: Star, videos: Video, routine: CheckCircle2, progress: Activity, reports: FileCheck2,
  reminders: CircleHelp,
};
const panelModules = [
  { id: "patients", title: "Patients & assessments", description: "Patient profiles, assessment review, and treatment history.", enabled: true, admins: "Individual access in Admin users" },
  { id: "catalog", title: "Product catalog", description: "Product content, pricing, supply plans, and stock state.", enabled: true, admins: "Individual access in Admin users" },
  { id: "content", title: "App Management", description: "Content, home placements, and app-facing experiences.", enabled: true, admins: "Individual access in Admin users" },
  { id: "orders", title: "Orders", description: "Order list, fulfilment state, and customer details.", enabled: true, admins: "Individual access in Admin users" },
  { id: "bookings", title: "Clinic appointments", description: "Record appointments arranged with the single clinic doctor outside the app.", enabled: true, admins: "Individual access in Admin users" },
  { id: "tests", title: "Hair tests & reports", description: "Patient test uploads, clinical review, and report sharing workflow.", enabled: true, admins: "Individual access in Admin users" },
];

export function FeatureControls({
  onToast, features, onFeaturesChange, panelAccess, onPanelAccessChange, onAudit,
}: {
  onToast: (message: string) => void;
  features: FeatureRecord[];
  onFeaturesChange: (features: FeatureRecord[]) => void;
  panelAccess: Record<string, boolean>;
  onPanelAccessChange: (id: string, enabled: boolean) => void;
  onAudit: (action: string, target: string) => void;
}) {
  const [tab, setTab] = useState<"app" | "panel">("app");
  const [target, setTarget] = useState<{ id: string; title: string; enabled: boolean; kind: "app" | "panel" } | null>(null);
  const panelState = panelModules.map((item) => ({ ...item, enabled: panelAccess[item.id] ?? item.enabled }));
  const grouped = useMemo(() => features.reduce<Record<string, FeatureRecord[]>>((acc, feature) => { (acc[feature.group] ??= []).push(feature); return acc; }, {}), [features]);

  const commitToggle = () => {
    if (!target) return;
    if (target.kind === "app") onFeaturesChange(features.map((item) => item.id === target.id ? { ...item, enabled: !item.enabled } : item));
    else onPanelAccessChange(target.id, !target.enabled);
    onAudit(target.enabled ? "disabled" : "enabled", target.title);
    onToast(`${target.title} ${target.enabled ? "disabled" : "enabled"} in this demo.`);
    setTarget(null);
  };

  return <section className="space-y-4">
    <div className="notice"><AlertCircle size={14} /><span>These are global on/off controls. Choose which individual admins can use enabled sections from Admin users → Edit access. Changes stay in this browser preview until configuration APIs are connected.</span></div>
    <div style={{ display: "flex", gap: 8, borderBottom: "1px solid var(--line)", margin: "17px 0 12px" }}>
      <button className={`filter-button ${tab === "app" ? "selected" : ""}`} style={tab === "app" ? { borderColor: "#c7e2dd", color: "var(--teal)", background: "#f3faf8" } : { borderColor: "transparent" }} onClick={() => setTab("app")}><Home size={13} />App features</button>
      <button className={`filter-button ${tab === "panel" ? "selected" : ""}`} style={tab === "panel" ? { borderColor: "#c7e2dd", color: "var(--teal)", background: "#f3faf8" } : { borderColor: "transparent" }} onClick={() => setTab("panel")}><LockKeyhole size={13} />Admin panel access</button>
    </div>
    {tab === "app" ? <>
      {Object.entries(grouped).map(([group, items]) => <section key={group}>
        <div className="feature-top"><div><h2>{group}</h2><p>Control availability for customers using the Dr. Hair app.</p></div><span style={{ color: "#8490a0", fontSize: 10 }}>{items.filter((item) => item.enabled).length} of {items.length} enabled</span></div>
        <div className="module-grid grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">{items.map((item) => { const Icon = iconFor[item.id] ?? Package; return <article className="card module-card" key={item.id}>
          <div className="module-top"><span className="module-symbol"><Icon size={17} /></span><ToggleSwitch checked={item.enabled} label={`${item.enabled ? "Disable" : "Enable"} ${item.title}`} onChange={() => setTarget({ id: item.id, title: item.title, enabled: item.enabled, kind: "app" })} /></div>
          <h3 className="module-title">{item.title}</h3><p className="module-desc">{item.description}</p>
          <div className="module-foot"><span>{item.admins} can manage</span><span className={`status ${item.enabled ? "status-active" : "status-inactive"}`}>{item.enabled ? "Enabled" : "Disabled"}</span></div>
        </article>; })}</div>
      </section>)}
    </> : <>
      <div className="feature-top"><div><h2>Admin panel modules</h2><p>Choose which operational sections are available to Admin users.</p></div><span style={{ color: "#8490a0", fontSize: 10 }}>{panelState.filter((item) => item.enabled).length} of {panelState.length} enabled</span></div>
      <div className="module-grid grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">{panelState.map((item) => { const Icon = item.id === "patients" ? ClipboardCheck : item.id === "catalog" ? Package : item.id === "orders" ? ShoppingBag : item.id === "bookings" ? UsersRound : item.id === "tests" ? FileCheck2 : FileText; return <article className="card module-card" key={item.id}>
        <div className="module-top"><span className="module-symbol"><Icon size={17} /></span><ToggleSwitch checked={item.enabled} label={`${item.enabled ? "Disable" : "Enable"} ${item.title}`} onChange={() => setTarget({ id: item.id, title: item.title, enabled: item.enabled, kind: "panel" })} /></div>
        <h3 className="module-title">{item.title}</h3><p className="module-desc">{item.description}</p><div className="module-foot"><span>Available to: {item.admins}</span><span className={`status ${item.enabled ? "status-active" : "status-inactive"}`}>{item.enabled ? "Enabled" : "Disabled"}</span></div>
      </article>; })}</div>
    </>}
    <div className="callout" style={{ marginTop: 17, display: "flex", gap: 12 }}><div className="callout-icon"><LockKeyhole size={16} /></div><div><h3>Access changes are visible to admins</h3><p>When a panel section is disabled, it will be removed from Admin navigation. Existing records are retained. Super Admins keep access to this control center.</p></div></div>
    {target && <Modal title={`${target.enabled ? "Disable" : "Enable"} ${target.title}?`} description={target.enabled ? "Admins may lose access to this section. Existing content and records will remain saved." : "This section will become available again with its current settings."} submitLabel={target.enabled ? "Disable feature" : "Enable feature"} onClose={() => setTarget(null)} onSubmit={commitToggle}><div className="notice"><AlertCircle size={14} /><span>This setting changes the visible demo state only. The app and admin panel will need configuration APIs for a live rollout.</span></div></Modal>}
  </section>;
}
