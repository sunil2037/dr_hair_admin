"use client";

import { useState } from "react";
import { BadgePercent, Check, Copy, Plus, TicketPercent, Trash2, WandSparkles } from "lucide-react";
import { Modal, StatusPill, ToggleSwitch } from "../../shared/components/ui";
import { formatCurrency } from "../lib/format";
import type { CouponRecord, ProductRecord } from "../types";

export function CouponsPanel({ coupons, products, onCouponsChange, onToast }: { coupons: CouponRecord[]; products: ProductRecord[]; onCouponsChange: (updater: (current: CouponRecord[]) => CouponRecord[]) => void; onToast: (message: string) => void }) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState(() => makeCode());
  const [discountType, setDiscountType] = useState<"percent" | "fixed">("percent");
  const [discountValue, setDiscountValue] = useState("15");
  const [appliesTo, setAppliesTo] = useState("All products");
  const [minimumOrder, setMinimumOrder] = useState("999");
  const [maxUses, setMaxUses] = useState("250");
  const [expiresOn, setExpiresOn] = useState("2026-12-31");
  const [couponToRemove, setCouponToRemove] = useState<CouponRecord | null>(null);
  const activeCoupons = coupons.filter((coupon) => coupon.status === "Active").length;
  const redemptions = coupons.reduce((sum, coupon) => sum + coupon.uses, 0);
  const reset = () => { setCode(makeCode()); setDiscountType("percent"); setDiscountValue("15"); setAppliesTo("All products"); setMinimumOrder("999"); setMaxUses("250"); setExpiresOn("2026-12-31"); };
  const createCoupon = () => {
    const value = Number(discountValue);
    if (!code.trim() || !Number.isFinite(value) || value <= 0 || Number(maxUses) <= 0) { onToast("Enter a coupon code, discount, and valid usage limit."); return; }
    if (discountType === "percent" && value > 100) { onToast("Percentage discount cannot be more than 100%."); return; }
    if (coupons.some((coupon) => coupon.code.toUpperCase() === code.trim().toUpperCase())) { onToast("That coupon code already exists. Generate a different one."); return; }
    const today = new Date().toISOString().slice(0, 10);
    const newCoupon: CouponRecord = { id: `CPN-${Date.now()}`, code: code.trim().toUpperCase(), discountType, discountValue: value, appliesTo, minimumOrder: Number(minimumOrder) || 0, uses: 0, maxUses: Number(maxUses), expiresOn, status: expiresOn && expiresOn < today ? "Expired" : "Active" };
    onCouponsChange((current) => [newCoupon, ...current]);
    setOpen(false); onToast(`${newCoupon.code} is ready in your local offers list.`);
  };
  const toggleCoupon = (coupon: CouponRecord) => {
    if (coupon.status === "Expired") return;
    onCouponsChange((current) => current.map((item) => item.id === coupon.id ? { ...item, status: item.status === "Active" ? "Scheduled" : "Active" } : item));
  };
  const removeCoupon = (coupon: CouponRecord) => { onCouponsChange((current) => current.filter((item) => item.id !== coupon.id)); onToast(`${coupon.code} removed from the local offers list.`); setCouponToRemove(null); };

  return <>
    <div className="commerce-toolbar"><div><h2 className="commerce-section-title">Coupons & discounts</h2><p className="card-note">Create product-specific offers and track how customers use them</p></div><button className="button button-primary" onClick={() => { reset(); setOpen(true); }}><Plus size={14} />Generate coupon</button></div>
    <div className="kpi-grid commerce-metrics grid grid-cols-2 gap-3 lg:grid-cols-3">
      <MiniMetric icon={<TicketPercent size={15} />} label="Active offers" value={String(activeCoupons)} note="Available at checkout" />
      <MiniMetric icon={<BadgePercent size={15} />} label="Total redemptions" value={redemptions.toLocaleString("en-IN")} note="Across all listed codes" />
      <MiniMetric icon={<Check size={15} />} label="Discounted sales" value={formatCurrency(184620)} note="Sample value this month" />
    </div>
    <div className="notice coupon-guidance"><WandSparkles size={14} /><span>Choose a product, percentage or fixed amount, minimum spend, usage limit, and end date. Rules save in this browser preview; Flutter currently mirrors FIRSTDR, GROW15, and SERUM300 until coupon APIs connect.</span></div>
    <section className="card commerce-list-card"><div className="section-row"><div><h2 className="card-title">Offer codes</h2><p className="card-note">Offers customers can enter during checkout</p></div><span className="small-caption">{coupons.length} total</span></div>
      <div className="table-wrap"><table className="commerce-table coupon-table"><thead><tr><th>Code</th><th>Discount</th><th>Applies to</th><th>Usage</th><th>Expires</th><th>Status</th><th>Available</th><th /></tr></thead><tbody>{coupons.map((coupon) => <tr key={coupon.id}>
        <td><div className="coupon-code-cell"><code>{coupon.code}</code><button className="row-action" aria-label={`Copy ${coupon.code}`} onClick={async () => { try { await navigator.clipboard.writeText(coupon.code); onToast(`${coupon.code} copied.`); } catch { onToast(`Coupon code: ${coupon.code}`); } }}><Copy size={13} /></button></div></td>
        <td><strong>{coupon.discountType === "percent" ? `${coupon.discountValue}% off` : `${formatCurrency(coupon.discountValue)} off`}</strong><small className="strike-price">Min. {formatCurrency(coupon.minimumOrder)}</small></td>
        <td>{coupon.appliesTo}</td><td>{coupon.uses.toLocaleString("en-IN")} / {coupon.maxUses.toLocaleString("en-IN")}</td><td>{formatDate(coupon.expiresOn)}</td><td><StatusPill status={coupon.status} /></td>
        <td><ToggleSwitch checked={coupon.status === "Active"} disabled={coupon.status === "Expired"} label={`${coupon.status === "Active" ? "Pause" : "Activate"} coupon ${coupon.code}`} onChange={() => toggleCoupon(coupon)} /></td>
        <td><button className="row-action danger-action" aria-label={`Remove ${coupon.code}`} onClick={() => setCouponToRemove(coupon)}><Trash2 size={13} /></button></td>
      </tr>)}{coupons.length === 0 && <tr><td colSpan={8}><div className="empty-state">No offers yet. Generate a coupon for your store.</div></td></tr>}</tbody></table></div>
      <div className="table-footer"><span>Offer data is sample-only in this preview</span><span>Checkout connection is pending API integration</span></div>
    </section>
    {open && <Modal title="Generate a coupon" description="Create a product offer with clear redemption rules." submitLabel="Create coupon" onClose={() => setOpen(false)} onSubmit={createCoupon}>
      <div className="field"><label htmlFor="coupon-code">Coupon code</label><div className="code-input-row"><input id="coupon-code" value={code} onChange={(event) => setCode(event.target.value.toUpperCase().replace(/\s/g, ""))} /><button className="button button-secondary button-small" onClick={() => setCode(makeCode())}><WandSparkles size={13} />Generate</button></div></div>
      <div className="form-grid-two"><div className="field"><label htmlFor="coupon-type">Discount type</label><select id="coupon-type" value={discountType} onChange={(event) => setDiscountType(event.target.value as "percent" | "fixed")}><option value="percent">Percentage</option><option value="fixed">Fixed amount (₹)</option></select></div><div className="field"><label htmlFor="coupon-value">Discount {discountType === "percent" ? "(%)" : "(₹)"}</label><input id="coupon-value" type="number" min="1" max={discountType === "percent" ? "100" : undefined} value={discountValue} onChange={(event) => setDiscountValue(event.target.value)} /></div></div>
      <div className="field"><label htmlFor="coupon-scope">Apply to</label><select id="coupon-scope" value={appliesTo} onChange={(event) => setAppliesTo(event.target.value)}><option>All products</option><option>First order</option>{products.map((product) => <option key={product.id}>{product.name}</option>)}</select></div>
      <div className="form-grid-two"><div className="field"><label htmlFor="coupon-min">Minimum order (₹)</label><input id="coupon-min" type="number" min="0" value={minimumOrder} onChange={(event) => setMinimumOrder(event.target.value)} /></div><div className="field"><label htmlFor="coupon-limit">Total redemptions</label><input id="coupon-limit" type="number" min="1" value={maxUses} onChange={(event) => setMaxUses(event.target.value)} /></div></div>
      <div className="field"><label htmlFor="coupon-expiry">Valid through</label><input id="coupon-expiry" type="date" value={expiresOn} onChange={(event) => setExpiresOn(event.target.value)} /></div>
      <div className="offer-preview"><TicketPercent size={16} /><span><strong>{code || "YOURCODE"}</strong><small>{discountValue || "0"}{discountType === "percent" ? "% off" : " rupees off"} · {appliesTo}</small></span></div>
    </Modal>}
    {couponToRemove && <Modal title="Delete this coupon?" description="This removes the offer from the current admin offers list. Confirm only if it should no longer be available." submitLabel="Delete coupon" submitVariant="danger" onClose={() => setCouponToRemove(null)} onSubmit={() => removeCoupon(couponToRemove)}>
      <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-3 text-xs text-rose-900"><p className="font-semibold">{couponToRemove.code}</p><p className="mt-1 leading-5">This removal cannot be undone in this browser preview.</p></div>
    </Modal>}
  </>;
}

function MiniMetric({ icon, label, value, note }: { icon: React.ReactNode; label: string; value: string; note: string }) {
  return <article className="card kpi-card commerce-metric"><div className="kpi-top"><span className="kpi-label">{label}</span><span className="kpi-icon teal">{icon}</span></div><div className="kpi-value">{value}</div><div className="kpi-foot">{note}</div></article>;
}

function makeCode() { return `DRHAIR${Math.random().toString(36).slice(2, 6).toUpperCase()}`; }
function formatDate(date: string) { return date ? new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "No expiry"; }
