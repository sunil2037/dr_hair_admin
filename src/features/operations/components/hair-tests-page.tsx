"use client";

import { useMemo, useState } from "react";
import { Check, ClipboardCheck, FileCheck2, FileUp, Search } from "lucide-react";
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
  const canUpload = permissions.includes("hair-tests.upload");
  const canSubmit = permissions.includes("hair-tests.submit");
  const canApprove = permissions.includes("reports.approve");
  const canShare = permissions.includes("reports.share");
  const canView = permissions.includes("hair-tests.view") || canUpload || canApprove || canShare;

  const filtered = useMemo(() => records.filter((record) =>
    `${record.id} ${record.patientId} ${record.patientName} ${record.testName} ${record.fileName} ${record.status}`.toLowerCase().includes(query.toLowerCase())
  ), [records, query]);

  const addFile = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canUpload) return;
    const patient = patients.find((item) => item.id === patientId);
    if (!patient || !testName.trim() || !file) {
      onToast("Choose a patient, test name, date, and result file.");
      return;
    }
    const record: HairTestRecord = {
      id: `HT-${Date.now().toString().slice(-5)}`,
      patientId: patient.id,
      patientName: patient.name,
      testName: testName.trim(),
      testDate,
      fileName: file.name,
      fileType: file.type || "application/octet-stream",
      fileSize: file.size,
      status: "Draft",
      createdAt: new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date()),
      uploadedBy: actor,
    };
    setRecords((current) => [record, ...current]);
    setFile(null);
    event.currentTarget.reset();
    onAudit("added a hair test file record for", `${patient.id} · ${record.testName}`);
    onToast("File record added to the local preview. File bytes are not uploaded or stored.");
  };

  const updateStatus = (record: HairTestRecord, status: HairTestStatus) => {
    const allowed = status === "In review" ? canSubmit : status === "Approved" ? canApprove : status === "Shared" ? canShare : false;
    if (!allowed) return;
    if (status === "Shared" && record.status !== "Approved") {
      onToast("Approve this report before sharing it with the patient.");
      return;
    }
    setRecords((current) => current.map((item) => item.id === record.id ? { ...item, status } : item));
    if (status === "Shared") {
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
    onAudit(status === "In review" ? "submitted for doctor review" : status === "Approved" ? "approved hair test" : "shared hair test with patient", `${record.id} · ${record.patientName}`);
    onToast(`${record.id} marked ${permissionLabels[status].toLowerCase()} in this browser preview.`);
  };

  if (!canView) return <main className="page-wrap"><section className="card empty-state">You don’t have permission to view hair test records.</section></main>;

  return <main className="page-wrap mx-auto w-full max-w-[1420px] px-4 py-6 sm:px-6 lg:px-8">
    <PageHeader eyebrow="Clinical workspace · Dr. Jai Bansal" title="Hair tests & reports" description="Keep patient test files in one review queue, then approve and share results when they are ready." />
    <div className="notice" style={{ marginBottom: 15 }}><FileCheck2 size={14} /><span>Local demo only. This screen stores file name and metadata in this browser; it does not upload the file or send a notification. Connect authenticated APIs and private file storage before using real patient records.</span></div>
    {canUpload && <form className="card hair-test-upload w-full" onSubmit={addFile}>
      <div className="section-row"><div><h2 className="card-title">Add a patient test result</h2><p className="card-note">Images, PDF, DOC, and DOCX · up to 15 MB</p></div><FileUp size={18} color="#167f79" /></div>
      <div className="hair-test-form-grid grid grid-cols-1 gap-3 md:grid-cols-2">
        <label className="field"><span>Patient</span><select value={patientId} onChange={(event) => setPatientId(event.target.value)} required>{patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.name} · {patient.id}</option>)}</select></label>
        <label className="field"><span>Test name</span><input value={testName} onChange={(event) => setTestName(event.target.value)} required placeholder="e.g. Hair density test" /></label>
        <label className="field"><span>Test date</span><input type="date" value={testDate} onChange={(event) => setTestDate(event.target.value)} required /></label>
        <label className="field"><span>Result file</span><input type="file" accept="image/*,.pdf,.doc,.docx" onChange={(event) => { const next = event.target.files?.[0] ?? null; if (next && next.size > 15 * 1024 * 1024) { onToast("Choose a file smaller than 15 MB."); event.target.value = ""; return; } setFile(next); }} required /><small>{file ? `${file.name} · ${(file.size / 1024 / 1024).toFixed(1)} MB` : "The file itself will not be saved in this demo."}</small></label>
      </div>
      <div className="hair-test-form-actions"><button className="button button-primary" type="submit"><FileUp size={14} />Add test record</button></div>
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
            {record.status === "Shared" && <span className="person-sub">Ready in patient app after API connection</span>}
          </div></td>
        </tr>)}
        {filtered.length === 0 && <tr><td colSpan={6}><div className="empty-state">No hair test records match this search.</div></td></tr>}
      </tbody></table></div>
      <div className="table-footer"><span>Showing {filtered.length} of {records.length} test records</span><span>File access requires private storage APIs</span></div>
    </section>
  </main>;
}
