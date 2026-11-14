"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, Archive, LoaderCircle, RotateCcw } from "lucide-react";
import { Modal } from "../../shared/components/ui";
import type { AdminPermissionId } from "../../shared/types";

type Assessment = Record<string, unknown> & {
  id: number | string;
  reference_no?: string;
  status?: string;
  ai_assessment_status?: string;
  ai_assessment?: Record<string, unknown> | null;
  created_at?: string;
  scalp_photos?: { file_name?: string; url?: string; angle?: string }[];
};

const labels: Record<string, string> = {
  full_name: "Patient name", age: "Age", gender: "Gender", city: "City", occupation: "Occupation",
  primary_concern: "Main concern", main_concern: "Main concern", hair_loss_stage: "Stage selected", stage: "Stage selected",
  duration: "Duration", hair_fall_start: "Hair fall started", hair_fall_pattern: "Pattern noticed", daily_hair_fall: "Daily hair fall",
  hair_fall_increasing: "Hair fall increasing", dandruff: "Dandruff", scalp_condition: "Scalp condition", scalp_symptoms: "Scalp symptoms",
  hair_type: "Hair type", stress_level: "Stress level", gut_health: "Gut health", sleep_quality: "Sleep quality", diet_type: "Diet",
  protein_intake: "Protein intake", family_history: "Family history", medical_conditions: "Medical conditions", recent_events: "Recent events",
  allergy_status: "Allergy status", allergy_details: "Allergy details", current_medications_status: "Current medicines status",
  current_medications: "Current medicines and supplements", have_taken_treatment: "Previous treatment", previous_treatments: "Treatments tried",
  treatment_results: "Treatment results", looking_for: "Looking for",
};
const systemFields = new Set([
  "id", "userId", "reference_no", "status", "status_history", "created_at", "updated_at", "scalp_photos",
  "ai_assessment", "ai_assessment_status", "ai_assessment_error", "ai_assessment_updated_at", "ai_assessment_queued_at",
]);
const readable = (value: unknown): string => {
  if (value === null || value === undefined || value === "") return "Not provided";
  if (Array.isArray(value)) return value.map(readable).join(", ");
  if (typeof value === "object") return Object.entries(value as Record<string, unknown>).map(([key, item]) => `${key}: ${readable(item)}`).join(" · ");
  return String(value);
};

