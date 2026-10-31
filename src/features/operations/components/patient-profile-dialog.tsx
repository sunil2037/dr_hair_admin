"use client";

import { useEffect, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  FileUp,
  HeartPulse,
  History,
  Image as ImageIcon,
  Maximize2,
  MessageCircle,
  Phone,
  Pill,
  Plus,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserRound,
  ZoomIn,
} from "lucide-react";
import { Modal, StatusPill } from "../../shared/components/ui";
import { FullSizeImageViewer } from "../../shared/components/full-size-image-viewer";
import type { AdminPermissionId, PatientRecord } from "../../shared/types";
import type {
  CareRoutineStep,
  DietMealPlan,
  PatientClinicalProfile,
  PatientReport,
  PrescribedProduct,
  PrescriptionPlan,
  ProgressCheckInEntry,
  PatientDocument,
  ScalpPhoto,
} from "../types";

type PatientTab = "overview" | "prescribe" | "progress" | "reports" | "documents" | "history";

const profileTabs: { id: PatientTab; label: string; icon: typeof UserRound; badge?: string }[] = [
  { id: "overview", label: "Overview", icon: UserRound },
  { id: "prescribe", label: "Prescribe Regimen", icon: Pill, badge: "Action" },
  { id: "progress", label: "Progress & Photos", icon: Activity },
  { id: "reports", label: "Reports", icon: FileText },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "history", label: "Medical history", icon: History },
];

const availableProducts: { id: string; name: string; category: string; defaultDose: string }[] = [
  { id: "PRD-101", name: "Follicle Booster Serum (5% Procapil + Redensyl)", category: "Topical Regrowth", defaultDose: "1 ml nightly" },
  { id: "PRD-102", name: "Scalp Balance Anti-Dandruff Shampoo", category: "Scalp Health", defaultDose: "Alternate days (3x weekly)" },
  { id: "PRD-103", name: "Saw Palmetto & Biotin Complex Tablets", category: "Oral Nutrition", defaultDose: "1 tablet after breakfast" },
  { id: "PRD-104", name: "Scalp Micro-Needling Roller (0.5mm)", category: "Regrowth Tool", defaultDose: "Once weekly before serum" },
  { id: "PRD-105", name: "Keratin & Peptide Repair Conditioner", category: "Shaft Strength", defaultDose: "Twice weekly after shampoo" },
];

