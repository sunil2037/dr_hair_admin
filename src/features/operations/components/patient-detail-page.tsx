"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, CalendarDays, ClipboardList, Download, FileCheck2, FileText, LoaderCircle, LockKeyhole, MapPin, Phone, Pill, Save, ShieldCheck, Stethoscope, UploadCloud, UserRound, X } from "lucide-react";
import type { Role } from "../../shared/types";

type Patient = { id: number | string; name: string; email?: string; phone?: string; age?: number | null; gender?: string | null; city?: string | null; occupation?: string | null; profile_url?: string | null; created_at?: string };
type Assessment = Record<string, unknown> & { id: string | number; reference_no?: string; created_at?: string; scalp_photos?: { file_name?: string; url?: string }[] };
type Treatment = { id: string | number; reference_no?: string; treatment_name: string; duration?: string; instructions?: string; doctor_name?: string; date?: string };
type Report = { id: string; title: string; file_name: string; mime_type: string; format: string; bytes: number; uploaded_by?: string; created_at: string };
type PatientDetails = { patient: Patient; assessments: Assessment[]; treatments: Treatment[]; reports: Report[] };

const profileFields = [
  { key: "name", label: "Full name", type: "text" },
  { key: "age", label: "Age", type: "number" },
  { key: "gender", label: "Gender", type: "text" },
  { key: "city", label: "City", type: "text" },
  { key: "occupation", label: "Occupation", type: "text" },
] as const;

const assessmentFields: { key: string; label: string }[] = [
  { key: "hair_fall_start", label: "Hair fall started" }, { key: "hair_fall_pattern", label: "Pattern noticed" },
  { key: "daily_hair_fall", label: "Daily hair fall" }, { key: "hair_fall_increasing", label: "Increasing recently" },
  { key: "dandruff", label: "Dandruff" }, { key: "scalp_condition", label: "Scalp condition" },
  { key: "scalp_symptoms", label: "Scalp symptoms" }, { key: "hair_type", label: "Hair type" },
  { key: "medical_conditions", label: "Medical conditions" }, { key: "recent_events", label: "Recent events" },
  { key: "stress_level", label: "Stress level" }, { key: "sleep_quality", label: "Sleep" },
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
  return "Not provided";
}
function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(date);
}
function isRecord(value: unknown): value is Record<string, unknown> { return Boolean(value && typeof value === "object"); }

