"use client";

import { BellRing, CalendarClock, CircleAlert, Send, X } from "lucide-react";
import { useState } from "react";
import { StatusPill } from "../../shared/components/ui";
import { useSessionState } from "../../shared/lib/use-session-state";

type NotificationStatus = "Queued" | "Scheduled" | "Cancelled";
type Audience = "All app users" | "Active patients" | "Patients with a shared report";
interface NotificationRecord {
  id: string;
  title: string;
  message: string;
  audience: Audience;
  status: NotificationStatus;
  createdAt: string;
  scheduledAt?: string;
}

const initialNotifications: NotificationRecord[] = [
  { id: "NTF-204", title: "Your weekly progress check-in", message: "Take a moment to share how your hair care routine is going this week.", audience: "Active patients", status: "Scheduled", createdAt: "Today", scheduledAt: "Oct 30, 2026 · 9:00 AM" },
  { id: "NTF-203", title: "Your report is ready", message: "A new report is available in your Dr. Hair app.", audience: "Patients with a shared report", status: "Queued", createdAt: "Yesterday" },
];

const audienceCounts: Record<Audience, number> = {
  "All app users": 1248,
  "Active patients": 384,
  "Patients with a shared report": 12,
};

export function NotificationsPanel({ onToast, onAudit }: { onToast: (message: string) => void; onAudit: (action: string, target: string) => void }) {
  const [records, setRecords] = useSessionState<NotificationRecord[]>("drhair-app-notifications", initialNotifications);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [audience, setAudience] = useState<Audience>("Active patients");
  const [scheduleMode, setScheduleMode] = useState<"now" | "later">("now");
  const [scheduledAt, setScheduledAt] = useState("");

  const submit = () => {
    const cleanTitle = title.trim();
    const cleanMessage = message.trim();
    if (cleanTitle.length < 3 || cleanTitle.length > 60) {
      onToast("Enter a notification title between 3 and 60 characters.");
      return;
    }
    if (cleanMessage.length < 10 || cleanMessage.length > 160) {
      onToast("Keep the notification message between 10 and 160 characters.");
      return;
    }
    if (scheduleMode === "later" && (!scheduledAt || new Date(scheduledAt).getTime() <= Date.now())) {
      onToast("Choose a future date and time for the notification.");
      return;
    }
    const record: NotificationRecord = {
      id: `NTF-${Date.now().toString().slice(-5)}`,
      title: cleanTitle,
      message: cleanMessage,
      audience,
      status: scheduleMode === "later" ? "Scheduled" : "Queued",
      createdAt: "Just now",
      scheduledAt: scheduleMode === "later" ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(scheduledAt)) : undefined,
    };
    setRecords((current) => [record, ...current]);
    onAudit(scheduleMode === "later" ? "scheduled app notification" : "queued app notification", cleanTitle);
    onToast(scheduleMode === "later" ? "Notification saved to the demo schedule." : "Notification added to the local demo queue.");
    setTitle("");
    setMessage("");
    setScheduledAt("");
  };

  const cancel = (record: NotificationRecord) => {
    setRecords((current) => current.map((item) => item.id === record.id ? { ...item, status: "Cancelled" } : item));
    onAudit("cancelled app notification", record.title);
    onToast("Scheduled notification cancelled in this demo.");
  };

  return <div className="space-y-4">
    <div className="notice"><CircleAlert size={14} /><span>Demo mode: this screen only saves a local preview. No push notification is sent. Keep diagnoses, test findings, and other private medical details out of notification text.</span></div>
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,.9fr)]">
      <section className="card p-4 sm:p-5">
        <div className="section-row !p-0 !pb-4"><div><h2 className="card-title">Compose notification</h2><p className="card-note">Write a short, privacy-safe message for the Dr. Hair app.</p></div><span className="module-symbol"><BellRing size={16} /></span></div>
        <div className="grid gap-3">
          <label className="field"><span>Notification title</span><input value={title} maxLength={60} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Your weekly progress check-in" /><small>{title.trim().length}/60 characters</small></label>
          <label className="field"><span>Message</span><textarea value={message} maxLength={160} rows={3} onChange={(event) => setMessage(event.target.value)} placeholder="Keep it brief. The app can show private details after sign-in." /><small>{message.trim().length}/160 characters</small></label>
          <label className="field"><span>Audience</span><select value={audience} onChange={(event) => setAudience(event.target.value as Audience)}><option>All app users</option><option>Active patients</option><option>Patients with a shared report</option></select><small>Estimated audience: {audienceCounts[audience].toLocaleString("en-IN")} users · demo estimate</small></label>
          <fieldset className="grid gap-2 border-0 p-0"><legend className="mb-2 text-[11px] font-semibold text-slate-600">When should it go out?</legend><div className="flex flex-wrap gap-2"><button type="button" className={`filter-button ${scheduleMode === "now" ? "selected" : ""}`} onClick={() => setScheduleMode("now")}><Send size={13} />Queue now</button><button type="button" className={`filter-button ${scheduleMode === "later" ? "selected" : ""}`} onClick={() => setScheduleMode("later")}><CalendarClock size={13} />Schedule</button></div></fieldset>
          {scheduleMode === "later" && <label className="field"><span>Scheduled date and time</span><input type="datetime-local" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} /><small>Choose a future local date and time.</small></label>}
          <div className="flex justify-end"><button className="button button-primary" type="button" onClick={submit}><Send size={14} />{scheduleMode === "later" ? "Save schedule" : "Add to queue"}</button></div>
        </div>
      </section>

      <section className="card p-4 sm:p-5">
        <div className="section-row !p-0 !pb-2"><div><h2 className="card-title">Recent notifications</h2><p className="card-note">Delivery stays marked as demo until the notification service is connected.</p></div><span className="text-[10px] text-slate-400">{records.length} records</span></div>
        <div className="divide-y divide-slate-100">
          {records.map((record) => <article key={record.id} className="flex items-start gap-3 py-3.5">
            <span className="activity-icon mt-0.5"><BellRing size={14} /></span>
            <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><strong className="text-xs text-slate-800">{record.title}</strong><StatusPill status={record.status} /></div><p className="mb-1 mt-1 text-[11px] leading-5 text-slate-500">{record.message}</p><div className="text-[10px] text-slate-400">{record.audience} · {record.scheduledAt ?? record.createdAt} · Not sent</div></div>
            {record.status === "Scheduled" && <button className="row-action" aria-label={`Cancel ${record.title}`} title="Cancel schedule" onClick={() => cancel(record)}><X size={14} /></button>}
          </article>)}
          {records.length === 0 && <div className="empty-state">No notifications yet. Compose the first one to create a local preview.</div>}
        </div>
      </section>
    </div>
  </div>;
}
