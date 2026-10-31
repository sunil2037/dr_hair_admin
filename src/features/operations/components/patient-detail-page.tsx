"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Activity, CalendarDays, ChevronDown, ClipboardList, Copy, Download, Eye, EyeOff, FileCheck2, FileText, History, LoaderCircle, LockKeyhole, Mail, Pencil, Phone, Pill, Plus, RotateCcw, Search, Share2, ShieldCheck, Trash2, UploadCloud, UserRound, X } from "lucide-react";
import type { Role } from "../../shared/types";
import { Modal } from "../../shared/components/ui";
import { CareArtwork, ImageChoice, careProductOptions, dietOptions, routineOptions } from "./patient-care-options";
import { FullSizeImageViewer, type ViewerImage } from "../../shared/components/full-size-image-viewer";

type Patient = { id: number | string; patient_code?: string; name: string; email?: string; phone?: string; age?: number | null; gender?: string | null; city?: string | null; occupation?: string | null; profile_url?: string | null; platform?: string; created_at?: string; updated_at?: string };
type Assessment = Record<string, unknown> & { id: string | number; reference_no?: string; created_at?: string; scalp_photos?: { file_name?: string; url?: string }[] };
type Medication = { catalog_id?: string; name: string; category?: string; form?: string; dose: string; frequency: string; duration?: string; instructions?: string };
type RoutineStep = { title: string; subtitle?: string; category?: string; time_of_day?: string };
type DietMeal = { type: string; name: string; nutrients?: string; benefit?: string };
type Treatment = { id: string | number; reference_no?: string; treatment_name: string; duration?: string; instructions?: string; doctor_name?: string; diagnosis?: string; stage?: string; next_review_date?: string; medications?: Medication[]; routine_steps?: RoutineStep[]; diet_meals?: DietMeal[]; date?: string };
type Report = { id: string; title: string; file_name: string; mime_type: string; format: string; bytes: number; uploaded_by?: string; visibility?: "Private" | "Shared"; shared_at?: string | null; deleted_at?: string | null; purge_after?: string | null; visibility_history?: { action?: "uploaded" | "shared" | "hidden" | "archived" | "restored"; visibility: "Private" | "Shared"; changed_by?: string; changed_at?: string | null; patient_consent_confirmed?: boolean }[]; created_at: string };
type PatientActivity = { id: string; type: string; title: string; summary?: string; actor?: string; occurred_at: string };
type PatientAppointment = { id: string; starts_at: string; reason?: string; status: string; opd_token?: string };
type ProgressCheckIn = { id: string; date: string; scalp_region?: string; shedding_level?: string; notes?: string; density_rating?: number; is_doctor_reviewed?: boolean; doctor_note?: string; photos?: { angle?: string; url?: string; file_name?: string; mime_type?: string; bytes?: number }[] };
type PatientDetails = { patient: Patient; assessments: Assessment[]; treatments: Treatment[]; reports: Report[]; appointments: PatientAppointment[]; activity: PatientActivity[]; progressCheckIns: ProgressCheckIn[] };

const profileFields = [
  { key: "name", label: "Full name", type: "text" },
  { key: "age", label: "Age", type: "number" },
  { key: "gender", label: "Gender", type: "text" },
  { key: "city", label: "City", type: "text" },
  { key: "occupation", label: "Occupation", type: "text" },
] as const;

const assessmentFields: { key: string; label: string }[] = [
  { key: "hair_fall_start", label: "Hair fall started" }, { key: "hair_fall_pattern", label: "Pattern noticed" },
  { key: "duration", label: "Hair loss duration" },
  { key: "daily_hair_fall", label: "Daily hair fall" }, { key: "hair_fall_increasing", label: "Increasing recently" },
  { key: "dandruff", label: "Dandruff" }, { key: "scalp_condition", label: "Scalp condition" },
  { key: "scalp_symptoms", label: "Scalp symptoms" }, { key: "hair_type", label: "Hair type" },
  { key: "medical_conditions", label: "Medical conditions" }, { key: "recent_events", label: "Recent events" },
  { key: "allergy_status", label: "Allergy status" }, { key: "allergy_details", label: "Known allergies" },
  { key: "current_medications_status", label: "Current medicines status" }, { key: "current_medications", label: "Current medicines & supplements" },
  { key: "stress_level", label: "Stress level" }, { key: "gut_health", label: "Gut health" }, { key: "sleep_quality", label: "Sleep" },
  { key: "diet_type", label: "Diet" }, { key: "protein_intake", label: "Protein intake" },
  { key: "family_history", label: "Family history" }, { key: "have_taken_treatment", label: "Prior treatment" },
  { key: "previous_treatments", label: "Previous treatments" }, { key: "treatment_results", label: "Previous results" },
  { key: "main_concern", label: "Main concern" }, { key: "looking_for", label: "Looking for" },
  { key: "hair_loss_stage", label: "Hair loss stage" },
];

function messageFrom(result: unknown, fallback: string) {
  return result && typeof result === "object" && "message" in result && typeof result.message === "string" ? result.message : fallback;
}
function displayValue(value: unknown) {
  if (Array.isArray(value)) return value.map((item) => String(item)).join(", ") || "Not provided";
  if (typeof value === "string" && value.trim()) return value;
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return "Not provided";
}
function hasValue(value: unknown) { return value !== null && value !== undefined && value !== "" && (!Array.isArray(value) || value.length > 0); }
function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(date);
}
function isRecord(value: unknown): value is Record<string, unknown> { return Boolean(value && typeof value === "object"); }