export function PatientDetailPage({ patientId, role, onToast, onAudit }: { patientId: string; role: Role; onToast: (message: string) => void; onAudit: (action: string, target: string) => void }) {
  const router = useRouter();
  const [details, setDetails] = useState<PatientDetails | null>(null);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");
  const [profile, setProfile] = useState<Partial<Patient>>({});
  const [savingProfile, setSavingProfile] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState("");
  const [treatmentName, setTreatmentName] = useState("");
  const [treatmentDuration, setTreatmentDuration] = useState("");
  const [treatmentInstructions, setTreatmentInstructions] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [savingTreatment, setSavingTreatment] = useState(false);
  const [reportTitle, setReportTitle] = useState("");
  const [reportFile, setReportFile] = useState<File | null>(null);
  const [uploadingReport, setUploadingReport] = useState(false);
  const [downloadingReport, setDownloadingReport] = useState<string | null>(null);
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
        assessments: Array.isArray(data.assessments) ? data.assessments as Assessment[] : [],
        treatments: Array.isArray(data.treatments) ? data.treatments as Treatment[] : [],
        reports: Array.isArray(data.reports) ? data.reports as Report[] : [],
      };
      setDetails(next);
      setProfile(next.patient);
      setSelectedAssessment((current) => current || String(next.assessments[0]?.reference_no ?? ""));
      setLoadState("ready");
    } catch (cause) {
      if (signal?.aborted) return;
      setError(cause instanceof Error ? cause.message : "Patient details could not be loaded.");
      setLoadState("error");
    }
  }, [patientId]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => { void loadPatient(controller.signal); }, 0);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [loadPatient]);

  const saveProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canWrite || !details) return;
    setSavingProfile(true);
    try {
      const body = { name: profile.name, age: profile.age == null ? null : Number(profile.age), gender: profile.gender || null, city: profile.city || null, occupation: profile.occupation || null };
      const response = await fetch(`/api/admin/users/${encodeURIComponent(patientId)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), cache: "no-store" });
      const result: unknown = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(messageFrom(result, "Patient profile could not be saved."));
      await loadPatient();
      onAudit("updated patient profile", `Patient ${patientId}`);
      onToast("Patient profile updated.");
    } catch (cause) {
      onToast(cause instanceof Error ? cause.message : "Patient profile could not be saved.");
    } finally { setSavingProfile(false); }
  };

  const submitTreatment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canWrite || !selectedAssessment || !treatmentName.trim()) return;
    setSavingTreatment(true);
    try {
      const response = await fetch("/api/admin/treatments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reference_no: selectedAssessment, treatment_name: treatmentName.trim(), duration: treatmentDuration.trim(), instructions: treatmentInstructions.trim(), doctor_name: doctorName.trim() }), cache: "no-store" });
      const result: unknown = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(messageFrom(result, "Treatment suggestion could not be saved."));
      const data = isRecord(result) && isRecord(result.data) ? result.data : null;
      if (data) setDetails((current) => current ? { ...current, treatments: [data as unknown as Treatment, ...current.treatments] } : current);
      setTreatmentName(""); setTreatmentDuration(""); setTreatmentInstructions("");
      onAudit("added treatment suggestion", `Patient ${patientId} · ${selectedAssessment}`);
      onToast("Treatment suggestion saved to this assessment.");
    } catch (cause) {
      onToast(cause instanceof Error ? cause.message : "Treatment suggestion could not be saved.");
    } finally { setSavingTreatment(false); }
  };

  const uploadReport = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canWrite || !reportFile || !reportTitle.trim()) return;
    setUploadingReport(true);
    try {
      const body = new FormData(); body.set("title", reportTitle.trim()); body.set("file", reportFile);
      const response = await fetch(`/api/admin/users/${encodeURIComponent(patientId)}/reports`, { method: "POST", body, cache: "no-store" });
      const result: unknown = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(messageFrom(result, "Report upload failed."));
      const data = isRecord(result) && isRecord(result.data) ? result.data as unknown as Report : null;
      if (data) setDetails((current) => current ? { ...current, reports: [data, ...current.reports] } : current);
      setReportTitle(""); setReportFile(null);
      const input = document.getElementById("patient-report-file") as HTMLInputElement | null; if (input) input.value = "";
      onAudit("uploaded private patient report", `Patient ${patientId}`);
      onToast("Report uploaded to private patient storage.");
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

  if (loadState === "loading") return <main className="page-wrap mx-auto w-full max-w-[1420px] p-4 sm:p-6 lg:p-8"><div className="card flex min-h-64 items-center justify-center gap-3 text-sm text-slate-500"><LoaderCircle className="animate-spin" size={18} />Loading patient record…</div></main>;
  if (loadState === "error" || !details) return <main className="page-wrap mx-auto w-full max-w-[1420px] p-4 sm:p-6 lg:p-8"><button className="button button-secondary mb-4" onClick={() => router.push("/patients")}><ArrowLeft size={15} />Back to patients</button><div className="card border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800" role="alert">{error}<button className="button button-secondary ml-3" onClick={() => void loadPatient()}>Retry</button></div></main>;

  const patient = details.patient;
  const initials = patient.name.split(/\s+/).map((part) => part[0] || "").join("").slice(0, 2).toUpperCase();
  const latestAssessment = details.assessments[0];

  return <main className="page-wrap mx-auto w-full max-w-[1420px] space-y-5 p-4 sm:p-6 lg:p-8">
    <button className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-[#1A365D]" onClick={() => router.push("/patients")}><ArrowLeft size={16} />Patients <span className="text-slate-300">/</span> Patient record</button>

    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="h-2 bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-600" />
      <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
        <div className="flex min-w-0 items-center gap-4">
          {patient.profile_url?.startsWith("https://") ? <Image src={patient.profile_url} alt="" width={64} height={64} unoptimized className="h-16 w-16 shrink-0 rounded-2xl object-cover ring-4 ring-teal-50" /> : <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-[#E9F5F4] text-xl font-bold text-[#0F766E] ring-4 ring-teal-50">{initials || <UserRound size={25} />}</div>}
          <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h1 className="truncate text-2xl font-bold tracking-tight text-[#1A365D] sm:text-3xl">{patient.name}</h1><span className="inline-flex items-center gap-1 rounded-full border border-teal-100 bg-teal-50 px-2.5 py-1 text-[11px] font-semibold text-teal-800"><ShieldCheck size={12} />Patient</span></div>
            <p className="mt-1 truncate text-sm text-slate-500">Patient ID <span className="font-mono font-semibold text-slate-700">{patient.id}</span></p>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-500"><span className="inline-flex items-center gap-1.5"><CalendarDays size={13} />Joined {formatDate(patient.created_at)}</span>{patient.city && <span className="inline-flex items-center gap-1.5"><MapPin size={13} />{patient.city}</span>}{patient.phone && <span className="inline-flex items-center gap-1.5"><Phone size={13} />{patient.phone}</span>}</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:min-w-[330px]">
          <Metric label="Assessments" value={details.assessments.length} icon={<ClipboardList size={14} />} />
          <Metric label="Treatments" value={details.treatments.length} icon={<Pill size={14} />} />
          <Metric label="Reports" value={details.reports.length} icon={<FileCheck2 size={14} />} />
        </div>
      </div>
    </section>

    {!canWrite && <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900"><LockKeyhole size={15} className="mt-0.5 shrink-0" />This account can view patient records. A Super Admin can edit the profile, upload reports, and add treatment suggestions.</div>}

    <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[0.9fr_1.1fr]">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <SectionHeading icon={<UserRound size={17} />} title="Patient profile" subtitle="The same personal details used in the mobile app." />
        <form onSubmit={saveProfile} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {profileFields.map((field) => <label key={field.key} className="block text-xs font-semibold text-slate-600">{field.label}
              <input className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal text-slate-800 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100 disabled:bg-slate-50 disabled:text-slate-500" type={field.type} min={field.type === "number" ? 1 : undefined} max={field.type === "number" ? 120 : undefined} value={String(profile[field.key] ?? "")} disabled={!canWrite || savingProfile} onChange={(event) => setProfile((current) => ({ ...current, [field.key]: field.key === "age" ? (event.target.value ? Number(event.target.value) : null) : event.target.value }))} />
            </label>)}
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><ReadOnlyField label="Verified email" value={patient.email || "Not provided"} /><ReadOnlyField label="Verified phone" value={patient.phone || "Not provided"} /></div>
          {canWrite && <div className="flex justify-end border-t border-slate-100 pt-4"><button className="button button-primary" type="submit" disabled={savingProfile}>{savingProfile ? <LoaderCircle size={15} className="animate-spin" /> : <Save size={15} />}Save profile</button></div>}
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <SectionHeading icon={<ClipboardList size={17} />} title="Hair assessment" subtitle="Answers and scalp photos submitted in the Dr. Hair app." />
        {details.assessments.length > 0 ? <>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 p-3"><div><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Latest assessment</p><p className="mt-0.5 font-mono text-sm font-semibold text-[#1A365D]">{latestAssessment?.reference_no || `Assessment ${latestAssessment?.id}`}</p></div><span className="text-xs text-slate-500">{formatDate(latestAssessment?.created_at)}</span></div>
          <div className="mt-4 grid grid-cols-1 gap-x-5 gap-y-3 sm:grid-cols-2">{assessmentFields.map(({ key, label }) => <div key={key} className="min-w-0 border-b border-slate-100 pb-2.5"><p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 break-words text-sm text-slate-700">{displayValue(latestAssessment?.[key])}</p></div>)}</div>
          {(latestAssessment?.scalp_photos?.length ?? 0) > 0 && <div className="mt-5"><h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Scalp photos · {latestAssessment?.scalp_photos?.length}</h3><div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{latestAssessment?.scalp_photos?.map((photo, index) => <a key={`${photo.url}-${index}`} href={photo.url?.startsWith("https://") ? photo.url : undefined} target="_blank" rel="noreferrer" className={`overflow-hidden rounded-xl border border-slate-200 bg-slate-50 ${photo.url?.startsWith("https://") ? "hover:border-teal-400" : "pointer-events-none"}`}><div className="relative grid aspect-[4/3] place-items-center bg-slate-100 text-slate-400">{photo.url?.startsWith("https://") ? <Image src={photo.url} alt={photo.file_name || `Scalp photo ${index + 1}`} fill unoptimized className="object-cover" /> : <FileText size={22} />}</div><p className="truncate px-2 py-2 text-[11px] text-slate-600">{photo.file_name || `Scalp image ${index + 1}`}</p></a>)}</div></div>}
        </> : <EmptyState icon={<ClipboardList size={20} />} title="No assessment submitted" detail="The patient has not submitted a hair assessment in the mobile app yet." />}
        {details.assessments.length > 1 && <details className="mt-5 rounded-lg border border-slate-200"><summary className="cursor-pointer px-3 py-2.5 text-xs font-semibold text-slate-600">View {details.assessments.length - 1} earlier assessment{details.assessments.length === 2 ? "" : "s"}</summary><div className="space-y-2 border-t border-slate-100 p-3">{details.assessments.slice(1).map((assessment) => <div key={assessment.id} className="flex flex-wrap justify-between gap-2 text-xs"><span className="font-mono font-semibold text-[#1A365D]">{assessment.reference_no || assessment.id}</span><span className="text-slate-500">{formatDate(assessment.created_at)} · {displayValue(assessment.main_concern)}</span></div>)}</div></details>}
      </section>
    </div>

    <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-2">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <SectionHeading icon={<Stethoscope size={17} />} title="Treatment suggestion" subtitle="Saved against an assessment and returned by the existing mobile treatment-history API." />
        {canWrite && <form onSubmit={submitTreatment} className="mt-5 space-y-3 rounded-xl border border-teal-100 bg-teal-50/50 p-4">
          <label className="block text-xs font-semibold text-slate-600">Assessment reference<select required value={selectedAssessment} onChange={(event) => setSelectedAssessment(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm" disabled={!details.assessments.length || savingTreatment}><option value="">Choose assessment</option>{details.assessments.map((item) => <option key={item.id} value={String(item.reference_no ?? "")}>{item.reference_no || `Assessment ${item.id}`} · {formatDate(item.created_at)}</option>)}</select></label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><label className="block text-xs font-semibold text-slate-600">Treatment / prescription name<input required maxLength={160} value={treatmentName} onChange={(event) => setTreatmentName(event.target.value)} placeholder="e.g. Scalp care routine" className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal" disabled={!details.assessments.length || savingTreatment} /></label><label className="block text-xs font-semibold text-slate-600">Duration<input maxLength={100} value={treatmentDuration} onChange={(event) => setTreatmentDuration(event.target.value)} placeholder="e.g. 8 weeks" className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal" disabled={savingTreatment} /></label></div>
          <label className="block text-xs font-semibold text-slate-600">Doctor / clinician name<input maxLength={120} value={doctorName} onChange={(event) => setDoctorName(event.target.value)} placeholder="Name shown in the app" className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal" disabled={savingTreatment} /></label>
          <label className="block text-xs font-semibold text-slate-600">Directions and notes<textarea maxLength={2000} rows={3} value={treatmentInstructions} onChange={(event) => setTreatmentInstructions(event.target.value)} placeholder="Enter the clinician’s instructions for the patient" className="mt-1.5 w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal" disabled={!details.assessments.length || savingTreatment} /></label>
          <div className="flex justify-end"><button type="submit" className="button button-primary" disabled={!details.assessments.length || savingTreatment}>{savingTreatment ? <LoaderCircle size={15} className="animate-spin" /> : <Pill size={15} />}Save suggestion</button></div>
          {!details.assessments.length && <p className="text-xs text-amber-800">A treatment can be linked after the patient submits an assessment.</p>}
        </form>}
        <div className="mt-5 space-y-3">{details.treatments.length ? details.treatments.map((treatment) => <article key={treatment.id} className="rounded-xl border border-slate-200 p-4"><div className="flex flex-wrap items-start justify-between gap-2"><div className="min-w-0"><h3 className="font-semibold text-[#1A365D]">{treatment.treatment_name}</h3><p className="mt-1 text-[11px] text-slate-500">{treatment.reference_no || "Assessment"} · {treatment.duration || "Duration not set"}</p></div><span className="rounded-full bg-teal-50 px-2 py-1 text-[10px] font-semibold text-teal-800">{formatDate(treatment.date)}</span></div>{treatment.instructions && <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">{treatment.instructions}</p>}{treatment.doctor_name && <p className="mt-2 text-xs text-slate-400">Added by {treatment.doctor_name}</p>}</article>) : <EmptyState icon={<Pill size={20} />} title="No treatment suggestions" detail="Suggestions added here will be linked to the selected hair assessment." />}</div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <SectionHeading icon={<FileCheck2 size={17} />} title="Reports & documents" subtitle="Patient files are uploaded as private authenticated Cloudinary assets." />
        {canWrite && <form onSubmit={uploadReport} className="mt-5 space-y-3 rounded-xl border border-dashed border-teal-300 bg-teal-50/40 p-4">
          <label className="block text-xs font-semibold text-slate-600">Report name<input required maxLength={160} value={reportTitle} onChange={(event) => setReportTitle(event.target.value)} placeholder="e.g. Blood test results · Oct 2026" className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal" disabled={uploadingReport} /></label>
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 hover:border-teal-400"><input id="patient-report-file" type="file" accept="application/pdf,image/jpeg,image/png,image/webp" className="sr-only" disabled={uploadingReport} onChange={(event) => setReportFile(event.target.files?.[0] ?? null)} /><span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-teal-50 text-teal-700"><UploadCloud size={18} /></span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold text-slate-700">{reportFile?.name || "Choose report file"}</span><span className="mt-1 block text-[10px] text-slate-400">PDF, JPG, PNG or WebP · max 10 MB</span></span>{reportFile && <button type="button" className="grid h-7 w-7 place-items-center rounded-md text-slate-400 hover:bg-slate-100" onClick={(event) => { event.preventDefault(); event.stopPropagation(); setReportFile(null); const input = document.getElementById("patient-report-file") as HTMLInputElement | null; if (input) input.value = ""; }} aria-label="Remove selected file"><X size={14} /></button>}</label>
          <div className="flex justify-end"><button type="submit" className="button button-primary" disabled={!reportFile || !reportTitle.trim() || uploadingReport}>{uploadingReport ? <LoaderCircle size={15} className="animate-spin" /> : <UploadCloud size={15} />}Upload private report</button></div>
        </form>}
        <div className="mt-5 space-y-2">{details.reports.length ? details.reports.map((report) => <article key={report.id} className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 p-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-indigo-50 text-indigo-700"><FileText size={18} /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-800">{report.title}</p><p className="mt-1 truncate text-[10px] text-slate-500">{report.file_name} · {(report.bytes / 1024).toFixed(0)} KB · {formatDate(report.created_at)}</p><p className="mt-1 text-[10px] text-slate-400">Private · uploaded by {report.uploaded_by || "clinic"}</p></div><button type="button" title="Download report" aria-label={`Download ${report.title}`} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:border-teal-300 hover:text-teal-700 disabled:opacity-50" disabled={downloadingReport === report.id} onClick={() => void downloadReport(report)}>{downloadingReport === report.id ? <LoaderCircle size={15} className="animate-spin" /> : <Download size={15} />}</button></article>) : <EmptyState icon={<FileText size={20} />} title="No reports uploaded" detail="Private reports for this patient will be listed here." />}</div>
      </section>
    </div>
  </main>;
}

function SectionHeading({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) { return <div className="flex items-start gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#EFF7F8] text-teal-700">{icon}</span><div><h2 className="text-base font-bold text-[#1A365D]">{title}</h2><p className="mt-1 text-xs leading-5 text-slate-500">{subtitle}</p></div></div>; }
function Metric({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) { return <div className="rounded-xl border border-slate-100 bg-slate-50 px-2 py-2.5 text-center"><div className="flex items-center justify-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">{icon}{label}</div><p className="mt-1 text-lg font-bold text-[#1A365D]">{value}</p></div>; }
function ReadOnlyField({ label, value }: { label: string; value: string }) { return <div className="min-w-0 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5"><p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label} · verified</p><p className="mt-1 truncate text-sm text-slate-600">{value}</p></div>; }
function EmptyState({ icon, title, detail }: { icon: React.ReactNode; title: string; detail: string }) { return <div className="mt-4 grid justify-items-center rounded-xl border border-dashed border-slate-200 px-5 py-7 text-center"><span className="text-slate-300">{icon}</span><p className="mt-2 text-sm font-semibold text-slate-600">{title}</p><p className="mt-1 max-w-sm text-xs leading-5 text-slate-400">{detail}</p></div>; }
