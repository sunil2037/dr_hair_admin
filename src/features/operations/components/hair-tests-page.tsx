"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ClipboardCheck, EyeOff, FileCheck2, FileUp, Loader2, RefreshCw, Search, Share2 } from "lucide-react";
import { Modal, PageHeader, StatusPill, TableToolbar } from "../../shared/components/ui";
import type { AdminPermissionId, PatientRecord } from "../../shared/types";
import type { HairTestRecord, HairTestStatus } from "../types";

const permissionLabels: Record<HairTestStatus, string> = {
  Draft: "Draft",
  "In review": "In review",
  Approved: "Approved",
  Shared: "Shared with patient",
  Private: "Private",
};

export function HairTestsPage({
  patients,
  permissions,
  actor,
  onToast,
  onAudit,
}: {
  patients: PatientRecord[];
  permissions: AdminPermissionId[];
  actor: string;
  onToast: (message: string) => void;
  onAudit: (action: string, target: string) => void;
}) {
  const router = useRouter();
  const [records, setRecords] = useState<HairTestRecord[]>([]);
  const [query, setQuery] = useState("");
  const [patientId, setPatientId] = useState(patients[0]?.id ?? "");
  const [testName, setTestName] = useState("Scalp analysis");
  const [testDate, setTestDate] = useState(new Date().toISOString().slice(0, 10));
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const [reportToConfirmVisibility, setReportToConfirmVisibility] = useState<{
    record: HairTestRecord;
    targetVisibility: "Shared" | "Private";
  } | null>(null);
  const [patientConsentConfirmed, setPatientConsentConfirmed] = useState(false);
  const [updatingReportVisibility, setUpdatingReportVisibility] = useState(false);

  const canUpload = permissions.includes("hair-tests.upload");
  const canSubmit = permissions.includes("hair-tests.submit");
  const canApprove = permissions.includes("reports.approve");
  const canShare = permissions.includes("reports.share");
  const canView = permissions.includes("hair-tests.view") || canUpload || canApprove || canShare;

  const loadRecords = useCallback(async (signal?: AbortSignal) => {
    try {
      const [testsRes, reportsRes] = await Promise.all([
        fetch("/api/admin/hair-tests?limit=50", { cache: "no-store", signal })
          .then((res) => (res.ok ? res.json() : null))
          .catch(() => null),
        fetch("/api/admin/reports", { cache: "no-store", signal })
          .then((res) => (res.ok ? res.json() : null))
          .catch(() => null),
      ]);

      const combined: HairTestRecord[] = [];

      const rawTests = testsRes?.data?.items || testsRes?.items;
      if (Array.isArray(rawTests) && rawTests.length > 0) {
        rawTests.forEach((t: Record<string, unknown>) => {
          if (String(t.status || "").toLowerCase() === "archived") return;
          const patient = patients.find((p) => String(p.id) === String(t.userId));
          const stage = String(t.hair_loss_stage || t.stage || t.main_concern || "Scalp screening");
          const photoCount = Array.isArray(t.scalp_photos) ? t.scalp_photos.length : 0;
          const status = String(t.status || "submitted").toLowerCase();
          combined.push({
            id: String(t.reference_no || t.id),
            patientId: String(t.userId),
            patientName: patient?.name || String(t.name || `Patient #${t.userId}`),
            testName: `Hair assessment · ${stage}`,
            testDate: t.created_at ? new Date(String(t.created_at)).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
            fileName: photoCount > 0 ? `${photoCount} scalp photos attached` : "Clinical questionnaire",
            fileType: photoCount > 0 ? "image/jpeg" : "application/json",
            fileSize: (photoCount || 1) * 2048,
            status: status === "reviewed" ? "Approved" : status === "under_review" ? "In review" : "Draft",
            aiAssessmentStatus: String(t.ai_assessment_status || (t.ai_assessment ? "ready" : "not_available")) as NonNullable<HairTestRecord["aiAssessmentStatus"]>,
            createdAt: t.created_at ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(String(t.created_at))) : "Recently",
            uploadedBy: "Patient via app",
            recordKind: "assessment",
          });
        });
      }

      const reportItems = reportsRes?.data?.reports;
      if (Array.isArray(reportItems) && reportItems.length > 0) {
        reportItems.forEach((r: Record<string, unknown>) => {
          const patient = patients.find((p) => String(p.id) === String(r.userId));
          combined.push({
            id: String(r.id),
            patientId: String(r.userId),
            patientName: patient?.name || `Patient #${r.userId}`,
            testName: String(r.title || "Clinical Report"),
            testDate: r.created_at ? new Date(String(r.created_at)).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
            fileName: String(r.file_name || "report.pdf"),
            fileType: String(r.mime_type || "application/pdf"),
            fileSize: Number(r.bytes) || 1024,
            status: r.visibility === "Shared" ? "Shared" : "Private",
            createdAt: r.created_at ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(String(r.created_at))) : "Recently",
            uploadedBy: String(r.uploaded_by || actor),
            recordKind: "report",
          });
        });
      }

      setRecords(combined);
    } catch {
      // Keep previous records on fetch error
    }
  }, [patients, actor]);

  useEffect(() => {
    const controller = new AbortController();
    const deferredLoad = window.setTimeout(() => { void loadRecords(controller.signal); }, 0);
    return () => { window.clearTimeout(deferredLoad); controller.abort(); };
  }, [loadRecords]);

  const filtered = useMemo(() => records.filter((record) =>
    `${record.id} ${record.patientId} ${record.patientName} ${record.testName} ${record.fileName} ${record.status} ${record.aiAssessmentStatus || ""}`.toLowerCase().includes(query.toLowerCase())
  ), [records, query]);
  const pendingAiCount = records.filter((record) => record.recordKind === "assessment" && ["queued", "processing"].includes(record.aiAssessmentStatus || "")).length;
  const failedAiCount = records.filter((record) => record.recordKind === "assessment" && record.aiAssessmentStatus === "failed").length;

  const addFile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canUpload || uploading) return;
    const patient = patients.find((item) => item.id === patientId);
    if (!patient || !testName.trim() || !file) {
      onToast("Choose a patient, test name, date, and result file.");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", testName.trim());

      const res = await fetch(`/api/admin/users/${encodeURIComponent(patient.id)}/reports`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const body = await res.json();
        const r = body.data || {};
        const newRecord: HairTestRecord = {
          id: String(r.id || `rpt_${Date.now().toString().slice(-6)}`),
          patientId: patient.id,
          patientName: patient.name,
          testName: String(r.title || testName.trim()),
          testDate,
          fileName: String(r.file_name || file.name),
          fileType: String(r.mime_type || file.type || "application/pdf"),
          fileSize: Number(r.bytes) || file.size,
          status: "Private",
          createdAt: new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date()),
          uploadedBy: actor,
          recordKind: "report",
        };
        setRecords((current) => [newRecord, ...current]);
        setFile(null);
        event.currentTarget.reset();
        onAudit("uploaded private patient report", `${patient.id} · ${newRecord.testName}`);
        onToast("Clinical report uploaded privately. Share with patient when ready.");
      } else {
        const err = await res.json().catch(() => ({}));
        onToast(err.message || "Failed to upload report.");
      }
    } catch {
      onToast("Could not upload report. Check network connection.");
    } finally {
      setUploading(false);
    }
  };

  const updateAssessmentStatus = async (record: HairTestRecord, nextStatus: HairTestStatus) => {
    const allowed = nextStatus === "In review" ? canSubmit : nextStatus === "Approved" ? canApprove : false;
    if (!allowed) return;

    const backendStatus = nextStatus === "In review" ? "under_review" : "reviewed";
    try {
      const res = await fetch(`/api/admin/hair-tests/${encodeURIComponent(record.id)}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: backendStatus }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        onToast(err.message || "Failed to update assessment status.");
        return;
      }
      setRecords((current) => current.map((item) => (item.id === record.id ? { ...item, status: nextStatus } : item)));
      onAudit(
        nextStatus === "In review" ? "submitted for doctor review" : "approved hair test",
        `${record.id} · ${record.patientName}`
      );
      onToast(`${record.id} marked ${permissionLabels[nextStatus].toLowerCase()}.`);
    } catch {
      onToast("Could not update assessment status. Check network connection.");
    }
  };

  const confirmReportVisibility = async () => {
    if (!reportToConfirmVisibility) return;
    const { record, targetVisibility } = reportToConfirmVisibility;
    setUpdatingReportVisibility(true);
    try {
      const res = await fetch(
        `/api/admin/users/${encodeURIComponent(record.patientId)}/reports/${encodeURIComponent(record.id)}/visibility`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            visibility: targetVisibility,
            ...(targetVisibility === "Shared" ? { patient_consent_confirmed: patientConsentConfirmed } : {}),
          }),
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to update report visibility.");
      }
      const json = await res.json().catch(() => ({}));
      const updatedVis = (json?.data?.visibility as HairTestStatus) || targetVisibility;
      setRecords((curr) =>
        curr.map((item) => (item.id === record.id ? { ...item, status: updatedVis } : item))
      );
      onAudit(
        targetVisibility === "Shared" ? "shared patient report" : "hid patient report",
        `${record.patientId} · ${record.testName}`
      );
      onToast(
        targetVisibility === "Shared"
          ? `${record.testName} is now visible to the patient.`
          : `${record.testName} is now hidden from the patient.`
      );
      setReportToConfirmVisibility(null);
      setPatientConsentConfirmed(false);
    } catch (cause) {
      onToast(cause instanceof Error ? cause.message : "Failed to update report visibility.");
    } finally {
      setUpdatingReportVisibility(false);
    }
  };

  if (!canView) return <div className="page-wrap w-full min-w-0"><section className="card empty-state">You don’t have permission to view hair test records.</section></div>;

  return (
    <div className="page-wrap w-full min-w-0">
      <PageHeader eyebrow="Clinical workspace" title="Hair tests & reports" description="Keep patient test files in one review queue, then approve and share results when they are ready." />
      <div className="notice" style={{ marginBottom: 15 }}>
        <FileCheck2 size={14} />
        <span>Upload verified clinical test reports (PDF or image). Reports remain private until explicitly shared with patient consent.</span>
      </div>
      {canUpload && (
        <form className="card hair-test-upload w-full" onSubmit={addFile}>
          <div className="section-row">
            <div>
              <h2 className="card-title">Add a patient test result</h2>
              <p className="card-note">Images, PDF, DOC, and DOCX · up to 15 MB</p>
            </div>
            <FileUp size={18} color="#167f79" />
          </div>
          <div className="hair-test-form-grid grid grid-cols-1 gap-3 md:grid-cols-2">
            <label className="field">
              <span>Patient</span>
              <select value={patientId} onChange={(event) => setPatientId(event.target.value)} required>
                {patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>{patient.name} · {patient.id}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Test name</span>
              <input value={testName} onChange={(event) => setTestName(event.target.value)} required placeholder="e.g. Hair density test" />
            </label>
            <label className="field">
              <span>Test date</span>
              <input type="date" value={testDate} onChange={(event) => setTestDate(event.target.value)} required />
            </label>
            <label className="field">
              <span>Result file</span>
              <input
                type="file"
                accept="image/*,.pdf,.doc,.docx"
                onChange={(event) => {
                  const next = event.target.files?.[0] ?? null;
                  if (next && next.size > 15 * 1024 * 1024) {
                    onToast("Choose a file smaller than 15 MB.");
                    event.target.value = "";
                    return;
                  }
                  setFile(next);
                }}
                required
              />
              <small>{file ? `${file.name} · ${(file.size / 1024 / 1024).toFixed(1)} MB` : "File will be encrypted and saved to clinical storage."}</small>
            </label>
          </div>
          <div className="hair-test-form-actions">
            <button className="button button-primary" type="submit" disabled={uploading}>
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <FileUp size={14} />}
              {uploading ? "Uploading..." : "Add test record"}
            </button>
          </div>
        </form>
      )}

      <section className="card hair-test-queue">
        <div className="section-row">
          <div>
            <h2 className="card-title">Test review queue</h2>
            <p className="card-note">
              {records.filter((item) => item.status === "In review").length} waiting for doctor review · {records.filter((item) => item.status === "Approved" || item.status === "Private").length} approved to share · {records.filter((item) => item.status === "Shared").length} shared with patients · {pendingAiCount} AI pending · {failedAiCount} AI failed
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="hair-test-count">{records.length} records</span>
            <button type="button" className="button button-secondary button-small" onClick={() => void loadRecords()} aria-label="Refresh assessment and AI queue status">
              <RefreshCw size={13} />Refresh status
            </button>
          </div>
        </div>
        <TableToolbar value={query} onChange={setQuery} placeholder="Search by patient, test, ID, or file name..." right={<Search size={14} color="#98a3af" />} />
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Patient</th>
                <th>Test</th>
                <th>File</th>
                <th>Test date</th>
                <th>Status</th>
                <th>Workflow</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((record) => {
                const isReport = record.recordKind === "report";
                return (
                  <tr key={record.id}>
                    <td>
                      <strong>{record.patientName}</strong>
                      <div className="person-sub">{record.patientId} · {record.id}</div>
                    </td>
                    <td>{record.testName}</td>
                    <td>
                      <div className="hair-test-file">
                        {record.fileName}
                        <small>{(record.fileSize / 1024).toFixed(0)} KB · added by {record.uploadedBy}</small>
                      </div>
                    </td>
                    <td>{record.testDate}</td>
                    <td>
                      <StatusPill status={record.status} />
                      {record.recordKind === "assessment" && record.aiAssessmentStatus && (
                        <div className="mt-1"><StatusPill status={`AI ${record.aiAssessmentStatus}`} /></div>
                      )}
                    </td>
                    <td>
                      <div className="hair-test-actions">
                        {record.recordKind === "assessment" && (
                          <button
                            type="button"
                            className="button button-secondary button-small"
                            onClick={() => router.push(`/patients/${encodeURIComponent(record.patientId)}/assessments/${encodeURIComponent(record.id)}`)}
                          >
                            View assessment
                          </button>
                        )}
                        {!isReport && record.status === "Draft" && canSubmit && (
                          <button
                            type="button"
                            className="button button-secondary button-small"
                            onClick={() => void updateAssessmentStatus(record, "In review")}
                          >
                            <ClipboardCheck size={13} />Submit
                          </button>
                        )}
                        {!isReport && record.status === "In review" && canApprove && (
                          <button
                            type="button"
                            className="button button-secondary button-small"
                            onClick={() => void updateAssessmentStatus(record, "Approved")}
                          >
                            <Check size={13} />Approve
                          </button>
                        )}
                        {isReport && record.status === "Private" && canShare && (
                          <button
                            type="button"
                            className="button button-primary button-small"
                            onClick={() => {
                              setPatientConsentConfirmed(false);
                              setReportToConfirmVisibility({ record, targetVisibility: "Shared" });
                            }}
                          >
                            <Share2 size={13} />Share with patient
                          </button>
                        )}
                        {isReport && record.status === "Shared" && canShare && (
                          <button
                            type="button"
                            className="button button-secondary button-small"
                            onClick={() => {
                              setReportToConfirmVisibility({ record, targetVisibility: "Private" });
                            }}
                          >
                            <EyeOff size={13} />Hide from patient
                          </button>
                        )}
                        {isReport && record.status === "Private" && !canShare && (
                          <span className="person-sub">Private · Super Admin can share</span>
                        )}
                        {isReport && record.status === "Shared" && !canShare && (
                          <span className="person-sub">Visible in patient app</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state">
                      {records.length === 0
                        ? "No hair assessment submissions or clinical reports yet."
                        : "No hair test records match this search."}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="table-footer">
          <span>Showing {filtered.length} of {records.length} test records</span>
          <span>Stored in secure Cloudinary clinical storage</span>
        </div>
      </section>

      {reportToConfirmVisibility && (
        <Modal
          title={reportToConfirmVisibility.targetVisibility === "Shared" ? "Share report with patient?" : "Hide report from patient?"}
          description={
            reportToConfirmVisibility.targetVisibility === "Shared"
              ? "Only this patient’s signed-in app account can view the report. The DHP patient ID alone does not grant access."
              : "The patient will no longer see this report in their signed-in clinical record."
          }
          submitLabel={
            updatingReportVisibility
              ? "Updating…"
              : reportToConfirmVisibility.targetVisibility === "Shared"
              ? "Share report"
              : "Hide report"
          }
          submitDisabled={
            updatingReportVisibility ||
            (reportToConfirmVisibility.targetVisibility === "Shared" && !patientConsentConfirmed)
          }
          onClose={() => {
            if (!updatingReportVisibility) {
              setReportToConfirmVisibility(null);
              setPatientConsentConfirmed(false);
            }
          }}
          onSubmit={() => {
            void confirmReportVisibility();
          }}
        >
          <div className="rounded-xl border border-slate-200 bg-[#FAFBFD] p-3">
            <p className="text-sm font-semibold text-[#1A365D]">
              {reportToConfirmVisibility.record.testName}
            </p>
            <p className="mt-1 break-all text-xs text-slate-500">
              {reportToConfirmVisibility.record.fileName} · Patient {reportToConfirmVisibility.record.patientName} ({reportToConfirmVisibility.record.patientId})
            </p>
          </div>
          {reportToConfirmVisibility.targetVisibility === "Shared" && (
            <label className="mt-3 flex cursor-pointer items-start gap-2 rounded-xl border border-teal-100 bg-teal-50/60 p-3 text-xs leading-5 text-teal-950">
              <input
                type="checkbox"
                checked={patientConsentConfirmed}
                onChange={(e) => setPatientConsentConfirmed(e.target.checked)}
                className="mt-1 accent-teal-700"
              />
              <span>I confirmed with the patient that this report may be shared to their signed-in app account.</span>
            </label>
          )}
          <p className="mt-3 text-xs leading-5 text-slate-500">
            This grants access only inside the patient’s authenticated app.
          </p>
        </Modal>
      )}
    </div>
  );
}