export function PatientProfileDialog({
  patient,
  notifications,
  profile,
  permissions,
  onClose,
  onSendReport,
  onUpdateProfile,
  onAudit,
  onQueueDocumentNotice,
  onToast,
}: {
  patient: PatientRecord;
  notifications: string[];
  profile: PatientClinicalProfile;
  permissions: AdminPermissionId[];
  onClose: () => void;
  onSendReport: (patient: PatientRecord, report: PatientReport) => void;
  onUpdateProfile: (patientId: string, updated: PatientClinicalProfile) => void;
  onAudit: (action: string, target: string) => void;
  onQueueDocumentNotice: (patient: PatientRecord, document: PatientDocument) => void;
  onToast: (message: string) => void;
}) {
  const canViewOverview = permissions.some((permission) => ["patients.view", "assessments.review", "progress.review", "care-plans.edit"].includes(permission));
  const canViewIdentityDetails = permissions.includes("patients.view");
  const [activeTab, setActiveTab] = useState<PatientTab>(canViewOverview ? "overview" : "documents");
  const [selectedDocument, setSelectedDocument] = useState<File | null>(null);
  const [documentCategory, setDocumentCategory] = useState<PatientDocument["category"]>("Lab result");
  const [lightboxPhoto, setLightboxPhoto] = useState<ScalpPhoto | null>(null);
  const [previewReport, setPreviewReport] = useState<PatientReport | null>(null);
  const [previewDocument, setPreviewDocument] = useState<PatientDocument | null>(null);

  const canPrescribe = permissions.includes("care-plans.edit");
  const canReviewProgress = permissions.includes("progress.review");
  const canViewDocuments = permissions.some((permission) => ["documents.view", "documents.upload", "documents.share"].includes(permission));
  const canShareReports = permissions.includes("reports.share");
  const visibleTabs = profileTabs.filter(({ id }) => (id === "overview" && canViewOverview)
    || (id === "prescribe" && canPrescribe)
    || (id === "progress" && canReviewProgress)
    || (id === "reports" && permissions.some((permission) => ["patients.view", "reports.approve", "reports.share"].includes(permission)))
    || (id === "documents" && canViewDocuments)
    || (id === "history" && permissions.includes("patients.view")));
  const resolvedActiveTab = visibleTabs.some((tab) => tab.id === activeTab) ? activeTab : visibleTabs[0]?.id ?? "overview";

  const readyReports = profile.reports.filter((report) => report.status === "Ready");
  const reportToSend = readyReports.find((report) => !notifications.includes(`${patient.id}:${report.id}`));
  const sentCount = readyReports.filter((report) => notifications.includes(`${patient.id}:${report.id}`)).length;

  const handleSavePrescription = (newPlan: PrescriptionPlan) => {
    const updatedProfile: PatientClinicalProfile = {
      ...profile,
      prescriptionPlan: newPlan,
      diagnoses: [
        {
          date: "Today",
          name: newPlan.diagnosis,
          stage: newPlan.stage,
          note: newPlan.instructions,
          clinician: newPlan.doctorName,
        },
        ...profile.diagnoses,
      ],
      medications: newPlan.products.map((p) => ({
        name: p.name,
        dose: p.dose,
        frequency: p.frequency,
        status: "Current" as const,
      })),
      reports: [
        {
          id: `RPT-${Math.floor(1000 + Math.random() * 9000)}`,
          title: `Custom Regimen & Clinical Diagnosis · ${newPlan.stage}`,
          date: "Today",
          status: "Ready",
          summary: `${newPlan.diagnosis}. ${newPlan.duration} targeted care protocol prescribed by ${newPlan.doctorName}.`,
        },
        ...profile.reports,
      ],
    };

    onUpdateProfile(patient.id, updatedProfile);
    onAudit("updated care plan for", `${patient.id} · ${patient.name}`);
    setActiveTab("overview");
  };

  const handleApproveProgress = (checkInId: string, doctorNote: string, densityRating: number) => {
    const updatedProgress = profile.progress.map((item) => {
      if (item.id === checkInId) {
        return {
          ...item,
          doctorReviewed: true,
          doctorNote: doctorNote.trim() || "Clinician reviewed and approved progress.",
          densityRating,
        };
      }
      return item;
    });

    const updatedProfile: PatientClinicalProfile = {
      ...profile,
      progress: updatedProgress,
    };

    onUpdateProfile(patient.id, updatedProfile);
    onAudit("reviewed progress check-in for", `${patient.id} · ${patient.name}`);
  };

  const addPatientDocument = () => {
    if (!selectedDocument || !permissions.includes("documents.upload")) return;
    const document: PatientDocument = {
      id: `DOC-${Date.now().toString().slice(-5)}`,
      fileName: selectedDocument.name,
      fileType: selectedDocument.type || "application/octet-stream",
      size: selectedDocument.size,
      category: documentCategory,
      uploadedAt: new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date()),
      visibility: "Private",
      uploadedBy: "Dr. Jai Bansal",
      uploaderRole: "Super Admin",
    };
    onUpdateProfile(patient.id, { ...profile, documents: [document, ...(profile.documents ?? [])] });
    onAudit("added patient document under Super Admin authority", `${patient.id} · ${document.fileName}`);
    setSelectedDocument(null);
  };

  const changeDocumentVisibility = (document: PatientDocument) => {
    if (!permissions.includes("documents.share")) return;
    const nextVisibility = document.visibility === "Shared" ? "Private" : "Shared";
    onUpdateProfile(patient.id, {
      ...profile,
      documents: (profile.documents ?? []).map((item) => item.id === document.id ? { ...item, visibility: nextVisibility } : item),
    });
    if (nextVisibility === "Shared") onQueueDocumentNotice(patient, document);
    onAudit(nextVisibility === "Shared" ? "shared patient document" : "made patient document private", `${patient.id} · ${document.fileName}`);
  };

  const cleanPhone = profile.phone.replace(/[^0-9]/g, "");

  return (
    <Modal
      className="clinical-modal max-w-4xl"
      title={`${canViewOverview ? "Patient Clinical Record" : "Patient Documents"} · ${patient.name}`}
      description={`${patient.id} · Private records for Dr. Jai Bansal’s clinic`}
      submitLabel={reportToSend && canShareReports ? "Queue Patient Notice" : sentCount ? "Notice Queued" : "Close Chart"}
      submitDisabled={!reportToSend || !canShareReports}
      onClose={onClose}
      onSubmit={() => reportToSend && onSendReport(patient, reportToSend)}
    >
      {/* Top Patient Bar with Teleconsultation & Contact Actions */}
      <div className="patient-profile-heading flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="patient-profile-avatar font-bold text-base flex-shrink-0">{patient.initials}</span>
          <div className="patient-heading-copy">
            <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
              {patient.name}
              <StatusPill status={patient.status} />
            </h3>
            {canViewIdentityDetails && <><p className="text-xs text-slate-500 m-0">
              {profile.age > 0 ? `${profile.age} yrs` : "Age unrecorded"} · {profile.pronouns} · Registered {profile.joined}
            </p>
            <div className="patient-heading-meta flex gap-3 text-xs text-slate-600 mt-1"><span>{patient.email}</span><span>{profile.phone}</span></div></>}
          </div>
        </div>

        {/* Clinical Quick Action Buttons */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end flex-wrap">
          {canViewIdentityDetails && <a
            href={`https://wa.me/${cleanPhone}?text=Hello%20${encodeURIComponent(patient.name)},%20this%20is%20Dr.%20Hair%20Clinic%20regarding%20your%20hair%20health%20assessment.`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
            title="Open WhatsApp chat with patient"
          >
            <MessageCircle size={13} />
            <span>WhatsApp</span>
          </a>}
          {canViewIdentityDetails && <a
            href={`tel:${profile.phone}`}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-[#F0F7FF] text-[#1A365D] hover:bg-[#D6E0FC] border border-[#D6E0FC] transition-colors"
            title="Direct phone call"
          >
            <Phone size={13} />
            <span>Call</span>
          </a>}
          {canPrescribe && <button
            type="button"
            onClick={() => setActiveTab("prescribe")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition-colors shadow-sm"
          >
            <Pill size={13} />
            <span>Prescribe</span>
          </button>}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="patient-profile-tabs mt-3 border-b border-slate-200 flex gap-2" role="tablist">
        {visibleTabs.map(({ id, label, icon: Icon, badge }) => (
          <button
            key={id}
            role="tab"
            aria-selected={resolvedActiveTab === id}
            className={`px-3 py-2 text-xs font-medium border-b-2 flex items-center gap-1.5 transition-colors ${
              resolvedActiveTab === id
                ? "border-teal-600 text-teal-800 font-semibold"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
            onClick={() => setActiveTab(id)}
          >
            <Icon size={14} />
            <span>{label}</span>
            {badge && (
              <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider">
                {badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div className="patient-profile-body py-3">
        {resolvedActiveTab === "overview" && canViewOverview && (
          <OverviewPanel
            patient={patient}
            profile={profile}
            canPrescribe={canPrescribe}
            onOpenPrescribe={() => setActiveTab("prescribe")}
            onOpenLightbox={(photo) => setLightboxPhoto(photo)}
          />
        )}

        {resolvedActiveTab === "prescribe" && canPrescribe && (
          <PrescribePanel
            profile={profile}
            onSave={handleSavePrescription}
            onCancel={() => setActiveTab("overview")}
          />
        )}

        {resolvedActiveTab === "progress" && canReviewProgress && (
          <ProgressPanel
            profile={profile}
            onApproveProgress={handleApproveProgress}
            onOpenLightbox={(photo) => setLightboxPhoto(photo)}
          />
        )}

        {resolvedActiveTab === "reports" && (
          <ReportsPanel
            profile={profile}
            notifications={notifications}
            patientId={patient.id}
            canShare={canShareReports}
            onNotify={(report) => onSendReport(patient, report)}
            onPreviewReport={(report) => setPreviewReport(report)}
            onDownloadReport={(report) => onToast(`Downloading ${report.fileName || report.title}... Saved to clinic archive.`)}
          />
        )}

        {resolvedActiveTab === "documents" && canViewDocuments && (
          <DocumentsPanel
            documents={profile.documents ?? []}
            canUpload={permissions.includes("documents.upload")}
            canShare={permissions.includes("documents.share")}
            selectedDocument={selectedDocument}
            category={documentCategory}
            onFileChange={setSelectedDocument}
            onCategoryChange={setDocumentCategory}
            onAdd={addPatientDocument}
            onVisibilityChange={changeDocumentVisibility}
            onPreviewDocument={(document) => setPreviewDocument(document)}
            onDownloadDocument={(document) => onToast(`Downloading ${document.fileName}... Saved to clinic archive.`)}
            onToast={onToast}
          />
        )}

        {resolvedActiveTab === "history" && <HistoryPanel profile={profile} />}
      </div>

      {/* Footer */}
      <div className="patient-profile-foot flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-200">
        <div className="flex items-center gap-1.5">
          <ShieldCheck size={14} className="text-teal-600" />
          <span>Private clinical chart · Changes are saved in this browser demo only</span>
        </div>
      </div>

      <FullSizeImageViewer
        image={lightboxPhoto?.url ? {
          src: lightboxPhoto.url,
          alt: `Scalp examination · ${lightboxPhoto.angle} view`,
          fileName: `scalp-${lightboxPhoto.angle.toLowerCase()}.jpg`,
          caption: lightboxPhoto.caption || `${lightboxPhoto.angle} angle submitted during clinical assessment.`,
        } : null}
        onClose={() => setLightboxPhoto(null)}
      />

      {/* Clinical Report Sheet Preview Modal */}
      {previewReport && (
        <Modal
          title={`Clinical Document Preview · ${previewReport.title}`}
          description={`Uploaded by ${previewReport.uploadedBy || "Dr. Jai Bansal"} (${previewReport.uploaderRole || "Super Admin"}) · ${previewReport.date}`}
          submitLabel="Download File (PDF/DOC/Image)"
          onClose={() => setPreviewReport(null)}
          onSubmit={() => {
            onToast(`Downloading ${previewReport.fileName || previewReport.title}... Saved to clinic archive.`);
            setPreviewReport(null);
          }}
        >
          <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-4 text-xs text-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#1A365D] text-white">
                  UPLOADED BY {previewReport.uploaderRole?.toUpperCase() || "SUPER ADMIN"}
                </span>
                <h4 className="text-sm font-bold text-slate-900 mt-1">{previewReport.title}</h4>
                <p className="text-[11px] text-slate-500">{previewReport.department || "Clinical Trichology"} · File: {previewReport.fileName}</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">
                {previewReport.fileSize || "1.4 MB"}
              </span>
            </div>

            {previewReport.format === "IMAGE" ? (
              <div className="bg-slate-950 rounded-xl p-4 text-white text-center space-y-3">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-900/60 text-teal-300 text-[10px] font-bold">
                  POLARIZED 120X TRICHOSCOPY MICROGRAPH
                </div>
                <div className="h-44 bg-slate-900 rounded-lg flex items-center justify-center border border-slate-800">
                  <div className="text-center space-y-1">
                    <ZoomIn size={36} className="text-teal-400 mx-auto" />
                    <p className="text-xs text-slate-300 font-semibold">Follicular Density Mapping Scan</p>
                    <span className="text-[10px] text-slate-500">Calibrated epiluminescence micrograph</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[10px]">
                  <div className="bg-slate-900 p-2 rounded"><span className="text-slate-400 block">Density</span><strong className="text-teal-300">64 FU/cm²</strong></div>
                  <div className="bg-slate-900 p-2 rounded"><span className="text-slate-400 block">Miniaturization</span><strong className="text-teal-300">24.5%</strong></div>
                  <div className="bg-slate-900 p-2 rounded"><span className="text-slate-400 block">Telogen Ratio</span><strong className="text-teal-300">26%</strong></div>
                </div>
              </div>
            ) : previewReport.format === "DOC" ? (
              <div className="p-3 bg-blue-50/50 border border-blue-200 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-blue-900 font-bold">
                  <FileSpreadsheet size={16} className="text-blue-600" />
                  <span>Surgical Protocol & Graft Harvest Specifications</span>
                </div>
                <p className="text-slate-600">
                  Document prepared for sapphire FUE graft extraction. Donor safe harvesting capacity: 3,600 viable follicular units. Phase 1 targets: 2,200 grafts.
                </p>
              </div>
            ) : (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex justify-between items-center text-slate-900 font-bold border-b border-slate-200 pb-2">
                  <span>DR. HAIR PATHOLOGY LABORATORY</span>
                  <span className="text-[10px] text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 font-bold">OFFICIAL PDF</span>
                </div>
                <table className="w-full text-[11px] text-left">
                  <thead>
                    <tr className="text-slate-500 border-b border-slate-200">
                      <th className="py-1">Investigation</th>
                      <th className="py-1">Result</th>
                      <th className="py-1">Reference Range</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr><td className="py-1 font-medium">Serum Ferritin</td><td className="py-1 font-bold">42.0 ng/mL</td><td className="py-1 text-slate-500">30–300 ng/mL</td></tr>
                    <tr><td className="py-1 font-medium">Serum DHT</td><td className="py-1 font-bold text-rose-600">68.2 ng/dL [HIGH]</td><td className="py-1 text-slate-500">25–65 ng/dL</td></tr>
                    <tr><td className="py-1 font-medium">TSH (Thyroid)</td><td className="py-1 font-bold">2.14 mIU/L</td><td className="py-1 text-slate-500">0.4–4.2 mIU/L</td></tr>
                  </tbody>
                </table>
              </div>
            )}

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Clinician Finding Summary</span>
              <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200 m-0">
                {previewReport.summary}
              </p>
            </div>
          </div>
        </Modal>
      )}

      {/* Patient Uploaded Document Preview Modal */}
      {previewDocument && (
        <Modal
          title={`Patient Document · ${previewDocument.fileName}`}
          description={`Uploaded by ${previewDocument.uploadedBy || "Dr. Jai Bansal"} (${previewDocument.uploaderRole || "Super Admin"}) · ${previewDocument.uploadedAt}`}
          submitLabel="Download File"
          onClose={() => setPreviewDocument(null)}
          onSubmit={() => {
            onToast(`Downloading ${previewDocument.fileName}... Saved to clinic archive.`);
            setPreviewDocument(null);
          }}
        >
          <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 text-xs text-slate-800">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div>
                <strong className="text-sm text-slate-900 block">{previewDocument.fileName}</strong>
                <span className="text-slate-500 text-[11px]">{previewDocument.category} · {(previewDocument.size / 1024).toFixed(0)} KB</span>
              </div>
              <span className={`status ${previewDocument.visibility === "Shared" ? "status-active" : "status-inactive"}`}>
                {previewDocument.visibility}
              </span>
            </div>
            <p className="text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200">
              This document is archived in the patient clinical record under authority of <strong>{previewDocument.uploadedBy || "Dr. Jai Bansal"} (Super Admin)</strong>. When shared, the patient can view and download it directly in their Dr. Hair mobile app.
            </p>
          </div>
        </Modal>
      )}
    </Modal>
  );
}

// ==========================================
// SUB-PANELS
// ==========================================

function OverviewPanel({
  patient,
  profile,
  canPrescribe,
  onOpenPrescribe,
  onOpenLightbox,
}: {
  patient: PatientRecord;
  profile: PatientClinicalProfile;
  canPrescribe: boolean;
  onOpenPrescribe: () => void;
  onOpenLightbox: (photo: ScalpPhoto) => void;
}) {
  const latestDiagnosis = profile.diagnoses[0];
  const prescription = profile.prescriptionPlan;
  const photos = profile.assessmentAnswers.photos || [];

  return (
    <div className="space-y-4">
      {/* Clinical Assessment & Prescription Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <article className="border border-teal-200 bg-teal-50/50 rounded-xl p-3.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-teal-800 flex items-center gap-1.5">
                <HeartPulse size={14} className="text-teal-600" />
                Latest Clinical Diagnosis
              </span>
              <span className="text-[10px] bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full font-bold">
                {latestDiagnosis?.stage ?? "Pending Diagnosis"}
              </span>
            </div>
            <h4 className="font-bold text-slate-800 text-sm">{latestDiagnosis?.name ?? patient.assessment}</h4>
            <p className="text-xs text-slate-600 mt-1 line-clamp-3">
              {latestDiagnosis?.note ?? "No clinical diagnosis notes recorded yet. Prescribe a regimen to send to patient app."}
            </p>
          </div>
          {canPrescribe && <button
            onClick={onOpenPrescribe}
            className="mt-3 text-xs font-semibold text-teal-700 hover:text-teal-900 inline-flex items-center gap-1 self-start"
          >
            <span>{prescription ? "Update Regimen & Care Steps" : "+ Prescribe Regimen"}</span>
            <ChevronRight size={13} />
          </button>}
        </article>

        <article className="border border-slate-200 bg-white rounded-xl p-3.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Pill size={14} className="text-[#0D9488]" />
                Active Treatment Protocol
              </span>
              <span className="text-[10px] text-slate-500 font-medium">{prescription?.duration ?? "No active plan"}</span>
            </div>
            {prescription ? (
              <div className="space-y-1.5 text-xs text-slate-600 mt-2">
                <div className="font-medium text-slate-800">{prescription.products.length} Products Prescribed:</div>
                <div className="flex flex-wrap gap-1">
                  {prescription.products.map((p) => (
                    <span key={p.name} className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-[11px]">
                      {p.name}
                    </span>
                  ))}
                </div>
                <div className="text-[11px] text-slate-500 pt-1">
                  <strong>Daily Routine:</strong> {prescription.routineSteps.length} AM/PM care steps assigned
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 mt-2">
                No active care routine or product kit assigned. Click Prescribe Regimen to design the patient’s protocol.
              </p>
            )}
          </div>
          {canPrescribe && <button
            onClick={onOpenPrescribe}
            className="mt-3 text-xs font-semibold text-[#1A365D] hover:text-[#0D9488] inline-flex items-center gap-1 self-start"
          >
            <span>Review Full Protocol</span>
            <ChevronRight size={13} />
          </button>}
        </article>
      </div>

      {/* Multi-Angle Scalp Photo Lightbox Gallery */}
      <section className="border border-slate-200 rounded-xl bg-white p-3.5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <ZoomIn size={14} className="text-teal-600" />
            <h4 className="text-xs font-bold text-slate-800 m-0 uppercase tracking-wide">
              Diagnostic Scalp Photos ({photos.filter((p) => p.status === "Uploaded").length}/{photos.length})
            </h4>
          </div>
          <span className="text-[11px] text-slate-400">Click photo to zoom & inspect</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-2">
          {photos.map((photo) => (
            <div
              key={photo.angle}
              className={`group relative border rounded-lg overflow-hidden bg-slate-100 cursor-pointer transition-all ${
                photo.url ? "hover:border-teal-500 hover:shadow-md" : "border-dashed border-slate-300 opacity-70"
              }`}
              onClick={() => photo.url && onOpenLightbox(photo)}
            >
              <div className="aspect-square w-full relative flex items-center justify-center overflow-hidden">
                {photo.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photo.url}
                    alt={`${photo.angle} view`}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="text-[10px] text-slate-400 flex flex-col items-center gap-1 p-2 text-center">
                    <AlertTriangle size={14} />
                    <span>Not submitted</span>
                  </div>
                )}
                {photo.url && (
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                    <Maximize2 size={16} />
                  </div>
                )}
              </div>
              <div className="p-1.5 bg-white flex items-center justify-between text-[11px]">
                <strong className="text-slate-700">{photo.angle} View</strong>
                <span className={`text-[9px] font-bold ${photo.status === "Uploaded" ? "text-emerald-600" : "text-amber-600"}`}>
                  {photo.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Patient Intake Questionnaire Details */}
      <section className="border border-slate-200 rounded-xl bg-white p-3.5">
        <h4 className="text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5 uppercase tracking-wide">
          <ClipboardList size={14} className="text-teal-600" />
          Patient Intake Assessment Answers
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <FactCard label="Selected Stage" value={profile.assessmentAnswers.stage} />
          <FactCard label="Primary Concern" value={profile.assessmentAnswers.primaryConcern} />
          <FactCard label="Hair Fall Duration" value={profile.assessmentAnswers.duration} />
          <FactCard label="Dandruff / Scalp" value={profile.assessmentAnswers.dandruff} />
          <FactCard label="Gut Health" value={profile.assessmentAnswers.gutHealth} />
          <FactCard label="Stress Level" value={profile.assessmentAnswers.stressLevel} />
          <FactCard label="Family History" value={profile.assessmentAnswers.familyHistory} />
          <FactCard label="Gender" value={profile.assessmentAnswers.gender} />
        </div>
      </section>
    </div>
  );
}

// ==========================================
// PRESCRIBE REGIMEN BUILDER (Interactive Clinical EMR)
// ==========================================

function PrescribePanel({
  profile,
  onSave,
  onCancel,
}: {
  profile: PatientClinicalProfile;
  onSave: (plan: PrescriptionPlan) => void;
  onCancel: () => void;
}) {
  const existing = profile.prescriptionPlan;

  const [stage, setStage] = useState(existing?.stage || profile.assessmentAnswers.stage || "Stage 2");
  const [diagnosis, setDiagnosis] = useState(
    existing?.diagnosis || "Androgenetic Alopecia (Stage 2) with Early Miniaturization"
  );
  const [duration, setDuration] = useState(existing?.duration || "90 Days (3 Months Protocol)");
  const [instructions, setInstructions] = useState(
    existing?.instructions ||
      "Apply 1ml topical booster every night to clean dry scalp. Massage gently for 2 minutes. Take 1 biotin tablet after breakfast."
  );
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>(
    existing?.products.map((p) => p.id) || ["PRD-101", "PRD-102", "PRD-103"]
  );

  // Daily Routine Steps (AM/PM)
  const [routineSteps, setRoutineSteps] = useState<CareRoutineStep[]>(
    existing?.routineSteps || [
      { id: "step-1", title: "Oral Nutritional Booster", subtitle: "1 Tablet with water after breakfast", category: "Supplements", timeOfDay: "Morning" },
      { id: "step-2", title: "Scalp Balance Wash", subtitle: "Lather and leave on for 3 minutes (Alternate Days)", category: "Cleansing", timeOfDay: "Morning" },
      { id: "step-3", title: "Nightly Follicle Serum", subtitle: "1ml on crown & hairline + 2 min scalp massage", category: "Regrowth", timeOfDay: "Night" },
    ]
  );

  // Diet / Nutrition
  const [dietMeals] = useState<DietMealPlan[]>(
    existing?.dietMeals || [
      { type: "Breakfast", name: "Boiled Eggs or Sprouted Moong", nutrients: "High Protein & Biotin", benefit: "Keratin root synthesis" },
      { type: "Lunch", name: "Dal, Spinach & Probiotic Curd", nutrients: "Iron & Zinc", benefit: "Scalp circulation & gut balance" },
      { type: "Snack", name: "Pumpkin Seeds & Walnuts", nutrients: "Omega-3 & DHT Blockers", benefit: "Follicular protection" },
      { type: "Dinner", name: "Paneer / Lean Protein & Greens", nutrients: "Essential Amino Acids", benefit: "Overnight cellular regeneration" },
    ]
  );

  const toggleProduct = (prodId: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(prodId) ? prev.filter((id) => id !== prodId) : [...prev, prodId]
    );
  };

  const addCustomRoutineStep = () => {
    const newStep: CareRoutineStep = {
      id: `step-${Date.now()}`,
      title: "Custom Care Step",
      subtitle: "Follow doctor advice",
      category: "Treatment",
      timeOfDay: "Evening",
    };
    setRoutineSteps([...routineSteps, newStep]);
  };

  const removeRoutineStep = (id: string) => {
    setRoutineSteps(routineSteps.filter((s) => s.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const chosenProducts: PrescribedProduct[] = availableProducts
      .filter((p) => selectedProductIds.includes(p.id))
      .map((p) => ({
        id: p.id,
        name: p.name,
        dose: p.defaultDose,
        frequency: "Daily as directed",
      }));

    const plan: PrescriptionPlan = {
      id: `RX-${Date.now().toString().slice(-4)}`,
      date: "Today",
      stage,
      diagnosis,
      doctorName: "Dr. Jai Bansal",
      duration,
      instructions,
      products: chosenProducts,
      routineSteps,
      dietMeals,
      nextReviewDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      status: "Active",
    };

    onSave(plan);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-xs">
      <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-amber-600 flex-shrink-0" />
          <span>
            <strong>Prescription & Care Regimen Builder</strong> — Submitting this will update the diagnosis, care routine tasks, and diet plan inside the patient’s Flutter app.
          </span>
        </div>
      </div>

      {/* 1. Verified Clinical Diagnosis & Stage */}
      <section className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-3">
        <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
          <HeartPulse size={14} className="text-teal-600" />
          1. Verified Trichology Diagnosis
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-600 font-medium mb-1">Trichology Stage</label>
            <select
              className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-slate-50 focus:bg-white"
              value={stage}
              onChange={(e) => setStage(e.target.value)}
            >
              <option value="Stage 1 · Mild hairline recession">Stage 1 · Mild hairline recession</option>
              <option value="Stage 2 · M-shaped recession & temple thinning">Stage 2 · M-shaped recession & temple thinning</option>
              <option value="Stage 3 · Deep frontal recession & vertex thinning">Stage 3 · Deep frontal recession & vertex thinning</option>
              <option value="Stage 4 · Significant crown & hairline loss">Stage 4 · Significant crown & hairline loss</option>
              <option value="Stage 5 · Advanced bridge thinning">Stage 5 · Advanced bridge thinning</option>
              <option value="Stage 6 · Extensive hair loss">Stage 6 · Extensive hair loss</option>
              <option value="Diffuse Shedding · Telogen Effluvium">Diffuse Shedding · Telogen Effluvium</option>
            </select>
          </div>
          <div>
            <label className="block text-slate-600 font-medium mb-1">Treatment Protocol Duration</label>
            <select
              className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-slate-50 focus:bg-white"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            >
              <option value="30 Days (1 Month Evaluation)">30 Days (1 Month Evaluation)</option>
              <option value="90 Days (3 Months Regrowth Protocol)">90 Days (3 Months Regrowth Protocol)</option>
              <option value="180 Days (6 Months Complete Protocol)">180 Days (6 Months Complete Protocol)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-slate-600 font-medium mb-1">Clinical Diagnosis Title</label>
          <input
            type="text"
            className="w-full border border-slate-300 rounded-lg p-2 text-xs"
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            placeholder="e.g. Androgenetic Alopecia (Stage 2) with Telogen Effluvium"
          />
        </div>

        <div>
          <label className="block text-slate-600 font-medium mb-1">Doctor Instructions & Advice</label>
          <textarea
            rows={2}
            className="w-full border border-slate-300 rounded-lg p-2 text-xs"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Detailed application instructions..."
          />
        </div>
      </section>

      {/* 2. Prescribed Medical Products Kit */}
      <section className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-3">
        <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
          <Pill size={14} className="text-teal-600" />
          2. Prescribed Product Regimen (Dr. Hair Catalog)
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {availableProducts.map((product) => {
            const isSelected = selectedProductIds.includes(product.id);
            return (
              <div
                key={product.id}
                onClick={() => toggleProduct(product.id)}
                className={`p-2.5 border rounded-lg cursor-pointer flex items-start gap-2.5 transition-colors ${
                  isSelected ? "border-teal-500 bg-teal-50/40" : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => {}}
                  className="mt-0.5 rounded text-teal-600"
                />
                <div>
                  <div className="font-semibold text-slate-800">{product.name}</div>
                  <div className="text-[11px] text-slate-500">{product.category} · {product.defaultDose}</div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. Daily Care Routine Steps (AM/PM) */}
      <section className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
            <ClipboardList size={14} className="text-teal-600" />
            3. Daily Care Routine Tasks (Syncs to Routine Tracker)
          </h4>
          <button
            type="button"
            onClick={addCustomRoutineStep}
            className="text-[11px] font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1"
          >
            <Plus size={12} />
            Add Step
          </button>
        </div>

        <div className="space-y-2">
          {routineSteps.map((step, idx) => (
            <div key={step.id} className="flex items-center gap-2 border border-slate-200 rounded-lg p-2 bg-slate-50">
              <span className="font-bold text-slate-400 w-4 text-center">{idx + 1}</span>
              <select
                className="border border-slate-300 rounded p-1 text-[11px] bg-white font-medium"
                value={step.timeOfDay}
                onChange={(e) => {
                  const updated = [...routineSteps];
                  updated[idx] = { ...step, timeOfDay: e.target.value as CareRoutineStep["timeOfDay"] };
                  setRoutineSteps(updated);
                }}
              >
                <option value="Morning">Morning</option>
                <option value="Evening">Evening</option>
                <option value="Night">Night</option>
                <option value="Daily">Daily</option>
              </select>
              <input
                type="text"
                className="flex-1 border border-slate-300 rounded p-1 text-[11px] bg-white"
                value={step.title}
                onChange={(e) => {
                  const updated = [...routineSteps];
                  updated[idx] = { ...step, title: e.target.value };
                  setRoutineSteps(updated);
                }}
                placeholder="Step title"
              />
              <input
                type="text"
                className="flex-1 border border-slate-300 rounded p-1 text-[11px] bg-white"
                value={step.subtitle}
                onChange={(e) => {
                  const updated = [...routineSteps];
                  updated[idx] = { ...step, subtitle: e.target.value };
                  setRoutineSteps(updated);
                }}
                placeholder="Instructions"
              />
              <button
                type="button"
                onClick={() => removeRoutineStep(step.id)}
                className="text-slate-400 hover:text-rose-600 p-1"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Buttons */}
      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 transition-colors shadow-sm flex items-center gap-1.5"
        >
          <CheckCircle2 size={14} />
          Save & Prescribe Regimen to Patient App
        </button>
      </div>
    </form>
  );
}

// ==========================================
// PROGRESS CHECK-INS & SIDE-BY-SIDE BEFORE/AFTER COMPARISON
// ==========================================

function ProgressPanel({
  profile,
  onApproveProgress,
  onOpenLightbox,
}: {
  profile: PatientClinicalProfile;
  onApproveProgress: (checkInId: string, doctorNote: string, densityRating: number) => void;
  onOpenLightbox: (photo: ScalpPhoto) => void;
}) {
  const [activeCheckInId, setActiveCheckInId] = useState<string | null>(null);
  const [doctorNoteInput, setDoctorNoteInput] = useState("");
  const [densityInput, setDensityInput] = useState(4);

  // Find baseline photo and latest photo for comparison
  const baselinePhoto = profile.progress[profile.progress.length - 1]?.photos?.[0]?.url;
  const latestPhoto = profile.progress[0]?.photos?.[0]?.url;

  const startReviewing = (entry: ProgressCheckInEntry) => {
    setActiveCheckInId(entry.id);
    setDoctorNoteInput(entry.doctorNote || "");
    setDensityInput(entry.densityRating || 4);
  };

  const submitReview = (entryId: string) => {
    onApproveProgress(entryId, doctorNoteInput, densityInput);
    setActiveCheckInId(null);
  };

  return (
    <div className="space-y-4">
      {/* Side-by-Side Before vs After Comparison */}
      {baselinePhoto && latestPhoto && (
        <section className="bg-slate-900 text-white rounded-xl p-3.5 shadow-md">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
            <div className="flex items-center gap-1.5">
              <ZoomIn size={14} className="text-teal-400" />
              <h4 className="font-bold text-xs uppercase tracking-wide">Before & After Progression Comparison</h4>
            </div>
            <span className="text-[10px] text-teal-300 font-semibold bg-teal-900/60 px-2 py-0.5 rounded">
              90-Day Visual Track
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-[11px] text-slate-400 mb-1 flex items-center justify-between">
                <span>Baseline Photo</span>
                <span className="text-[10px] text-slate-500">{profile.progress[profile.progress.length - 1]?.date}</span>
              </div>
              <div
                className="aspect-square bg-black rounded-lg overflow-hidden cursor-pointer relative group"
                onClick={() => onOpenLightbox({ angle: "Front", url: baselinePhoto, status: "Uploaded" })}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={baselinePhoto} alt="Baseline Scalp" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <Maximize2 size={16} />
                </div>
              </div>
            </div>

            <div>
              <div className="text-[11px] text-teal-400 mb-1 flex items-center justify-between">
                <span>Latest Progress Check-In</span>
                <span className="text-[10px] text-slate-400">{profile.progress[0]?.date}</span>
              </div>
              <div
                className="aspect-square bg-black rounded-lg overflow-hidden cursor-pointer relative group border-2 border-teal-500/50"
                onClick={() => onOpenLightbox({ angle: "Front", url: latestPhoto, status: "Uploaded" })}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={latestPhoto} alt="Latest Scalp" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <Maximize2 size={16} />
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Progress Timeline & Approval Actions */}
      <div className="space-y-3">
        <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wide flex items-center gap-1.5">
          <Activity size={14} className="text-teal-600" />
          Patient Monthly Photo Check-Ins ({profile.progress.length})
        </h4>

        {profile.progress.map((entry) => {
          const isReviewing = activeCheckInId === entry.id;

          return (
            <article key={entry.id} className="border border-slate-200 rounded-xl bg-white p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <strong className="text-slate-800 text-xs">{entry.label}</strong>
                    <span className="text-[11px] text-slate-500">· {entry.date}</span>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-semibold">
                      Density: {entry.densityRating}/5
                    </span>
                    <span className="text-[10px] text-slate-500">Shedding: {entry.sheddingLevel}</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 mb-0">{entry.note}</p>
                </div>

                <div>
                  {entry.doctorReviewed ? (
                    <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded text-[10px] font-semibold">
                      <Check size={11} />
                      Reviewed
                    </span>
                  ) : (
                    <button
                      onClick={() => startReviewing(entry)}
                      className="inline-flex items-center gap-1 text-amber-800 bg-amber-50 border border-amber-300 hover:bg-amber-100 px-2.5 py-1 rounded text-xs font-semibold transition-colors"
                    >
                      <Sparkles size={12} />
                      Review & Leave Note
                    </button>
                  )}
                </div>
              </div>

              {/* Photos inside this checkin */}
              {entry.photos && entry.photos.length > 0 && (
                <div className="flex gap-2 pt-1">
                  {entry.photos.map((p, idx) => (
                    <div
                      key={idx}
                      className="w-16 h-16 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 cursor-pointer relative group flex-shrink-0"
                      onClick={() => onOpenLightbox({ angle: p.angle as ScalpPhoto["angle"], url: p.url, status: "Uploaded" })}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.url} alt={p.angle} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white">
                        <Maximize2 size={12} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Existing Doctor Note */}
              {entry.doctorReviewed && entry.doctorNote && (
                <div className="bg-emerald-50/70 border border-emerald-200 rounded-lg p-2 text-xs text-emerald-900 flex items-start gap-1.5 mt-2">
                  <CheckCircle2 size={13} className="text-emerald-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong>Clinician Feedback: </strong>
                    <span>{entry.doctorNote}</span>
                  </div>
                </div>
              )}

              {/* Interactive Doctor Review Form */}
              {isReviewing && (
                <div className="bg-amber-50/60 border border-amber-200 rounded-lg p-3 space-y-2 mt-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-amber-900">
                    <span>Clinician Check-In Evaluation & Feedback</span>
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <span>Adjust Density:</span>
                      <select
                        value={densityInput}
                        onChange={(e) => setDensityInput(Number(e.target.value))}
                        className="border border-amber-300 rounded px-1.5 py-0.5 bg-white"
                      >
                        <option value={1}>1 / 5 (Severe Thinning)</option>
                        <option value={2}>2 / 5 (Noticeable Thinning)</option>
                        <option value={3}>3 / 5 (Moderate Density)</option>
                        <option value={4}>4 / 5 (Good Density)</option>
                        <option value={5}>5 / 5 (Full Scalp Density)</option>
                      </select>
                    </div>
                  </div>
                  <textarea
                    rows={2}
                    className="w-full border border-amber-300 rounded-lg p-2 text-xs bg-white"
                    placeholder="e.g. Visible baby hair growth around crown. Continue minoxidil 5% nightly..."
                    value={doctorNoteInput}
                    onChange={(e) => setDoctorNoteInput(e.target.value)}
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveCheckInId(null)}
                      className="px-2.5 py-1 text-xs text-slate-600 hover:text-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => submitReview(entry.id)}
                      className="px-3 py-1 bg-teal-600 text-white rounded font-semibold text-xs hover:bg-teal-700 transition-colors"
                    >
                      Approve & Send Note to Patient
                    </button>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}

function ReportsPanel({
  profile,
  notifications,
  patientId,
  canShare,
  onNotify,
  onPreviewReport,
  onDownloadReport,
}: {
  profile: PatientClinicalProfile;
  notifications: string[];
  patientId: string;
  canShare: boolean;
  onNotify: (report: PatientReport) => void;
  onPreviewReport: (report: PatientReport) => void;
  onDownloadReport: (report: PatientReport) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="bg-[#F0F7FF] border border-[#D6E0FC] rounded-xl p-3 text-xs text-[#1A365D] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-[#0D9488] shrink-0" />
          <span>
            <strong>Clinical Reports & Lab Vault</strong> — Reports uploaded by Super Admin (Dr. Jai Bansal) or Clinical Desk. Shared reports sync directly into the patient&apos;s mobile app.
          </span>
        </div>
      </div>

      {profile.reports.map((report) => {
        const notified = notifications.includes(`${patientId}:${report.id}`);
        const format = report.format || (report.fileName?.endsWith(".png") || report.fileName?.endsWith(".jpg") ? "IMAGE" : report.fileName?.endsWith(".docx") ? "DOC" : "PDF");
        const formatBadgeColor = format === "IMAGE" ? "text-teal-700 bg-teal-50 border-teal-200" : format === "DOC" ? "text-blue-700 bg-blue-50 border-blue-200" : "text-rose-700 bg-rose-50 border-rose-200";

        return (
          <article className="border border-slate-200 rounded-xl bg-white p-3.5 space-y-2.5 shadow-sm" key={report.id}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2.5">
                <span className="p-2 rounded-lg bg-slate-100 text-slate-700 mt-0.5">
                  {format === "IMAGE" ? <ImageIcon size={16} aria-hidden="true" className="text-teal-600" /> : format === "DOC" ? <FileSpreadsheet size={16} aria-hidden="true" className="text-blue-600" /> : <FileText size={16} aria-hidden="true" className="text-rose-600" />}
                </span>
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#1A365D] text-white">
                      Uploaded by {report.uploaderRole || "Super Admin"}
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${formatBadgeColor}`}>
                      {format}
                    </span>
                    {report.fileSize && <span className="text-[10px] text-slate-400">{report.fileSize}</span>}
                  </div>
                  <strong className="text-slate-900 text-sm block mt-1">{report.title}</strong>
                  <span className="text-[11px] text-slate-500">
                    ID: {report.id} · Date: {report.date} · Evaluator: {report.uploadedBy || "Dr. Jai Bansal"}
                  </span>
                </div>
              </div>
              <StatusPill status={report.status} />
            </div>

            <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 m-0">
              {report.summary}
            </p>

            <div className="flex items-center justify-between pt-1 border-t border-slate-100 gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onPreviewReport(report)}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1 transition-colors"
                >
                  <Eye size={13} />
                  Preview Sheet
                </button>
                <button
                  type="button"
                  onClick={() => onDownloadReport(report)}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1 transition-colors"
                >
                  <Download size={13} />
                  Download
                </button>
              </div>

              {notified ? (
                <div className="inline-flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  <Check size={12} />
                  <span>Notification Queued & Visible in App</span>
                </div>
              ) : report.status === "Ready" && canShare ? (
                <button
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0D9488] text-white text-xs font-semibold rounded-lg hover:bg-teal-700 transition-colors"
                  onClick={() => onNotify(report)}
                >
                  <Send size={12} />
                  <span>Share with Patient App</span>
                </button>
              ) : (
                <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                  <CheckCircle2 size={13} />
                  Available in Patient Vault
                </span>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}

function DocumentsPanel({
  documents,
  canUpload,
  canShare,
  selectedDocument,
  category,
  onFileChange,
  onCategoryChange,
  onAdd,
  onVisibilityChange,
  onPreviewDocument,
  onDownloadDocument,
  onToast,
}: {
  documents: PatientDocument[];
  canUpload: boolean;
  canShare: boolean;
  selectedDocument: File | null;
  category: PatientDocument["category"];
  onFileChange: (file: File | null) => void;
  onCategoryChange: (category: PatientDocument["category"]) => void;
  onAdd: () => void;
  onVisibilityChange: (document: PatientDocument) => void;
  onPreviewDocument: (document: PatientDocument) => void;
  onDownloadDocument: (document: PatientDocument) => void;
  onToast: (message: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!selectedDocument && fileInputRef.current) fileInputRef.current.value = "";
  }, [selectedDocument]);

  return (
    <div className="patient-documents-panel space-y-3">
      <div className="notice bg-[#F0F7FF] border-[#D6E0FC] text-[#1A365D]">
        <ShieldCheck size={14} className="text-[#0D9488]" />
        <span>
          Clinical Document Vault · Uploaded files tagged with <strong>Super Admin (Dr. Jai Bansal)</strong> authorization. Shared files are accessible by the patient in their Dr. Hair app.
        </span>
      </div>

      {canUpload && (
        <div className="patient-document-upload grid grid-cols-1 gap-2 md:grid-cols-[0.7fr_1.3fr_auto] md:items-end p-3 bg-slate-50 border border-slate-200 rounded-xl">
          <label className="field">
            <span>Category</span>
            <select value={category} onChange={(event) => onCategoryChange(event.target.value as PatientDocument["category"])}>
              {["Lab result", "Prescription", "Consent", "Other"].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Choose Image, PDF, DOC, or DOCX (up to 10 MB)</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf,.doc,.docx"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                if (file && file.size > 10 * 1024 * 1024) {
                  event.target.value = "";
                  onFileChange(null);
                  onToast("Choose a patient document smaller than 10 MB.");
                  return;
                }
                onFileChange(file);
              }}
            />
          </label>
          <button className="button button-primary" type="button" disabled={!selectedDocument} onClick={onAdd}>
            <FileUp size={14} />
            Upload Document
          </button>
          {selectedDocument && (
            <small className="col-auto md:col-start-2 text-slate-500">
              {selectedDocument.name} · {(selectedDocument.size / 1024).toFixed(0)} KB · Ready to save under Super Admin authority
            </small>
          )}
        </div>
      )}

      <div className="patient-document-list space-y-2">
        {documents.map((document) => {
          const isDoc = document.fileName.toLowerCase().endsWith(".doc") || document.fileName.toLowerCase().endsWith(".docx");
          const isImg = document.fileType.includes("image") || Boolean(document.fileName.match(/\.(png|jpg|jpeg)$/i));

          return (
            <article className="patient-document-row flex flex-wrap items-center justify-between gap-3 p-3 bg-white border border-slate-200 rounded-xl shadow-sm" key={document.id}>
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-lg bg-slate-100">
                  {isImg ? <ImageIcon size={16} aria-hidden="true" className="text-teal-600" /> : isDoc ? <FileSpreadsheet size={16} aria-hidden="true" className="text-blue-600" /> : <FileText size={16} aria-hidden="true" className="text-rose-600" />}
                </span>
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <strong className="text-slate-800 text-xs">{document.fileName}</strong>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-bold">
                      {isImg ? "IMAGE" : isDoc ? "DOC" : "PDF"}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#1A365D] text-white font-bold">
                      Uploaded by {document.uploaderRole || "Super Admin"}
                    </span>
                  </div>
                  <small className="text-[10px] text-slate-500 block mt-0.5">
                    {document.category} · {document.uploadedAt} · {(document.size / 1024).toFixed(0)} KB · {document.uploadedBy || "Dr. Jai Bansal"}
                  </small>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="px-2 py-1 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700 flex items-center gap-1"
                  onClick={() => onPreviewDocument(document)}
                >
                  <Eye size={12} />
                  Preview
                </button>
                <button
                  type="button"
                  className="px-2 py-1 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700 flex items-center gap-1"
                  onClick={() => onDownloadDocument(document)}
                >
                  <Download size={12} />
                  Download
                </button>
                <span className={`status text-[11px] ${document.visibility === "Shared" ? "status-active" : "status-inactive"}`}>
                  {document.visibility}
                </span>
                {canShare && (
                  <button
                    type="button"
                    className="button button-secondary button-small"
                    onClick={() => onVisibilityChange(document)}
                  >
                    {document.visibility === "Shared" ? "Make Private" : "Share with App"}
                  </button>
                )}
              </div>
            </article>
          );
        })}
        {documents.length === 0 && <div className="empty-state">No patient documents have been added yet.</div>}
      </div>
    </div>
  );
}

function HistoryPanel({ profile }: { profile: PatientClinicalProfile }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <section className="border border-slate-200 rounded-xl bg-white p-3 space-y-2">
          <h4 className="font-bold text-xs text-slate-800 uppercase flex items-center gap-1.5">
            <History size={13} className="text-teal-600" />
            Medical History Timeline
          </h4>
          <div className="space-y-2">
            {profile.history.map((h, idx) => (
              <div key={idx} className="border-l-2 border-teal-500 pl-2.5 py-0.5">
                <div className="text-[10px] text-slate-400">{h.date} · {h.kind}</div>
                <strong className="text-xs text-slate-700 block">{h.title}</strong>
                <p className="text-xs text-slate-600 m-0">{h.details}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border border-slate-200 rounded-xl bg-white p-3 space-y-2">
          <h4 className="font-bold text-xs text-slate-800 uppercase flex items-center gap-1.5">
            <AlertTriangle size={13} className="text-amber-600" />
            Allergies & Sensitivities
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {profile.allergies.map((a) => (
              <span key={a} className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-xs font-medium">
                {a}
              </span>
            ))}
          </div>

          <h4 className="font-bold text-xs text-slate-800 uppercase flex items-center gap-1.5 pt-2">
            <Pill size={13} className="text-[#0D9488]" />
            Active Medications
          </h4>
          <div className="space-y-1.5">
            {profile.medications.map((m) => (
              <div key={m.name} className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-200 text-xs">
                <div>
                  <strong className="text-slate-800">{m.name}</strong>
                  <div className="text-[10px] text-slate-500">{m.dose} · {m.frequency}</div>
                </div>
                <StatusPill status={m.status} />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function FactCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-2">
      <div className="text-[10px] text-slate-400 font-medium">{label}</div>
      <div className="text-xs font-semibold text-slate-700 truncate" title={value}>
        {value || "Not recorded"}
      </div>
    </div>
  );
}

export function createFallbackProfile(patient: PatientRecord): PatientClinicalProfile {
  return {
    age: 25,
    pronouns: "Patient",
    phone: "+91 98765 00000",
    joined: patient.submitted,
    assessmentAnswers: {
      gender: "Not recorded",
      stage: patient.assessment,
      primaryConcern: patient.assessment,
      duration: "6–12 months",
      dandruff: "Mild",
      gutHealth: "Normal",
      stressLevel: "Moderate",
      familyHistory: "None",
      photos: [
        { angle: "Front", status: "Uploaded", url: "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=600&auto=format&fit=crop&q=80" },
        { angle: "Top", status: "Uploaded", url: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=600&auto=format&fit=crop&q=80" },
      ],
    },
    concerns: [patient.assessment],
    allergies: ["No known drug allergies"],
    medications: [],
    history: [{ date: patient.submitted, title: "Initial assessment", details: patient.assessment, kind: "Assessment" }],
    diagnoses: [],
    progress: [
      {
        id: "PRG-INIT",
        date: "Today",
        densityRating: 2,
        scalpRegion: "Frontal & Crown",
        sheddingLevel: "Moderate",
        label: "Baseline Intake",
        note: "Initial assessment photos submitted by patient.",
        doctorReviewed: false,
        photoAngles: ["Front", "Top"],
        photos: [{ angle: "Front", url: "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=600&auto=format&fit=crop&q=80" }],
      },
    ],
    reports: [],
    documents: [],
  };
}
