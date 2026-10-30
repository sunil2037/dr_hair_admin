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
  Trash2,
  UserCheck,
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

export function OperationsPage({
  kind,
  globalSearch,
  onToast,
  permissions = [],
  onAudit = () => {},
}: {
  kind: "patients" | "orders" | "bookings";
  globalSearch: string;
  onToast: (message: string) => void;
  permissions?: AdminPermissionId[];
  onAudit?: (action: string, target: string) => void;
}) {
  if (kind === "orders") return <OrdersPage globalSearch={globalSearch} onToast={onToast} onAudit={onAudit} canExport={permissions.includes("commerce.export")} />;
  return <CareOperationsPage kind={kind} globalSearch={globalSearch} onToast={onToast} permissions={permissions} onAudit={onAudit} />;
}

function CareOperationsPage({
  kind,
  globalSearch,
  onToast,
  permissions,
  onAudit,
}: {
  kind: CareOperationsKind;
  globalSearch: string;
  onToast: (message: string) => void;
  permissions: AdminPermissionId[];
  onAudit: (action: string, target: string) => void;
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
  const [visitTypeFilter] = useState<"All" | "Physical" | "Phone">("All");
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
      onToast("This date is already listed as an official clinic holiday.");
      return;
    }
    setClinicHolidays((current) => [...current, newHolidayDate].sort());
    onAudit("added clinic holiday", newHolidayDate);
    onToast(`Clinic holiday added: ${newHolidayDate}`);
    setNewHolidayDate("");
  };

  const removeClinicHoliday = (date: string) => {
    setClinicHolidays((current) => current.filter((d) => d !== date));
    onAudit("removed clinic holiday", date);
    onToast(`Clinic holiday removed: ${date}`);
  };

  const updateOpdStatus = (bookingId: string, nextOpdStatus: NonNullable<BookingRecord["opdStatus"]>) => {
    setBookings((current) =>
      current.map((item) => {
        if (item.id !== bookingId) return item;
        const mainStatus = nextOpdStatus === "Completed" ? "Completed" : nextOpdStatus === "No show" ? "No show" : "Active";
        return { ...item, opdStatus: nextOpdStatus, status: mainStatus };
      })
    );
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
    return bookings.filter(
      (item) => {
        const matchesSearch = `${item.customer} ${item.service} ${item.id} ${item.tokenNumber ?? ""} ${item.source ?? ""}`.toLowerCase().includes(search);
        const matchesStatus = statusFilter === "All status" || item.status === statusFilter || item.opdStatus === statusFilter;
        const matchesType = visitTypeFilter === "All" || (visitTypeFilter === "Physical" ? item.type !== "Video Consultation" : item.source === "Phone" || item.source === "WhatsApp");
        return matchesSearch && matchesStatus && matchesType;
      }
    );
  }, [bookings, search, statusFilter, visitTypeFilter]);

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

    const day = new Date(appointmentDate);
    if (day.getDay() === 0) {
      onToast("Sundays are clinic weekly off. Please select Mon–Sat.");
      return;
    }
    if (clinicHolidays.includes(appointmentDate)) {
      onToast("Selected date is marked as an official clinic holiday.");
      return;
    }

    const [time, period] = appointmentSlot.split(" ");
    const [rawH, m] = time.split(":").map(Number);
    let h = rawH;
    if (period === "PM" && h !== 12) h += 12;
    if (period === "AM" && h === 12) h = 0;
    const start = new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, m);

    if (start.getTime() <= Date.now()) {
      onToast("Selected sitting slot has already passed.");
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
    setAppointmentService("");
  };

  const rescheduleAppointment = (appointment: BookingRecord) => {
    setEditingAppointmentId(appointment.id);
    setAppointmentPatientId(appointment.patientId ?? "");
    setAppointmentService(appointment.service);
    if (appointment.startsAt) {
      const d = new Date(appointment.startsAt);
      setAppointmentDate(d.toISOString().slice(0, 10));
      const hours = d.getHours();
      const mins = d.getMinutes();
      const period = hours >= 12 ? "PM" : "AM";
      const displayHours = hours % 12 || 12;
      const formattedSlot = `${displayHours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")} ${period}`;
      setAppointmentSlot(formattedSlot);
    }
    setAppointmentSource(appointment.source ?? "Phone");
    setDialog(null);
    setShowAppointmentForm(true);
  };

  return (
    <main className="page-wrap mx-auto w-full max-w-[1420px] px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow={config.eyebrow}
        title={config.title}
        description={config.desc}
        action={!isPatient ? (
          <div className="flex items-center gap-2">
            <button className="button button-secondary" onClick={() => setShowScheduleModal(true)}>
              <CalendarDays size={14} />
              Sitting Hours & Holidays
            </button>
            <button className="button button-primary" onClick={() => setShowAppointmentForm(true)}>
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

      <div className="notice operations-notice">
        <Eye size={14} />
        <span>
          {isPatient
            ? "Private patient workspace for Dr. Jai Bansal. Changes and report notices stay in this browser preview until secure APIs are connected."
            : "Physical visits with Dr. Jai Bansal. App requests appear here after synchronization is connected; the App row shown now is sample data."}
        </span>
      </div>

      {isPatient ? <PatientSummary patients={patients} profiles={profiles} clinicalAccess={canViewClinicalPatients} /> : <BookingSummary bookings={bookings} />}

      <section className="card operations-table-card mt-4">
        <div className="section-row flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="card-title">{isPatient ? "Patient Triage & Clinical Charts" : "Visit schedule"}</h2>
            <p className="card-note">
              {isPatient
                ? "Click any patient row to open their clinical chart, inspect scalp photos, or prescribe regimens"
                : "App requests and appointments arranged directly with the clinic"}
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
        </div>

        <TableToolbar
          value={query}
          onChange={setQuery}
          placeholder={
            isPatient
              ? canViewClinicalPatients ? "Search by patient name, email, ID, or diagnosis..." : "Find a patient by name or ID..."
              : "Search patient, visit reason, or appointment ID..."
          }
          right={
            <>
              {(canViewClinicalPatients || !isPatient) && <select
                className="period-select"
                aria-label="Filter by status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option>All status</option>
                {(isPatient ? ["Review", "Pending", "Completed"] : ["Pending", "Active", "Completed", "Cancelled", "No show"]).map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>}
              <button
                className="filter-button"
                onClick={() => {
                  setQuery("");
                  setStatusFilter("All status");
                  setTriageFilter("all");
                }}
              >
                <Filter size={13} />
                Reset
              </button>
            </>
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
            <table>
              <thead>
                <tr>
                  <th>OPD Token & Patient</th>
                  <th>Visit Service & Chamber</th>
                  <th>Scheduled Slot</th>
                  <th>Source</th>
                  <th>OPD Live Status</th>
                  <th>Chamber Actions</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td>
                      <div className="flex items-center gap-2.5">
                        <span className="px-2 py-0.5 font-mono text-[11px] font-bold rounded bg-slate-100 text-slate-800 border border-slate-300">
                          {item.tokenNumber ?? "OPD"}
                        </span>
                        <div className="person">
                          <Avatar initials={item.customer.split(" ").map((part) => part[0]).join("")} />
                          <div>
                            <div className="person-name font-semibold">{item.customer}</div>
                            <div className="person-sub text-[10px] text-slate-500">{item.id}</div>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="font-semibold text-slate-800 text-xs">{item.service}</div>
                      <div className="text-[11px] text-teal-700 flex items-center gap-1 mt-0.5 font-medium">
                        <Building2 size={12} /> {item.room ?? "Room 101"} · Dr. Jai Bansal
                      </div>
                    </td>
                    <td>
                      <span className="text-xs font-medium text-slate-700">{item.date}</span>
                    </td>
                    <td>
                      <span className="text-[11px] text-slate-500 font-medium">{item.source ?? "Clinic"}</span>
                    </td>
                    <td>
                      {item.opdStatus === "Arrived" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                          <UsersRound size={11} /> Waiting Room
                        </span>
                      ) : item.opdStatus === "In Consultation" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                          <Stethoscope size={11} /> In Chamber (Dr. Bansal)
                        </span>
                      ) : item.opdStatus === "Completed" || item.status === "Completed" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 size={11} /> Completed
                        </span>
                      ) : (
                        <StatusPill status={item.status} />
                      )}
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {item.opdStatus !== "Arrived" && item.opdStatus !== "In Consultation" && item.opdStatus !== "Completed" && item.status !== "Completed" && (
                          <button
                            onClick={() => updateOpdStatus(item.id, "Arrived")}
                            className="text-[11px] px-2 py-1 bg-amber-50 text-amber-800 hover:bg-amber-100 rounded border border-amber-200 font-semibold flex items-center gap-1"
                            title="Mark patient present at clinic reception"
                          >
                            <UserCheck size={12} />
                            Mark Arrived
                          </button>
                        )}

                        {item.opdStatus === "Arrived" && (
                          <button
                            onClick={() => updateOpdStatus(item.id, "In Consultation")}
                            className="text-[11px] px-2.5 py-1 bg-teal-600 text-white hover:bg-teal-700 rounded font-bold flex items-center gap-1 shadow-sm"
                            title="Call patient into Dr. Jai Bansal's consultation chamber"
                          >
                            <Stethoscope size={12} />
                            Call to Chamber
                          </button>
                        )}

                        {item.opdStatus === "In Consultation" && (
                          <button
                            onClick={() => updateOpdStatus(item.id, "Completed")}
                            className="text-[11px] px-2 py-1 bg-emerald-600 text-white hover:bg-emerald-700 rounded font-semibold flex items-center gap-1 shadow-sm"
                            title="Complete in-person consultation"
                          >
                            <CheckCircle2 size={12} />
                            Complete
                          </button>
                        )}

                        {permissions.includes("patients.view") && (
                          <button
                            onClick={() => handleOpenPatientFromBooking(item)}
                            className="text-[11px] px-2 py-1 bg-[#F0F7FF] text-[#1A365D] hover:bg-[#D6E0FC] rounded border border-[#D6E0FC] font-medium flex items-center gap-1"
                            title="Open patient EMR and chart"
                          >
                            <FileText size={12} />
                            Chart
                          </button>
                        )}

                        <button
                          onClick={() => setPrintingSlipBooking(item)}
                          className="text-[11px] px-2 py-1 bg-slate-50 text-slate-700 hover:bg-slate-100 rounded border border-slate-200 font-medium flex items-center gap-1"
                          title="Print OPD Consultation Slip"
                        >
                          <Printer size={12} />
                          Slip
                        </button>
                      </div>
                    </td>
                    <td>
                      <button
                        className="row-action"
                        aria-label={`View ${item.id}`}
                        onClick={() => setDialog(item)}
                      >
                        <ArrowRight size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredBookings.length === 0 && (
                  <tr>
                    <td colSpan={7}>
                      <div className="empty-state py-8 text-center text-slate-400 text-xs">
                        No clinic appointments match this search.
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        <div className="table-footer flex items-center justify-between p-3 border-t border-slate-200 text-xs text-slate-500">
          <span>
            {isPatient
              ? `Showing ${filteredPatients.length} of ${patients.length} patient records`
              : `${filteredBookings.length} clinic appointments`}
          </span>
          <span>Trichology EMR Portal</span>
        </div>
      </section>

      {/* Staff-managed clinic appointment */}
      {dialog && (
        <Modal
          title={`Clinic appointment · ${dialog.id}`}
          description={`${dialog.customer} · ${dialog.service}`}
          submitLabel="Mark Completed"
          submitDisabled={["Cancelled", "Completed", "No show"].includes(dialog.status)}
          onClose={() => setDialog(null)}
          onSubmit={() => updateBookingStatus("Completed")}
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
                <StatusPill status={dialog.status} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              {permissions.includes("patients.view") && <button
                type="button"
                onClick={() => handleOpenPatientFromBooking(dialog)}
                className="p-2.5 rounded-lg border border-teal-300 bg-teal-50 text-teal-800 hover:bg-teal-100 font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <FileText size={14} />
                Open Medical Chart
              </button>}
              {dialog.status === "Pending" && <button type="button" onClick={() => updateBookingStatus("Active")} className="button button-secondary">Confirm visit</button>}
              {dialog.status !== "Cancelled" && dialog.status !== "Completed" && <button type="button" onClick={() => updateBookingStatus("Cancelled")} className="button button-secondary">Cancel visit</button>}
              {!["Cancelled", "Completed", "No show"].includes(dialog.status) && <button type="button" onClick={() => updateBookingStatus("No show")} className="button button-secondary">Mark no show</button>}
              {!["Cancelled", "Completed", "No show"].includes(dialog.status) && <button type="button" onClick={() => rescheduleAppointment(dialog)} className="button button-secondary">Reschedule</button>}
            </div>
          </div>
        </Modal>
      )}
      {showAppointmentForm && (
        <Modal
          title={editingAppointmentId ? "Reschedule In-Clinic Appointment" : "Add Physical Clinic Appointment"}
          description="Book an in-person OPD consultation with Dr. Jai Bansal at Room 101."
          submitLabel={editingAppointmentId ? "Save New OPD Slot" : "Confirm Visit & Issue Token"}
          onClose={() => {
            setShowAppointmentForm(false);
            setEditingAppointmentId(null);
          }}
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
                  min={new Date().toISOString().slice(0, 10)}
                  value={appointmentDate}
                  onChange={(event) => setAppointmentDate(event.target.value)}
                />
              </label>

              <label className="field">
                <span>Doctor Sitting Slot *</span>
                <select value={appointmentSlot} onChange={(event) => setAppointmentSlot(event.target.value)}>
                  <optgroup label="Morning Session (10:00 AM – 01:00 PM)">
                    <option value="10:00 AM">10:00 AM</option>
                    <option value="10:30 AM">10:30 AM</option>
                    <option value="11:00 AM">11:00 AM</option>
                    <option value="11:30 AM">11:30 AM</option>
                    <option value="12:00 PM">12:00 PM</option>
                    <option value="12:30 PM">12:30 PM</option>
                  </optgroup>
                  <optgroup label="Evening Session (03:30 PM – 07:00 PM)">
                    <option value="03:30 PM">03:30 PM</option>
                    <option value="04:00 PM">04:00 PM</option>
                    <option value="04:30 PM">04:30 PM</option>
                    <option value="05:00 PM">05:00 PM</option>
                    <option value="05:30 PM">05:30 PM</option>
                    <option value="06:00 PM">06:00 PM</option>
                    <option value="06:30 PM">06:30 PM</option>
                  </optgroup>
                </select>
              </label>
            </div>

            {appointmentDate && new Date(appointmentDate).getDay() === 0 && (
              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center gap-2">
                <AlertTriangle size={15} className="shrink-0 text-amber-600" />
                <span><strong>Sunday Selected:</strong> Clinic is closed on Sundays (Weekly Off). Please select a slot between Monday and Saturday.</span>
              </div>
            )}

            {appointmentDate && clinicHolidays.includes(appointmentDate) && (
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-300 text-rose-900 text-xs flex items-center gap-2">
                <AlertTriangle size={15} className="shrink-0 text-rose-600" />
                <span><strong>Clinic Holiday:</strong> This date is marked as an official clinic holiday. Consultations will not be scheduled on this day.</span>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Doctor Jai Bansal Sitting Hours & Clinic Holidays Modal */}
      {showScheduleModal && (
        <Modal
          title="Dr. Jai Bansal's Clinic Sitting Schedule & Holidays"
          description="Manage chamber timings, weekly off, and clinic holiday calendar."
          submitLabel="Done"
          onClose={() => setShowScheduleModal(false)}
          onSubmit={() => setShowScheduleModal(false)}
        >
          <div className="space-y-4 text-xs">
            {/* Sitting Hours Card */}
            <div className="p-3 bg-[#F0F7FF] border border-[#D6E0FC] rounded-xl space-y-2">
              <div className="flex items-center gap-2 font-bold text-[#1A365D] text-sm">
                <Clock size={16} className="text-[#0D9488]" />
                <span>Official Consultation Hours · Room 101 (Sector 29)</span>
              </div>
              <p className="text-slate-600">
                Dr. Jai Bansal conducts physical trichology and hair graft consultations exclusively in two daily batches:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
                  <span className="font-semibold text-teal-800 block text-[11px]">🌅 MORNING SITTING</span>
                  <span className="text-[#1A365D] font-bold text-sm">10:00 AM – 01:00 PM</span>
                  <span className="text-slate-500 block text-[10px] mt-0.5">Monday to Saturday · 6 slots (30 min)</span>
                </div>
                <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
                  <span className="font-semibold text-teal-800 block text-[11px]">🌇 EVENING SITTING</span>
                  <span className="text-[#1A365D] font-bold text-sm">03:30 PM – 07:00 PM</span>
                  <span className="text-slate-500 block text-[10px] mt-0.5">Monday to Saturday · 7 slots (30 min)</span>
                </div>
              </div>
              <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 font-medium">
                🛑 <strong>Weekly Off:</strong> Sundays are strictly closed for routine physical consultations.
              </div>
            </div>

            {/* Clinic Holidays Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  <CalendarDays size={15} className="text-[#1A365D]" />
                  <span>Official Clinic Holidays & Blocked Dates</span>
                </h4>
                <span className="text-slate-500 text-[11px]">{clinicHolidays.length} dates configured</span>
              </div>

              {/* Add New Holiday input */}
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  min={new Date().toISOString().slice(0, 10)}
                  value={newHolidayDate}
                  onChange={(e) => setNewHolidayDate(e.target.value)}
                  className="text-xs p-2 border border-slate-300 rounded-lg flex-1"
                />
                <button
                  type="button"
                  onClick={addClinicHoliday}
                  className="px-3 py-2 bg-[#1A365D] hover:bg-[#152a48] text-white font-medium rounded-lg text-xs flex items-center gap-1 transition-colors"
                >
                  <Plus size={13} />
                  Add Holiday
                </button>
              </div>

              {/* List of holidays */}
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {clinicHolidays.map((holiday) => (
                  <div
                    key={holiday}
                    className="flex items-center justify-between p-2 bg-white border border-slate-200 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800">
                        {new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" }).format(new Date(holiday))}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 font-bold">
                        Clinic Closed
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeClinicHoliday(holiday)}
                      className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                      title="Remove holiday"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
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
    <article className="card p-3 border border-slate-200 rounded-xl bg-white shadow-sm flex flex-col justify-between">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-slate-500 font-medium">{label}</span>
        <span className={`p-1.5 rounded-lg border ${tones[tone]}`}>{icon}</span>
      </div>
      <div className="text-xl font-bold text-slate-800">{value}</div>
      <div className="text-[10px] text-slate-400 mt-1">{foot}</div>
    </article>
  );
}
