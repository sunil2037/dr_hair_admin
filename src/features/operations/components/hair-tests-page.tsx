"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, ClipboardCheck, FileCheck2, FileUp, Loader2, Search } from "lucide-react";
import { PageHeader, StatusPill, TableToolbar } from "../../shared/components/ui";
import { useSessionState } from "../../shared/lib/use-session-state";
import type { AdminPermissionId, PatientRecord } from "../../shared/types";
import { patientClinicalProfiles } from "../lib/patient-profiles";
import { initialHairTests } from "../lib/hair-test-demo";
import { createFallbackProfile } from "./patient-profile-dialog";
import type { HairTestRecord, HairTestStatus, PatientClinicalProfile, PatientReportNotification } from "../types";

const permissionLabels: Record<HairTestStatus, string> = {
  Draft: "Draft",
  "In review": "In review",
  Approved: "Approved",
  Shared: "Shared with patient",
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
  const [records, setRecords] = useSessionState<HairTestRecord[]>("drhair-demo-hair-tests", initialHairTests);
  const [profiles, setProfiles] = useSessionState<Record<string, PatientClinicalProfile>>("drhair-demo-patient-profiles", patientClinicalProfiles);
  const [notifications, setNotifications] = useSessionState<PatientReportNotification[]>("drhair-demo-patient-notifications", []);
  const [query, setQuery] = useState("");
  const [patientId, setPatientId] = useState(patients[0]?.id ?? "");
  const [testName, setTestName] = useState("Scalp analysis");
  const [testDate, setTestDate] = useState(new Date().toISOString().slice(0, 10));
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const canUpload = permissions.includes("hair-tests.upload");
  const canSubmit = permissions.includes("hair-tests.submit");
  const canApprove = permissions.includes("reports.approve");
  const canShare = permissions.includes("reports.share");
  const canView = permissions.includes("hair-tests.view") || canUpload || canApprove || canShare;

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/admin/reports", { cache: "no-store", signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) return;
        const body = await res.json().catch(() => ({}));
        const items = body?.data?.reports;
        if (Array.isArray(items) && items.length > 0) {
          const mapped: HairTestRecord[] = items.map((r: Record<string, unknown>) => {
            const patient = patients.find((p) => String(p.id) === String(r.userId));
            return {
              id: String(r.id),
              patientId: String(r.userId),
              patientName: patient?.name || `Patient #${r.userId}`,
              testName: String(r.title || "Clinical Report"),
              testDate: r.created_at ? new Date(String(r.created_at)).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
              fileName: String(r.file_name || "report.pdf"),
              fileType: String(r.mime_type || "application/pdf"),
              fileSize: Number(r.bytes) || 1024,
              status: r.visibility === "Shared" ? "Shared" : "Approved",
              createdAt: r.created_at ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(String(r.created_at))) : "Recently",
              uploadedBy: String(r.uploaded_by || actor),
            };
          });
          setRecords(mapped);
        }
      })
      .catch(() => {});
    return () => controller.abort();
  }, [patients, actor, setRecords]);

  const filtered = useMemo(() => records.filter((record) =>
    `${record.id} ${record.patientId} ${record.patientName} ${record.testName} ${record.fileName} ${record.status}`.toLowerCase().includes(query.toLowerCase())
  ), [records, query]);

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
          id: String(r.id || `HT-${Date.now().toString().slice(-5)}`),
          patientId: patient.id,
          patientName: patient.name,
          testName: String(r.title || testName.trim()),
          testDate,
          fileName: String(r.file_name || file.name),
          fileType: String(r.mime_type || file.type || "application/pdf"),
          fileSize: Number(r.bytes) || file.size,
          status: "Draft",
          createdAt: new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date()),
          uploadedBy: actor,
        };
        setRecords((current) => [newRecord, ...current]);
        setFile(null);
        event.currentTarget.reset();
        onAudit("uploaded a clinical report for", `${patient.id} · ${newRecord.testName}`);
        onToast("Clinical report uploaded successfully to secure storage.");
        return;
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

  const updateStatus = async (record: HairTestRecord, status: HairTestStatus) => {
    const allowed = status === "In review" ? canSubmit : status === "Approved" ? canApprove : status === "Shared" ? canShare : false;
    if (!allowed) return;
    if (status === "Shared" && record.status !== "Approved") {
      onToast("Approve this report before sharing it with the patient.");
      return;
    }

    if (status === "Shared") {
      try {
        const res = await fetch(`/api/admin/users/${encodeURIComponent(record.patientId)}/reports/${encodeURIComponent(record.id)}/visibility`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ visibility: "Shared", patient_consent_confirmed: true }),
        });
        if (res.ok) {
          onToast(`${record.testName} shared with patient. Push notification dispatched.`);
        }
      } catch {}

      const patientRecord = patients.find((patient) => patient.id === record.patientId);
      const profile = profiles[record.patientId] ?? (patientRecord ? createFallbackProfile(patientRecord) : undefined);
      if (profile) {
        const sharedReport = { id: record.id, title: `${record.testName} report`, date: record.testDate, status: "Shared" as const, summary: "Test result reviewed by Dr. Jai Bansal.", fileName: record.fileName };
        setProfiles((current) => ({
          ...current,
          [record.patientId]: {
            ...profile,
            reports: profile.reports.some((report) => report.id === record.id)
              ? profile.reports.map((report) => report.id === record.id ? { ...report, ...sharedReport } : report)
              : [sharedReport, ...profile.reports],
          },
        }));
      }
      if (!notifications.some((notification) => notification.patientId === record.patientId && notification.reportId === record.id)) {
        setNotifications((current) => [{ id: `NTF-${Date.now()}`, patientId: record.patientId, reportId: record.id, title: "Your hair test report is ready", body: `${record.testName} results are available in your Dr. Hair profile.`, createdAt: new Date().toISOString(), queuedAt: "Just now" }, ...current]);
      }
    }

    setRecords((current) => current.map((item) => item.id === record.id ? { ...item, status } : item));
    onAudit(status === "In review" ? "submitted for doctor review" : status === "Approved" ? "approved hair test" : "shared hair test with patient", `${record.id} · ${record.patientName}`);
    if (status !== "Shared") {
      onToast(`${record.id} marked ${permissionLabels[status].toLowerCase()}.`);
    }
  };

  if (!canView) return <main className="page-wrap"><section className="card empty-state">You don’t have permission to view hair test records.</section></main>;

  return <main className="page-wrap mx-auto w-full max-w-[1420px] px-4 py-6 sm:px-6 lg:px-8">
    <PageHeader eyebrow="Clinical workspace · Dr. Jai Bansal" title="Hair tests & reports" description="Keep patient test files in one review queue, then approve and share results when they are ready." />
    <div className="notice" style={{ marginBottom: 15 }}><FileCheck2 size={14} /><span>Upload verified clinical test reports (PDF or image). Approved reports shared with patients appear immediately in their Dr. Hair mobile app.</span></div>
    {canUpload && <form className="card hair-test-upload w-full" onSubmit={addFile}>
      <div className="section-row"><div><h2 className="card-title">Add a patient test result</h2><p className="card-note">Images, PDF, DOC, and DOCX · up to 15 MB</p></div><FileUp size={18} color="#167f79" /></div>
      <div className="hair-test-form-grid grid grid-cols-1 gap-3 md:grid-cols-2">
        <label className="field"><span>Patient</span><select value={patientId} onChange={(event) => setPatientId(event.target.value)} required>{patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.name} · {patient.id}</option>)}</select></label>
        <label className="field"><span>Test name</span><input value={testName} onChange={(event) => setTestName(event.target.value)} required placeholder="e.g. Hair density test" /></label>
        <label className="field"><span>Test date</span><input type="date" value={testDate} onChange={(event) => setTestDate(event.target.value)} required /></label>
        <label className="field"><span>Result file</span><input type="file" accept="image/*,.pdf,.doc,.docx" onChange={(event) => { const next = event.target.files?.[0] ?? null; if (next && next.size > 15 * 1024 * 1024) { onToast("Choose a file smaller than 15 MB."); event.target.value = ""; return; } setFile(next); }} required /><small>{file ? `${file.name} · ${(file.size / 1024 / 1024).toFixed(1)} MB` : "File will be encrypted and saved to clinical storage."}</small></label>
      </div>
      <div className="hair-test-form-actions">
        <button className="button button-primary" type="submit" disabled={uploading}>
          {uploading ? <Loader2 size={14} className="animate-spin" /> : <FileUp size={14} />}
          {uploading ? "Uploading..." : "Add test record"}
        </button>
      </div>
    </form>}
    <section className="card hair-test-queue">
      <div className="section-row"><div><h2 className="card-title">Test review queue</h2><p className="card-note">{records.filter((item) => item.status === "In review").length} waiting for doctor review · {records.filter((item) => item.status === "Approved").length} approved to share</p></div><span className="hair-test-count">{records.length} records</span></div>
      <TableToolbar value={query} onChange={setQuery} placeholder="Search by patient, test, ID, or file name..." right={<Search size={14} color="#98a3af" />} />
      <div className="table-wrap"><table><thead><tr><th>Patient</th><th>Test</th><th>File</th><th>Test date</th><th>Status</th><th>Workflow</th></tr></thead><tbody>
        {filtered.map((record) => <tr key={record.id}>
          <td><strong>{record.patientName}</strong><div className="person-sub">{record.patientId} · {record.id}</div></td>
          <td>{record.testName}</td><td><div className="hair-test-file">{record.fileName}<small>{(record.fileSize / 1024).toFixed(0)} KB · added by {record.uploadedBy}</small></div></td><td>{record.testDate}</td><td><StatusPill status={record.status} /></td>
          <td><div className="hair-test-actions">
            {record.status === "Draft" && canSubmit && <button className="button button-secondary button-small" onClick={() => updateStatus(record, "In review")}><ClipboardCheck size={13} />Submit</button>}
            {record.status === "In review" && canApprove && <button className="button button-secondary button-small" onClick={() => updateStatus(record, "Approved")}><Check size={13} />Approve</button>}
            {record.status === "Approved" && canShare && <button className="button button-primary button-small" onClick={() => updateStatus(record, "Shared")}><Check size={13} />Share</button>}
            {record.status === "Draft" && !canSubmit && <span className="person-sub">Awaiting doctor submission</span>}
            {record.status === "In review" && !canApprove && <span className="person-sub">Awaiting doctor review</span>}
            {record.status === "Approved" && !canShare && <span className="person-sub">Approved · doctor can share</span>}
            {record.status === "Shared" && <span className="person-sub">Visible in patient app</span>}
          </div></td>
        </tr>)}
        {filtered.length === 0 && <tr><td colSpan={6}><div className="empty-state">No hair test records match this search.</div></td></tr>}
      </tbody></table></div>
      <div className="table-footer"><span>Showing {filtered.length} of {records.length} test records</span><span>Stored in secure Cloudinary clinical storage</span></div>
    </section>
  </main>;
}
