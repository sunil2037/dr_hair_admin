"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Download,
  Eye,
  FileText,
  Filter,
  Pill,
  Plus,
  Printer,
  Sparkles,
  Stethoscope,
  UsersRound,
  ZoomIn,
} from "lucide-react";
import { Avatar, Modal, PageHeader, StatusPill, TableToolbar } from "../../shared/components/ui";
import { useSessionState } from "../../shared/lib/use-session-state";
import { bookings as initialBookings, patients as initialPatients } from "../../shared/lib/demo-data";
import type { BookingRecord, PatientRecord } from "../../shared/types";
import type { AdminPermissionId } from "../../shared/types";
import { patientClinicalProfiles } from "../lib/patient-profiles";
import { createFallbackProfile } from "./patient-profile-dialog";
import { OrdersPage } from "./orders-page";

type CareOperationsKind = "patients" | "bookings";
type TriageFilter = "all" | "needs-regimen" | "pending-checkins" | "active-regimen";
type BookingDateRange = "upcoming" | "past" | "all";
const clinicSlotGroups = [
  { label: "Morning · 10:00 AM–1:00 PM", slots: ["10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM"] },
  { label: "Evening · 3:30–7:00 PM", slots: ["03:30 PM", "04:00 PM", "04:30 PM", "05:00 PM", "05:30 PM", "06:00 PM", "06:30 PM"] },
];

export function OperationsPage({
  kind,
  globalSearch,
  onToast,
  permissions = [],
  onAudit = () => {},
  initialDateFilter = "",
}: {
  kind: "patients" | "orders" | "bookings";
  globalSearch: string;
  onToast: (message: string) => void;
  permissions?: AdminPermissionId[];
  onAudit?: (action: string, target: string) => void;
  initialDateFilter?: string;
}) {
  if (kind === "orders") return <OrdersPage globalSearch={globalSearch} onToast={onToast} onAudit={onAudit} canExport={permissions.includes("commerce.export")} />;
  return <CareOperationsPage kind={kind} globalSearch={globalSearch} onToast={onToast} permissions={permissions} onAudit={onAudit} initialDateFilter={initialDateFilter} />;
}