export function PatientDetailPage({ patientId, role, onToast, onAudit }: { patientId: string; role: Role; onToast: (message: string) => void; onAudit: (action: string, target: string) => void }) {
  const [details, setDetails] = useState<PatientDetails | null>(null);
  const [pageNow, setPageNow] = useState<number | null>(null);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");
  const [profile, setProfile] = useState<Partial<Patient>>({});
  const [editOpen, setEditOpen] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState("");
  const [viewedAssessmentId, setViewedAssessmentId] = useState("");
  const [treatmentOpen, setTreatmentOpen] = useState(false);
  const [routineOpen, setRoutineOpen] = useState(false);
  const [dietOpen, setDietOpen] = useState(false);
  const [medicineSearch, setMedicineSearch] = useState("");
  const [routineSearch, setRoutineSearch] = useState("");
  const [dietSearch, setDietSearch] = useState("");
  const [treatmentInstructions, setTreatmentInstructions] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [nextReviewDate, setNextReviewDate] = useState("");
  const [safetyReviewed, setSafetyReviewed] = useState(false);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [selectedRoutineIds, setSelectedRoutineIds] = useState<string[]>([]);
  const [customRoutineSteps, setCustomRoutineSteps] = useState<RoutineStep[]>([]);
  const [selectedDietIds, setSelectedDietIds] = useState<string[]>([]);
  const [customDietMeals, setCustomDietMeals] = useState<DietMeal[]>([]);
  const [savingCare, setSavingCare] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportTitle, setReportTitle] = useState("");
  const [reportFile, setReportFile] = useState<File | null>(null);
  const [uploadingReport, setUploadingReport] = useState(false);
  const [downloadingReport, setDownloadingReport] = useState<string | null>(null);
  const [updatingReportVisibility, setUpdatingReportVisibility] = useState<string | null>(null);
  const [deletingReport, setDeletingReport] = useState<string | null>(null);
  const [reportToDelete, setReportToDelete] = useState<Report | null>(null);
  const [reportToConfirmVisibility, setReportToConfirmVisibility] = useState<Report | null>(null);
  const [patientConsentConfirmed, setPatientConsentConfirmed] = useState(false);
  const [archivedReports, setArchivedReports] = useState<Report[]>([]);
  const [restoringReport, setRestoringReport] = useState<string | null>(null);
  const [reportPreview, setReportPreview] = useState<{ report: Report; url: string } | null>(null);
  const [imageToView, setImageToView] = useState<ViewerImage | null>(null);
  const [previewingReport, setPreviewingReport] = useState<string | null>(null);
  const [photoToDelete, setPhotoToDelete] = useState<{ assessmentId: string; photoIndex: number; fileName: string } | null>(null);
  const [deletingScalpPhoto, setDeletingScalpPhoto] = useState<string | null>(null);
  const canWrite = role === "super-admin";

  const loadPatient = useCallback(async (signal?: AbortSignal) => {
    setLoadState("loading");
    setError("");
    try {
      const response = await fetch(`/api/admin/users/${encodeURIComponent(patientId)}`, { cache: "no-store", signal });
      const result: unknown = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(messageFrom(result, "Patient details could not be loaded."));
      const data = isRecord(result) && isRecord(result.data) ? result.data : null;
      if (!data || !isRecord(data.patient)) throw new Error("The patient record is incomplete.");
      const next: PatientDetails = {
        patient: data.patient as Patient,
        assessments: Array.isArray(data.assessments) ? [...data.assessments as Assessment[]].sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()) : [],
        treatments: Array.isArray(data.treatments) ? data.treatments as Treatment[] : [],
        reports: Array.isArray(data.reports) ? data.reports as Report[] : [],
        appointments: Array.isArray(data.appointments) ? data.appointments as PatientAppointment[] : [],
        activity: Array.isArray(data.activity) ? data.activity as PatientActivity[] : [],
        progressCheckIns: Array.isArray(data.progress_checkins) ? data.progress_checkins as ProgressCheckIn[] : [],
      };
      setDetails(next);
      setArchivedReports(Array.isArray(data.archived_reports) ? data.archived_reports as Report[] : []);
      setProfile(next.patient);
      setSelectedAssessment((current) => current || String(next.assessments[0]?.reference_no ?? ""));
      setViewedAssessmentId((current) => current || String(next.assessments[0]?.id ?? ""));
      setLoadState("ready");
    } catch (cause) {
      if (signal?.aborted) return;
      setError(cause instanceof Error ? cause.message : "Patient details could not be loaded.");
      setLoadState("error");
    }
  }, [patientId]);

  useEffect(() => {
    const timer = window.setTimeout(() => setPageNow(Date.now()), 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => { void loadPatient(controller.signal); }, 0);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [loadPatient]);

  const saveProfile = async () => {
    if (!canWrite || !details) return;
    if (!String(profile.name ?? "").trim()) {
      onToast("Patient name is required.");
      return;
    }
    setSavingProfile(true);
    try {
      const body = { name: String(profile.name).trim(), age: profile.age == null ? null : Number(profile.age), gender: profile.gender || null, city: profile.city || null, occupation: profile.occupation || null };
      const response = await fetch(`/api/admin/users/${encodeURIComponent(patientId)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), cache: "no-store" });
      const result: unknown = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(messageFrom(result, "Patient profile could not be saved."));
      const updated = isRecord(result) && isRecord(result.data) ? result.data as unknown as Partial<Patient> : body;
      setDetails((current) => current ? { ...current, patient: { ...current.patient, ...updated } } : current);
      setProfile((current) => ({ ...current, ...updated }));
      setEditOpen(false);
      onAudit("updated patient profile", `Patient ${patientId}`);
      onToast("Patient profile updated.");
    } catch (cause) {
      onToast(cause instanceof Error ? cause.message : "Patient profile could not be saved.");
    } finally { setSavingProfile(false); }
  };

  const openTreatmentBuilder = () => {
    setMedicineSearch("");
    setMedications([]);
    setTreatmentInstructions("");
    setDoctorName("");
    setNextReviewDate("");
    setSafetyReviewed(false);
    setTreatmentOpen(true);
  };

  const openRoutineBuilder = () => {
    setRoutineSearch("");
    setSelectedRoutineIds([]);
    setCustomRoutineSteps([]);
    setRoutineOpen(true);
  };

  const openDietBuilder = () => {
    setDietSearch("");
    setSelectedDietIds([]);
    setCustomDietMeals([]);
    setDietOpen(true);
  };

  const saveCareSuggestion = async (kind: "medicine" | "routine" | "diet", payload: Partial<Pick<Treatment, "treatment_name" | "duration" | "instructions" | "doctor_name" | "next_review_date" | "medications" | "routine_steps" | "diet_meals">>) => {
    if (!canWrite || !selectedAssessment) {
      onToast("Select a patient assessment before adding a suggestion.");
      return;
    }
    setSavingCare(true);
    try {
      const response = await fetch("/api/admin/treatments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reference_no: selectedAssessment, treatment_name: payload.treatment_name, duration: payload.duration || "", instructions: payload.instructions || "", doctor_name: payload.doctor_name || "", next_review_date: payload.next_review_date || "", medications: payload.medications || [], routine_steps: payload.routine_steps || [], diet_meals: payload.diet_meals || [] }), cache: "no-store" });
      const result: unknown = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(messageFrom(result, "Suggestion could not be saved."));
      const data = isRecord(result) && isRecord(result.data) ? result.data : null;
      if (data) setDetails((current) => current ? { ...current, treatments: [data as unknown as Treatment, ...current.treatments] } : current);
      if (kind === "medicine") setTreatmentOpen(false);
      if (kind === "routine") setRoutineOpen(false);
      if (kind === "diet") setDietOpen(false);
      const action = kind === "medicine" ? "added medication suggestion" : kind === "routine" ? "added routine suggestion" : "added diet suggestion";
      const message = kind === "medicine" ? "Medication suggestion saved." : kind === "routine" ? "Routine suggestions saved." : "Diet suggestions saved.";
      onAudit(action, `Patient ${patientId} · ${selectedAssessment}`);
      onToast(message);
    } catch (cause) {
      onToast(cause instanceof Error ? cause.message : "Suggestion could not be saved.");
    } finally { setSavingCare(false); }
  };

  const submitMedicationSuggestion = () => {
    if (!safetyReviewed) {
      onToast("Review and confirm the patient's medication safety details first.");
      return;
    }
    if (!medications.length || medications.some((medicine) => !medicine.name.trim() || !medicine.dose.trim() || !medicine.frequency.trim())) {
      onToast("Select a care item and complete its dose and frequency.");
      return;
    }
    const names = medications.map((medicine) => medicine.name).slice(0, 2).join(" + ");
    void saveCareSuggestion("medicine", { treatment_name: `Medication plan · ${names}`.slice(0, 160), medications, instructions: treatmentInstructions.trim(), doctor_name: doctorName.trim(), next_review_date: nextReviewDate });
  };

  const submitRoutineSuggestion = () => {
    const routineSteps = [...routineOptions.filter((step) => selectedRoutineIds.includes(step.id)), ...customRoutineSteps]
      .map(({ title, subtitle = "", category = "", time_of_day = "" }) => ({ title, subtitle, category, time_of_day }));
    if (!routineSteps.length || customRoutineSteps.some((step) => !step.title.trim())) {
      onToast("Select a routine option or complete each custom routine step.");
      return;
    }
    void saveCareSuggestion("routine", { treatment_name: "Daily routine suggestion", routine_steps: routineSteps, doctor_name: doctorName.trim() });
  };

  const submitDietSuggestion = () => {
    const dietMeals = [...dietOptions.filter((meal) => selectedDietIds.includes(meal.id)), ...customDietMeals]
      .map(({ type, name, nutrients = "", benefit = "" }) => ({ type, name, nutrients, benefit }));
    if (!dietMeals.length || customDietMeals.some((meal) => !meal.type.trim() || !meal.name.trim())) {
      onToast("Select a meal suggestion or complete each custom meal.");
      return;
    }
    void saveCareSuggestion("diet", { treatment_name: "Diet suggestion", diet_meals: dietMeals, doctor_name: doctorName.trim() });
  };

  const uploadReport = async () => {
    if (!canWrite || !reportFile || !reportTitle.trim()) {
      onToast("Add a report name and choose a file first.");
      return;
    }
    setUploadingReport(true);
    try {
      const body = new FormData(); body.set("title", reportTitle.trim()); body.set("file", reportFile);
      const response = await fetch(`/api/admin/users/${encodeURIComponent(patientId)}/reports`, { method: "POST", body, cache: "no-store" });
      const result: unknown = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(messageFrom(result, "Report upload failed."));
      const data = isRecord(result) && isRecord(result.data) ? result.data as unknown as Report : null;
      if (data) setDetails((current) => current ? { ...current, reports: [data, ...current.reports] } : current);
      setReportTitle(""); setReportFile(null);
      setReportOpen(false);
      const input = document.getElementById("patient-report-file") as HTMLInputElement | null; if (input) input.value = "";
      onAudit("uploaded private patient report", `Patient ${patientId}`);
      onToast("Report uploaded privately. Share it with the patient when it is ready.");
    } catch (cause) {
      onToast(cause instanceof Error ? cause.message : "Report upload failed.");
    } finally { setUploadingReport(false); }
  };

  const downloadReport = async (report: Report) => {
    setDownloadingReport(report.id);
    try {
      const response = await fetch(`/api/admin/users/${encodeURIComponent(patientId)}/reports/${encodeURIComponent(report.id)}/download`, { cache: "no-store" });
      const result: unknown = await response.json().catch(() => ({}));
      if (!response.ok || !isRecord(result) || !isRecord(result.data) || typeof result.data.url !== "string") throw new Error(messageFrom(result, "Report download could not be prepared."));
      const link = document.createElement("a"); link.href = result.data.url; link.target = "_blank"; link.rel = "noopener noreferrer"; link.click();
    } catch (cause) { onToast(cause instanceof Error ? cause.message : "Report download could not be prepared."); }
    finally { setDownloadingReport(null); }
  };

  const previewPatientReport = async (report: Report) => {
    setPreviewingReport(report.id);
    try {
      const response = await fetch(`/api/admin/users/${encodeURIComponent(patientId)}/reports/${encodeURIComponent(report.id)}/download?inline=true`, { cache: "no-store" });
      const result: unknown = await response.json().catch(() => ({}));
      if (!response.ok || !isRecord(result) || !isRecord(result.data) || typeof result.data.url !== "string") throw new Error(messageFrom(result, "Report preview could not be prepared."));
      if (report.mime_type.startsWith("image/")) {
        const downloadResponse = await fetch(`/api/admin/users/${encodeURIComponent(patientId)}/reports/${encodeURIComponent(report.id)}/download`, { cache: "no-store" });
        const downloadResult: unknown = await downloadResponse.json().catch(() => ({}));
        const downloadHref = downloadResponse.ok && isRecord(downloadResult) && isRecord(downloadResult.data) && typeof downloadResult.data.url === "string" ? downloadResult.data.url : undefined;
        setImageToView({ src: result.data.url, alt: report.title, fileName: report.file_name, caption: "Patient report", downloadHref });
      } else {
        setReportPreview({ report, url: result.data.url });
      }
    } catch (cause) { onToast(cause instanceof Error ? cause.message : "Report preview could not be prepared."); }
    finally { setPreviewingReport(null); }
  };

  const removePatientReport = async (report: Report) => {
    if (!canWrite) return;
    setDeletingReport(report.id);
    try {
      const response = await fetch(`/api/admin/users/${encodeURIComponent(patientId)}/reports/${encodeURIComponent(report.id)}`, { method: "DELETE", cache: "no-store" });
      const result: unknown = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(messageFrom(result, "Report could not be removed."));
      setDetails((current) => current ? { ...current, reports: current.reports.filter((item) => item.id !== report.id) } : current);
      const archived = isRecord(result) && isRecord(result.data) ? result.data as unknown as Report : null;
      if (archived) setArchivedReports((current) => [archived, ...current.filter((item) => item.id !== archived.id)]);
      setReportPreview((current) => current?.report.id === report.id ? null : current);
      setReportToDelete(null);
      onAudit("archived patient report for 30 days", `${patient.patient_code || patientId} · ${report.title}`);
      onToast("Report archived. A Super Admin can restore it within 30 days.");
    } catch (cause) {
      onToast(cause instanceof Error ? cause.message : "Report could not be removed.");
    } finally { setDeletingReport(null); }
  };

  const restorePatientReport = async (report: Report) => {
    if (!canWrite) return;
    setRestoringReport(report.id);
    try {
      const response = await fetch(`/api/admin/users/${encodeURIComponent(patientId)}/reports/${encodeURIComponent(report.id)}/restore`, { method: "POST", cache: "no-store" });
      const result: unknown = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(messageFrom(result, "Report could not be restored."));
      const restored = isRecord(result) && isRecord(result.data) ? result.data as unknown as Report : null;
      if (!restored) throw new Error("The restored report response was incomplete.");
      setDetails((current) => current ? { ...current, reports: [restored, ...current.reports.filter((item) => item.id !== restored.id)] } : current);
      setArchivedReports((current) => current.filter((item) => item.id !== restored.id));
      onAudit("restored archived patient report", `${patient.patient_code || patientId} · ${report.title}`);
      onToast("Report restored as private. Share it again if the patient should see it.");
    } catch (cause) {
      onToast(cause instanceof Error ? cause.message : "Report could not be restored.");
    } finally { setRestoringReport(null); }
  };

  const removePatientScalpPhoto = async (target: { assessmentId: string; photoIndex: number; fileName: string }) => {
    if (!canWrite || !viewedAssessment) return;
    const removalKey = `${target.assessmentId}:${target.photoIndex}`;
    setDeletingScalpPhoto(removalKey);
    try {
      const response = await fetch(`/api/admin/users/${encodeURIComponent(patientId)}/assessments/${encodeURIComponent(target.assessmentId)}/photos/${target.photoIndex}`, { method: "DELETE", cache: "no-store" });
      const result: unknown = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(messageFrom(result, "Scalp photo could not be removed."));
      setDetails((current) => current ? { ...current, assessments: current.assessments.map((assessment) => String(assessment.id) === target.assessmentId ? { ...assessment, scalp_photos: (assessment.scalp_photos ?? []).filter((_, index) => index !== target.photoIndex) } : assessment) } : current);
      setPhotoToDelete(null);
      onAudit("deleted patient scalp photo and stored file", `${patient.patient_code || patientId} · ${target.fileName}`);
      onToast("Scalp photo and stored file removed.");
    } catch (cause) {
      onToast(cause instanceof Error ? cause.message : "Scalp photo could not be removed.");
    } finally { setDeletingScalpPhoto(null); }
  };

  const updateReportVisibility = async (report: Report) => {
    if (!canWrite) return;
    const visibility = report.visibility === "Shared" ? "Private" : "Shared";
    setUpdatingReportVisibility(report.id);
    try {
      const response = await fetch(`/api/admin/users/${encodeURIComponent(patientId)}/reports/${encodeURIComponent(report.id)}/visibility`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visibility, ...(visibility === "Shared" ? { patient_consent_confirmed: patientConsentConfirmed } : {}) }),
        cache: "no-store",
      });
      const result: unknown = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(messageFrom(result, "Report visibility could not be updated."));
      const data: Report = isRecord(result) && isRecord(result.data) ? result.data as unknown as Report : { ...report, visibility };
      setDetails((current) => current ? { ...current, reports: current.reports.map((item) => item.id === report.id ? { ...item, ...data } : item) } : current);
      const action = visibility === "Shared" ? "shared patient report" : "hid patient report";
      onAudit(action, `Patient ${patientId} · ${report.title}`);
      onToast(visibility === "Shared" ? "Report is now visible to the patient." : "Report is now hidden from the patient.");
      setPatientConsentConfirmed(false);
      setReportToConfirmVisibility(null);
    } catch (cause) {
      onToast(cause instanceof Error ? cause.message : "Report visibility could not be updated.");
    } finally {
      setUpdatingReportVisibility(null);
    }
  };

  if (loadState === "loading") return <main className="page-wrap mx-auto w-full max-w-[1420px] p-4 sm:p-6 lg:p-8"><div className="card flex min-h-64 items-center justify-center gap-3 text-sm text-slate-500"><LoaderCircle className="animate-spin" size={18} />Loading patient record…</div></main>;
  if (loadState === "error" || !details) return <main className="page-wrap mx-auto w-full max-w-[1420px] p-4 sm:p-6 lg:p-8"><div className="card border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800" role="alert">{error}<button className="button button-secondary ml-3" onClick={() => void loadPatient()}>Retry</button></div></main>;

  const patient = details.patient;
  const patientCode = patient.patient_code || `DHP${String(patient.id).padStart(4, "0")}`;
  const initials = patient.name.split(/\s+/).map((part) => part[0] || "").join("").slice(0, 2).toUpperCase();
  const viewedAssessment = details.assessments.find((assessment) => String(assessment.id) === viewedAssessmentId) ?? details.assessments[0];
  const medicationSafetyAssessment = details.assessments.find((assessment) => String(assessment.reference_no ?? "") === selectedAssessment);
  const assessmentAnswers = assessmentFields.filter(({ key }) => hasValue(viewedAssessment?.[key]));
  const assessmentProfile = [{ key: "full_name", label: "Name" }, { key: "email", label: "Email" }, { key: "phone", label: "Phone" }, { key: "age", label: "Age" }, { key: "gender", label: "Gender" }, { key: "city", label: "City" }, { key: "occupation", label: "Occupation" }].filter(({ key }) => hasValue(viewedAssessment?.[key]));
  const savedRoutineSteps = details.treatments.flatMap((treatment) => treatment.routine_steps ?? []);
  const savedDietMeals = details.treatments.flatMap((treatment) => treatment.diet_meals ?? []);
  const recentActivity = [...details.activity].sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime()).slice(0, 20);
  const filteredMedicineOptions = careProductOptions.filter((option) => [option.name, option.category, option.form].join(" ").toLowerCase().includes(medicineSearch.trim().toLowerCase()));
  const filteredRoutineOptions = routineOptions.filter((option) => [option.title, option.subtitle, option.category, option.time_of_day].join(" ").toLowerCase().includes(routineSearch.trim().toLowerCase()));
  const filteredDietOptions = dietOptions.filter((option) => [option.type, option.name, option.nutrients, option.benefit].join(" ").toLowerCase().includes(dietSearch.trim().toLowerCase()));

  const toggleMedicine = (option: typeof careProductOptions[number]) => {
    setMedications((current) => current.some((medicine) => medicine.catalog_id === option.id)
      ? current.filter((medicine) => medicine.catalog_id !== option.id)
      : [...current, { catalog_id: option.id, name: option.name, category: option.category, form: option.form, dose: "", frequency: "", duration: "", instructions: "" }]);
  };
  const updateMedicine = (index: number, patch: Partial<Medication>) => setMedications((current) => current.map((medicine, itemIndex) => itemIndex === index ? { ...medicine, ...patch } : medicine));

  return <main className="page-wrap mx-auto w-full max-w-[1420px] space-y-5 p-4 sm:p-6 lg:p-8">
    {!canWrite && <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900"><LockKeyhole size={15} className="mt-0.5 shrink-0" />This account can view patient records. A Super Admin can edit the profile, upload reports, and add care suggestions.</div>}

    <div className="grid min-w-0 grid-cols-1 items-start gap-5 md:grid-cols-[minmax(245px,0.82fr)_minmax(0,1.45fr)]">
      <div className="min-w-0 space-y-5">
        <section className="patient-identity-card overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
          <div className="h-1.5 bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-600" />
          <div className="p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3.5">
                {patient.profile_url?.startsWith("https://") ? <button type="button" className="shrink-0 rounded-[20px] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-200" aria-label="View patient profile photo full size" onClick={() => setImageToView({ src: patient.profile_url!, alt: `${patient.name} profile photo`, fileName: `${patientCode}-profile.jpg` })}><Image src={patient.profile_url} alt="" width={68} height={68} unoptimized className="h-[68px] w-[68px] rounded-[20px] object-cover ring-4 ring-teal-50" /></button> : <div className="grid h-[68px] w-[68px] shrink-0 place-items-center rounded-[20px] bg-[#E9F5F4] text-xl font-bold text-[#0F766E] ring-4 ring-teal-50">{initials || <UserRound size={25} />}</div>}
                <div className="min-w-0"><span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-teal-800"><ShieldCheck size={11} />Patient</span><h2 className="mt-1.5 break-words text-xl font-bold leading-tight tracking-tight text-[#1A365D]">{patient.name}</h2><div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500"><span>Patient ID</span><span className="font-mono font-semibold text-slate-700">{patientCode}</span><button type="button" className="grid h-6 w-6 place-items-center rounded-md text-slate-400 transition hover:bg-teal-50 hover:text-teal-700" title="Copy patient ID" aria-label="Copy patient ID" onClick={() => { void navigator.clipboard.writeText(patientCode).then(() => onToast("Patient ID copied.")).catch(() => onToast("Could not copy patient ID.")); }}><Copy size={13} /></button></div></div>
              </div>
              {canWrite && <button type="button" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-teal-300 hover:text-teal-700" aria-label="Edit patient profile" title="Edit patient profile" onClick={() => { setProfile(patient); setEditOpen(true); }}><Pencil size={16} /></button>}
            </div>

            <div className="mt-6 space-y-4 border-y border-slate-100 py-4">
              <IdentityLine icon={<Mail size={15} />} label="Email" value={patient.email} />
              <IdentityLine icon={<Phone size={15} />} label="Phone" value={patient.phone} />
              <div className="grid grid-cols-2 gap-x-4 gap-y-4 pt-1">
                <IdentityValue label="Age" value={patient.age == null ? undefined : `${patient.age} years`} />
                <IdentityValue label="Gender" value={patient.gender} />
                <IdentityValue label="City" value={patient.city} />
                <IdentityValue label="Occupation" value={patient.occupation} />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
              <IdentityValue label="Registered via" value={patient.platform} />
              <IdentityValue label="Joined" value={formatDate(patient.created_at)} />
              <IdentityValue label="Profile updated" value={formatDate(patient.updated_at)} />
            </div>
            <div className="mt-5 grid grid-cols-3 divide-x divide-slate-200 rounded-2xl bg-[#F5F8FC] py-3 text-center">
              <CompactMetric label="Assessments" value={details.assessments.length} />
              <CompactMetric label="Care plans" value={details.treatments.length} />
              <CompactMetric label="Reports" value={details.reports.length} />
            </div>
          </div>
        </section>

        <section className="min-w-0 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <SectionHeading icon={<CalendarDays size={17} />} title="Appointments" subtitle="Upcoming and recent clinic visits linked to this patient ID." />
          {details.appointments.length ? <div className="mt-4 space-y-2.5">{[...details.appointments].sort((a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime()).slice(0, 4).map((appointment) => <article key={appointment.id} className="flex min-w-0 items-center gap-3 rounded-2xl bg-[#FAFBFD] p-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-teal-700"><CalendarDays size={17} /></span><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-[#1A365D]">{appointment.reason || "Clinic consultation"}</p><p className="mt-1 text-[10px] text-slate-500">{new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(appointment.starts_at))} · {appointment.id}</p></div><span className="rounded-full bg-white px-2 py-1 text-[10px] font-semibold text-slate-600">{appointment.status}</span></article>)}</div> : <EmptyState icon={<CalendarDays size={19} />} title="No appointments yet" detail="Patient appointment requests and clinic bookings will appear here." />}
        </section>

        <section className="min-w-0 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <SectionHeading icon={<Pill size={17} />} title="Treatment history" subtitle="Medication plans previously shared with this patient." />
            {canWrite && <button type="button" className="button button-primary w-full sm:w-auto" disabled={!details.assessments.length} onClick={openTreatmentBuilder}><Plus size={15} />Add medication</button>}
          </div>
          {!details.assessments.length && <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-900">A suggestion needs a patient assessment first.</p>}
          {details.treatments.some((treatment) => (treatment.medications?.length ?? 0) > 0 || (!treatment.routine_steps?.length && !treatment.diet_meals?.length && treatment.treatment_name.toLowerCase().includes("medication"))) ? <div className="mt-4 space-y-3">
            {details.treatments.filter((treatment) => (treatment.medications?.length ?? 0) > 0 || (!treatment.routine_steps?.length && !treatment.diet_meals?.length && treatment.treatment_name.toLowerCase().includes("medication"))).map((treatment, index) => <article key={treatment.id} className="rounded-2xl border border-slate-100 bg-[#FAFBFD] p-3.5">
              <div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-wide text-teal-700">{index === 0 ? "Latest medication plan" : "Previous plan"}{treatment.reference_no ? ` · ${treatment.reference_no}` : ""}</p><h3 className="mt-1 break-words text-sm font-bold text-[#1A365D]">{treatment.treatment_name}</h3><p className="mt-1 text-[10px] text-slate-500">{formatDate(treatment.date)}{treatment.duration ? ` · ${treatment.duration}` : ""}</p></div>{treatment.next_review_date && <span className="shrink-0 rounded-full bg-white px-2 py-1 text-[10px] font-semibold text-slate-500">Review {formatDate(treatment.next_review_date)}</span>}</div>
              {(treatment.medications?.length ?? 0) > 0 && <div className="mt-3 space-y-2">{treatment.medications?.map((medicine, medicineIndex) => <div key={`${medicine.catalog_id || medicine.name}-${medicineIndex}`} className="flex items-center gap-2 rounded-xl bg-white p-2"><CareArtwork kind={medicine.form?.toLowerCase().includes("shampoo") ? "shampoo" : medicine.category?.toLowerCase().includes("supplement") ? "supplement" : "serum"} className="h-10 w-12 shrink-0 rounded-lg" /><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-slate-700">{medicine.name}</p><p className="mt-0.5 text-[10px] text-slate-500">{[medicine.category, medicine.form, medicine.dose, medicine.frequency, medicine.duration].filter(Boolean).join(" · ")}</p></div></div>)}</div>}
              {treatment.instructions && <p className="mt-3 border-t border-slate-100 pt-2 text-xs leading-5 text-slate-600">{treatment.instructions}</p>}
            </article>)}
          </div> : <EmptyState icon={<Pill size={20} />} title="No medication history" detail="Medication suggestions saved for this patient will appear here." />}
        </section>
        <section className="min-w-0 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><SectionHeading icon={<ClipboardList size={17} />} title="Daily routine" subtitle="Selected care steps from this patient's saved plans." />{canWrite && <button type="button" className="button button-secondary w-full sm:w-auto" disabled={!details.assessments.length} onClick={openRoutineBuilder}><Plus size={14} />Add routine</button>}</div>
          {savedRoutineSteps.length ? <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">{savedRoutineSteps.map((step, index) => {
            const option = routineOptions.find((item) => item.title === step.title);
            return <article key={`${step.title}-${index}`} className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-100 bg-[#FAFBFD] p-3"><CareArtwork kind={option?.art ?? "scalp"} className="h-[56px] w-[66px] shrink-0 rounded-xl" /><div className="min-w-0"><p className="text-xs font-semibold text-[#1A365D]">{step.title}</p><p className="mt-1 text-[10px] leading-4 text-slate-500">{[step.time_of_day, step.category, step.subtitle].filter(Boolean).join(" · ")}</p></div></article>;
          })}</div> : <EmptyState icon={<ClipboardList size={19} />} title="No routine suggestions yet" detail="Create separate morning, evening or weekly care steps for the patient." />}
        </section>

        <section className="min-w-0 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><SectionHeading icon={<FileCheck2 size={17} />} title="Diet suggestions" subtitle="Meal ideas saved separately from medicines and routines." />{canWrite && <button type="button" className="button button-secondary w-full sm:w-auto" disabled={!details.assessments.length} onClick={openDietBuilder}><Plus size={14} />Add diet suggestion</button>}</div>
          {savedDietMeals.length ? <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">{savedDietMeals.map((meal, index) => {
            const option = dietOptions.find((item) => item.name === meal.name);
            return <article key={`${meal.type}-${meal.name}-${index}`} className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-100 bg-[#FAFBFD] p-3"><CareArtwork kind={option?.art ?? (meal.type.toLowerCase() === "snack" ? "snack" : "lunch")} className="h-[56px] w-[66px] shrink-0 rounded-xl" /><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-wide text-teal-700">{meal.type}</p><p className="mt-0.5 text-xs font-semibold text-[#1A365D]">{meal.name}</p><p className="mt-1 text-[10px] leading-4 text-slate-500">{[meal.nutrients, meal.benefit].filter(Boolean).join(" · ")}</p></div></article>;
          })}</div> : <EmptyState icon={<FileCheck2 size={19} />} title="No diet suggestions yet" detail="Add meal ideas that match the patient's assessment and dietary needs." />}
        </section>
      </div>

      <div className="min-w-0 space-y-5">
    {(details.reports.length > 0 || archivedReports.length > 0 || canWrite) && <section className="min-w-0 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start justify-between gap-3 sm:block">
          <SectionHeading icon={<FileCheck2 size={17} />} title="Reports & documents" subtitle="Private by default. Share a file when it is ready for the patient." />
          <span className="shrink-0 rounded-full bg-[#F4F8FB] px-2.5 py-1 text-[10px] font-semibold text-slate-500 sm:hidden">{details.reports.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden rounded-full bg-[#F4F8FB] px-2.5 py-1 text-[10px] font-semibold text-slate-500 sm:inline-flex">{details.reports.length} files</span>
          {canWrite && <button type="button" className="button button-secondary w-full sm:w-auto" onClick={() => { setReportTitle(""); setReportFile(null); setReportOpen(true); }}><UploadCloud size={15} />Upload report</button>}
        </div>
      </div>
      {details.reports.length ? <div className="mt-5 space-y-3">{details.reports.map((report) => {
        const isShared = report.visibility === "Shared";
        const visibilityHistory = report.visibility_history ?? [];
        return <article key={report.id} className="min-w-0 rounded-2xl border border-slate-100 bg-[#FAFBFD] p-3.5">
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-teal-700 shadow-sm"><FileText size={18} /></span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2"><p className="min-w-0 break-words text-sm font-semibold text-slate-800">{report.title}</p><span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold ${isShared ? "bg-teal-50 text-teal-800" : "bg-slate-100 text-slate-600"}`}>{isShared ? <Eye size={11} /> : <EyeOff size={11} />}{isShared ? "Visible to patient" : "Private"}</span></div>
              <p className="mt-1 break-all text-[11px] text-slate-500">{report.file_name} · {(report.bytes / 1024).toFixed(0)} KB</p>
              <p className="mt-1 text-[10px] text-slate-400">{formatDate(report.created_at)} · {report.uploaded_by || "Clinic"}{isShared && report.shared_at ? ` · Shared ${formatDate(report.shared_at)}` : ""}</p>
            </div>
          </div>
          <details className="mt-3 border-t border-slate-100 pt-3">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-[11px] font-semibold text-slate-500 [&::-webkit-details-marker]:hidden"><span>Visibility history</span><ChevronDown size={14} className="text-slate-400" /></summary>
            {visibilityHistory.length ? <ol className="mt-3 space-y-2">{[...visibilityHistory].reverse().map((event, index) => {
              const isInitialPrivate = event.visibility === "Private" && index === visibilityHistory.length - 1;
              const label = event.action === "uploaded" || (!event.action && isInitialPrivate) ? "Uploaded as private" : event.action === "archived" ? "Archived for 30 days" : event.action === "restored" ? "Restored as private" : event.action === "hidden" || (!event.action && event.visibility === "Private") ? "Hidden from patient" : "Shared with patient";
              return <li key={`${event.changed_at ?? "event"}-${index}`} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-lg bg-white px-3 py-2 text-[10px] text-slate-500"><span className="font-semibold text-slate-700">{label}{event.patient_consent_confirmed ? " · permission confirmed" : ""}</span><span>{event.changed_by || "Clinic"} · {formatDate(event.changed_at ?? undefined)}</span></li>;
            })}</ol> : <p className="mt-2 text-[10px] text-slate-400">No visibility changes recorded for this report.</p>}
          </details>
          <div className="mt-3 flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 pt-3">
            <button type="button" className="button button-secondary !min-h-9 !px-3 !py-2 text-xs disabled:opacity-50" disabled={previewingReport === report.id} onClick={() => void previewPatientReport(report)}>{previewingReport === report.id ? <LoaderCircle size={14} className="animate-spin" /> : <Eye size={14} />}Preview</button>
            {canWrite && <>
            <button type="button" title={`Download ${report.title}`} aria-label={`Download ${report.title}`} className="button button-secondary !min-h-9 !px-3 !py-2 text-xs disabled:opacity-50" disabled={downloadingReport === report.id} onClick={() => void downloadReport(report)}>{downloadingReport === report.id ? <LoaderCircle size={14} className="animate-spin" /> : <Download size={14} />}Download</button>
            <button type="button" className={`button !min-h-9 !px-3 !py-2 text-xs ${isShared ? "button-secondary" : "button-primary"}`} disabled={Boolean(updatingReportVisibility)} onClick={() => { setPatientConsentConfirmed(false); setReportToConfirmVisibility(report); }}>{isShared ? <EyeOff size={14} /> : <Share2 size={14} />}{isShared ? "Hide from patient" : "Share with patient"}</button>
            <button type="button" title={`Remove ${report.title}`} aria-label={`Remove ${report.title}`} className="button button-secondary !min-h-9 !px-3 !py-2 text-xs !text-rose-700 hover:!border-rose-200 hover:!bg-rose-50 disabled:opacity-50" disabled={Boolean(deletingReport)} onClick={() => setReportToDelete(report)}><Trash2 size={14} />Remove</button>
            </>}
          </div>
        </article>;
      })}</div> : <p className="mt-4 rounded-xl border border-dashed border-slate-200 bg-[#FAFBFD] px-4 py-6 text-center text-xs text-slate-500">No active reports. Upload a report here; it stays private until you share it.</p>}
      {canWrite && archivedReports.length > 0 && <div className="mt-5 border-t border-slate-100 pt-4">
        <div className="flex flex-wrap items-center justify-between gap-2"><div><h3 className="text-xs font-bold text-[#1A365D]">Deleted reports · recoverable for 30 days</h3><p className="mt-1 text-[10px] text-slate-500">Expired reports are permanently removed by the backend.</p></div><span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-800">{archivedReports.length} archived</span></div>
        <div className="mt-3 space-y-2.5">{archivedReports.map((report) => {
          const daysLeft = report.purge_after && pageNow !== null ? Math.max(0, Math.ceil((new Date(report.purge_after).getTime() - pageNow) / 86400000)) : null;
          return <article key={report.id} className="flex min-w-0 flex-col gap-3 rounded-2xl border border-amber-100 bg-amber-50/50 p-3 sm:flex-row sm:items-center"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-amber-700"><FileText size={18} /></span><div className="min-w-0 flex-1"><p className="break-words text-xs font-semibold text-[#1A365D]">{report.title}</p><p className="mt-1 break-all text-[10px] text-slate-500">{report.file_name} · Deleted {formatDate(report.deleted_at || undefined)} · {daysLeft === null ? "Checking recovery window" : `${daysLeft} day${daysLeft === 1 ? "" : "s"} left`}</p></div><button type="button" className="button button-secondary w-full !min-h-9 !px-3 !py-2 text-xs sm:w-auto" disabled={restoringReport === report.id || daysLeft === 0} onClick={() => void restorePatientReport(report)}>{restoringReport === report.id ? <LoaderCircle size={14} className="animate-spin" /> : <RotateCcw size={14} />}Restore report</button></article>;
        })}</div>
      </div>}
    </section>}
        <section className="min-w-0 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <SectionHeading icon={<ClipboardList size={17} />} title="Hair assessment" subtitle="App answers and scalp photos, with previous submissions available." />
            {details.assessments.length > 1 && <label className="block w-full sm:max-w-[260px]"><span className="sr-only">Choose assessment</span><select value={viewedAssessmentId} onChange={(event) => { const assessment = details.assessments.find((item) => String(item.id) === event.target.value); setViewedAssessmentId(event.target.value); setSelectedAssessment(String(assessment?.reference_no ?? "")); }} className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-2.5 text-xs font-semibold text-[#1A365D]">{details.assessments.map((assessment, index) => <option key={assessment.id} value={String(assessment.id)}>{index === 0 ? "Latest" : `Previous ${index}`} · {assessment.reference_no || assessment.id}</option>)}</select></label>}
          </div>
          {viewedAssessment ? <>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#F4F8FB] px-4 py-3.5">
              <div><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{details.assessments[0]?.id === viewedAssessment.id ? "Latest submission" : "Assessment record"}</p><p className="mt-1 font-mono text-sm font-bold text-[#1A365D]">{viewedAssessment.reference_no || `Assessment ${viewedAssessment.id}`}</p></div>
              <div className="text-right"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Submitted</p><p className="mt-1 text-sm font-medium text-slate-700">{formatDate(viewedAssessment.created_at)}</p></div>
            </div>
            {assessmentAnswers.length > 0 ? <div className="mt-5 grid grid-cols-1 gap-x-6 lg:grid-cols-2">{assessmentAnswers.map(({ key, label }) => <div key={key} className="min-w-0 border-b border-slate-100 py-3"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1.5 break-words text-sm leading-5 text-slate-700">{displayValue(viewedAssessment[key])}</p></div>)}</div> : <EmptyState icon={<ClipboardList size={20} />} title="No assessment answers" detail="There are no answers saved on this assessment." />}
            {assessmentProfile.length > 0 && <details className="mt-4 rounded-xl border border-slate-100 bg-[#FAFBFD] px-4 py-3"><summary className="flex cursor-pointer list-none items-center justify-between text-xs font-semibold text-slate-600 [&::-webkit-details-marker]:hidden">Patient details captured with this submission<ChevronDown size={15} className="text-slate-400" /></summary><div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 lg:grid-cols-3">{assessmentProfile.map(({ key, label }) => <IdentityValue key={key} label={label} value={displayValue(viewedAssessment[key])} />)}</div></details>}
            {(viewedAssessment.scalp_photos?.length ?? 0) > 0 && <div className="mt-5"><div className="mb-2.5 flex items-center justify-between"><h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">Scalp photos</h3><span className="rounded-full bg-teal-50 px-2.5 py-1 text-[10px] font-semibold text-teal-800">{viewedAssessment.scalp_photos?.length} images</span></div><div className="grid grid-cols-2 gap-3 lg:grid-cols-3">{viewedAssessment.scalp_photos?.map((photo, index) => {
              const photoUrl = photo.url?.startsWith("https://") ? photo.url : undefined;
              const removalKey = `${viewedAssessment.id}:${index}`;
              return <article key={`${photo.url}-${index}`} className="relative min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                <button type="button" className="block w-full text-left hover:border-teal-400 disabled:cursor-default" disabled={!photoUrl} onClick={() => photoUrl && setImageToView({ src: photoUrl, alt: photo.file_name || `Scalp photo ${index + 1}`, fileName: photo.file_name || `${patientCode}-scalp-${index + 1}.jpg`, caption: `Hair assessment · ${formatDate(viewedAssessment.created_at)}` })}>
                  <div className="relative grid aspect-[4/3] place-items-center bg-slate-100 text-slate-400">{photoUrl ? <Image src={photoUrl} alt={photo.file_name || `Scalp photo ${index + 1}`} fill unoptimized className="object-cover" /> : <FileText size={22} />}</div>
                  <p className="truncate px-2 py-2 text-[11px] text-slate-600">{photo.file_name || `Scalp image ${index + 1}`} · View full size</p>
                </button>
                {canWrite && <button type="button" title="Remove scalp photo" aria-label={`Remove scalp photo ${index + 1}`} disabled={Boolean(deletingScalpPhoto)} onClick={() => setPhotoToDelete({ assessmentId: String(viewedAssessment.id), photoIndex: index, fileName: photo.file_name || `Scalp photo ${index + 1}` })} className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full border border-white/80 bg-white/95 text-rose-700 shadow-sm transition hover:bg-rose-50 disabled:opacity-50">{deletingScalpPhoto === removalKey ? <LoaderCircle size={14} className="animate-spin" /> : <Trash2 size={14} />}</button>}
              </article>;
            })}</div></div>}
          </> : <EmptyState icon={<ClipboardList size={20} />} title="No assessment submitted" detail="The patient has not submitted a hair assessment in the mobile app yet." />}
        </section>

        <section className="min-w-0 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <SectionHeading icon={<Activity size={17} />} title="Daily progress" subtitle="Patient check-ins and progress photos from the mobile app." />
          {details.progressCheckIns.length ? <div className="mt-4 space-y-3">{details.progressCheckIns.map((checkIn) => <article key={checkIn.id} className="rounded-2xl border border-slate-100 bg-[#FAFBFD] p-3.5 sm:p-4">
            <div className="flex flex-wrap items-start justify-between gap-2"><div><h3 className="text-sm font-semibold text-[#1A365D]">{formatDate(checkIn.date)}</h3><p className="mt-1 text-[11px] text-slate-500">{[checkIn.scalp_region || "Scalp", checkIn.shedding_level || "Shedding not recorded"].join(" · ")}</p></div><span className="rounded-full bg-teal-50 px-2.5 py-1 text-[10px] font-semibold text-teal-800">Density {checkIn.density_rating ?? "—"}/5</span></div>
            {checkIn.notes && <p className="mt-3 whitespace-pre-wrap break-words text-xs leading-5 text-slate-700">{checkIn.notes}</p>}
            {checkIn.doctor_note && <div className="mt-3 rounded-xl border border-teal-100 bg-teal-50/60 px-3 py-2.5"><p className="text-[9px] font-bold uppercase tracking-wide text-teal-800">Clinician note{checkIn.is_doctor_reviewed ? " · Reviewed" : ""}</p><p className="mt-1 whitespace-pre-wrap break-words text-xs leading-5 text-teal-950">{checkIn.doctor_note}</p></div>}
            {checkIn.photos?.length ? <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">{checkIn.photos.map((photo, index) => {
              const photoUrl = photo.url?.startsWith("https://") ? photo.url : undefined;
              const name = photo.file_name || `${patientCode}-progress-${checkIn.id}-${photo.angle || index + 1}.jpg`;
              return <button key={`${photo.url || photo.angle}-${index}`} type="button" disabled={!photoUrl} onClick={() => photoUrl && setImageToView({ src: photoUrl, alt: `${photo.angle || "Progress"} progress photo`, fileName: name, caption: `${formatDate(checkIn.date)} · ${photo.angle || "Daily progress"}` })} className="group relative min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 text-left disabled:cursor-default">
                <span className="relative block aspect-[4/3]">{photoUrl ? <Image src={photoUrl} alt={`${photo.angle || "Progress"} progress photo`} fill unoptimized className="object-cover transition duration-200 group-hover:scale-[1.02]" /> : <span className="grid h-full place-items-center text-xs text-slate-400">Photo unavailable</span>}</span>
                <span className="block truncate px-2.5 py-2 text-[10px] font-semibold capitalize text-slate-600">{photo.angle || `Photo ${index + 1}`} · Full size</span>
              </button>;
            })}</div> : <p className="mt-3 rounded-lg bg-white px-3 py-2 text-[11px] text-slate-500">No photos were attached to this check-in.</p>}
          </article>)}</div> : <EmptyState icon={<Activity size={19} />} title="No daily progress yet" detail="Patient photo check-ins saved from the mobile app will appear here." />}
        </section>

        <section className="min-w-0 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <SectionHeading icon={<History size={17} />} title="Patient care timeline" subtitle="Recent clinical changes and appointment activity, with the staff member and time." />
          {recentActivity.length ? <ol className="mt-5 space-y-0">{recentActivity.map((event, index) => <li key={event.id || `${event.type}-${event.occurred_at}-${index}`} className="relative flex gap-3 pb-5 last:pb-0"><span className="relative z-10 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#EFF7F8] text-teal-700"><Activity size={16} /></span>{index < recentActivity.length - 1 && <span aria-hidden="true" className="absolute bottom-0 left-[17px] top-9 w-px bg-slate-200" />}<div className="min-w-0 flex-1 rounded-xl bg-[#FAFBFD] px-3 py-2.5"><div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1"><p className="text-xs font-semibold text-[#1A365D]">{event.title}</p><time className="text-[10px] text-slate-400">{formatDate(event.occurred_at)}</time></div>{event.summary && <p className="mt-1 break-words text-[11px] leading-5 text-slate-600">{event.summary}</p>}<p className="mt-1 text-[10px] text-slate-400">{event.actor || "Clinic"} · {event.type.replaceAll("_", " ")}</p></div></li>)}</ol> : <EmptyState icon={<History size={19} />} title="No activity recorded yet" detail="Profile updates, care plans, reports and appointments will appear here as the clinic works on this record." />}
        </section>

      </div>
    </div>



    {editOpen && <Modal title="Edit patient profile" description="Update the personal details used across the clinic workspace." submitLabel={savingProfile ? "Saving…" : "Save profile"} submitDisabled={savingProfile} onClose={() => setEditOpen(false)} onSubmit={() => { void saveProfile(); }}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{profileFields.map((field) => <label key={field.key} className="block text-xs font-semibold text-slate-600">{field.label}<input autoFocus={field.key === "name"} className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal text-slate-800 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100" type={field.type} min={field.type === "number" ? 1 : undefined} max={field.type === "number" ? 120 : undefined} maxLength={field.type === "text" ? 120 : undefined} value={String(profile[field.key] ?? "")} disabled={savingProfile} onChange={(event) => setProfile((current) => ({ ...current, [field.key]: field.key === "age" ? (event.target.value ? Number(event.target.value) : null) : event.target.value }))} /></label>)}</div>
      <div className="mt-4 rounded-xl bg-slate-50 px-3 py-2.5 text-xs leading-5 text-slate-500">Email and phone are displayed here for reference. They can’t be edited from the admin profile form.</div>
    </Modal>}

    {treatmentOpen && <Modal className="care-plan-modal" title="Add medication suggestion" description="Select a patient assessment, then add approved medicine and instructions." submitLabel={savingCare ? "Saving…" : "Save medication"} submitDisabled={savingCare || !details.assessments.length || !safetyReviewed} onClose={() => setTreatmentOpen(false)} onSubmit={submitMedicationSuggestion}>
      <p className="mb-3 rounded-xl bg-[#F4F8FB] px-3 py-2 text-xs text-slate-600">Linked assessment: <span className="font-semibold text-[#1A365D]">{selectedAssessment || "Select an assessment in the Hair assessment card"}</span></p>
      <section className="mb-4 rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
        <div className="flex items-start gap-2"><LockKeyhole size={15} className="mt-0.5 shrink-0 text-amber-800" /><div><h3 className="text-xs font-bold text-amber-950">Medication safety review</h3><p className="mt-1 text-[11px] leading-5 text-amber-900">Confirm allergies, current medicines and relevant health conditions with the patient before adding a medication.</p></div></div>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <SafetyFact label="Allergies" value={displayValue(medicationSafetyAssessment?.allergy_details || medicationSafetyAssessment?.allergy_status)} />
          <SafetyFact label="Current medicines / supplements" value={displayValue(medicationSafetyAssessment?.current_medications || medicationSafetyAssessment?.current_medications_status)} />
          <SafetyFact label="Medical conditions" value={displayValue(medicationSafetyAssessment?.medical_conditions)} />
          <SafetyFact label="Previous treatments" value={displayValue(medicationSafetyAssessment?.previous_treatments)} />
        </div>
        <label className="mt-3 flex cursor-pointer items-start gap-2 rounded-xl border border-amber-200 bg-white/80 p-3 text-[11px] leading-5 text-amber-950"><input type="checkbox" checked={safetyReviewed} onChange={(event) => setSafetyReviewed(event.target.checked)} className="mt-1 accent-teal-700" /><span>I reviewed this information with the patient and confirmed any details that were missing or unclear.</span></label>
      </section>
      <CareSearch value={medicineSearch} onChange={setMedicineSearch} placeholder="Search medicines or care products…" />
      <p className="mb-2 mt-4 text-[10px] font-bold uppercase tracking-wide text-slate-400">Suggested catalog items · Search and select, then set clinician-approved dose</p>
      {filteredMedicineOptions.length ? <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">{filteredMedicineOptions.map((option) => <ImageChoice key={option.id} selected={medications.some((medicine) => medicine.catalog_id === option.id)} title={option.name} detail={`${option.category} · ${option.form}`} art={option.art} onClick={() => toggleMedicine(option)} />)}</div> : <p className="rounded-xl bg-slate-50 p-4 text-center text-xs text-slate-500">No matching catalog items.</p>}
      <button type="button" onClick={() => setMedications((current) => [...current, { name: "", category: "", form: "", dose: "", frequency: "", duration: "", instructions: "" }])} className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:text-teal-800" disabled={savingCare}><Plus size={14} />Add custom medication</button>
      {medications.length > 0 && <div className="mt-4 space-y-3">{medications.map((medicine, index) => <div key={`${medicine.catalog_id ?? "custom"}-${index}`} className="rounded-2xl border border-slate-200 bg-[#FAFBFD] p-3.5">
        <div className="mb-3 flex items-center justify-between gap-2"><p className="text-xs font-semibold text-[#1A365D]">{medicine.name || `Custom medication ${index + 1}`}</p><button type="button" className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600" aria-label={`Remove medication ${index + 1}`} onClick={() => setMedications((current) => current.filter((_, itemIndex) => itemIndex !== index))}><Trash2 size={15} /></button></div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {!medicine.catalog_id && <label className="block text-[11px] font-semibold text-slate-600 sm:col-span-2">Medication name<input maxLength={240} value={medicine.name} onChange={(event) => updateMedicine(index, { name: event.target.value })} placeholder="Enter medication or product name" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal" /></label>}
          {!medicine.catalog_id && <label className="block text-[11px] font-semibold text-slate-600">Type<select value={medicine.category} onChange={(event) => updateMedicine(index, { category: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-normal"><option value="">Choose type</option><option>Topical</option><option>Shampoo</option><option>Oral medicine</option><option>Supplement</option><option>Other</option></select></label>}
          <label className="block text-[11px] font-semibold text-slate-600">Dose<input maxLength={240} value={medicine.dose} onChange={(event) => updateMedicine(index, { dose: event.target.value })} placeholder="Dose advised by clinician" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal" /></label>
          <label className="block text-[11px] font-semibold text-slate-600">Frequency<input maxLength={240} value={medicine.frequency} onChange={(event) => updateMedicine(index, { frequency: event.target.value })} placeholder="e.g. Once daily" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal" /></label>
          <label className="block text-[11px] font-semibold text-slate-600">Duration<input maxLength={120} value={medicine.duration} onChange={(event) => updateMedicine(index, { duration: event.target.value })} placeholder="e.g. 8 weeks" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal" /></label>
          <label className="block text-[11px] font-semibold text-slate-600">Patient instructions<input maxLength={1000} value={medicine.instructions} onChange={(event) => updateMedicine(index, { instructions: event.target.value })} placeholder="Optional usage notes" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal" /></label>
        </div>
      </div>)}</div>}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2"><label className="block text-xs font-semibold text-slate-600">Clinician name<input maxLength={120} value={doctorName} onChange={(event) => setDoctorName(event.target.value)} placeholder="Name shown in the patient app" className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal" /></label><label className="block text-xs font-semibold text-slate-600">Next review date<input type="date" value={nextReviewDate} onChange={(event) => setNextReviewDate(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal" /></label></div>
      <label className="mt-3 block text-xs font-semibold text-slate-600">Clinician instructions<textarea rows={3} maxLength={2000} value={treatmentInstructions} onChange={(event) => setTreatmentInstructions(event.target.value)} placeholder="Add instructions to share with the patient" className="mt-1.5 w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal" /></label>
    </Modal>}

    {reportToConfirmVisibility && <Modal title={reportToConfirmVisibility.visibility === "Shared" ? "Hide report from patient?" : "Share report with patient?"} description={reportToConfirmVisibility.visibility === "Shared" ? "The patient will no longer see this report in their signed-in clinical record." : "Only this patient’s signed-in app account can view the report. The DHP patient ID alone does not grant access."} submitLabel={updatingReportVisibility ? "Updating…" : reportToConfirmVisibility.visibility === "Shared" ? "Hide report" : "Share report"} submitDisabled={Boolean(updatingReportVisibility) || (reportToConfirmVisibility.visibility !== "Shared" && !patientConsentConfirmed)} onClose={() => { if (!updatingReportVisibility) { setReportToConfirmVisibility(null); setPatientConsentConfirmed(false); } }} onSubmit={() => { void updateReportVisibility(reportToConfirmVisibility); }}>
      <div className="rounded-xl border border-slate-200 bg-[#FAFBFD] p-3"><p className="text-sm font-semibold text-[#1A365D]">{reportToConfirmVisibility.title}</p><p className="mt-1 break-all text-xs text-slate-500">{reportToConfirmVisibility.file_name}</p></div>
      {reportToConfirmVisibility.visibility !== "Shared" && <label className="mt-3 flex cursor-pointer items-start gap-2 rounded-xl border border-teal-100 bg-teal-50/60 p-3 text-xs leading-5 text-teal-950"><input type="checkbox" checked={patientConsentConfirmed} onChange={(event) => setPatientConsentConfirmed(event.target.checked)} className="mt-1 accent-teal-700" /><span>I confirmed with the patient that this report may be shared to their signed-in app account.</span></label>}
      <p className="mt-3 text-xs leading-5 text-slate-500">This grants access only inside the patient’s authenticated app. The DHP code is used to find the record, not to authorize access.</p>
    </Modal>}

    {reportToDelete && <Modal title="Move report to recovery archive?" description="The report and its file will be kept for 30 days. A Super Admin can restore it during that period; after expiry, the backend permanently deletes the database record and stored file." submitLabel={deletingReport ? "Archiving…" : "Archive report"} submitVariant="danger" submitDisabled={Boolean(deletingReport)} onClose={() => { if (!deletingReport) setReportToDelete(null); }} onSubmit={() => { void removePatientReport(reportToDelete); }}>
      <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3"><p className="text-sm font-semibold text-amber-950">{reportToDelete.title}</p><p className="mt-1 break-all text-xs text-amber-900/80">{reportToDelete.file_name} · Patient {patient.patient_code || patientId}</p><p className="mt-2 text-xs leading-5 text-amber-900">Recovery window: 30 days. This report will be hidden from the patient immediately.</p></div>
    </Modal>}

    {photoToDelete && <Modal title="Permanently delete scalp photo?" description="This photo is not kept in the 30-day report archive. It will be removed from this assessment and the stored media file will be permanently deleted." submitLabel={deletingScalpPhoto ? "Deleting…" : "Permanently delete"} submitVariant="danger" submitDisabled={Boolean(deletingScalpPhoto)} onClose={() => { if (!deletingScalpPhoto) setPhotoToDelete(null); }} onSubmit={() => { void removePatientScalpPhoto(photoToDelete); }}>
      <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-3"><p className="text-sm font-semibold text-rose-900">{photoToDelete.fileName}</p><p className="mt-1 text-xs text-rose-800/80">Patient {patient.patient_code || patientId} · Assessment {photoToDelete.assessmentId}</p><p className="mt-2 text-xs font-semibold text-rose-900">This cannot be recovered after confirmation.</p></div>
    </Modal>}

    {reportPreview && <Modal title={reportPreview.report.title} description={`${reportPreview.report.file_name} · ${reportPreview.report.mime_type}`} submitLabel="Open in new tab" hideCancel onClose={() => setReportPreview(null)} onSubmit={() => window.open(reportPreview.url, "_blank", "noopener,noreferrer")}>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100"><iframe title={`Preview: ${reportPreview.report.title}`} src={reportPreview.url} className="h-[min(68vh,720px)] w-full bg-white" /></div>
    </Modal>}

    <FullSizeImageViewer image={imageToView} onClose={() => setImageToView(null)} />

    {routineOpen && <Modal className="care-plan-modal" title="Add routine suggestions" description="Choose the care steps to share with the patient." submitLabel={savingCare ? "Saving…" : "Save routine"} submitDisabled={savingCare || !details.assessments.length} onClose={() => setRoutineOpen(false)} onSubmit={submitRoutineSuggestion}>
      <p className="mb-3 rounded-xl bg-[#F4F8FB] px-3 py-2 text-xs text-slate-600">Linked assessment: <span className="font-semibold text-[#1A365D]">{selectedAssessment || "Select an assessment in the Hair assessment card"}</span></p>
      <CareSearch value={routineSearch} onChange={setRoutineSearch} placeholder="Search routine steps…" />
      {filteredRoutineOptions.length ? <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">{filteredRoutineOptions.map((option) => <ImageChoice key={option.id} selected={selectedRoutineIds.includes(option.id)} title={option.title} detail={`${option.time_of_day} · ${option.category}`} art={option.art} onClick={() => setSelectedRoutineIds((current) => current.includes(option.id) ? current.filter((id) => id !== option.id) : [...current, option.id])} />)}</div> : <p className="mt-3 rounded-xl bg-slate-50 p-4 text-center text-xs text-slate-500">No matching routine options.</p>}
      {customRoutineSteps.map((step, index) => <div key={`custom-routine-${index}`} className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] gap-2 rounded-xl border border-teal-100 bg-teal-50/40 p-3"><div className="grid gap-2 sm:grid-cols-2"><input maxLength={160} value={step.title} onChange={(event) => setCustomRoutineSteps((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, title: event.target.value } : item))} placeholder="Custom step title" className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs" /><select value={step.time_of_day} onChange={(event) => setCustomRoutineSteps((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, time_of_day: event.target.value } : item))} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs"><option>Morning</option><option>Evening</option><option>Night</option><option>Daily</option><option>Weekly</option></select><input maxLength={500} value={step.subtitle} onChange={(event) => setCustomRoutineSteps((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, subtitle: event.target.value } : item))} placeholder="Patient instructions" className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs sm:col-span-2" /></div><button type="button" onClick={() => setCustomRoutineSteps((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="h-9 w-9 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600" aria-label="Remove custom routine step"><X size={15} /></button></div>)}
      <button type="button" className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:text-teal-800" onClick={() => setCustomRoutineSteps((current) => [...current, { title: "", subtitle: "", category: "Custom", time_of_day: "Morning" }])}><Plus size={14} />Add custom routine step</button>
    </Modal>}

    {dietOpen && <Modal className="care-plan-modal" title="Add diet suggestions" description="Choose meal options that fit the patient's assessment and needs." submitLabel={savingCare ? "Saving…" : "Save diet suggestions"} submitDisabled={savingCare || !details.assessments.length} onClose={() => setDietOpen(false)} onSubmit={submitDietSuggestion}>
      <p className="mb-3 rounded-xl bg-[#F4F8FB] px-3 py-2 text-xs text-slate-600">Linked assessment: <span className="font-semibold text-[#1A365D]">{selectedAssessment || "Select an assessment in the Hair assessment card"}</span></p>
      <CareSearch value={dietSearch} onChange={setDietSearch} placeholder="Search meals or nutrients…" />
      {filteredDietOptions.length ? <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">{filteredDietOptions.map((option) => <ImageChoice key={option.id} selected={selectedDietIds.includes(option.id)} title={`${option.type} · ${option.name}`} detail={[option.nutrients, option.benefit].filter(Boolean).join(" · ")} art={option.art} onClick={() => setSelectedDietIds((current) => current.includes(option.id) ? current.filter((id) => id !== option.id) : [...current, option.id])} />)}</div> : <p className="mt-3 rounded-xl bg-slate-50 p-4 text-center text-xs text-slate-500">No matching meal suggestions.</p>}
      {customDietMeals.map((meal, index) => <div key={`custom-meal-${index}`} className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] gap-2 rounded-xl border border-teal-100 bg-teal-50/40 p-3"><div className="grid gap-2 sm:grid-cols-[130px_minmax(0,1fr)]"><select value={meal.type} onChange={(event) => setCustomDietMeals((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, type: event.target.value } : item))} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs"><option>Breakfast</option><option>Lunch</option><option>Snack</option><option>Dinner</option></select><input maxLength={160} value={meal.name} onChange={(event) => setCustomDietMeals((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, name: event.target.value } : item))} placeholder="Meal suggestion" className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs" /><input maxLength={300} value={meal.nutrients} onChange={(event) => setCustomDietMeals((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, nutrients: event.target.value } : item))} placeholder="Nutrients / ingredients" className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs sm:col-span-2" /></div><button type="button" onClick={() => setCustomDietMeals((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="h-9 w-9 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600" aria-label="Remove custom meal"><X size={15} /></button></div>)}
      <button type="button" className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:text-teal-800" onClick={() => setCustomDietMeals((current) => [...current, { type: "Breakfast", name: "", nutrients: "", benefit: "" }])}><Plus size={14} />Add custom meal</button>
    </Modal>}

    {reportOpen && <Modal title="Upload patient report" description="Keep the file private and linked to this patient record." submitLabel={uploadingReport ? "Uploading…" : "Upload private report"} submitDisabled={uploadingReport || !reportFile || !reportTitle.trim()} onClose={() => setReportOpen(false)} onSubmit={() => { void uploadReport(); }}>
      <label className="block text-xs font-semibold text-slate-600">Report name<input autoFocus maxLength={160} value={reportTitle} onChange={(event) => setReportTitle(event.target.value)} placeholder="e.g. Blood test results" className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal" disabled={uploadingReport} /></label>
      <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-[#FAFBFD] p-4 transition hover:border-teal-400"><input id="patient-report-file" type="file" accept="application/pdf,image/jpeg,image/png,image/webp" className="sr-only" disabled={uploadingReport} onChange={(event) => setReportFile(event.target.files?.[0] ?? null)} /><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-teal-700 shadow-sm"><UploadCloud size={19} /></span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold text-slate-700">{reportFile?.name || "Choose a report file"}</span><span className="mt-1 block text-[10px] text-slate-400">PDF, JPG, PNG or WebP · up to 10 MB</span></span>{reportFile && <button type="button" className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-white hover:text-slate-700" onClick={(event) => { event.preventDefault(); event.stopPropagation(); setReportFile(null); const input = document.getElementById("patient-report-file") as HTMLInputElement | null; if (input) input.value = ""; }} aria-label="Remove selected file"><X size={15} /></button>}</label>
    </Modal>}
  </main>;
}

function SectionHeading({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) { return <div className="flex items-start gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#EFF7F8] text-teal-700">{icon}</span><div><h2 className="text-base font-bold text-[#1A365D]">{title}</h2><p className="mt-1 text-xs leading-5 text-slate-500">{subtitle}</p></div></div>; }
function SafetyFact({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-amber-100 bg-white/70 px-3 py-2"><p className="text-[9px] font-bold uppercase tracking-wide text-amber-700/70">{label}</p><p className="mt-1 break-words text-[11px] font-medium leading-4 text-amber-950">{value}</p></div>; }
function IdentityLine({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | number | null }) { return <div className="flex min-w-0 items-start gap-3"><span className="mt-0.5 shrink-0 text-teal-700">{icon}</span><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 break-words text-sm font-medium text-slate-700">{value === null || value === undefined || value === "" ? "Not provided" : value}</p></div></div>; }
function IdentityValue({ label, value }: { label: string; value?: string | number | null }) { return <div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 break-words text-xs font-medium leading-5 text-slate-700">{value === null || value === undefined || value === "" ? "Not provided" : value}</p></div>; }
function CompactMetric({ label, value }: { label: string; value: number }) { return <div className="px-2"><p className="text-base font-bold text-[#1A365D]">{value}</p><p className="mt-0.5 text-[10px] font-medium text-slate-500">{label}</p></div>; }
function CareSearch({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) { return <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-400 focus-within:border-teal-400 focus-within:ring-2 focus-within:ring-teal-50"><Search size={15} className="shrink-0" /><span className="sr-only">Search options</span><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="min-w-0 flex-1 border-0 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400" /></label>; }
function EmptyState({ icon, title, detail }: { icon: React.ReactNode; title: string; detail: string }) { return <div className="mt-4 grid justify-items-center rounded-xl border border-dashed border-slate-200 px-5 py-7 text-center"><span className="text-slate-300">{icon}</span><p className="mt-2 text-sm font-semibold text-slate-600">{title}</p><p className="mt-1 max-w-sm text-xs leading-5 text-slate-400">{detail}</p></div>; }
