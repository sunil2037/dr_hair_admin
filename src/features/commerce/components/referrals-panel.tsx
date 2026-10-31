"use client";

import { useState } from "react";
import { ArrowUpRight, Check, Copy, Gift, Link2, Plus, Share2, Trash2, UsersRound } from "lucide-react";
import { Modal, StatusPill, ToggleSwitch } from "../../shared/components/ui";
import { formatCurrency } from "../lib/format";
import type { ReferralRecord } from "../types";

export function ReferralsPanel({ referrals, enabled, onEnabledChange, onReferralsChange, onToast, canExport = false }: {
  referrals: ReferralRecord[];
  enabled: boolean;
  onEnabledChange: (value: boolean) => void;
  onReferralsChange: (updater: (current: ReferralRecord[]) => ReferralRecord[]) => void;
  onToast: (message: string) => void;
  canExport?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [reward, setReward] = useState("250");
  const [code, setCode] = useState("DRH-FRIEND");
  const [referralToRemove, setReferralToRemove] = useState<ReferralRecord | null>(null);
  const activeReferrers = referrals.filter((referral) => referral.status === "Active").length;
  const totalReferrals = referrals.reduce((sum, referral) => sum + referral.referrals, 0);
  const totalOrders = referrals.reduce((sum, referral) => sum + referral.orders, 0);
  const totalRevenue = referrals.reduce((sum, referral) => sum + referral.revenue, 0);

  const addReferrer = () => {
    if (!name.trim() || !email.includes("@") || Number(reward) < 0) { onToast("Add a name, valid email, and reward amount."); return; }
    if (referrals.some((referral) => referral.code.toUpperCase() === code.trim().toUpperCase())) { onToast("That referral code already exists. Generate a different one."); return; }
    const newReferral: ReferralRecord = { id: `REF-${Date.now()}`, name: name.trim(), email: email.trim(), code, reward: Number(reward), referrals: 0, orders: 0, revenue: 0, status: "Active" };
    onReferralsChange((current) => [newReferral, ...current]); setOpen(false); setName(""); setEmail(""); setReward("250");
    onToast(`Referral code created for ${newReferral.name}.`);
  };
  const toggleReferrer = (referral: ReferralRecord) => onReferralsChange((current) => current.map((item) => item.id === referral.id ? { ...item, status: item.status === "Active" ? "Paused" : "Active" } : item));
  const removeReferrer = (referral: ReferralRecord) => { onReferralsChange((current) => current.filter((item) => item.id !== referral.id)); onToast(`${referral.name} removed from the referral preview.`); setReferralToRemove(null); };

  return <>
    <div className="commerce-toolbar"><div><h2 className="commerce-section-title">Referral program</h2><p className="card-note">Reward customers for sharing products with friends</p></div><button className="button button-primary" onClick={() => { setCode(makeReferralCode()); setOpen(true); }}><Plus size={14} />Create referral code</button></div>
    <section className={`referral-program-banner ${enabled ? "enabled" : "paused"}`}>
      <span className="referral-banner-symbol"><Gift size={20} /></span>
      <div className="referral-banner-copy"><strong>{enabled ? "Your referral program is live" : "Your referral program is paused"}</strong><span>{enabled ? "Customers receive a reward when a friend completes a qualifying order." : "New referral codes will not be active while the program is paused."}</span><small>Current reward · ₹250 store credit per successful referral</small></div>
      <div className="referral-banner-control"><span>{enabled ? "Active" : "Paused"}</span><ToggleSwitch checked={enabled} label={enabled ? "Pause referral program" : "Enable referral program"} onChange={() => { onEnabledChange(!enabled); onToast(`Referral program ${enabled ? "paused" : "enabled"} in this preview.`); }} /></div>
    </section>
    <div className="kpi-grid commerce-metrics grid grid-cols-2 gap-3 lg:grid-cols-4">
      <ReferralMetric icon={<UsersRound size={15} />} label="Active referrers" value={activeReferrers.toLocaleString("en-IN")} note="People sharing a code" />
      <ReferralMetric icon={<Share2 size={15} />} label="Invited friends" value={totalReferrals.toLocaleString("en-IN")} note="Tracked referral signups" />
      <ReferralMetric icon={<Check size={15} />} label="Orders attributed" value={totalOrders.toLocaleString("en-IN")} note="Completed sample orders" />
      <ReferralMetric icon={<ArrowUpRight size={15} />} label="Referral sales" value={formatCurrency(totalRevenue)} note="Sample attributed revenue" />
    </div>
    <div className="notice coupon-guidance"><Link2 size={14} /><span>Each code is associated with a referrer and can be tied to product purchases, customer rewards, and attributed sales once referral APIs and checkout tracking are connected.</span></div>
    <section className="card commerce-list-card"><div className="section-row"><div><h2 className="card-title">Referral partners</h2><p className="card-note">Codes, customer activity, and attributed sales</p></div><span className="small-caption">{referrals.length} codes</span></div>
      <div className="table-wrap"><table className="commerce-table referral-table"><thead><tr><th>Referrer</th><th>Code</th><th>Reward</th><th>Invites</th><th>Orders</th><th>Conversion</th><th>Sales attributed</th><th>Status</th><th /></tr></thead><tbody>{referrals.map((referral) => { const conversion = referral.referrals ? Math.round(referral.orders / referral.referrals * 100) : 0; return <tr key={referral.id}>
        <td><div className="referrer-person"><span className="avatar">{referral.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase()}</span><div><strong>{referral.name}</strong><small>{referral.email}</small></div></div></td>
        <td><div className="coupon-code-cell"><code>{referral.code}</code><button className="row-action" aria-label={`Copy ${referral.code}`} onClick={async () => { try { await navigator.clipboard.writeText(referral.code); onToast("Referral code copied."); } catch { onToast(`Referral code: ${referral.code}`); } }}><Copy size={13} /></button></div></td>
        <td>{formatCurrency(referral.reward)}</td><td>{referral.referrals}</td><td>{referral.orders}</td><td><span className="margin-pill">{conversion}%</span></td><td><strong>{formatCurrency(referral.revenue)}</strong></td><td><StatusPill status={referral.status} /></td>
        <td><div className="table-actions"><ToggleSwitch checked={referral.status === "Active"} label={`${referral.status === "Active" ? "Pause" : "Activate"} ${referral.name}`} onChange={() => toggleReferrer(referral)} /><button className="row-action danger-action" aria-label={`Remove ${referral.name}`} onClick={() => setReferralToRemove(referral)}><Trash2 size={13} /></button></div></td>
      </tr>; })}{referrals.length === 0 && <tr><td colSpan={9}><div className="empty-state">No referral codes yet. Create a code to start tracking shares.</div></td></tr>}</tbody></table></div>
      <div className="table-footer"><span>Referral rewards are sample settings</span>{canExport && <button className="text-action" onClick={() => onToast("Referral export will be available with reporting APIs.")}>Export report <ArrowUpRight size={13} /></button>}</div>
    </section>
    {open && <Modal title="Create referral code" description="Link a customer to a unique share code and reward." submitLabel="Create code" onClose={() => setOpen(false)} onSubmit={addReferrer}>
      <div className="field"><label htmlFor="referral-name">Referrer name</label><input id="referral-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Customer full name" /></div>
      <div className="field"><label htmlFor="referral-email">Email address</label><input id="referral-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" /></div>
      <div className="field"><label htmlFor="referral-reward">Store credit reward (₹)</label><input id="referral-reward" type="number" min="0" value={reward} onChange={(event) => setReward(event.target.value)} /></div>
      <div className="field"><label htmlFor="referral-code">Share code</label><div className="code-input-row"><input id="referral-code" value={code} onChange={(event) => setCode(event.target.value.toUpperCase().replace(/\s/g, ""))} /><button className="button button-secondary button-small" onClick={() => setCode(makeReferralCode())}>Generate</button></div></div>
      <div className="offer-preview"><Share2 size={16} /><span><strong>{code || "UNIQUECODE"}</strong><small>Unique code · {formatCurrency(Number(reward) || 0)} reward</small></span></div>
    </Modal>}
    {referralToRemove && <Modal title="Remove this referral partner?" description="Removing the partner also removes this code from the current referral list. Confirm before continuing." submitLabel="Remove partner" submitVariant="danger" onClose={() => setReferralToRemove(null)} onSubmit={() => removeReferrer(referralToRemove)}>
      <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-3 text-xs text-rose-900"><p className="font-semibold">{referralToRemove.name} · {referralToRemove.code}</p><p className="mt-1 leading-5">This removal cannot be undone in this browser preview.</p></div>
    </Modal>}
  </>;
}

function ReferralMetric({ icon, label, value, note }: { icon: React.ReactNode; label: string; value: string; note: string }) {
  return <article className="card kpi-card commerce-metric"><div className="kpi-top"><span className="kpi-label">{label}</span><span className="kpi-icon teal">{icon}</span></div><div className="kpi-value">{value}</div><div className="kpi-foot">{note}</div></article>;
}

function makeReferralCode() { return `DRH-${Math.random().toString(36).slice(2, 7).toUpperCase()}`; }