export function PatientAssessmentDetailPage({ patientId, referenceNo, permissions, onToast, onAudit }: {
  patientId: string;
  referenceNo: string;
  permissions: AdminPermissionId[];
  onToast: (message: string) => void;
  onAudit: (action: string, target: string) => void;
}) {
  const router = useRouter();
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [patientName, setPatientName] = useState("Patient");
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [confirmAction, setConfirmAction] = useState<"archive" | "restore" | null>(null);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const canManage = permissions.includes("assessments.review") || permissions.includes("hair-tests.upload");

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/admin/users/${encodeURIComponent(patientId)}`, { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result?.message || "Could not load this assessment.");
        const data = result?.data;
        if (data?.patient?.name) setPatientName(String(data.patient.name));
        const match = (Array.isArray(data?.assessments) ? data.assessments : []).find((item: Assessment) => String(item.reference_no) === referenceNo);
        if (!match) throw new Error("Assessment not found in this patient's record.");
        setAssessment(match);
        setLoadState("ready");
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setLoadState("error");
          onToast(error instanceof Error ? error.message : "Could not load this assessment.");
        }
      });
    return () => controller.abort();
  }, [onToast, patientId, referenceNo]);

  const answers = useMemo(() => assessment ? Object.entries(assessment)
    .filter(([key, value]) => !systemFields.has(key) && value !== null && value !== undefined && value !== "")
    .map(([key, value]) => ({ label: labels[key] || key.replaceAll("_", " "), value: readable(value) })) : [], [assessment]);
  const aiDetails = useMemo(() => assessment?.ai_assessment ? Object.entries(assessment.ai_assessment)
    .filter(([key, value]) => key !== "generated_by" && value !== null && value !== undefined && value !== "")
    .map(([key, value]) => ({ label: key.replaceAll("_", " "), value: readable(value) })) : [], [assessment]);

  const changeStatus = async () => {
    if (!assessment || !confirmAction || reason.trim().length < 8 || saving) return;
    const nextStatus = confirmAction === "archive" ? "archived" : "submitted";
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/hair-tests/${encodeURIComponent(referenceNo)}/status`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus, note: reason.trim() }), cache: "no-store",
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result?.message || "Assessment status could not be changed.");
      setAssessment((current) => current ? { ...current, status: nextStatus } : current);
      onAudit(confirmAction === "archive" ? "archived patient assessment" : "restored patient assessment", `${patientId} · ${referenceNo}`);
      onToast(confirmAction === "archive" ? "Assessment archived; admins can still view it in patient history." : "Assessment restored to patient history.");
      setConfirmAction(null);
      setReason("");
    } catch (error) {
      onToast(error instanceof Error ? error.message : "Assessment status could not be changed.");
    } finally {
      setSaving(false);
    }
  };

  if (loadState === "loading") return <main className="page-wrap flex min-h-64 items-center justify-center gap-3 text-sm text-slate-500"><LoaderCircle className="animate-spin" size={18} />Loading assessment…</main>;
  if (loadState === "error" || !assessment) return <main className="page-wrap"><section className="card border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800">Assessment could not be loaded. <button className="button button-secondary ml-2" onClick={() => router.push(`/patients/${encodeURIComponent(patientId)}`)}>Back to patient record</button></section></main>;

  const archived = assessment.status === "archived";
  const aiStatus = String(assessment.ai_assessment_status || (assessment.ai_assessment ? "ready" : "not_available"));
  return <main className="page-wrap w-full min-w-0 space-y-5">
    <button className="button button-secondary" onClick={() => router.push(`/patients/${encodeURIComponent(patientId)}`)}><ArrowLeft size={15} />Back to patient history</button>
    <section className="card space-y-5">
      <header className="flex flex-col gap-3 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Uploaded patient assessment</p><h1 className="mt-1 text-xl font-extrabold text-[#1A365D]">{patientName}</h1><p className="mt-1 font-mono text-sm text-slate-600">{referenceNo} · {assessment.created_at ? new Date(assessment.created_at).toLocaleString("en-IN") : "Submission date unavailable"}</p></div>
        <div className="flex flex-wrap gap-2"><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-800">{String(assessment.status || "submitted").replaceAll("_", " ")}</span><span className={`rounded-full px-3 py-1 text-xs font-bold ${aiStatus === "ready" ? "bg-emerald-50 text-emerald-800" : aiStatus === "failed" ? "bg-rose-50 text-rose-800" : aiStatus === "queued" || aiStatus === "processing" ? "bg-amber-50 text-amber-800" : "bg-slate-100 text-slate-600"}`}>AI: {aiStatus.replaceAll("_", " ")}</span></div>
      </header>
      <div><h2 className="text-sm font-bold text-slate-800">Assessment answers</h2>{answers.length ? <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">{answers.map((answer) => <div key={answer.label} className="min-w-0 rounded-xl border border-slate-100 bg-slate-50 p-3"><dt className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{answer.label}</dt><dd className="mt-1 break-words text-sm text-slate-800">{answer.value}</dd></div>)}</dl> : <p className="mt-2 text-sm text-slate-500">No submitted answers were included.</p>}</div>
      <div><h2 className="text-sm font-bold text-slate-800">Scalp photos ({assessment.scalp_photos?.length || 0})</h2>{assessment.scalp_photos?.length ? <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">{assessment.scalp_photos.map((photo, index) => <a key={`${photo.file_name || index}`} href={photo.url} target="_blank" rel="noreferrer" className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50"><div className="relative aspect-[4/3] w-full"><Image src={photo.url || ""} alt={`${photo.angle || `Scalp photo ${index + 1}`} uploaded for assessment`} fill unoptimized className="object-cover" /></div><p className="px-3 py-2 text-xs font-semibold capitalize text-slate-600">{photo.angle || `Photo ${index + 1}`} · open full image</p></a>)}</div> : <p className="mt-2 text-sm text-slate-500">No scalp photos were attached.</p>}</div>
      {assessment.ai_assessment && <div className="rounded-xl border border-teal-100 bg-teal-50/50 p-4"><h2 className="text-sm font-bold text-teal-950">Assistant result</h2><dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">{aiDetails.map((item) => <div key={item.label} className="min-w-0 rounded-xl border border-teal-100 bg-white/70 p-3"><dt className="text-[10px] font-bold uppercase tracking-wide text-teal-700">{item.label}</dt><dd className="mt-1 break-words whitespace-pre-wrap text-sm leading-5 text-teal-950">{item.value}</dd></div>)}</dl></div>}
      {canManage && <div className="flex justify-end border-t border-slate-100 pt-4">{archived ? <button className="button button-primary" onClick={() => { setReason(""); setConfirmAction("restore"); }}><RotateCcw size={15} />Restore to patient history</button> : <button className="button button-danger" onClick={() => { setReason(""); setConfirmAction("archive"); }}><Archive size={15} />Archive assessment</button>}</div>}
    </section>
    {confirmAction && <Modal title={confirmAction === "archive" ? "Archive this assessment?" : "Restore this assessment?"} description={confirmAction === "archive" ? "This hides the assessment from the patient's app history. Admins can still find it in patient history. The assessment and photos are not permanently deleted." : "This makes the assessment visible in the patient's app history again."} submitLabel={saving ? "Saving…" : confirmAction === "archive" ? "Archive assessment" : "Restore assessment"} submitVariant={confirmAction === "archive" ? "danger" : "primary"} submitDisabled={saving || reason.trim().length < 8} onClose={() => !saving && setConfirmAction(null)} onSubmit={() => void changeStatus()}>
      <label className="block text-xs font-semibold text-slate-700">Reason<textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={3} maxLength={300} className="mt-2 w-full rounded-xl border border-slate-200 p-3 text-sm" placeholder="Enter at least 8 characters for the audit history" /></label>
      <p className="mt-2 text-xs text-slate-500">The action and reason are recorded in assessment status history and the admin audit log.</p>
    </Modal>}
  </main>;
}
