"use client";

import { AlertTriangle, Apple, CheckCircle2, ExternalLink, Smartphone } from "lucide-react";
import { useState } from "react";
import type { Platform } from "../types";
import { Modal, ToggleSwitch } from "../../shared/components/ui";
import { useSessionState } from "../../shared/lib/use-session-state";

interface UpdatePolicy {
  latestVersion: string;
  latestBuild: string;
  minimumVersion: string;
  minimumBuild: string;
  storeUrl: string;
  updateMessage: string;
  releaseNotes: string;
  mode: "recommended" | "required";
  scheduledAt: string;
  enabled: boolean;
}

type PlatformPolicies = Record<Platform, UpdatePolicy>;

const initialPolicies: PlatformPolicies = {
  android: { latestVersion: "1.0.0", latestBuild: "1", minimumVersion: "1.0.0", minimumBuild: "1", storeUrl: "", updateMessage: "A new Dr. Hair app update is available.", releaseNotes: "", mode: "recommended", scheduledAt: "", enabled: false },
  ios: { latestVersion: "1.0.0", latestBuild: "1", minimumVersion: "1.0.0", minimumBuild: "1", storeUrl: "", updateMessage: "A new Dr. Hair app update is available.", releaseNotes: "", mode: "recommended", scheduledAt: "", enabled: false },
};

const versionPattern = /^\d+\.\d+\.\d+$/;

function compareBuild(versionA: string, buildA: string, versionB: string, buildB: string) {
  const partsA = versionA.split(".").map(Number);
  const partsB = versionB.split(".").map(Number);
  for (let index = 0; index < 3; index += 1) {
    if (partsA[index] !== partsB[index]) return partsA[index] - partsB[index];
  }
  return Number(buildA) - Number(buildB);
}

function getValidationError(policy: UpdatePolicy) {
  if (!versionPattern.test(policy.latestVersion) || !versionPattern.test(policy.minimumVersion)) return "Use a semantic version such as 1.2.3 for both version fields.";
  if (!/^\d+$/.test(policy.latestBuild) || !/^\d+$/.test(policy.minimumBuild)) return "Build numbers must be whole numbers.";
  if (Number(policy.latestBuild) < 1 || Number(policy.minimumBuild) < 1) return "Build numbers must be at least 1.";
  if (compareBuild(policy.minimumVersion, policy.minimumBuild, policy.latestVersion, policy.latestBuild) > 0) return "Minimum supported version/build cannot be newer than the latest release.";
  if (policy.updateMessage.trim().length < 8 || policy.updateMessage.trim().length > 160) return "Update message must be between 8 and 160 characters.";
  if (policy.enabled) {
    try {
      const url = new URL(policy.storeUrl);
      if (url.protocol !== "https:") return "Use a secure HTTPS store link before enabling updates.";
    } catch {
      return "Add a valid HTTPS store link before enabling updates.";
    }
  }
  if (policy.enabled && policy.mode === "required" && !policy.storeUrl.trim()) return "A required update needs a store link.";
  if (policy.scheduledAt && new Date(policy.scheduledAt).getTime() <= Date.now()) return "Choose a future date and time, or clear the schedule to apply now.";
  return "";
}

export function AppUpdatesPanel({ onToast, onAudit }: { onToast: (message: string) => void; onAudit: (action: string, target: string) => void }) {
  const [policies, setPolicies] = useSessionState<PlatformPolicies>("drhair-app-update-policies", initialPolicies);
  const [confirming, setConfirming] = useState<{ platform: Platform; policy: UpdatePolicy } | null>(null);

  const save = (platform: Platform, policy: UpdatePolicy) => {
    const error = getValidationError(policy);
    if (error) {
      onToast(error);
      return;
    }
    if (policy.enabled && policy.mode === "required") {
      setConfirming({ platform, policy });
      return;
    }
    commitSave(platform, policy);
  };

  const commitSave = (platform: Platform, policy: UpdatePolicy) => {
    setPolicies((current) => ({ ...current, [platform]: policy }));
    const target = `${platform === "android" ? "Android" : "iOS"} ${policy.mode} update · minimum ${policy.minimumVersion} (${policy.minimumBuild})`;
    onAudit(policy.scheduledAt ? "scheduled app release policy" : "updated app release policy", target);
    onToast(policy.enabled ? policy.scheduledAt ? `${platform === "android" ? "Android" : "iOS"} update policy scheduled in this demo.` : `${platform === "android" ? "Android" : "iOS"} update policy saved in this demo.` : `${platform === "android" ? "Android" : "iOS"} update policy disabled in this demo.`);
    setConfirming(null);
  };

  return <div className="space-y-4">
    <div className="notice"><AlertTriangle size={14} /><span>Demo mode: saving here does not change the Flutter app. A live force update needs a published store release and a remote update-policy API. The app should block only versions below the minimum supported version.</span></div>
    <div className="grid grid-cols-1 gap-4 2xl:grid-cols-2">
      {(["android", "ios"] as Platform[]).map((platform) => <UpdatePolicyCard key={platform} platform={platform} value={policies[platform]} onSave={(next) => save(platform, next)} />)}
    </div>
    <div className="callout flex gap-3"><span className="callout-icon"><CheckCircle2 size={16} /></span><div><h3>Recommended and required updates</h3><p>A recommended update can be dismissed. A required update blocks app use below the configured minimum version and opens the platform store link. Configure Android and iOS independently.</p></div></div>
    {confirming && <Modal title={`Require the ${confirming.platform === "android" ? "Android" : "iOS"} update?`} description={`This would block app versions below ${confirming.policy.minimumVersion} build ${confirming.policy.minimumBuild} when the policy starts.`} submitLabel="Confirm required update" onClose={() => setConfirming(null)} onSubmit={() => commitSave(confirming.platform, confirming.policy)}><div className="notice"><AlertTriangle size={14} /><span>Review the minimum version and store link carefully. Existing users below this version will be asked to update before continuing.</span></div><p className="mt-3 text-xs text-slate-500">{confirming.platform === "android" ? "Play Store" : "App Store"} link: <a className="text-teal-700 underline" href={confirming.policy.storeUrl} target="_blank" rel="noreferrer">Open {confirming.platform === "android" ? "Play Store" : "App Store"} <ExternalLink className="inline" size={12} /></a></p></Modal>}
  </div>;
}

