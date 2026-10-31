"use client";

import { Activity, ArrowRight, BellRing, CalendarCheck2, ChevronLeft, ChevronRight, ClipboardCheck, Clock3, FileText, HeartPulse, PackageCheck, UsersRound, X } from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect, useMemo, useState } from "react";
import { Avatar, PageHeader, StatusPill } from "../../shared/components/ui";
import { useSessionState } from "../../shared/lib/use-session-state";
import { admins as initialAdmins, bookings as initialBookings, orders as initialOrders, patients as initialPatients } from "../../shared/lib/demo-data";
import { patientClinicalProfiles } from "../../operations/lib/patient-profiles";
import { initialHairTests } from "../../operations/lib/hair-test-demo";
import type { AdminRecord, AuditEventRecord, PageKey, Role, Status } from "../../shared/types";
import type { OrderRecord, PatientRecord } from "../../shared/types";
import type { BookingRecord } from "../../shared/types";
import type { HairTestRecord, PatientClinicalProfile, PatientReportNotification } from "../../operations/types";

type RegisteredPatient = {
  id: string;
  name: string;
  initials: string;
  email: string;
  phone: string;
  age: number | null;
  gender: string;
  city: string;
  createdAt: string;
};

export function Dashboard({ role, userName, onNavigate, onOpenPatient, permissions = [], events = [], admins = initialAdmins, onAudit = () => {}, onToast = () => {}, anchor = "" }: {
  role: Role;
  userName: string;
  onNavigate: (page: PageKey, options?: { bookingDate?: string; anchor?: string }) => void;
  onOpenPatient: (patientId: string) => void;
  permissions?: string[];
  events?: AuditEventRecord[];
  admins?: AdminRecord[];
  onAudit?: (action: string, target: string) => void;
  onToast?: (message: string) => void;
  anchor?: string;
}) {
  const isSuper = role === "super-admin";
  const [patients] = useSessionState<PatientRecord[]>("drhair-demo-patients", initialPatients);
  const [bookings, setBookings] = useSessionState<BookingRecord[]>("drhair-demo-bookings", initialBookings);
  const [clinicHolidays] = useSessionState<string[]>("drhair-demo-clinic-holidays", ["2026-11-01", "2026-11-02", "2026-12-25", "2027-01-26"]);
  const [selectedAppointmentDate, setSelectedAppointmentDate] = useState(() => startOfToday());
  const [selectedBooking, setSelectedBooking] = useState<BookingRecord | null>(null);
  const [registeredPatients, setRegisteredPatients] = useState<RegisteredPatient[]>([]);
  const [registeredPatientTotal, setRegisteredPatientTotal] = useState(0);
  const [registeredPatientsState, setRegisteredPatientsState] = useState<"loading" | "ready" | "error">("loading");
  const [orders] = useSessionState<OrderRecord[]>("drhair-demo-orders", initialOrders);
  const [profiles] = useSessionState<Record<string, PatientClinicalProfile>>("drhair-demo-patient-profiles", patientClinicalProfiles);
  const [hairTests] = useSessionState<HairTestRecord[]>("drhair-demo-hair-tests", initialHairTests);
  const [notifications] = useSessionState<PatientReportNotification[]>("drhair-demo-patient-notifications", []);
  const reviewPatients = patients.filter((patient) => patient.status === "Review" || patient.status === "Pending");
  const today = new Date().toDateString();
  const todayKey = localDateKey(startOfToday());
  const appointmentsToday = bookings.filter((booking) => (booking.startsAt ? new Date(booking.startsAt).toDateString() === today : booking.date.toLowerCase().includes("today")) && !["Cancelled", "No show"].includes(booking.status));
  const selectedDateKey = localDateKey(selectedAppointmentDate);
  const selectedDateAppointments = bookings
    .filter((booking) => !["Cancelled", "No show"].includes(booking.status))
    .filter((booking) => {
      const date = appointmentDate(booking);
      return date !== null && localDateKey(date) === selectedDateKey;
    })
    .sort((left, right) => (appointmentDate(left)?.getTime() ?? 0) - (appointmentDate(right)?.getTime() ?? 0));
  const ordersToFulfil = orders.filter((order) => ["New", "Pending", "Needs attention"].includes(order.status)).length;
  const reportsReady = Object.entries(profiles).flatMap(([patientId, profile]) => profile.reports
    .filter((report) => report.status === "Ready" && !notifications.some((notification) => notification.patientId === patientId && notification.reportId === report.id)));
  const adminActive = admins.filter((admin) => admin.status === "Active").length;
  const permitted = (permission: string) => isSuper || permissions.includes(permission);
  const canViewPatients = permitted("patients.view");
  useEffect(() => {
    const targetAnchor = anchor || window.location.hash.slice(1);
    if (!targetAnchor) return;
    const frame = window.requestAnimationFrame(() => {
      document.getElementById(decodeURIComponent(targetAnchor))?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [anchor]);

  useEffect(() => {
    if (!canViewPatients) return;
    const controller = new AbortController();
    const loadRegisteredPatients = async () => {
      setRegisteredPatientsState("loading");
      try {
        const response = await fetch("/api/admin/users?page=1&limit=50", { cache: "no-store", signal: controller.signal });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error("Registered patients could not be loaded.");
        const items: unknown[] = Array.isArray(result?.data?.items) ? result.data.items : [];
        setRegisteredPatients(items.flatMap((item): RegisteredPatient[] => {
          if (!item || typeof item !== "object") return [];
          const user = item as Record<string, unknown>;
          const name = typeof user.name === "string" && user.name.trim() ? user.name.trim() : "Unnamed patient";
          return [{
            id: String(user.id ?? ""),
            name,
            initials: name.split(/\s+/).map((part) => part[0] || "").join("").slice(0, 2).toUpperCase(),
            email: typeof user.email === "string" ? user.email : "",
            phone: typeof user.phone === "string" ? user.phone : "",
            age: typeof user.age === "number" ? user.age : null,
            gender: typeof user.gender === "string" ? user.gender : "",
            city: typeof user.city === "string" ? user.city : "",
            createdAt: typeof user.created_at === "string" ? user.created_at : "",
          }];
        }));
        setRegisteredPatientTotal(typeof result?.data?.total === "number" ? result.data.total : items.length);
        setRegisteredPatientsState("ready");
      } catch {
        if (!controller.signal.aborted) {
          setRegisteredPatientTotal(0);
          setRegisteredPatientsState("error");
        }
      }
    };
    void loadRegisteredPatients();
    return () => controller.abort();
  }, [canViewPatients]);

  const openReviewPatient = (patient: PatientRecord) => {
    const linkedPatient = registeredPatients.find((item) => item.id === patient.id)
      ?? registeredPatients.find((item) => normalizePatientName(item.name) === normalizePatientName(patient.name));
    if (linkedPatient) {
      onOpenPatient(linkedPatient.id);
      return;
    }
    onToast("This review is sample data and is not linked to a live patient profile yet.");
  };

  const advanceAppointment = (booking: BookingRecord) => {
    const action = nextAppointmentAction(booking);
    if (!action) return;
    const status: Status = action.opdStatus === "Completed" ? "Completed" : "Active";
    const updated = { ...booking, opdStatus: action.opdStatus, status };
    setBookings((current) => current.map((item) => item.id === booking.id ? updated : item));
    setSelectedBooking(updated);
    onAudit(`updated OPD status to ${action.opdStatus}`, `${booking.id} · ${booking.customer}`);
    onToast(`Appointment updated: ${action.opdStatus}`);
  };

  const openReviewQueue = () => document.getElementById("patient-reviews")?.scrollIntoView({ behavior: "smooth", block: "start" });
  const activityRows = useMemo(() => (isSuper ? events : events.filter((event) => event.who === userName)).slice(0, 4), [events, isSuper, userName]);
  const queueBars = [
    ...(permitted("assessments.review") ? [{ label: "Patient reviews", count: reviewPatients.length, tone: "teal" }] : []),
    ...(permitted("hair-tests.view") ? [{ label: "Hair tests awaiting review", count: hairTests.filter((test) => test.status === "In review").length, tone: "amber" }] : []),
    ...(permitted("reports.share") ? [{ label: "Reports ready to share", count: reportsReady.length, tone: "blue" }] : []),
    ...(permitted("bookings.manage") ? [{ label: "Clinic visits today", count: appointmentsToday.length, tone: "violet" }] : []),
    ...(permitted("orders.manage") ? [{ label: "Orders needing action", count: ordersToFulfil, tone: "amber" }] : []),
  ];
  const largestQueue = Math.max(1, ...queueBars.map((item) => item.count));
  return <main className="page-wrap dashboard-bento mx-auto w-full max-w-[1420px] px-4 py-6 sm:px-6 lg:px-8">
    <PageHeader eyebrow={isSuper ? "Super Admin · Clinical overview" : "Admin workspace"} title={`Welcome, ${userName}`} description="A current view of this clinic’s patient care, consultations, reports, and operations." />
    <div className="notice mb-4 flex items-start gap-2.5"><Clock3 size={14} className="mt-0.5 shrink-0" /><span><strong>Preview workspace</strong> · Patient totals and directory load from the admin API. Appointment, assessment, order, and report queues use sample records saved in this browser session.</span></div>
    <section className="kpi-grid grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Overview metrics">
      <Kpi icon={<UsersRound size={16} />} label="Patient records" value={!permitted("patients.view") ? "—" : registeredPatientsState === "ready" ? String(registeredPatientTotal) : registeredPatientsState === "loading" ? "…" : "—"} trend={permitted("patients.view") ? "Live directory" : "No access"} foot={permitted("patients.view") ? registeredPatientsState === "error" ? "directory unavailable" : "registered patients" : "patient access is off"} onClick={permitted("patients.view") ? () => onNavigate("patients", { anchor: "registered-patients" }) : undefined} />
      <Kpi icon={<ClipboardCheck size={16} />} label="Assessments to review" value={permitted("assessments.review") ? String(reviewPatients.length) : "—"} trend={permitted("assessments.review") ? "Current queue" : "No access"} foot={permitted("assessments.review") ? "Preview records" : "assessment access is off"} onClick={permitted("assessments.review") ? openReviewQueue : undefined} />
      <Kpi icon={<CalendarCheck2 size={16} />} label="Clinic visits today" value={permitted("bookings.manage") ? String(appointmentsToday.length) : "—"} trend={permitted("bookings.manage") ? "Dr. Jai Bansal" : "No access"} foot={permitted("bookings.manage") ? "Preview schedule" : "appointment access is off"} onClick={permitted("bookings.manage") ? () => onNavigate("bookings", { bookingDate: todayKey }) : undefined} />
      <Kpi icon={isSuper ? <HeartPulse size={16} /> : <PackageCheck size={16} />} label={isSuper ? "Reports ready to share" : "Orders to fulfil"} value={permitted(isSuper ? "reports.share" : "orders.manage") ? String(isSuper ? reportsReady.length : ordersToFulfil) : "—"} trend={permitted(isSuper ? "reports.share" : "orders.manage") ? "Current queue" : "No access"} foot={permitted(isSuper ? "reports.share" : "orders.manage") ? "Preview records" : "restricted for this account"} onClick={!isSuper && permitted("orders.manage") ? () => onNavigate("orders") : undefined} />
    </section>

    <section className="mb-4 grid grid-cols-1 items-stretch gap-4 lg:grid-cols-12" aria-label="Appointments by date">
      <AppointmentCalendar
        bookings={permitted("bookings.manage") ? bookings : []}
        selectedDate={selectedAppointmentDate}
        onSelectDate={setSelectedAppointmentDate}
        clinicHolidays={clinicHolidays}
      />
      <SelectedDateAppointments
        bookings={permitted("bookings.manage") ? selectedDateAppointments : []}
        date={selectedAppointmentDate}
        onNavigate={() => onNavigate("bookings", { bookingDate: selectedDateKey })}
        onOpenAppointment={setSelectedBooking}
      />
    </section>

    {canViewPatients && <RegisteredPatients patients={registeredPatients} totalCount={registeredPatientTotal} loadState={registeredPatientsState} onOpenPatient={onOpenPatient} />}

    <section className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-12" aria-label="Clinic operations">
      <article className="card overflow-hidden rounded-[28px] lg:col-span-5">
        <div className="card-head"><div><span className="eyebrow">Care operations</span><h2 className="card-title">Clinic work queues</h2><p className="card-note">Open work based on the current sample records</p></div></div>
        {queueBars.length > 0 ? <div className="dashboard-queue-list">{queueBars.map((item) => <div className="dashboard-queue-row" key={item.label}>
          <div className="dashboard-queue-heading"><span>{item.label}</span><strong>{item.count}</strong></div>
          <div className="dashboard-queue-track"><span className={`dashboard-queue-fill ${item.tone}`} style={{ width: `${Math.max(item.count ? 9 : 0, item.count / largestQueue * 100)}%` }} /></div>
        </div>)}</div> : <div className="empty-state">No operational access is assigned to this account.</div>}
        {queueBars.length > 0 && <div className="chart-foot"><span><i className="legend-dot" />Queue size</span><span>Derived from demo records</span></div>}
      </article>
      <div className="grid grid-cols-1 gap-4 lg:col-span-7">
      <article className="card overflow-hidden rounded-[28px]">
        <div className="card-head"><div><h2 className="card-title">Recent activity</h2><p className="card-note">Saved panel actions and sample history</p></div><button className="row-action" aria-label="View activity" onClick={() => isSuper ? onNavigate("activity") : onNavigate(permitted("patients.view") ? "patients" : "overview")}><ArrowRight size={16} /></button></div>
        {activityRows.length ? <div className="activity-list">{activityRows.map((event, index) => {
          const Icon = event.type === "Orders" || event.type === "Commerce" ? PackageCheck : event.type === "Bookings" ? CalendarCheck2 : event.type === "Testing" ? FileText : event.type === "Access" ? UsersRound : event.type === "Feature" ? BellRing : Activity;
          return <div className="activity-row" key={`${event.who}-${event.time}-${index}`}><div className="activity-icon"><Icon size={14} /></div><div className="activity-copy"><div className="activity-text"><strong>{event.who}</strong> {event.action} <strong>{event.target}</strong></div><div className="activity-time">{event.time} · {event.type}</div></div></div>;
        })}</div> : <div className="empty-state">No recorded activity yet.</div>}
      </article>
      {isSuper && <article className="card overflow-hidden rounded-[28px]"><div className="section-row"><div><h2 className="card-title">Admin access snapshot</h2><p className="card-note">Staff access to Dr. Jai Bansal’s panel</p></div><button className="button button-secondary button-small" onClick={() => onNavigate("team")}>Manage team <ArrowRight size={13} /></button></div><div className="admin-snapshot-body"><div className="admin-snapshot-avatars">{admins.slice(0, 4).map((admin) => <span className="avatar" key={admin.id}>{admin.initials}</span>)}</div><span>{admins.length} admins · {adminActive} active · {admins.length - adminActive} inactive or suspended</span></div></article>}
      </div>
    </section>

    {permitted("patients.view") && <section className="card" style={{ marginBottom: 16 }}>
      <div id="patient-reviews" className="section-row scroll-mt-24"><div><h2 className="card-title">Patient reviews</h2><p className="card-note">Patients waiting for clinical attention</p></div><button className="button button-secondary button-small" onClick={() => onNavigate("patients", { anchor: "registered-patients" })}>Open patient records <ArrowRight size={13} /></button></div>
      <div className="table-wrap"><table><thead><tr><th>Patient</th><th>Assessment summary</th><th>Submitted</th><th>Status</th><th /></tr></thead><tbody>{reviewPatients.slice(0, 4).map((patient) => { const linked = registeredPatients.find((item) => item.id === patient.id) ?? registeredPatients.find((item) => normalizePatientName(item.name) === normalizePatientName(patient.name)); return <tr key={patient.id}><td><button type="button" className="person text-left" onClick={() => openReviewPatient(patient)} aria-label={linked ? `Open ${patient.name} patient profile` : `${patient.name}; preview review not linked to a live profile`}><Avatar initials={patient.initials} /><span><span className="person-name block">{patient.name}</span><span className="person-sub block">{patient.id}</span></span></button></td><td>{patient.assessment}</td><td>{patient.submitted}</td><td><StatusPill status={patient.status} /></td><td><button className="row-action" aria-label={linked ? `Open ${patient.name} profile` : `Check ${patient.name} review link`} onClick={() => openReviewPatient(patient)}><ArrowRight size={15} /></button></td></tr>;})}{reviewPatients.length === 0 && <tr><td colSpan={5}><div className="empty-state">No patients are waiting for review.</div></td></tr>}</tbody></table></div>
    </section>}

    {selectedBooking && <AppointmentDetailsDialog
      booking={selectedBooking}
      patient={registeredPatients.find((patient) => patient.id === selectedBooking.patientId)
        ?? registeredPatients.find((patient) => normalizePatientName(patient.name) === normalizePatientName(selectedBooking.customer))}
      onClose={() => setSelectedBooking(null)}
      onOpenPatient={onOpenPatient}
      onAdvance={() => advanceAppointment(selectedBooking)}
      onManage={() => { const date = appointmentDate(selectedBooking); setSelectedBooking(null); onNavigate("bookings", { bookingDate: date ? localDateKey(date) : undefined }); }}
    />}

  </main>;
}

function Kpi({ icon, label, value, trend, foot, onClick }: { icon: React.ReactNode; label: string; value: string; trend: string; foot: string; onClick?: () => void }) {
  const content = <><div className="kpi-top"><span className="kpi-label">{label}</span><span className="kpi-icon">{icon}</span></div><div className="kpi-value">{value}</div><div className="kpi-foot"><span className={onClick ? "positive" : "negative"}>{trend}</span><span>{foot}</span></div></>;
  if (!onClick) return <article className="card kpi-card">{content}</article>;
  return <button type="button" className="card kpi-card w-full text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0D9488]" onClick={onClick} aria-label={`${label}: ${value}. ${foot}. Open related section.`}>{content}</button>;
}

function AppointmentCalendar({ bookings, selectedDate, onSelectDate, clinicHolidays }: {
  bookings: BookingRecord[];
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  clinicHolidays: string[];
}) {
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const monthTitle = new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(month);
  const offset = (month.getDay() + 6) % 7;
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const dayCells = [...Array(offset).fill(null), ...Array.from({ length: daysInMonth }, (_, index) => index + 1)];
  const bookingsByDate = useMemo(() => {
    const byDate = new Map<string, BookingRecord[]>();
    bookings.filter((booking) => !["Cancelled", "No show"].includes(booking.status)).forEach((booking) => {
      const date = appointmentDate(booking);
      if (!date) return;
      const key = localDateKey(date);
      byDate.set(key, [...(byDate.get(key) ?? []), booking]);
    });
    return byDate;
  }, [bookings]);
  const selectedKey = localDateKey(selectedDate);
  const todayKey = localDateKey(new Date());

  const moveMonth = (change: number) => {
    const next = new Date(month.getFullYear(), month.getMonth() + change, 1);
    setMonth(next);
    const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
    onSelectDate(new Date(next.getFullYear(), next.getMonth(), Math.min(selectedDate.getDate(), lastDay)));
  };

  const returnToToday = () => {
    const today = startOfToday();
    setMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    onSelectDate(today);
  };

  return <article className="min-w-0 overflow-hidden rounded-[28px] bg-[#1A365D] p-4 text-white shadow-sm sm:p-6 lg:col-span-5" aria-label="Appointment calendar">
    <div className="flex flex-col gap-2 border-b border-white/10 pb-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <span className="text-[10px] font-bold uppercase tracking-[.16em] text-[#45c4b5]">OPD schedule</span>
        <h2 className="mt-0.5 text-lg font-bold tracking-tight">Clinic appointments</h2>
      </div>
      <div className="flex w-full items-center justify-between gap-1 sm:w-auto sm:justify-start">
        <button type="button" onClick={returnToToday} className="h-8 rounded-full bg-white/10 px-3 text-[11px] font-semibold text-slate-200 transition hover:bg-white/15 hover:text-white">Today</button>
        <button type="button" onClick={() => moveMonth(-1)} aria-label="Previous month" className="grid h-8 w-8 place-items-center rounded-full text-slate-300 transition hover:bg-white/10 hover:text-white"><ChevronLeft size={17} /></button>
        <span className="min-w-[104px] text-center text-xs font-semibold text-slate-200" aria-live="polite">{monthTitle}</span>
        <button type="button" onClick={() => moveMonth(1)} aria-label="Next month" className="grid h-8 w-8 place-items-center rounded-full text-slate-300 transition hover:bg-white/10 hover:text-white"><ChevronRight size={17} /></button>
      </div>
    </div>

    <div className="grid grid-cols-7 py-2 text-center text-[10px] font-bold uppercase tracking-wide text-slate-400" aria-hidden="true">
      {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => <span key={`${day}-${index}`}>{day}</span>)}
    </div>
    <div className="grid grid-cols-7 gap-y-1 text-center">
      {dayCells.map((day, index) => {
        if (day === null) return <span aria-hidden="true" key={`blank-${index}`} className="mx-auto h-9 w-9" />;
        const date = new Date(month.getFullYear(), month.getMonth(), day);
        const key = localDateKey(date);
        const count = bookingsByDate.get(key)?.length ?? 0;
        const isSelected = key === selectedKey;
        const isToday = key === todayKey;
        const isClosed = clinicHolidays.includes(key) || date.getDay() === 0;
        const dayTone = isSelected
          ? "bg-white font-bold text-[#1A365D] shadow"
          : isClosed
            ? "bg-[#F5DEDA] font-semibold text-[#8D514D] hover:bg-[#F0D1CB]"
            : count > 1
              ? "bg-[#78C5B6] font-bold text-[#153A58] hover:bg-[#8BD0C2]"
              : count === 1
                ? "bg-[#D8EEE9] font-semibold text-[#1A365D] hover:bg-[#C7E6DF]"
                : isToday
                  ? "ring-1 ring-white/70 text-white"
                  : "text-slate-300";
        const statusLabel = isClosed ? ", clinic closed" : "";
        return <button
          key={key}
          type="button"
          aria-label={`${formatFullDate(date)}${count ? `, ${count} appointment${count === 1 ? "" : "s"}` : ", no appointments"}${statusLabel}`}
          aria-pressed={isSelected}
          onClick={() => onSelectDate(date)}
          className={`relative mx-auto grid h-9 w-9 place-items-center rounded-full text-xs font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#45c4b5] ${dayTone} ${count > 0 && isClosed && !isSelected ? "ring-2 ring-[#76C6B7]" : ""} ${isSelected && isClosed ? "ring-2 ring-[#E7B9B3]" : ""}`}
        >
          {day}
        </button>;
      })}
    </div>
  </article>;
}

function SelectedDateAppointments({ bookings, date, onNavigate, onOpenAppointment }: {
  bookings: BookingRecord[];
  date: Date;
  onNavigate: () => void;
  onOpenAppointment: (booking: BookingRecord) => void;
}) {
  const isToday = localDateKey(date) === localDateKey(new Date());
  const title = isToday ? "Today’s appointments" : `Appointments · ${formatShortDate(date)}`;

  return <article className="card overflow-hidden rounded-[28px] lg:col-span-7" aria-live="polite" aria-label={title}>
    <div className="section-row">
      <div>
        <span className="eyebrow">Selected date</span>
        <h2 className="card-title">{title}</h2>
        <p className="card-note">{bookings.length} booked patient{bookings.length === 1 ? "" : "s"}</p>
      </div>
      <button type="button" className="button button-secondary button-small" onClick={onNavigate}>All bookings <ArrowRight size={13} /></button>
    </div>
    {bookings.length ? <div className="grid gap-2 px-4 pb-4 sm:px-5 sm:pb-5">
      {bookings.map((booking) => <AppointmentPatientCard key={booking.id} booking={booking} onClick={() => onOpenAppointment(booking)} />)}
    </div> : <div className="empty-state mx-4 mb-4 rounded-2xl bg-[#F7F9FC] sm:mx-5 sm:mb-5">No appointments are booked for this date.</div>}
  </article>;
}

function AppointmentPatientCard({ booking, onClick }: {
  booking: BookingRecord;
  onClick: () => void;
}) {
  const content = <>
    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-[#0D9488] shadow-sm"><CalendarCheck2 size={18} /></span>
    <span className="min-w-0 flex-1">
      <span className="block truncate text-sm font-semibold text-[#1A365D]">{booking.customer}</span>
      <span className="mt-0.5 block truncate text-xs text-slate-500">{booking.service}</span>
      <span className="mt-1 block truncate text-[11px] text-slate-400">{booking.doctorName || "Clinic team"}</span>
    </span>
    <span className="flex w-full items-center justify-between gap-3 border-t border-slate-200/70 pt-2 sm:w-auto sm:flex-col sm:items-end sm:border-0 sm:pt-0">
      <span className="text-xs font-semibold text-[#1A365D]">{formatBookingTime(booking)}</span>
      <StatusPill status={booking.status} />
    </span>
  </>;
  const cardClass = "flex min-w-0 flex-wrap items-center gap-3 rounded-2xl bg-[#F7F9FC] p-3 text-left sm:flex-nowrap sm:p-4";

  return <button type="button" className={`${cardClass} w-full transition hover:bg-[#EDF3F8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0D9488]`} onClick={onClick} aria-label={`Open appointment details for ${booking.customer}`}>
    {content}
  </button>;
}

function RegisteredPatients({ patients, totalCount, loadState, onOpenPatient }: {
  patients: RegisteredPatient[];
  totalCount: number;
  loadState: "loading" | "ready" | "error";
  onOpenPatient: (patientId: string) => void;
}) {
  return <section id="registered-patients" className="card mb-4 overflow-hidden rounded-[28px]" aria-labelledby="registered-patients-title">
    <div className="section-row">
      <div>
        <span className="eyebrow">Patient directory</span>
        <h2 id="registered-patients-title" className="card-title">Registered patients</h2>
        <p className="card-note">Select a patient to open their full profile and care history.</p>
      </div>
      {loadState === "ready" && <span className="rounded-full bg-[#F0F7FF] px-3 py-1 text-xs font-semibold text-[#1A365D]">{totalCount} registered</span>}
    </div>
    {loadState === "loading" ? <div className="empty-state">Loading registered patients…</div>
      : loadState === "error" ? <div className="empty-state">Patient directory is unavailable right now.</div>
      : patients.length ? <div className="table-wrap">
      <table>
        <thead><tr><th>Patient</th><th>Contact</th><th>Age / gender</th><th>City</th><th>Registered</th><th /></tr></thead>
        <tbody>{patients.map((patient) => <tr key={patient.id}>
          <td><button type="button" className="person text-left" onClick={() => onOpenPatient(patient.id)} aria-label={`Open ${patient.name} patient details`}><Avatar initials={patient.initials} /><span><span className="person-name block">{patient.name}</span><span className="person-sub block">{patient.id}</span></span></button></td>
          <td><span className="block">{patient.email || "No email"}</span><span className="person-sub block">{patient.phone || "No phone"}</span></td>
          <td>{[patient.age ? `${patient.age} yrs` : "", patient.gender].filter(Boolean).join(" · ") || "—"}</td>
          <td>{patient.city || "—"}</td>
          <td>{formatRegistrationDate(patient.createdAt)}</td>
          <td><button type="button" className="row-action" aria-label={`Open ${patient.name}`} onClick={() => onOpenPatient(patient.id)}><ArrowRight size={15} /></button></td>
        </tr>)}</tbody>
      </table>
    </div> : <div className="empty-state">No registered patients yet.</div>}
  </section>;
}

function AppointmentDetailsDialog({ booking, patient, onClose, onOpenPatient, onAdvance, onManage }: {
  booking: BookingRecord;
  patient?: RegisteredPatient;
  onClose: () => void;
  onOpenPatient: (patientId: string) => void;
  onAdvance: () => void;
  onManage: () => void;
}) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  const appointmentDateValue = appointmentDate(booking);
  const action = nextAppointmentAction(booking);
  const details = [
    ["Date", appointmentDateValue ? formatFullDate(appointmentDateValue) : booking.date],
    ["Time", formatBookingTime(booking)],
    ["Doctor", booking.doctorName || "Not assigned"],
    ["Visit type", booking.type || "Clinic visit"],
    ["Room", booking.room || "Not assigned"],
    ["Booking source", booking.source || "Not recorded"],
    ["OPD token", booking.tokenNumber || "Not assigned"],
    ["OPD status", booking.opdStatus || booking.status],
  ] as const;

  if (typeof document === "undefined") return null;
  return createPortal(<div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="modal max-w-xl overflow-y-auto" style={{ maxHeight: "calc(100dvh - 40px)" }} role="dialog" aria-modal="true" aria-labelledby="appointment-detail-title">
      <div className="modal-head">
        <div>
          <span className="eyebrow">Appointment details</span>
          <h2 id="appointment-detail-title">{booking.customer}</h2>
          <p>{booking.service}</p>
        </div>
        <button type="button" className="row-action" aria-label="Close appointment details" onClick={onClose}><X size={17} /></button>
      </div>
      <div className="modal-body">
        <div className="flex items-center justify-between gap-3 rounded-xl bg-[#F7F9FC] p-3">
          <div><span className="person-sub">Booking reference</span><p className="person-name mt-1">{booking.id}</p></div>
          <StatusPill status={booking.status} />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {details.map(([label, value]) => <div key={label} className="rounded-xl border border-slate-100 p-3">
            <p className="person-sub">{label}</p><p className="mt-1 text-sm font-medium text-[#1A365D]">{value}</p>
          </div>)}
        </div>
        {patient ? <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#dcebe8] bg-[#f4faf9] p-3">
          <div><p className="text-xs font-semibold text-[#1A365D]">Linked registered profile</p><p className="person-sub mt-1">{patient.name} · {patient.id}</p></div>
          <button type="button" className="button button-primary button-small" onClick={() => onOpenPatient(patient.id)}>Open patient profile <ArrowRight size={13} /></button>
        </div> : <p className="rounded-xl bg-[#F7F9FC] p-3 text-xs leading-5 text-slate-500">No registered patient profile is linked to this appointment yet.</p>}
      </div>
      <div className="modal-actions flex-col sm:flex-row">
        {action && <button type="button" className="button button-primary" onClick={onAdvance}>{action.label}<ArrowRight size={14} /></button>}
        <button type="button" className="button button-secondary" onClick={onManage}><CalendarCheck2 size={14} />Manage booking</button>
      </div>
    </section>
  </div>, document.body);
}

function normalizePatientName(name: string) {
  return name.trim().toLocaleLowerCase().replace(/\s+/g, " ");
}

function nextAppointmentAction(booking: BookingRecord) {
  const opdStatus = booking.opdStatus;
  if (["Completed", "Cancelled", "No show"].includes(booking.status) || opdStatus === "Completed" || opdStatus === "No show") return null;
  if (opdStatus === "Requested" || booking.status === "Pending" && !opdStatus) return { label: "Confirm appointment", opdStatus: "Confirmed" as const };
  const appointment = appointmentDate(booking);
  if (appointment && localDateKey(appointment) > localDateKey(startOfToday())) return null;
  if (opdStatus === "Arrived") return { label: "Start consultation", opdStatus: "In Consultation" as const };
  if (opdStatus === "In Consultation") return { label: "Complete consultation", opdStatus: "Completed" as const };
  if (opdStatus === "Confirmed" || booking.status === "Pending") return { label: "Mark patient arrived", opdStatus: "Arrived" as const };
  return { label: "Mark patient arrived", opdStatus: "Arrived" as const };
}

function formatRegistrationDate(value: string) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(date);
}

function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function localDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function appointmentDate(booking: BookingRecord): Date | null {
  if (booking.startsAt) {
    const fromTimestamp = new Date(booking.startsAt);
    return Number.isNaN(fromTimestamp.getTime()) ? null : fromTimestamp;
  }
  const label = booking.date.toLowerCase();
  const date = startOfToday();
  if (label.includes("tomorrow")) date.setDate(date.getDate() + 1);
  else if (label.includes("today")) return date;
  else {
    const parsed = new Date(booking.date);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return date;
}

function formatFullDate(date: Date) {
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric" }).format(date);
}

function formatShortDate(date: Date) {
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

function formatBookingTime(booking: BookingRecord) {
  if (!booking.startsAt) return booking.date.split("·")[1]?.trim() || "Time not set";
  const date = new Date(booking.startsAt);
  return Number.isNaN(date.getTime()) ? "Time not set" : new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit" }).format(date);
}
