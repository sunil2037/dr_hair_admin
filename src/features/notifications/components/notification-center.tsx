"use client";

import { useMemo, useState } from "react";
import { Activity, BellRing, CalendarDays, CheckCheck, ChevronRight, FileText, PackageCheck, UsersRound } from "lucide-react";
import { PageHeader } from "../../shared/components/ui";
import { bookings as initialBookings, orders as initialOrders, patients as initialPatients } from "../../shared/lib/demo-data";
import { useSessionState } from "../../shared/lib/use-session-state";
import type { AuditEventRecord, BookingRecord, PageKey, PatientRecord, Role } from "../../shared/types";
import { patientClinicalProfiles } from "../../operations/lib/patient-profiles";
import { initialHairTests } from "../../operations/lib/hair-test-demo";
import type { HairTestRecord, PatientClinicalProfile, PatientReportNotification } from "../../operations/types";

type NotificationCategory = "Appointments" | "Patients" | "Reports" | "Orders" | "Activity";
type NotificationFilter = "All" | "Unread" | NotificationCategory;
type NavigateOptions = { bookingDate?: string; anchor?: string };
type DashboardNotification = {
  id: string;
  category: NotificationCategory;
  title: string;
  detail: string;
  time: string;
  page: PageKey;
  bookingDate?: string;
  anchor?: string;
  unreadTone: string;
};

const filters: NotificationFilter[] = ["All", "Unread", "Appointments", "Patients", "Reports", "Orders", "Activity"];