function CareOperationsPage({
  kind,
  globalSearch,
  onToast,
  permissions,
  onAudit,
  initialDateFilter,
}: {
  kind: CareOperationsKind;
  globalSearch: string;
  onToast: (message: string) => void;
  permissions: AdminPermissionId[];
  onAudit: (action: string, target: string) => void;
  initialDateFilter: string;
}) {
  const router = useRouter();
  const [demoPatients] = useSessionState<PatientRecord[]>("drhair-demo-patients", initialPatients);
  const isPatient = kind === "patients";
  const [apiPatients, setApiPatients] = useState<PatientRecord[]>([]);
  const [apiPatientTotal, setApiPatientTotal] = useState(0);
  const [patientPageState, setPatientPageState] = useState({ search: "", page: 1 });
  const [apiPatientState, setApiPatientState] = useState<"loading" | "ready" | "error">("loading");
  const [apiPatientError, setApiPatientError] = useState("");
  const [reloadPatients, setReloadPatients] = useState(0);
  const patients = isPatient ? apiPatients : demoPatients;
  const [bookings, setBookings] = useSessionState<BookingRecord[]>("drhair-demo-bookings", initialBookings);
  const [profiles] = useSessionState("drhair-demo-patient-profiles", patientClinicalProfiles);
  const [query, setQuery] = useState("");
  const [triageFilter, setTriageFilter] = useState<TriageFilter>("all");
  const [dialog, setDialog] = useState<BookingRecord | null>(null);
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [editingAppointmentId, setEditingAppointmentId] = useState<string | null>(null);
  const [appointmentPatientId, setAppointmentPatientId] = useState("");
  const [appointmentService, setAppointmentService] = useState("Clinic consultation");
  const [appointmentSource, setAppointmentSource] = useState<NonNullable<BookingRecord["source"]>>("Phone");
  const [statusFilter, setStatusFilter] = useState("All status");
  const [bookingDateRange, setBookingDateRange] = useState<BookingDateRange>(initialDateFilter ? "all" : "upcoming");
  const [bookingDateFilter, setBookingDateFilter] = useState(initialDateFilter);
  const [printingSlipBooking, setPrintingSlipBooking] = useState<BookingRecord | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [clinicHolidays, setClinicHolidays] = useSessionState<string[]>("drhair-demo-clinic-holidays", [
    "2026-11-01",
    "2026-11-02",
    "2026-12-25",
    "2027-01-26",
  ]);
  const [newHolidayDate, setNewHolidayDate] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentSlot, setAppointmentSlot] = useState("10:30 AM");
  const [currentTime, setCurrentTime] = useState(0);
  const apiSearch = `${globalSearch} ${query}`.trim();
  const patientPage = patientPageState.search === apiSearch ? patientPageState.page : 1;

  useEffect(() => {
    if (!isPatient) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setApiPatientState("loading");
      setApiPatientError("");
      const params = new URLSearchParams({ page: String(patientPage), limit: "50" });
      if (apiSearch) params.set("search", apiSearch);
      try {
        const response = await fetch(`/api/admin/users?${params.toString()}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.message || "Patient profiles could not be loaded.");
        const data = result.data && typeof result.data === "object" ? result.data : {};
        const items = Array.isArray(data.items) ? data.items : [];
        setApiPatients(items.map((user: Record<string, unknown>) => {
          const name = String(user.name || "Unnamed patient");
          const createdAt = user.created_at ? new Date(String(user.created_at)) : null;
          return {
            id: String(user.id ?? ""),
            name,
            initials: name.split(/\s+/).map((part) => part[0] || "").join("").slice(0, 2).toUpperCase(),
            email: String(user.email || ""),
            phone: String(user.phone || ""),
            age: typeof user.age === "number" ? user.age : null,
            gender: typeof user.gender === "string" ? user.gender : null,
            city: typeof user.city === "string" ? user.city : null,
            occupation: typeof user.occupation === "string" ? user.occupation : null,
            photoUrl: typeof user.profile_url === "string" ? user.profile_url : null,
            assessment: "No assessment submitted",
            submitted: createdAt && !Number.isNaN(createdAt.valueOf()) ? createdAt.toLocaleDateString("en-IN") : "—",
            status: "Active" as const,
          };
        }));
        setApiPatientTotal(typeof data.total === "number" ? data.total : items.length);
        setApiPatientState("ready");
      } catch (error) {
        if (controller.signal.aborted) return;
        setApiPatientError(error instanceof Error ? error.message : "Patient profiles could not be loaded.");
        setApiPatientState("error");
      }
    }, 250);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [apiSearch, isPatient, patientPage, reloadPatients]);

  const addClinicHoliday = () => {
    if (!newHolidayDate) {
      onToast("Please select a date to add as an official clinic holiday.");
      return;
    }
    if (clinicHolidays.includes(newHolidayDate)) {
      onToast("Bookings are already closed for this date.");
      return;
    }
    const affectedCount = bookings.filter((booking) => bookingDateKey(booking) === newHolidayDate && !["Cancelled", "Completed", "No show"].includes(booking.status)).length;
    setClinicHolidays((current) => [...current, newHolidayDate].sort());
    onAudit("added clinic holiday", newHolidayDate);
    onToast(affectedCount
      ? `New bookings are blocked. ${affectedCount} existing appointment${affectedCount === 1 ? "" : "s"} remain; reschedule them below.`
      : `New bookings are blocked for ${formatDateKey(newHolidayDate)}.`);
    setNewHolidayDate("");
  };

  const removeClinicHoliday = (date: string) => {
    setClinicHolidays((current) => current.filter((d) => d !== date));
    onAudit("removed clinic holiday", date);
    onToast(`Clinic holiday removed: ${date}`);
  };

  const updateOpdStatus = (bookingId: string, nextOpdStatus: NonNullable<BookingRecord["opdStatus"]>) => {
    const mainStatus = nextOpdStatus === "Completed" ? "Completed" : nextOpdStatus === "No show" ? "No show" : "Active";
    setBookings((current) =>
      current.map((item) => {
        if (item.id !== bookingId) return item;
        return { ...item, opdStatus: nextOpdStatus, status: mainStatus };
      })
    );
    setDialog((current) => current?.id === bookingId ? { ...current, opdStatus: nextOpdStatus, status: mainStatus } : current);
    onAudit(`updated OPD status to ${nextOpdStatus}`, `Booking ${bookingId}`);
    onToast(`Patient OPD status updated: ${nextOpdStatus}`);
  };

  const canViewClinicalPatients = permissions.some((permission) => ["patients.view", "assessments.review", "progress.review", "care-plans.edit"].includes(permission));
  const config = isPatient
    ? {
        title: "Trichology & Patient Care",
        desc: "Review assessments, test results, care plans, private patient files, and progress check-ins for Dr. Jai Bansal’s clinic.",
        eyebrow: "Clinical Workspace",
      }
      : {
        title: "Clinic appointments",
        desc: "Review physical visit requests and record appointments for Dr. Jai Bansal.",
        eyebrow: "Clinic operations",
      };

  const search = `${globalSearch} ${query}`.trim().toLowerCase();

  const filteredPatients = useMemo(() => {
    return patients.filter((item) => {
      const profile = profiles[item.id] ?? createFallbackProfile(item);
      const diagnosis = profile?.diagnoses[0]?.name ?? item.assessment;
      const searchText = canViewClinicalPatients ? `${item.name} ${item.email} ${item.assessment} ${diagnosis} ${item.id}` : `${item.name} ${item.id}`;
      const matchesSearch = searchText
        .toLowerCase()
        .includes(search);

      const matchesStatus = !canViewClinicalPatients || statusFilter === "All status" || item.status === statusFilter;

      // Triage filter
      let matchesTriage = true;
      if (!canViewClinicalPatients) matchesTriage = true;
      else if (triageFilter === "needs-regimen") {
        matchesTriage = !profile?.prescriptionPlan || item.status === "Review" || item.status === "Pending";
      } else if (triageFilter === "pending-checkins") {
        matchesTriage = Boolean(profile?.progress?.some((p) => !p.doctorReviewed));
      } else if (triageFilter === "active-regimen") {
        matchesTriage = Boolean(profile?.prescriptionPlan);
      }

      return matchesSearch && matchesStatus && matchesTriage;
    });
  }, [canViewClinicalPatients, patients, profiles, search, statusFilter, triageFilter]);

  const filteredBookings = useMemo(() => {
    const now = new Date();
    const todayKey = localDateKey(now);
    return bookings.filter(
      (item) => {
        const matchesSearch = `${item.customer} ${item.service} ${item.id} ${item.tokenNumber ?? ""} ${item.source ?? ""}`.toLowerCase().includes(search);
        const matchesStatus = statusFilter === "All status" || item.status === statusFilter || item.opdStatus === statusFilter;
        const dateKey = bookingDateKey(item);
        const matchesDate = bookingDateFilter ? dateKey === bookingDateFilter : bookingDateRange === "all" || (bookingDateRange === "upcoming" ? dateKey >= todayKey : dateKey < todayKey);
        return matchesSearch && matchesStatus && matchesDate;
      }
    ).sort((left, right) => {
      const difference = bookingTimestamp(left) - bookingTimestamp(right);
      return bookingDateFilter || bookingDateRange === "upcoming" ? difference : -difference;
    });
  }, [bookingDateFilter, bookingDateRange, bookings, search, statusFilter]);

  const isSlotBooked = (date: string, slot: string) => {
    if (!date || !slot) return false;
    const startsAt = appointmentSlotStart(date, slot).valueOf();
    return bookings.some((booking) => booking.id !== editingAppointmentId && booking.startsAt
      && new Date(booking.startsAt).valueOf() === startsAt && !["Cancelled", "No show"].includes(booking.status));
  };

  if (isPatient) {
    return <PatientDirectory
      patients={apiPatients}
      total={apiPatientTotal}
      page={patientPage}
      pageSize={50}
      loading={apiPatientState === "loading"}
      error={apiPatientState === "error" ? apiPatientError : ""}
      query={query}
      onQueryChange={setQuery}
      onPageChange={(page) => setPatientPageState({ search: apiSearch, page })}
      onRetry={() => setReloadPatients((value) => value + 1)}
      onOpenPatient={(id) => router.push(`/patients/${encodeURIComponent(id)}`)}
    />;
  }

  const updateBookingStatus = (status: "Completed" | "Active" | "Cancelled" | "No show") => {
    if (!dialog) return;
    if (["Cancelled", "Completed", "No show"].includes(dialog.status)) return;
    if (status === "No show" && dialog.startsAt && new Date(dialog.startsAt).getTime() > Date.now()) {
      onToast("A future appointment cannot be marked as no show.");
      return;
    }
    setBookings((current) => current.map((item) => (item.id === dialog.id ? { ...item, status } : item)));
    onAudit("updated clinic appointment", `${dialog.id} · ${status}`);
    onToast(`Appointment updated to ${status}.`);
    setDialog(null);
  };

  const handleOpenPatientFromBooking = (appointment: BookingRecord) => {
    if (!permissions.includes("patients.view")) {
      onToast("Patient chart access is not assigned to this admin account.");
      return;
    }
    const matched = patients.find((patient) => patient.id === appointment.patientId);
    if (!matched) {
      onToast("No linked patient record was found for this appointment.");
      return;
    }
    setDialog(null);
    router.push(`/patients/${encodeURIComponent(matched.id)}`);
  };

  const createAppointment = () => {
    const patient = patients.find((item) => item.id === appointmentPatientId);
    if (!patient || !appointmentDate || !appointmentSlot) {
      onToast("Choose a patient, visit date and sitting time slot.");
      return;
    }

    const [year, month, dateNumber] = appointmentDate.split("-").map(Number);
    const day = new Date(year, month - 1, dateNumber);
    if (day.getDay() === 0) {
      onToast("Sundays are clinic weekly off. Please select Mon–Sat.");
      return;
    }
    if (clinicHolidays.includes(appointmentDate)) {
      onToast("Bookings are closed for this date. Choose another date or reopen it in Manage availability.");
      return;
    }

    const start = appointmentSlotStart(appointmentDate, appointmentSlot);

    if (start.getTime() <= Date.now()) {
      onToast("Selected sitting slot has already passed.");
      return;
    }

    const occupied = bookings.some((booking) => booking.id !== editingAppointmentId && booking.startsAt && new Date(booking.startsAt).getTime() === start.getTime() && !["Cancelled", "No show"].includes(booking.status));
    if (occupied) {
      onToast("This sitting slot is already booked. Choose another time.");
      return;
    }

    const id = editingAppointmentId ?? `APT-${Date.now().toString().slice(-5)}`;
    const reason = appointmentService.trim() || "General hair & scalp consultation";
    const next: BookingRecord = {
      id,
      patientId: patient.id,
      customer: patient.name,
      service: reason,
      startsAt: start.toISOString(),
      date: new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(start),
      source: appointmentSource,
      status: "Active",
      type: "Physical Clinic Visit",
      doctorName: "Dr. Jai Bansal",
      room: "Room 101 - Chamber A",
      tokenNumber: `OPD-${(bookings.length + 1).toString().padStart(2, "0")}`,
      opdStatus: "Confirmed",
    };

    setBookings((current) => editingAppointmentId ? current.map((item) => item.id === id ? next : item) : [next, ...current]);
    onAudit(editingAppointmentId ? "rescheduled clinic appointment" : "created clinic appointment", `${id} · ${patient.id}`);
    onToast(editingAppointmentId ? "Appointment rescheduled with Dr. Jai Bansal." : "OPD clinic appointment scheduled with Dr. Jai Bansal.");
    setShowAppointmentForm(false);
    setEditingAppointmentId(null);
    setAppointmentPatientId("");
    setAppointmentDate("");
    setAppointmentSlot("10:30 AM");
    setAppointmentService("Clinic consultation");
    setAppointmentSource("Phone");
    setBookingDateRange("upcoming");
    setBookingDateFilter("");
    setStatusFilter("All status");
  };

  const openAppointmentForm = () => {
    setCurrentTime(Date.now());
    setEditingAppointmentId(null);
    setAppointmentPatientId("");
    setAppointmentDate("");
    setAppointmentSlot("10:30 AM");
    setAppointmentService("Clinic consultation");
    setAppointmentSource("Phone");
    setShowAppointmentForm(true);
  };

  const closeAppointmentForm = () => {
    setShowAppointmentForm(false);
    setEditingAppointmentId(null);
    setAppointmentPatientId("");
    setAppointmentDate("");
    setAppointmentSlot("10:30 AM");
    setAppointmentService("Clinic consultation");
    setAppointmentSource("Phone");
  };

  const rescheduleAppointment = (appointment: BookingRecord) => {
    setCurrentTime(Date.now());
    setEditingAppointmentId(appointment.id);
    setAppointmentPatientId(appointment.patientId ?? "");
    setAppointmentService(appointment.service);
    const timestamp = bookingTimestamp(appointment);
    if (timestamp) {
      const d = new Date(timestamp);
      setAppointmentDate(localDateKey(d));
      const hours = d.getHours();
      const mins = d.getMinutes();
      const period = hours >= 12 ? "PM" : "AM";
      const displayHours = hours % 12 || 12;
      const formattedSlot = `${displayHours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")} ${period}`;
      setAppointmentSlot(formattedSlot);
    }
    setAppointmentSource(appointment.source ?? "Phone");
    setDialog(null);
    setShowScheduleModal(false);
    setShowAppointmentForm(true);
  };

  return (
    <main className="page-wrap mx-auto w-full max-w-[1420px] px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow={config.eyebrow}
        title={config.title}
        description={config.desc}
        action={!isPatient ? (
          <div className="flex w-full flex-col justify-end gap-2 sm:w-auto sm:flex-row sm:flex-nowrap [&>.button]:w-full sm:[&>.button]:w-auto">
            <button className="button button-secondary" onClick={() => setShowScheduleModal(true)}>
              <CalendarDays size={14} />
              Manage availability
            </button>
            <button className="button button-primary" onClick={openAppointmentForm}>
              <Plus size={14} />
              Add appointment
            </button>
          </div>
        ) : permissions.includes("patients.export") ? (
          <button
            className="button button-secondary"
            onClick={() => onToast("Clinical export is a demo action until the API is connected.")}
          >
            <Download size={14} />
            Export Records
          </button>
        ) : undefined}
      />

      {isPatient && <div className="notice operations-notice">
        <Eye size={14} />
        <span>Private patient workspace for Dr. Jai Bansal. Changes and report notices stay in this browser preview until secure APIs are connected.</span>
      </div>}

      {isPatient ? <PatientSummary patients={patients} profiles={profiles} clinicalAccess={canViewClinicalPatients} /> : <BookingSummary bookings={bookings} />}

      <section className="card operations-table-card mt-4">
        <div className="section-row flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="card-title">{isPatient ? "Patient Triage & Clinical Charts" : "Appointment schedule"}</h2>
            <p className="card-note">
              {isPatient
                ? "Click any patient row to open their clinical chart, inspect scalp photos, or prescribe regimens"
                : "Switch between upcoming and past visits, or choose an exact date."}
            </p>
          </div>

          {/* Clinical Triage Buckets (Only for Patients) */}
          {isPatient && canViewClinicalPatients && (
            <div className="inline-flex rounded-lg border border-slate-200 p-1 bg-slate-50 gap-1 text-xs">
              <button
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  triageFilter === "all" ? "bg-white text-teal-800 shadow-sm font-semibold" : "text-slate-500 hover:text-slate-800"
                }`}
                onClick={() => setTriageFilter("all")}
              >
                All Patients ({patients.length})
              </button>
              <button
                className={`px-2.5 py-1 rounded font-medium transition-colors flex items-center gap-1 ${
                  triageFilter === "needs-regimen"
                    ? "bg-amber-100 text-amber-900 shadow-sm font-semibold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
                onClick={() => setTriageFilter("needs-regimen")}
              >
                <Sparkles size={11} className="text-amber-600" />
                Needs Regimen
              </button>
              <button
                className={`px-2.5 py-1 rounded font-medium transition-colors flex items-center gap-1 ${
                  triageFilter === "pending-checkins"
                    ? "bg-teal-100 text-teal-900 shadow-sm font-semibold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
                onClick={() => setTriageFilter("pending-checkins")}
              >
                <Activity size={11} className="text-teal-600" />
                Pending Check-Ins
              </button>
              <button
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  triageFilter === "active-regimen"
                    ? "bg-[#1A365D] text-white shadow-sm font-semibold"
                    : "text-slate-600 hover:text-[#1A365D]"
                }`}
                onClick={() => setTriageFilter("active-regimen")}
              >
                Active Regimens
              </button>
            </div>
          )}
          {!isPatient && <div className="booking-range-tabs w-full sm:w-auto" role="group" aria-label="Appointment date range">
            {([
              ["upcoming", "Upcoming"],
              ["past", "Past"],
              ["all", "All"],
            ] as const).map(([range, label]) => <button
              key={range}
              type="button"
              className={`flex-1 sm:flex-none ${bookingDateRange === range && !bookingDateFilter ? "active" : ""}`}
              aria-pressed={bookingDateRange === range && !bookingDateFilter}
              onClick={() => { setBookingDateRange(range); setBookingDateFilter(""); }}
            >{label}</button>)}
          </div>}
        </div>

        <TableToolbar
          value={query}
          onChange={setQuery}
          placeholder={
            isPatient
              ? canViewClinicalPatients ? "Search by patient name, email, ID, or diagnosis..." : "Find a patient by name or ID..."
              : "Search patient, reason, or ID..."
          }
          right={
            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:flex-nowrap">
              {!isPatient && <label className="booking-date-filter min-w-0 w-full shrink-0 sm:w-auto sm:flex-none">
                <span>Date</span>
                <input
                  className="min-w-0 flex-1 sm:flex-none sm:w-[132px]"
                  type="date"
                  aria-label="Show appointments on a specific date"
                  value={bookingDateFilter}
                  onChange={(event) => { setBookingDateFilter(event.target.value); setBookingDateRange("all"); }}
                />
              </label>}
              {(canViewClinicalPatients || !isPatient) && <select
                className="period-select min-w-0 flex-1 sm:flex-none"
                aria-label="Filter by status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option>All status</option>
                {(isPatient ? ["Review", "Pending", "Completed"] : ["Pending", "Active", "Requested", "Confirmed", "Arrived", "In Consultation", "Completed", "Cancelled", "No show"]).map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>}
              {(query || statusFilter !== "All status" || bookingDateFilter || bookingDateRange !== "upcoming") && <button
                className="filter-button min-w-[82px] flex-1 sm:flex-none"
                onClick={() => {
                  setQuery("");
                  setStatusFilter("All status");
                  setTriageFilter("all");
                  setBookingDateFilter("");
                  setBookingDateRange("upcoming");
                }}
              >
                <Filter size={13} />
                Reset
              </button>}
            </div>
          }
        />

        <div className="table-wrap">
          {isPatient ? canViewClinicalPatients ? (
            <table className="clinical-patient-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Verified Diagnosis & Stage</th>
                  <th>Scalp Photos</th>
                  <th>Active Protocol</th>
                  <th>Check-In Review</th>
                  <th>Queue Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filteredPatients.map((patient) => {
                  const profile = profiles[patient.id] ?? createFallbackProfile(patient);
                  const latestDiagnosis = profile?.diagnoses[0];
                  const prescription = profile?.prescriptionPlan;
                  const photos = profile?.assessmentAnswers?.photos || [];
                  const uploadedPhotosCount = photos.filter((p) => p.status === "Uploaded").length;
                  const unreviewedCheckIn = profile?.progress?.find((p) => !p.doctorReviewed);

                  return (
                    <tr
                      key={patient.id}
                      className="hover:bg-slate-50/80 cursor-pointer"
                      onClick={() => router.push(`/patients/${encodeURIComponent(patient.id)}`)}
                    >
                      <td>
                        <div className="person">
                          <Avatar initials={patient.initials} />
                          <div>
                            <div className="person-name font-semibold text-slate-800">{patient.name}</div>
                            <div className="person-sub text-[11px] text-slate-500">
                              {patient.id} · {profile?.age ? `${profile.age} yrs` : "Age —"} · {patient.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <strong className="text-slate-800 block text-xs">
                          {latestDiagnosis?.name ?? patient.assessment}
                        </strong>
                        <small className="text-teal-700 font-medium">
                          {latestDiagnosis?.stage ?? "Pending Clinician Diagnosis"}
                        </small>
                      </td>

                      <td>
                        <div className="inline-flex items-center gap-1.5 text-xs text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                          <ZoomIn size={12} className="text-teal-600" />
                          <span>{uploadedPhotosCount} angles</span>
                        </div>
                      </td>

                      <td>
                        {prescription ? (
                          <div className="text-xs">
                            <span className="font-semibold text-[#1A365D] block">
                              {prescription.products.length} Products Prescribed
                            </span>
                            <span className="text-[10px] text-slate-500">{prescription.duration}</span>
                          </div>
                        ) : (
                          <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            Regimen Needed
                          </span>
                        )}
                      </td>

                      <td>
                        {unreviewedCheckIn ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                            <Activity size={11} />
                            Action Needed
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">Up to date</span>
                        )}
                      </td>

                      <td>
                        <StatusPill status={patient.status} />
                      </td>

                      <td>
                        <button
                          className="row-action"
                          aria-label={`Open clinical record for ${patient.name}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/patients/${encodeURIComponent(patient.id)}`);
                          }}
                        >
                          <ArrowRight size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filteredPatients.length === 0 && (
                  <tr>
                    <td colSpan={7}>
                      <div className="empty-state py-8 text-center text-slate-400 text-xs">
                        No patient records match the selected filters.
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            <table>
              <thead><tr><th>Patient</th><th>Patient documents</th><th /></tr></thead>
              <tbody>{filteredPatients.map((patient) => {
                const documents = profiles[patient.id]?.documents ?? [];
                return <tr key={patient.id}>
                  <td><div className="person"><Avatar initials={patient.initials} /><div><div className="person-name">{patient.name}</div><div className="person-sub">{patient.id}</div></div></div></td>
                  <td>{documents.length} document{documents.length === 1 ? "" : "s"}</td>
                  <td><button className="button button-secondary button-small" onClick={() => router.push(`/patients/${encodeURIComponent(patient.id)}`)}>Open patient record</button></td>
                </tr>;
              })}{filteredPatients.length === 0 && <tr><td colSpan={3}><div className="empty-state">No patient matches that name or ID.</div></td></tr>}</tbody>
            </table>
          ) : (
            <AppointmentList
              bookings={filteredBookings}
              onOpen={setDialog}
              onAdvance={(booking) => {
                const next = nextAppointmentAction(booking);
                if (next) updateOpdStatus(booking.id, next.status);
              }}
            />
          )}
        </div>

        <div className="table-footer flex items-center justify-between p-3 border-t border-slate-200 text-xs text-slate-500">
          <span>
            {isPatient
              ? `Showing ${filteredPatients.length} of ${patients.length} patient records`
              : `${filteredBookings.length} ${bookingDateFilter ? `appointment${filteredBookings.length === 1 ? "" : "s"} · ${formatDateKey(bookingDateFilter)}` : bookingDateRange === "past" ? "past appointment" : bookingDateRange === "upcoming" ? "upcoming appointment" : "appointment"}${!bookingDateFilter && filteredBookings.length !== 1 ? "s" : ""}`}
          </span>
          <span>{isPatient ? "Trichology EMR Portal" : "Demo preview · saved in this browser session"}</span>
        </div>
      </section>

      {/* Staff-managed clinic appointment */}
      {dialog && (
        <Modal
          title={`Clinic appointment · ${dialog.id}`}
          description={`${dialog.customer} · ${dialog.service}`}
          submitLabel={nextAppointmentAction(dialog)?.label ?? "Close"}
          hideCancel
          onClose={() => setDialog(null)}
          onSubmit={() => {
            const next = nextAppointmentAction(dialog);
            if (next) updateOpdStatus(dialog.id, next.status);
            else setDialog(null);
          }}
        >
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Patient:</span>
                <strong className="text-slate-800">{dialog.customer}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Service:</span>
                <span className="font-medium text-slate-700">{dialog.service}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Source:</span>
                <span className="font-medium text-slate-700">{dialog.source ?? "Clinic"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Doctor:</span>
                <span className="font-medium text-slate-700">Dr. Jai Bansal</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Scheduled:</span>
                <span className="font-medium text-slate-700">{dialog.date}</span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                <span className="text-slate-500">Status:</span>
                <StatusPill status={bookingStatusLabel(dialog)} />
              </div>
            </div>

            <div className="appointment-detail-actions [&>.button]:flex-[1_1_auto]">
              {permissions.includes("patients.view") && <button type="button" onClick={() => handleOpenPatientFromBooking(dialog)} className="button button-secondary"><FileText size={14} /> Open patient chart</button>}
              {!['Cancelled', 'Completed', 'No show'].includes(dialog.status) && <button type="button" onClick={() => updateBookingStatus("Cancelled")} className="button button-danger">Cancel visit</button>}
              {!['Cancelled', 'Completed', 'No show'].includes(dialog.status) && <button type="button" onClick={() => updateBookingStatus("No show")} className="button button-secondary">Mark no-show</button>}
              {!['Cancelled', 'Completed', 'No show'].includes(dialog.status) && <button type="button" onClick={() => rescheduleAppointment(dialog)} className="button button-secondary">Reschedule</button>}
              <button type="button" onClick={() => setPrintingSlipBooking(dialog)} className="button button-secondary"><Printer size={14} /> Print slip</button>
            </div>
          </div>
        </Modal>
      )}
      {showAppointmentForm && (
        <Modal
          title={editingAppointmentId ? "Reschedule In-Clinic Appointment" : "Add Physical Clinic Appointment"}
          description="Book an in-person OPD consultation with Dr. Jai Bansal at Room 101."
          submitLabel={editingAppointmentId ? "Save New OPD Slot" : "Confirm Visit & Issue Token"}
          submitDisabled={!appointmentPatientId || !appointmentDate || !appointmentSlot || isSundayDateKey(appointmentDate) || clinicHolidays.includes(appointmentDate) || isSlotBooked(appointmentDate, appointmentSlot) || appointmentSlotStart(appointmentDate, appointmentSlot).getTime() <= currentTime}
          onClose={closeAppointmentForm}
          onSubmit={createAppointment}
        >
          <div className="space-y-3">
            <div className="p-2.5 bg-[#F0F7FF] border border-[#D6E0FC] rounded-lg flex items-center gap-2 text-xs text-[#1A365D]">
              <Stethoscope size={16} className="text-[#0D9488] shrink-0" />
              <div>
                <strong>Chief Surgeon:</strong> Dr. Jai Bansal (Room 101 · Sector 29, Gurugram)
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="field">
                <span>Patient *</span>
                <select value={appointmentPatientId} onChange={(event) => setAppointmentPatientId(event.target.value)}>
                  <option value="">Choose a patient</option>
                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.name} · {patient.id}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>Booking Channel</span>
                <select value={appointmentSource} onChange={(event) => setAppointmentSource(event.target.value as typeof appointmentSource)}>
                  {appointmentSource === "App" && <option>App</option>}
                  <option>Reception</option>
                  <option>Phone</option>
                  <option>WhatsApp</option>
                </select>
              </label>

              <label className="field sm:col-span-2">
                <span>Description / Reason for Visit (Optional)</span>
                <input
                  placeholder="e.g. Scalp examination, hair thinning review, graft assessment"
                  value={appointmentService}
                  onChange={(event) => setAppointmentService(event.target.value)}
                  maxLength={80}
                />
              </label>

              <label className="field">
                <span>Consultation Date *</span>
                <input
                  type="date"
                  min={localDateKey(new Date())}
                  value={appointmentDate}
                  onChange={(event) => setAppointmentDate(event.target.value)}
                />
              </label>

              <label className="field">
                <span>Doctor Sitting Slot *</span>
                <select value={appointmentSlot} onChange={(event) => setAppointmentSlot(event.target.value)}>
                  {clinicSlotGroups.map((group) => <optgroup label={group.label} key={group.label}>
                    {group.slots.map((slot) => {
                      const unavailable = Boolean(appointmentDate) && (isSlotBooked(appointmentDate, slot) || appointmentSlotStart(appointmentDate, slot).getTime() <= currentTime);
                      return <option value={slot} key={slot} disabled={unavailable}>{slot}{isSlotBooked(appointmentDate, slot) ? " · Booked" : unavailable ? " · Passed" : ""}</option>;
                    })}
                  </optgroup>)}
                </select>
              </label>
            </div>

            {appointmentDate && isSundayDateKey(appointmentDate) && (
              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center gap-2">
                <AlertTriangle size={15} className="shrink-0 text-amber-600" />
                <span><strong>Sunday Selected:</strong> Clinic is closed on Sundays (Weekly Off). Please select a slot between Monday and Saturday.</span>
              </div>
            )}

            {appointmentDate && clinicHolidays.includes(appointmentDate) && (
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-300 text-rose-900 text-xs flex items-center gap-2">
                <AlertTriangle size={15} className="shrink-0 text-rose-600" />
                <span><strong>Date closed:</strong> New appointments cannot be added on this date. Reopen it in Manage availability to accept bookings again.</span>
              </div>
            )}
          </div>
        </Modal>
      )}

      {showScheduleModal && (
        <Modal
          title="Manage appointment availability"
          description="Close a date to stop new bookings. Existing appointments stay visible until you reschedule them."
          submitLabel="Done"
          hideCancel
          className="availability-modal"
          onClose={() => setShowScheduleModal(false)}
          onSubmit={() => setShowScheduleModal(false)}
        >
          <div className="availability-content">
            <div className="availability-hours">
              <Clock size={15} />
              <span>Clinic hours: Mon–Sat · 10:00 AM–1:00 PM and 3:30–7:00 PM</span>
              <span className="availability-weekly-off ml-0 sm:ml-auto">Sunday closed</span>
            </div>

            <div className="availability-date-entry grid-cols-1 sm:grid-cols-[minmax(0,1fr)_auto]">
              <label className="field">
                <span>Date to close</span>
                <input
                  type="date"
                  min={localDateKey(new Date())}
                  value={newHolidayDate}
                  onChange={(event) => setNewHolidayDate(event.target.value)}
                />
              </label>
              <button type="button" className="button button-primary col-start-1 row-auto w-full justify-self-start sm:col-start-2 sm:row-start-1 sm:w-auto" disabled={!newHolidayDate || clinicHolidays.includes(newHolidayDate)} onClick={addClinicHoliday}>
                <CalendarDays size={14} /> Close date
              </button>
              {newHolidayDate && <p className={bookings.some((booking) => bookingDateKey(booking) === newHolidayDate && !["Cancelled", "Completed", "No show"].includes(booking.status)) ? "availability-warning" : "availability-hint"}>
                {clinicHolidays.includes(newHolidayDate)
                  ? "Bookings are already closed for this date."
                  : (() => {
                    const count = bookings.filter((booking) => bookingDateKey(booking) === newHolidayDate && !["Cancelled", "Completed", "No show"].includes(booking.status)).length;
                    return count ? `${count} existing appointment${count === 1 ? "" : "s"} will remain. Reschedule them below after closing the date.` : "No existing appointments on this date.";
                  })()}
              </p>}
            </div>

            <div className="availability-list-heading">
              <div><h3>Closed dates</h3><p>Reopen a date to accept appointments again.</p></div>
              <span>{clinicHolidays.length}</span>
            </div>

            {clinicHolidays.length ? <div className="closed-date-list">
              {clinicHolidays.map((closedDate) => {
                const affected = bookings
                  .filter((booking) => bookingDateKey(booking) === closedDate && !["Cancelled", "Completed", "No show"].includes(booking.status))
                  .sort((left, right) => bookingTimestamp(left) - bookingTimestamp(right));
                return <section className="closed-date-card" key={closedDate}>
                  <div className="closed-date-heading flex-col items-start sm:flex-row sm:items-center">
                    <div><strong>{formatDateKey(closedDate)}</strong><span>Closed to new bookings</span></div>
                    <button type="button" className="button button-secondary button-small w-full sm:w-auto" onClick={() => removeClinicHoliday(closedDate)}>Reopen date</button>
                  </div>
                  {affected.length > 0 && <div className="closed-date-appointments">
                    <p>{affected.length} existing appointment{affected.length === 1 ? "" : "s"} to review</p>
                    {affected.map((booking) => <div className="closed-date-appointment flex-col items-start sm:flex-row sm:items-center" key={booking.id}>
                      <span><strong>{booking.customer}</strong><small>{booking.tokenNumber ?? booking.id} · {formatBookingDateTime(booking)}</small></span>
                      <button type="button" className="button button-secondary button-small w-full sm:w-auto" onClick={() => rescheduleAppointment(booking)}>Reschedule</button>
                    </div>)}
                  </div>}
                </section>;
              })}
            </div> : <div className="empty-state">No dates are closed. Choose a date above to stop new bookings.</div>}
          </div>
        </Modal>
      )}

      {/* Printable In-Clinic OPD Consultation Slip */}
      {printingSlipBooking && (
        <Modal
          title={`OPD Consultation Slip · ${printingSlipBooking.tokenNumber ?? "OPD"}`}
          description="Dr. Hair Restoration & Trichology Center · Physical Visit"
          submitLabel="Print Consultation Slip"
          onClose={() => setPrintingSlipBooking(null)}
          onSubmit={() => {
            if (typeof window !== "undefined") window.print();
          }}
        >
          <div className="p-4 bg-white border border-slate-300 rounded-xl space-y-4 text-slate-800">
            {/* Slip Header */}
            <div className="text-center pb-3 border-b-2 border-slate-800">
              <h3 className="font-extrabold text-base tracking-wide text-slate-900">DR. HAIR RESTORATION & TRICHOLOGY CENTER</h3>
              <p className="text-[11px] text-slate-600">Sector 29, Gurugram, Delhi NCR · Tel: +91 98765 43210</p>
              <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full font-bold text-xs text-slate-800">
                <span>OPD TOKEN: {printingSlipBooking.tokenNumber ?? "OPD-01"}</span>
                <span>·</span>
                <span>{printingSlipBooking.room ?? "Room 101 (Chamber A)"}</span>
              </div>
            </div>

            {/* Slip Patient & Doctor Info */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div>
                <span className="text-slate-500 block text-[10px]">PATIENT DETAILS</span>
                <strong className="text-sm text-slate-900 block">{printingSlipBooking.customer}</strong>
                <span className="text-slate-600">ID: {printingSlipBooking.patientId ?? printingSlipBooking.id}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">CONSULTING CHIEF SURGEON</span>
                <strong className="text-sm text-slate-900 block">Dr. Jai Bansal</strong>
                <span className="text-slate-600">MBBS, MD · Reg. MCI-84920</span>
              </div>
            </div>

            {/* Visit Details */}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Service / Reason:</span>
                <span className="font-semibold text-slate-900">{printingSlipBooking.service}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Scheduled Date & Time:</span>
                <span className="font-semibold text-slate-900">{printingSlipBooking.date}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Chamber Venue:</span>
                <span className="font-medium text-slate-700">Room 101 · Dr. Hair Center</span>
              </div>
            </div>

            {/* Clinical Space for In-Person Notes */}
            <div className="pt-2 border-t border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">DOCTOR&apos;S CLINICAL FINDINGS &amp; Rx</span>
              <div className="min-h-[90px] border border-dashed border-slate-300 rounded-lg p-2.5 text-[11px] text-slate-400">
                Trichoscopy follicular density, scalp condition, and prescribed protocol notes written by Dr. Jai Bansal.
              </div>
            </div>
          </div>
        </Modal>
      )}
    </main>
  );
}

function PatientDirectory({
  patients,
  total,
  page,
  pageSize,
  loading,
  error,
  query,
  onQueryChange,
  onPageChange,
  onRetry,
  onOpenPatient,
}: {
  patients: PatientRecord[];
  total: number;
  page: number;
  pageSize: number;
  loading: boolean;
  error: string;
  query: string;
  onQueryChange: (value: string) => void;
  onPageChange: (page: number) => void;
  onRetry: () => void;
  onOpenPatient: (id: string) => void;
}) {
  return <main className="page-wrap mx-auto w-full max-w-[1420px] px-4 py-6 sm:px-6 lg:px-8">
    <PageHeader
      eyebrow="Patient Directory"
      title="Registered users"
      description="Browse patient profiles from the mobile app. Select a patient to open their full profile, submitted assessments, reports, and treatment suggestions."
    />
    <section className="card">
      <div className="card-head"><div><h2 className="card-title">Patient profiles</h2><p className="card-note">Search is debounced and results are paginated by the backend.</p></div></div>
      <TableToolbar value={query} onChange={onQueryChange} placeholder="Search by name, email, or phone..." />
      <div className="table-wrap">
        <table>
          <thead><tr><th>Patient</th><th>Email</th><th>Phone</th><th>Age & location</th><th>Registered</th><th>Photo</th><th /></tr></thead>
          <tbody>
            {loading && patients.length === 0 && <tr><td colSpan={7}><div className="empty-state">Loading patient profiles…</div></td></tr>}
            {!loading && !error && patients.map((patient) => <tr key={patient.id} className="cursor-pointer hover:bg-teal-50/50" onClick={() => onOpenPatient(patient.id)}>
              <td><div className="person"><Avatar initials={patient.initials} /><div><div className="person-name">{patient.name}</div><div className="person-sub">ID {patient.id}</div></div></div></td>
              <td>{patient.email || "—"}</td>
              <td>{patient.phone || "—"}</td>
              <td>{patient.age ?? "—"}{patient.gender ? ` · ${patient.gender}` : ""}{patient.city ? ` · ${patient.city}` : ""}</td>
              <td>{patient.submitted}</td>
              <td>{patient.photoUrl?.startsWith("https://") ? <a className="text-teal-700 underline" href={patient.photoUrl} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()}>Open photo</a> : "—"}</td>
              <td><button className="button button-secondary button-small" onClick={(event) => { event.stopPropagation(); onOpenPatient(patient.id); }}>Open record</button></td>
            </tr>)}
            {!loading && !error && patients.length === 0 && <tr><td colSpan={7}><div className="empty-state">No patient profiles match this search.</div></td></tr>}
            {error && <tr><td colSpan={7}><div className="empty-state"><p role="alert">{error}</p><button className="button button-secondary button-small mt-3" onClick={onRetry}>Try again</button></div></td></tr>}
          </tbody>
        </table>
      </div>
      <div className="table-footer flex items-center justify-between p-3 border-t border-slate-200 text-xs text-slate-500">
        <span>{loading ? "Refreshing…" : `Showing ${patients.length} of ${total} patient profiles · Page ${page} of ${Math.max(1, Math.ceil(total / pageSize))}`}</span>
        <div className="flex gap-2">
          <button className="button button-secondary button-small" disabled={loading || page <= 1} onClick={() => onPageChange(page - 1)}>Previous</button>
          <button className="button button-secondary button-small" disabled={loading || page >= Math.ceil(total / pageSize)} onClick={() => onPageChange(page + 1)}>Next</button>
        </div>
      </div>
    </section>
  </main>;
}

function PatientSummary({ patients, profiles, clinicalAccess }: { patients: PatientRecord[]; profiles: Record<string, typeof patientClinicalProfiles[string]>; clinicalAccess: boolean }) {
  if (!clinicalAccess) return <div className="kpi-grid clinical-metrics grid grid-cols-2 gap-3 lg:grid-cols-4"><ClinicalMetric icon={<UsersRound size={15} />} label="Patient records available for document tasks" value={String(patients.length)} foot="Names and IDs only" tone="blue" /></div>;
  const patientProfiles = patients.map((patient) => profiles[patient.id] ?? createFallbackProfile(patient));
  const activeRegimens = patientProfiles.reduce(
    (sum, profile) => sum + (profile.prescriptionPlan ? 1 : 0),
    0
  );
  const pendingCheckIns = patientProfiles.reduce(
    (sum, profile) => sum + profile.progress.filter((p) => !p.doctorReviewed).length,
    0
  );
  const needsRegimen = patientProfiles.filter((profile) => !profile.prescriptionPlan).length;

  return (
    <div className="kpi-grid clinical-metrics grid grid-cols-2 gap-3 lg:grid-cols-4">
      <ClinicalMetric
        icon={<UsersRound size={15} />}
        label="Total Patients"
        value={String(patients.length)}
        foot="Registered in Dr. Hair"
        tone="blue"
      />
      <ClinicalMetric
        icon={<ClipboardCheck size={15} />}
        label="Needs Regimen"
        value={String(needsRegimen)}
        foot="Patients awaiting a care plan"
        tone="amber"
      />
      <ClinicalMetric
        icon={<Activity size={15} />}
        label="Pending Check-Ins"
        value={String(pendingCheckIns)}
        foot="Monthly photos to review"
        tone="violet"
      />
      <ClinicalMetric
        icon={<Pill size={15} />}
        label="Active Regimens"
        value={String(activeRegimens)}
        foot="Prescriptions syncing to app"
        tone="teal"
      />
    </div>
  );
}

function BookingSummary({ bookings }: { bookings: BookingRecord[] }) {
  const totalBookings = bookings.length;
  const inWaitingRoom = bookings.filter((b) => b.opdStatus === "Arrived").length;
  const inChamber = bookings.filter((b) => b.opdStatus === "In Consultation").length;
  const completed = bookings.filter((b) => b.opdStatus === "Completed" || b.status === "Completed").length;

  return (
    <div className="kpi-grid clinical-metrics grid grid-cols-2 gap-3 lg:grid-cols-4">
      <ClinicalMetric
        icon={<Building2 size={15} />}
        label="Dr. Jai Bansal's OPD Queue"
        value={String(totalBookings)}
        foot="Scheduled physical visits"
        tone="blue"
      />
      <ClinicalMetric
        icon={<UsersRound size={15} />}
        label="In Waiting Room"
        value={String(inWaitingRoom)}
        foot="Arrived at clinic reception"
        tone="amber"
      />
      <ClinicalMetric
        icon={<Stethoscope size={15} />}
        label="In Consultation Chamber"
        value={String(inChamber)}
        foot="Room 101 · Dr. Jai Bansal"
        tone="teal"
      />
      <ClinicalMetric
        icon={<CheckCircle2 size={15} />}
        label="Completed Consultations"
        value={String(completed)}
        foot="Clinical records updated"
        tone="violet"
      />
    </div>
  );
}

function localDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function bookingDateKey(booking: BookingRecord) {
  if (booking.startsAt) {
    const date = new Date(booking.startsAt);
    if (!Number.isNaN(date.valueOf())) return localDateKey(date);
  }
  if (/\btoday\b/i.test(booking.date)) return localDateKey(new Date());
  if (/\btomorrow\b/i.test(booking.date)) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return localDateKey(tomorrow);
  }
  const parsed = new Date(booking.date);
  return Number.isNaN(parsed.valueOf()) ? "" : localDateKey(parsed);
}

function bookingTimestamp(booking: BookingRecord) {
  if (booking.startsAt) {
    const timestamp = new Date(booking.startsAt).valueOf();
    if (!Number.isNaN(timestamp)) return timestamp;
  }
  const dateKey = bookingDateKey(booking);
  if (!dateKey) return 0;
  const date = new Date(`${dateKey}T00:00:00`);
  const time = booking.date.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (time) {
    let hour = Number(time[1]) % 12;
    if (time[3].toUpperCase() === "PM") hour += 12;
    date.setHours(hour, Number(time[2]), 0, 0);
  }
  return date.valueOf();
}

function formatDateKey(value: string) {
  if (!value) return "";
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return value;
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(new Date(year, month - 1, day, 12));
}

function formatBookingDateTime(booking: BookingRecord) {
  const timestamp = bookingTimestamp(booking);
  if (!timestamp) return booking.date;
  const date = new Date(timestamp);
  return `${new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short" }).format(date)} · ${new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit" }).format(date)}`;
}

function bookingStatusLabel(booking: BookingRecord) {
  if (["Cancelled", "Completed", "No show"].includes(booking.status)) return booking.status;
  if (booking.opdStatus === "Arrived") return "Waiting room";
  if (booking.opdStatus === "In Consultation") return "In consultation";
  if (booking.opdStatus === "Requested") return booking.status === "Pending" ? "Needs confirmation" : "Requested";
  return booking.opdStatus ?? booking.status;
}

function bookingStatusTone(booking: BookingRecord) {
  if (booking.status === "Cancelled" || booking.status === "No show") return "closed";
  if (booking.status === "Completed" || booking.opdStatus === "Completed") return "complete";
  if (booking.opdStatus === "Arrived") return "waiting";
  if (booking.opdStatus === "In Consultation") return "consulting";
  if (booking.status === "Pending" || booking.opdStatus === "Requested") return "pending";
  return "confirmed";
}

function appointmentSlotStart(dateKey: string, slot: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const [clock, period] = slot.split(" ");
  const [rawHour, minute] = clock.split(":").map(Number);
  let hour = rawHour % 12;
  if (period === "PM") hour += 12;
  return new Date(year, month - 1, day, hour, minute, 0, 0);
}

function isSundayDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day).getDay() === 0;
}

function nextAppointmentAction(booking: BookingRecord) {
  if (["Completed", "Cancelled", "No show"].includes(booking.status) || booking.opdStatus === "Completed" || booking.opdStatus === "No show") return null;
  if (booking.status === "Pending" && booking.opdStatus === "Requested") return { label: "Confirm visit", status: "Confirmed" as const };
  if (booking.opdStatus === "Arrived") return { label: "Call to chamber", status: "In Consultation" as const };
  if (booking.opdStatus === "In Consultation") return { label: "Complete visit", status: "Completed" as const };
  return { label: "Mark arrived", status: "Arrived" as const };
}

function AppointmentList({ bookings, onOpen, onAdvance }: {
  bookings: BookingRecord[];
  onOpen: (booking: BookingRecord) => void;
  onAdvance: (booking: BookingRecord) => void;
}) {
  if (bookings.length === 0) return <div className="empty-state py-8 text-center">No appointments match this date and filter.</div>;

  return <div className="appointment-list">
    {bookings.map((booking) => {
      const primaryAction = nextAppointmentAction(booking);

      return <article className="appointment-card grid-cols-1 min-[461px]:grid-cols-2 min-[761px]:grid-cols-[minmax(0,1fr)_minmax(150px,.8fr)_auto] min-[1101px]:grid-cols-[minmax(180px,1.05fr)_minmax(185px,1.25fr)_minmax(145px,.85fr)_minmax(115px,.6fr)_auto]" key={booking.id}>
        <div className="appointment-card-patient min-[461px]:col-span-2 min-[761px]:col-span-1 min-[761px]:col-start-1 min-[761px]:row-start-1 min-[1101px]:col-auto min-[1101px]:row-auto">
          <span className="appointment-token">{booking.tokenNumber ?? "OPD"}</span>
          <Avatar initials={booking.customer.split(/\s+/).map((part) => part[0]).join("")} />
          <div className="appointment-patient-copy">
            <strong>{booking.customer}</strong>
            <span>{booking.id}</span>
          </div>
        </div>
        <div className="appointment-card-service min-[461px]:col-span-2 min-[761px]:col-span-1 min-[761px]:col-start-2 min-[761px]:row-start-1 min-[1101px]:col-auto min-[1101px]:row-auto">
          <strong>{booking.service}</strong>
          <span><Building2 size={12} />{booking.room ?? "Room 101"} · {booking.doctorName ?? "Dr. Jai Bansal"}</span>
        </div>
        <div className="appointment-card-time min-[461px]:col-start-1 min-[761px]:row-start-2 min-[1101px]:col-auto min-[1101px]:row-auto">
          <strong>{formatBookingDateTime(booking)}</strong>
          <span>{booking.source ?? "Clinic"} booking</span>
        </div>
        <div className="appointment-card-status min-[461px]:col-start-2 min-[461px]:justify-self-end min-[761px]:row-start-2 min-[1101px]:col-auto min-[1101px]:row-auto min-[1101px]:justify-self-stretch">
          <span className={`booking-status-chip ${bookingStatusTone(booking)}`}>{bookingStatusLabel(booking)}</span>
        </div>
        <div className="appointment-card-actions flex-wrap justify-start border-t border-slate-100 pt-2 min-[461px]:col-span-2 min-[461px]:[&>.button]:flex-1 min-[761px]:col-span-1 min-[761px]:col-start-3 min-[761px]:row-span-2 min-[761px]:row-start-1 min-[761px]:flex-col min-[761px]:justify-center min-[761px]:border-t-0 min-[761px]:pt-0 min-[1101px]:col-auto min-[1101px]:row-auto min-[1101px]:flex-row min-[1101px]:justify-end min-[1101px]:[&>.button]:flex-none">
          {primaryAction && <button type="button" className="button button-primary button-small" onClick={() => onAdvance(booking)}>{primaryAction.label}</button>}
          <button type="button" className="button button-secondary button-small" onClick={() => onOpen(booking)}>Details</button>
        </div>
      </article>;
    })}
  </div>;
}

function ClinicalMetric({
  icon,
  label,
  value,
  foot,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  foot: string;
  tone: "blue" | "teal" | "amber" | "violet";
}) {
  const tones = {
    blue: "text-[#1A365D] bg-[#F0F7FF] border-[#D6E0FC]",
    teal: "text-[#0D9488] bg-[#F0FDFA] border-[#CCFBF1]",
    amber: "text-[#B45309] bg-[#FFFBEB] border-[#FEF3C7]",
    violet: "text-[#1A365D] bg-[#F0F7FF] border-[#B4BFCD]",
  };

  return (
    <article className="card min-w-0 p-3 border border-slate-200 rounded-[22px] bg-white shadow-sm flex flex-col justify-between">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-slate-500 font-medium">{label}</span>
        <span className={`p-1.5 rounded-lg border ${tones[tone]}`}>{icon}</span>
      </div>
      <div className="text-xl font-bold text-slate-800">{value}</div>
      <div className="text-[10px] text-slate-400 mt-1">{foot}</div>
    </article>
  );
}
