"use client";

import { ArrowDownToLine, History } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Avatar, PageHeader, TableToolbar } from "../../shared/components/ui";
import type { AuditEventRecord } from "../../shared/types";

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

export function AuditLog({ globalSearch, onToast, events }: { globalSearch: string; onToast: (message: string) => void; events: AuditEventRecord[] }) {
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("All activity");
  const [serverEvents, setServerEvents] = useState<AuditEventRecord[]>([]);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const loadAuditLogs = async () => {
      try {
        const response = await fetch("/api/admin/audit-logs?limit=100", { cache: "no-store", signal: controller.signal });
        const result = await response.json().catch(() => ({}));
        if (response.ok && Array.isArray(result?.data?.items)) {
          const items: unknown[] = result.data.items;
          setServerEvents(items.map((item) => {
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
          }));
        }
      } catch {
        // Fallback silently to parent events
      }
    };
    void loadAuditLogs();
    return () => controller.abort();
  }, []);

  const effectiveEvents = serverEvents.length > 0 ? serverEvents : events;
  const search = `${query} ${globalSearch}`.trim().toLowerCase();
  const rows = useMemo(() => effectiveEvents.filter((event) => `${event.who} ${event.action} ${event.target} ${event.type}`.toLowerCase().includes(search) && (kind === "All activity" || event.type === kind)), [effectiveEvents, search, kind]);

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

  return <main className="page-wrap mx-auto w-full max-w-[1420px] px-4 py-6 sm:px-6 lg:px-8">
    <PageHeader eyebrow="Management · Super Admin" title="Audit log" description="A clear record of changes made across the admin panel." action={<button className="button button-secondary" disabled={exporting} onClick={handleExport}><ArrowDownToLine size={14} />{exporting ? "Exporting…" : "Export log"}</button>} />
    <div className="notice" style={{ marginBottom: 15 }}><History size={14} /><span>{serverEvents.length > 0 ? "Live audit stream connected. Sensitive credentials, OTPs, and authorization tokens are strictly redacted." : "Activity captured in this browser preview. Server-side audit history begins after the API is connected."}</span></div>
    <section className="card">
      <div className="section-row"><div><h2 className="card-title">Recent changes</h2><p className="card-note">Content updates, access changes, and operational actions</p></div><select className="period-select" aria-label="Filter activity type" value={kind} onChange={(event) => setKind(event.target.value)}><option>All activity</option><option>Access</option><option>Feature</option><option>Content</option><option>Notifications</option><option>App updates</option><option>Commerce</option><option>Orders</option><option>Testing</option><option>Bookings</option><option>Clinical</option></select></div>
      <TableToolbar value={query} onChange={setQuery} placeholder="Search people, actions, or records..." right={<span style={{ color: "#8a95a4", fontSize: 10 }}>{rows.length} events</span>} />
      <div className="table-wrap"><table><thead><tr><th>Person</th><th>Action</th><th>Area</th><th>Time</th><th>Details</th></tr></thead><tbody>{rows.map((event, index) => <tr key={`${event.who}-${index}`}><td><div className="person"><Avatar initials={event.initials} /><div className="person-name">{event.who}</div></div></td><td>{event.action} <strong style={{ color: "#334258" }}>{event.target}</strong></td><td><span className="status status-inactive" style={{ textTransform: "capitalize" }}>{event.type}</span></td><td>{event.time}</td><td><button className="button button-secondary button-small" onClick={() => onToast(`Event detail: ${event.who} ${event.action} ${event.target}.`)}>View details</button></td></tr>)}{rows.length === 0 && <tr><td colSpan={5}><div className="empty-state">No activity matches those filters.</div></td></tr>}</tbody></table></div>
      <div className="table-footer"><span>Showing {rows.length} of {effectiveEvents.length} events</span></div>
    </section>
  </main>;
}
