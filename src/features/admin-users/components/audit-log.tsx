"use client";

import { ArrowDownToLine, History } from "lucide-react";
import { useMemo, useState } from "react";
import { Avatar, PageHeader, TableToolbar } from "../../shared/components/ui";
import type { AuditEventRecord } from "../../shared/types";

export function AuditLog({ globalSearch, onToast, events }: { globalSearch: string; onToast: (message: string) => void; events: AuditEventRecord[] }) {
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("All activity");
  const search = `${query} ${globalSearch}`.trim().toLowerCase();
  const rows = useMemo(() => events.filter((event) => `${event.who} ${event.action} ${event.target} ${event.type}`.toLowerCase().includes(search) && (kind === "All activity" || event.type === kind)), [events, search, kind]);
  return <main className="page-wrap mx-auto w-full max-w-[1420px] px-4 py-6 sm:px-6 lg:px-8">
    <PageHeader eyebrow="Management · Super Admin" title="Audit log" description="A clear record of changes made across the admin panel." action={<button className="button button-secondary" onClick={() => onToast("Audit export is a demo action until the audit API is connected.")}><ArrowDownToLine size={14} />Export log</button>} />
      <div className="notice" style={{ marginBottom: 15 }}><History size={14} /><span>Activity captured in this browser preview. Server-side audit history begins after the API is connected.</span></div>
    <section className="card">
      <div className="section-row"><div><h2 className="card-title">Recent changes</h2><p className="card-note">Content updates, access changes, and operational actions</p></div><select className="period-select" aria-label="Filter activity type" value={kind} onChange={(event) => setKind(event.target.value)}><option>All activity</option><option>Access</option><option>Feature</option><option>Content</option><option>Notifications</option><option>App updates</option><option>Commerce</option><option>Orders</option><option>Testing</option><option>Bookings</option><option>Clinical</option></select></div>
      <TableToolbar value={query} onChange={setQuery} placeholder="Search people, actions, or records..." right={<span style={{ color: "#8a95a4", fontSize: 10 }}>{rows.length} events</span>} />
      <div className="table-wrap"><table><thead><tr><th>Person</th><th>Action</th><th>Area</th><th>Time</th><th>Details</th></tr></thead><tbody>{rows.map((event, index) => <tr key={`${event.who}-${index}`}><td><div className="person"><Avatar initials={event.initials} /><div className="person-name">{event.who}</div></div></td><td>{event.action} <strong style={{ color: "#334258" }}>{event.target}</strong></td><td><span className="status status-inactive" style={{ textTransform: "capitalize" }}>{event.type}</span></td><td>{event.time}</td><td><button className="button button-secondary button-small" onClick={() => onToast(`Event detail: ${event.who} ${event.action} ${event.target}.`)}>View details</button></td></tr>)}{rows.length === 0 && <tr><td colSpan={5}><div className="empty-state">No activity matches those filters.</div></td></tr>}</tbody></table></div>
      <div className="table-footer"><span>Showing {rows.length} of {events.length} events</span></div>
    </section>
  </main>;
}