function UpdatePolicyCard({ platform, value, onSave }: { platform: Platform; value: UpdatePolicy; onSave: (policy: UpdatePolicy) => void }) {
  const [draft, setDraft] = useState(value);
  const Icon = platform === "android" ? Smartphone : Apple;
  const update = <K extends keyof UpdatePolicy>(key: K, next: UpdatePolicy[K]) => setDraft((current) => ({ ...current, [key]: next }));
  return <section className="card p-4 sm:p-5">
    <div className="section-row !p-0 !pb-4"><div className="flex items-center gap-3"><span className="module-symbol"><Icon size={17} /></span><div><h2 className="card-title">{platform === "android" ? "Android" : "iOS"} release policy</h2><p className="card-note">Set versions and behavior for this app platform.</p></div></div><ToggleSwitch checked={draft.enabled} label={`${draft.enabled ? "Disable" : "Enable"} ${platform} update policy`} onChange={() => update("enabled", !draft.enabled)} /></div>
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <label className="field"><span>Latest version</span><input value={draft.latestVersion} onChange={(event) => update("latestVersion", event.target.value)} placeholder="1.2.0" /></label>
      <label className="field"><span>Latest build number</span><input inputMode="numeric" value={draft.latestBuild} onChange={(event) => update("latestBuild", event.target.value)} placeholder="42" /></label>
      <label className="field"><span>Minimum supported version</span><input value={draft.minimumVersion} onChange={(event) => update("minimumVersion", event.target.value)} placeholder="1.0.0" /></label>
      <label className="field"><span>Minimum supported build</span><input inputMode="numeric" value={draft.minimumBuild} onChange={(event) => update("minimumBuild", event.target.value)} placeholder="1" /></label>
      <label className="field sm:col-span-2"><span>{platform === "android" ? "Play Store link" : "App Store link"}</span><input type="url" value={draft.storeUrl} onChange={(event) => update("storeUrl", event.target.value)} placeholder={platform === "android" ? "https://play.google.com/store/apps/details?id=…" : "https://apps.apple.com/app/id…"} /></label>
      <label className="field sm:col-span-2"><span>Update message</span><input maxLength={160} value={draft.updateMessage} onChange={(event) => update("updateMessage", event.target.value)} /></label>
      <label className="field sm:col-span-2"><span>Release notes</span><textarea rows={2} maxLength={500} value={draft.releaseNotes} onChange={(event) => update("releaseNotes", event.target.value)} placeholder="What changed in this release?" /></label>
      <label className="field sm:col-span-2"><span>Update behavior</span><select value={draft.mode} onChange={(event) => update("mode", event.target.value as UpdatePolicy["mode"])}><option value="recommended">Recommended · dismissible</option><option value="required">Required · blocks old versions</option></select></label>
      <label className="field sm:col-span-2"><span>Schedule start (optional)</span><input type="datetime-local" value={draft.scheduledAt} onChange={(event) => update("scheduledAt", event.target.value)} /><small>Leave empty to make the policy available as soon as it is enabled. Future times are checked when you save.</small></label>
    </div>
    <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between"><span className={`status ${draft.enabled ? "status-active" : "status-inactive"}`}>{draft.enabled ? draft.scheduledAt ? "Scheduled · demo only" : "Policy enabled · demo only" : "Not active"}</span><button className="button button-primary" type="button" onClick={() => onSave(draft)}>Save {draft.mode === "required" ? "required" : "recommended"} policy</button></div>
  </section>;
}
