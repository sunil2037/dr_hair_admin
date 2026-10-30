"use client";

import { Activity, ArrowRight, BellRing, CalendarCheck2, ClipboardCheck, Clock3, FileText, HeartPulse, PackageCheck, Plus, UsersRound } from "lucide-react";
import { useMemo } from "react";
import { Avatar, PageHeader, StatusPill } from "../../shared/components/ui";
import { useSessionState } from "../../shared/lib/use-session-state";
import { admins as initialAdmins, bookings as initialBookings, orders as initialOrders, patients as initialPatients } from "../../shared/lib/demo-data";
import { patientClinicalProfiles } from "../../operations/lib/patient-profiles";
import { initialHairTests } from "../../operations/lib/hair-test-demo";
import type { AdminRecord, AuditEventRecord, PageKey, Role } from "../../shared/types";
import type { OrderRecord, PatientRecord } from "../../shared/types";
import type { BookingRecord } from "../../shared/types";
import type { HairTestRecord, PatientClinicalProfile, PatientReportNotification } from "../../operations/types";

export function Dashboard({ role, userName, onNavigate, permissions = [], events = [], admins = initialAdmins }: {
  role: Role;
  userName: string;
  onNavigate: (page: PageKey) => void;
  permissions?: string[];
  events?: AuditEventRecord[];
  admins?: AdminRecord[];
}) {
  const isSuper = role === "super-admin";
  const [patients] = useSessionState<PatientRecord[]>("drhair-demo-patients", initialPatients);
  const [bookings] = useSessionState<BookingRecord[]>("drhair-demo-bookings", initialBookings);
  const [orders] = useSessionState<OrderRecord[]>("drhair-demo-orders", initialOrders);
  const [profiles] = useSessionState<Record<string, PatientClinicalProfile>>("drhair-demo-patient-profiles", patientClinicalProfiles);
  const [hairTests] = useSessionState<HairTestRecord[]>("drhair-demo-hair-tests", initialHairTests);
  const [notifications] = useSessionState<PatientReportNotification[]>("drhair-demo-patient-notifications", []);
  const reviewPatients = patients.filter((patient) => patient.status === "Review" || patient.status === "Pending");
  const today = new Date().toDateString();
  const appointmentsToday = bookings.filter((booking) => (booking.startsAt ? new Date(booking.startsAt).toDateString() === today : booking.date.toLowerCase().includes("today")) && !["Cancelled", "No show"].includes(booking.status));
  const ordersToFulfil = orders.filter((order) => ["New", "Pending", "Needs attention"].includes(order.status)).length;
  const reportsReady = Object.entries(profiles).flatMap(([patientId, profile]) => profile.reports
    .filter((report) => report.status === "Ready" && !notifications.some((notification) => notification.patientId === patientId && notification.reportId === report.id)));
  const adminActive = admins.filter((admin) => admin.status === "Active").length;
  const permitted = (permission: string) => isSuper || permissions.includes(permission);
  const activityRows = useMemo(() => (isSuper ? events : events.filter((event) => event.who === userName)).slice(0, 4), [events, isSuper, userName]);
  const queueBars = [
    ...(permitted("assessments.review") ? [{ label: "Patient reviews", count: reviewPatients.length, tone: "teal" }] : []),
    ...(permitted("hair-tests.view") ? [{ label: "Hair tests awaiting review", count: hairTests.filter((test) => test.status === "In review").length, tone: "amber" }] : []),
    ...(permitted("reports.share") ? [{ label: "Reports ready to share", count: reportsReady.length, tone: "blue" }] : []),
    ...(permitted("bookings.manage") ? [{ label: "Clinic visits today", count: appointmentsToday.length, tone: "violet" }] : []),
    ...(permitted("orders.manage") ? [{ label: "Orders needing action", count: ordersToFulfil, tone: "amber" }] : []),
  ];
  const largestQueue = Math.max(1, ...queueBars.map((item) => item.count));

  return <main className="page-wrap mx-auto w-full max-w-[1420px] px-4 py-6 sm:px-6 lg:px-8">
    <PageHeader eyebrow={isSuper ? "Super Admin · Clinical overview" : "Admin workspace"} title={`Welcome, ${userName}`} description="A current view of this clinic’s patient care, consultations, reports, and operations." action={<>
      {permitted("patients.view") && <button className="button button-secondary" onClick={() => onNavigate("patients")}><FileText size={14} />Patient records</button>}
      {isSuper ? <button className="button button-primary" onClick={() => onNavigate("team")}><Plus size={15} />Manage admins</button> : permitted("assessments.review") ? <button className="button button-primary" onClick={() => onNavigate("patients")}><ClipboardCheck size={14} />Review assessments</button> : null}
    </>} />
    <div className="notice" style={{ marginBottom: 15 }}><Clock3 size={14} /><span><strong>Demo workspace</strong> · Totals below come from the panel’s sample records and browser preview. Live app activity starts after API integration.</span></div>
    <section className="kpi-grid grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Overview metrics">
      <Kpi icon={<UsersRound size={16} />} label="Patient records" value={permitted("patients.view") ? String(patients.length) : "—"} trend={permitted("patients.view") ? "Local records" : "No access"} foot={permitted("patients.view") ? "in this preview" : "patient access is off"} positive />
      <Kpi icon={<ClipboardCheck size={16} />} label="Assessments to review" value={permitted("assessments.review") ? String(reviewPatients.length) : "—"} trend={permitted("assessments.review") ? "Current queue" : "No access"} foot={permitted("assessments.review") ? "Pending or review" : "assessment access is off"} positive={false} />
      <Kpi icon={<CalendarCheck2 size={16} />} label="Clinic visits today" value={permitted("bookings.manage") ? String(appointmentsToday.length) : "—"} trend={permitted("bookings.manage") ? "Dr. Jai Bansal" : "No access"} foot={permitted("bookings.manage") ? "in this schedule" : "appointment access is off"} positive={false} />
      <Kpi icon={isSuper ? <HeartPulse size={16} /> : <PackageCheck size={16} />} label={isSuper ? "Reports ready to share" : "Orders to fulfil"} value={permitted(isSuper ? "reports.share" : "orders.manage") ? String(isSuper ? reportsReady.length : ordersToFulfil) : "—"} trend={permitted(isSuper ? "reports.share" : "orders.manage") ? "Current queue" : "No access"} foot={permitted(isSuper ? "reports.share" : "orders.manage") ? "from local records" : "restricted for this account"} positive={false} />
    </section>

    <section className="dashboard-grid grid grid-cols-1 gap-4 lg:grid-cols-2">
      <article className="card">
        <div className="card-head"><div><h2 className="card-title">Clinic work queues</h2><p className="card-note">Open work based on the current sample records</p></div></div>
        {queueBars.length > 0 ? <div className="dashboard-queue-list">{queueBars.map((item) => <div className="dashboard-queue-row" key={item.label}>
          <div className="dashboard-queue-heading"><span>{item.label}</span><strong>{item.count}</strong></div>
          <div className="dashboard-queue-track"><span className={`dashboard-queue-fill ${item.tone}`} style={{ width: `${Math.max(item.count ? 9 : 0, item.count / largestQueue * 100)}%` }} /></div>
        </div>)}</div> : <div className="empty-state">No operational access is assigned to this account.</div>}
        {queueBars.length > 0 && <div className="chart-foot"><span><i className="legend-dot" />Queue size</span><span>Derived from demo records</span></div>}
      </article>
      <article className="card">
        <div className="card-head"><div><h2 className="card-title">Recent activity</h2><p className="card-note">Saved panel actions and sample history</p></div><button className="row-action" aria-label="View activity" onClick={() => isSuper ? onNavigate("activity") : onNavigate(permitted("patients.view") ? "patients" : "overview")}><ArrowRight size={16} /></button></div>
        {activityRows.length ? <div className="activity-list">{activityRows.map((event, index) => {
          const Icon = event.type === "Orders" || event.type === "Commerce" ? PackageCheck : event.type === "Bookings" ? CalendarCheck2 : event.type === "Testing" ? FileText : event.type === "Access" ? UsersRound : event.type === "Feature" ? BellRing : Activity;
          return <div className="activity-row" key={`${event.who}-${event.time}-${index}`}><div className="activity-icon"><Icon size={14} /></div><div className="activity-copy"><div className="activity-text"><strong>{event.who}</strong> {event.action} <strong>{event.target}</strong></div><div className="activity-time">{event.time} · {event.type}</div></div></div>;
        })}</div> : <div className="empty-state">No recorded activity yet.</div>}
      </article>
    </section>

    {permitted("patients.view") && <section className="card" style={{ marginBottom: 16 }}>
      <div className="section-row"><div><h2 className="card-title">Patient reviews</h2><p className="card-note">Patients waiting for clinical attention</p></div><button className="button button-secondary button-small" onClick={() => onNavigate("patients")}>Open patient records <ArrowRight size={13} /></button></div>
      <div className="table-wrap"><table><thead><tr><th>Patient</th><th>Assessment summary</th><th>Submitted</th><th>Status</th><th /></tr></thead><tbody>{reviewPatients.slice(0, 4).map((patient) => <tr key={patient.id}><td><div className="person"><Avatar initials={patient.initials} /><div><div className="person-name">{patient.name}</div><div className="person-sub">{patient.id}</div></div></div></td><td>{patient.assessment}</td><td>{patient.submitted}</td><td><StatusPill status={patient.status} /></td><td><button className="row-action" aria-label={`Open ${patient.name}`} onClick={() => onNavigate("patients")}><ArrowRight size={15} /></button></td></tr>)}{reviewPatients.length === 0 && <tr><td colSpan={5}><div className="empty-state">No patients are waiting for review.</div></td></tr>}</tbody></table></div>
    </section>}

    {isSuper && <section className="dashboard-grid grid grid-cols-1 gap-4 lg:grid-cols-2">
      <article className="card"><div className="section-row"><div><h2 className="card-title">Admin access snapshot</h2><p className="card-note">Staff access to Dr. Jai Bansal’s panel</p></div><button className="button button-secondary button-small" onClick={() => onNavigate("team")}>Manage team <ArrowRight size={13} /></button></div><div className="admin-snapshot-body"><div className="admin-snapshot-avatars">{admins.slice(0, 4).map((admin) => <span className="avatar" key={admin.id}>{admin.initials}</span>)}</div><span>{admins.length} admins · {adminActive} active · {admins.length - adminActive} inactive or suspended</span></div></article>
      <article className="card"><div className="section-row"><div><h2 className="card-title">Next clinic visit</h2><p className="card-note">Upcoming appointment arranged with the clinic</p></div><button className="row-action" onClick={() => onNavigate("bookings")} aria-label="View clinic appointments"><ArrowRight size={15} /></button></div>{bookings.find((booking) => booking.status === "Pending" || booking.status === "Active") ? <div className="next-consultation-row"><div className="activity-icon" style={{ width: 38, height: 38 }}><CalendarCheck2 size={17} /></div><div style={{ flex: 1 }}><div className="person-name">{bookings.find((booking) => booking.status === "Pending" || booking.status === "Active")?.customer}</div><div className="person-sub">{bookings.find((booking) => booking.status === "Pending" || booking.status === "Active")?.date} · Dr. Jai Bansal</div></div><StatusPill status={bookings.find((booking) => booking.status === "Pending" || booking.status === "Active")?.status ?? "Pending"} /></div> : <div className="empty-state">No upcoming clinic visit is scheduled.</div>}</article>
    </section>}
  </main>;
}

function Kpi({ icon, label, value, trend, foot, positive }: { icon: React.ReactNode; label: string; value: string; trend: string; foot: string; positive: boolean }) {
  return <article className="card kpi-card"><div className="kpi-top"><span className="kpi-label">{label}</span><span className="kpi-icon">{icon}</span></div><div className="kpi-value">{value}</div><div className="kpi-foot"><span className={positive ? "positive" : "negative"}>{trend}</span><span>{foot}</span></div></article>;
}