export function NotificationCenter({
  role,
  userName,
  permissions,
  events,
  onNavigate,
}: {
  role: Role;
  userName: string;
  permissions: string[];
  events: AuditEventRecord[];
  onNavigate: (page: PageKey, options?: NavigateOptions) => void;
}) {
  const [bookings] = useSessionState<BookingRecord[]>("drhair-demo-bookings", initialBookings);
  const [patients] = useSessionState<PatientRecord[]>("drhair-demo-patients", initialPatients);
  const [orders] = useSessionState("drhair-demo-orders", initialOrders);
  const [profiles] = useSessionState<Record<string, PatientClinicalProfile>>("drhair-demo-patient-profiles", patientClinicalProfiles);
  const [hairTests] = useSessionState<HairTestRecord[]>("drhair-demo-hair-tests", initialHairTests);
  const [reportNotifications] = useSessionState<PatientReportNotification[]>("drhair-demo-patient-notifications", []);
  const [readIds, setReadIds] = useSessionState<string[]>("drhair-admin-notification-read", []);
  const [filter, setFilter] = useState<NotificationFilter>("All");

  const visibleEvents = useMemo(() => role === "super-admin" ? events : events.filter((event) => event.who === userName), [events, role, userName]);

  const notifications = useMemo(() => {
    const createdAppointmentIds = new Set(visibleEvents
      .filter((event) => /created clinic appointment/i.test(event.action))
      .map((event) => event.target.split("·")[0].trim()));

    const appointmentItems: DashboardNotification[] = visibleEvents
      .filter((event) => event.type === "Bookings" && hasPermission(role, permissions, "bookings.manage"))
      .map((event, index) => {
        const bookingId = event.target.split("·")[0].trim();
        const booking = bookings.find((item) => item.id === bookingId);
        const created = /created clinic appointment/i.test(event.action);
        return {
          id: `event:${event.type}:${event.who}:${event.time}:${event.target}:${index}`,
          category: "Appointments",
          title: created ? "New clinic appointment" : "Appointment updated",
          detail: `${booking?.customer ?? event.target} · ${booking?.service ?? event.action}`,
          time: event.time,
          page: "bookings",
          bookingDate: booking ? bookingDateKey(booking) : undefined,
          unreadTone: "bg-[#E6F4F1] text-[#237A70]",
        };
      });

    bookings.filter((booking) => hasPermission(role, permissions, "bookings.manage") && booking.opdStatus === "Requested" && !createdAppointmentIds.has(booking.id)).forEach((booking) => {
      appointmentItems.push({
        id: `booking-request:${booking.id}`,
        category: "Appointments",
        title: "Appointment needs confirmation",
        detail: `${booking.customer} · ${booking.service}`,
        time: booking.startsAt ? formatDateTime(booking.startsAt) : booking.date,
        page: "bookings",
        bookingDate: bookingDateKey(booking),
        unreadTone: "bg-[#E6F4F1] text-[#237A70]",
      });
    });

    const patientItems: DashboardNotification[] = hasPermission(role, permissions, "patients.view") ? patients
      .filter((patient) => patient.status === "Review" || patient.status === "Pending")
      .map((patient) => ({
        id: `patient-review:${patient.id}`,
        category: "Patients",
        title: patient.status === "Review" ? "Patient review is waiting" : "New patient assessment",
        detail: `${patient.name} · ${patient.assessment}`,
        time: patient.submitted,
        page: "patients",
        anchor: "patient-reviews",
        unreadTone: "bg-[#EEF4FF] text-[#436693]",
      })) : [];

    const reportItems: DashboardNotification[] = hasPermission(role, permissions, "reports.share") ? Object.entries(profiles).flatMap(([patientId, profile]) => profile.reports
      .filter((report) => report.status === "Ready" && !reportNotifications.some((notification) => notification.patientId === patientId && notification.reportId === report.id))
      .map((report) => ({
        id: `report-ready:${patientId}:${report.id}`,
        category: "Reports",
        title: "Patient report is ready to share",
        detail: `${report.title} · ${patientId}`,
        time: report.date,
        page: "patients",
        anchor: "patient-reviews",
        unreadTone: "bg-[#F2EEFF] text-[#6757A6]",
      }))) : [];

    const testItems: DashboardNotification[] = hasPermission(role, permissions, "hair-tests.view") ? hairTests
      .filter((test) => test.status === "In review")
      .map((test) => ({
        id: `hair-test:${test.id}`,
        category: "Reports",
        title: "Hair test result needs review",
        detail: `${test.patientName} · ${test.testName}`,
        time: test.testDate,
        page: "tests",
        unreadTone: "bg-[#FFF4E3] text-[#966218]",
      })) : [];

    const orderItems: DashboardNotification[] = hasPermission(role, permissions, "orders.manage") ? orders
      .filter((order) => ["New", "Pending", "Needs attention"].includes(order.status))
      .map((order) => ({
        id: `order-action:${order.id}`,
        category: "Orders",
        title: order.status === "Needs attention" ? "Order needs attention" : "Order needs fulfilment",
        detail: `${order.id} · ${order.customer} · ${order.item}`,
        time: order.date,
        page: "orders",
        unreadTone: "bg-[#FFF4E3] text-[#966218]",
      })) : [];

    const activityItems: DashboardNotification[] = visibleEvents
      .filter((event) => event.type !== "Bookings")
      .slice(0, 12)
      .map((event, index) => {
        const category = event.type === "Orders" || event.type === "Commerce" ? "Orders"
          : event.type === "Testing" ? "Reports"
          : event.type === "Clinical" ? "Patients" : "Activity";
        return {
          id: `activity:${event.type}:${event.who}:${event.time}:${event.target}:${index}`,
          category,
          title: activityTitle(event),
          detail: `${event.who} · ${event.target}`,
          time: event.time,
          page: pageForEvent(event, role),
          anchor: category === "Patients" ? "patient-reviews" : undefined,
          unreadTone: categoryTone(category),
        };
      });

    return [...appointmentItems, ...patientItems, ...reportItems, ...testItems, ...orderItems, ...activityItems];
  }, [bookings, hairTests, orders, patients, profiles, reportNotifications, role, permissions, visibleEvents]);

  const unreadCount = notifications.filter((item) => !readIds.includes(item.id)).length;
  const appointmentCount = notifications.filter((item) => item.category === "Appointments" && !readIds.includes(item.id)).length;
  const needsAttentionCount = notifications.filter((item) => item.category !== "Activity" && !readIds.includes(item.id)).length;
  const visibleNotifications = notifications.filter((item) => {
    if (filter === "Unread" && readIds.includes(item.id)) return false;
    return filter === "All" || filter === "Unread" || item.category === filter;
  });

  const markRead = (id: string) => setReadIds((current) => current.includes(id) ? current : [id, ...current].slice(0, 500));
  const markAllRead = () => setReadIds((current) => [...new Set([...current, ...notifications.map((item) => item.id)])].slice(0, 500));
  const openNotification = (item: DashboardNotification) => {
    markRead(item.id);
    if (item.page === "bookings") onNavigate("bookings", { bookingDate: item.bookingDate });
    else if (item.page === "patients") onNavigate("patients", { anchor: item.anchor });
    else onNavigate(item.page);
  };

  return <main className="page-wrap mx-auto w-full min-w-0 max-w-[1420px] px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
    <PageHeader
      eyebrow="Clinic updates"
      title="Notifications"
      description="Appointment requests, patient reviews, reports, orders, and recent admin activity."
      action={<button type="button" className="button button-secondary w-full sm:w-auto" onClick={markAllRead} disabled={!unreadCount}><CheckCheck size={15} />Mark all as read</button>}
    />

    <div className="notice mb-4 flex items-start gap-2.5" role="status">
      <BellRing size={15} className="mt-0.5 shrink-0" />
      <span><strong>Preview inbox.</strong> Updates are built from this browser’s sample data and activity. Live notification delivery needs the notification API/feed.</span>
    </div>

    <section className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3" aria-label="Notification summary">
      <NotificationSummary label="Unread updates" value={unreadCount} icon={<BellRing size={16} />} tone="teal" />
      <NotificationSummary label="Appointment updates" value={appointmentCount} icon={<CalendarDays size={16} />} tone="blue" />
      <NotificationSummary label="Needs attention" value={needsAttentionCount} icon={<Activity size={16} />} tone="amber" />
    </section>

    <section className="card overflow-hidden rounded-[24px]" aria-label="Notification inbox">
      <div className="section-row flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <h2 className="card-title">Your inbox</h2>
          <p className="card-note">Choose an update to open the related workspace.</p>
        </div>
        <div className="flex w-full gap-1 overflow-x-auto rounded-xl bg-slate-50 p-1 sm:w-auto" role="group" aria-label="Filter notifications">
          {filters.map((value) => <button
            key={value}
            type="button"
            aria-pressed={filter === value}
            onClick={() => setFilter(value)}
            className={`min-h-9 shrink-0 rounded-lg px-3 text-xs font-semibold transition ${filter === value ? "bg-white text-[#1A365D] shadow-sm" : "text-slate-500 hover:text-[#1A365D]"}`}
          >{value}{value === "Unread" && unreadCount > 0 ? ` (${unreadCount})` : ""}</button>)}
        </div>
      </div>

      {visibleNotifications.length ? <div className="grid gap-2 p-3 pt-0 sm:p-4 sm:pt-0">
        {visibleNotifications.map((item) => {
          const unread = !readIds.includes(item.id);
          const Icon = iconForCategory(item.category);
          return <button
            key={item.id}
            type="button"
            onClick={() => openNotification(item)}
            aria-label={`${unread ? "Unread. " : "Read. "}${item.title}. ${item.detail}`}
            className={`group flex min-w-0 w-full items-start gap-3 rounded-2xl border p-3 text-left transition sm:items-center sm:p-4 ${unread ? "border-[#dcece8] bg-[#f6fbf9] hover:bg-[#eef8f5]" : "border-slate-100 bg-white hover:bg-slate-50"}`}
          >
            <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${item.unreadTone}`}><Icon size={17} /></span>
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-[#1A365D]">{item.title}</span>
                {unread && <span className="rounded-full bg-[#0D9488]/10 px-2 py-0.5 text-[10px] font-semibold text-[#0D7E74]">New</span>}
                <span className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-medium text-slate-500">{item.category}</span>
              </span>
              <span className="mt-1 block break-words text-xs leading-5 text-slate-500">{item.detail}</span>
            </span>
            <span className="flex shrink-0 items-center gap-2 self-center text-right">
              <span className="hidden text-[11px] text-slate-400 sm:block">{item.time}</span>
              <ChevronRight size={16} className="text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-[#1A365D]" />
            </span>
          </button>;
        })}
      </div> : <div className="mx-3 mb-3 rounded-2xl bg-[#F7F9FC] px-5 py-10 text-center sm:mx-4 sm:mb-4">
        <span className="mx-auto grid h-11 w-11 place-items-center rounded-2xl bg-white text-slate-400 shadow-sm"><BellRing size={18} /></span>
        <h3 className="mt-3 text-sm font-semibold text-[#1A365D]">{filter === "Unread" ? "You’re all caught up" : "No updates in this section"}</h3>
        <p className="mt-1 text-xs text-slate-500">New items will appear here when the connected clinic services send them.</p>
      </div>}
    </section>
  </main>;
}

function NotificationSummary({ label, value, icon, tone }: { label: string; value: number; icon: React.ReactNode; tone: "teal" | "blue" | "amber" }) {
  const tones = {
    teal: "bg-[#E7F5F2] text-[#21786F]",
    blue: "bg-[#EDF3FB] text-[#496D99]",
    amber: "bg-[#FFF5E7] text-[#9A6A1D]",
  };
  return <article className="card flex min-w-0 items-center gap-3 rounded-[22px] p-4 sm:p-5">
    <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${tones[tone]}`}>{icon}</span>
    <span className="min-w-0"><span className="block text-xs font-medium text-slate-500">{label}</span><strong className="mt-1 block text-2xl font-bold tracking-tight text-[#1A365D]">{value}</strong></span>
  </article>;
}

function iconForCategory(category: NotificationCategory) {
  if (category === "Appointments") return CalendarDays;
  if (category === "Patients") return UsersRound;
  if (category === "Reports") return FileText;
  if (category === "Orders") return PackageCheck;
  return Activity;
}

function categoryTone(category: NotificationCategory) {
  if (category === "Appointments") return "bg-[#E6F4F1] text-[#237A70]";
  if (category === "Patients") return "bg-[#EEF4FF] text-[#436693]";
  if (category === "Reports") return "bg-[#F2EEFF] text-[#6757A6]";
  if (category === "Orders") return "bg-[#FFF4E3] text-[#966218]";
  return "bg-[#F1F4F8] text-[#5D6D80]";
}

function activityTitle(event: AuditEventRecord) {
  if (/created clinic appointment/i.test(event.action)) return "New clinic appointment";
  if (/rescheduled clinic appointment/i.test(event.action)) return "Appointment rescheduled";
  if (/updated opd status/i.test(event.action)) return "Appointment status changed";
  return `${event.action} ${event.target}`.replace(/\s+/g, " ").trim();
}

function pageForEvent(event: AuditEventRecord, role: Role): PageKey {
  if (event.type === "Bookings") return "bookings";
  if (event.type === "Orders") return "orders";
  if (event.type === "Commerce") return "catalog";
  if (event.type === "Content" || event.type === "Feature" || event.type === "App updates" || event.type === "Notifications") return "content";
  if (event.type === "Testing") return "tests";
  if (event.type === "Access" && role === "super-admin") return "team";
  if (event.type === "Clinical") return "patients";
  return "overview";
}

function bookingDateKey(booking: BookingRecord) {
  if (booking.startsAt) {
    const date = new Date(booking.startsAt);
    if (!Number.isNaN(date.valueOf())) return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }
  return "";
}

function formatDateTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? "Scheduled appointment" : new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function hasPermission(role: Role, permissions: string[], permission: string) {
  return role === "super-admin" || permissions.includes(permission);
}
