"use client";

import { useEffect, useState } from "react";
import { DollarSign, Info, RefreshCw, Save } from "lucide-react";

export function AppointmentBillingControl({
  onToast,
  onAudit = () => {},
}: {
  onToast: (message: string) => void;
  onAudit?: (action: string, target: string) => void;
}) {
  const [paymentRequired, setPaymentRequired] = useState(false);
  const [firstAppointmentFree, setFirstAppointmentFree] = useState(false);
  const [fee, setFee] = useState<number>(500);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/admin/appointments/billing")
      .then(async (res) => {
        if (!res.ok) throw new Error("Could not load appointment billing settings.");
        return res.json();
      })
      .then((json) => {
        if (!active) return;
        const data = json.data || {};
        setPaymentRequired(Boolean(data.payment_required));
        setFirstAppointmentFree(Boolean(data.first_appointment_free));
        setFee(Number(data.consultation_fee ?? 500));
      })
      .catch(() => { if (active) onToast("Could not load appointment billing settings."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [onToast]);

  const handleSave = async () => {
    if (fee < 0) {
      onToast("Consultation fee cannot be negative.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/appointments/billing", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payment_required: paymentRequired,
          consultation_fee: fee,
          first_appointment_free: firstAppointmentFree,
        }),
      });

      if (res.ok) {
        onToast(`Appointment billing updated: Payment ${paymentRequired ? "Required (ON)" : "Optional / Free (OFF)"}, 1st Visit ${firstAppointmentFree ? "FREE (ON)" : "Paid (OFF)"}, fee ₹${fee}.`);
        onAudit(
          paymentRequired
            ? `enabled mandatory online appointment payment (₹${fee}, 1st free: ${firstAppointmentFree})`
            : `disabled mandatory appointment payment (pay at clinic / free booking, 1st free: ${firstAppointmentFree})`,
          "Appointment Billing",
        );
      } else {
        const err = await res.json().catch(() => ({}));
        onToast(err.message || "Failed to save appointment billing.");
      }
    } catch {
      onToast("Network error saving appointment billing.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <details className="group bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 sm:p-5 transition-all">
      <summary className="flex cursor-pointer list-none flex-col gap-2 sm:flex-row sm:items-center sm:justify-between [&::-webkit-details-marker]:hidden">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-teal-50 text-teal-700 rounded-lg">
              <DollarSign size={16} />
            </span>
            <h3 className="text-sm font-bold text-slate-800">
              Appointment Payment & Consultation Fee
            </h3>
            {!loading && (
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                paymentRequired
                  ? "bg-teal-50 text-teal-700 border border-teal-200"
                  : "bg-amber-50 text-amber-700 border border-amber-200"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${paymentRequired ? "bg-teal-500 animate-pulse" : "bg-amber-500"}`} />
                {paymentRequired ? `Online Fee Active (₹${fee})` : "Online Payment OFF"}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">{loading ? "Loading billing policy…" : `${paymentRequired ? "Online payment mandatory via Razorpay" : "Pay at clinic / free booking"} · ${paymentRequired ? `₹${fee}` : "Amount field inactive"}${firstAppointmentFree ? " · First visit free" : ""}`}</p>
        </div>
        <span className="text-xs font-semibold text-teal-700 hover:text-teal-800 transition-colors">Edit policy</span>
      </summary>

      <div className="space-y-4 pt-4">

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
        {/* Toggle Card 1: Mandatory Online Payment */}
        <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="font-bold text-xs text-slate-800">
              Require Online Payment
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={paymentRequired}
                onChange={(e) => setPaymentRequired(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
            </label>
          </div>
          <div className="text-[11px] text-slate-500">
            {paymentRequired
              ? "Active: Patient must pay fee via Razorpay to book slot."
              : "Inactive: Patient can book slot without online payment."}
          </div>
        </div>

        {/* Toggle Card 2: First Appointment Free */}
        <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="font-bold text-xs text-slate-800">
              First Appointment Free
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={firstAppointmentFree}
                onChange={(e) => setFirstAppointmentFree(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
            </label>
          </div>
          <div className="text-[11px] text-slate-500">
            {firstAppointmentFree
              ? "Active: 1st clinic consultation is ₹0 Free for all new patients."
              : "Inactive: Standard consultation fee applies to first visit."}
          </div>
        </div>

        {/* Custom Fee Card */}
        <div className={`p-4 rounded-xl border transition-all duration-200 flex flex-col justify-between ${
          paymentRequired
            ? "border-teal-200/80 bg-teal-50/20 shadow-xs"
            : "border-slate-200/50 bg-slate-100/60 opacity-60 cursor-not-allowed"
        }`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xs text-slate-800">Consultation Fee (₹)</span>
              {!paymentRequired && (
                <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-md border border-amber-200">
                  OFF
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`text-sm font-bold ${paymentRequired ? "text-teal-700" : "text-slate-400"}`}>₹</span>
              <input
                type="number"
                min={0}
                step={50}
                value={fee}
                disabled={!paymentRequired}
                onChange={(e) => setFee(Math.max(0, Number(e.target.value)))}
                className={`w-24 px-2.5 py-1 text-xs font-bold border rounded-lg text-right transition-all ${
                  paymentRequired
                    ? "border-teal-300 text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-xs"
                    : "border-slate-200 text-slate-400 bg-slate-200/50 cursor-not-allowed select-none"
                }`}
                title={paymentRequired ? "Set consultation fee" : "Consultation fee is disabled while online payment is OFF"}
              />
            </div>
          </div>
          <div className="text-[11px] text-slate-500">
            {paymentRequired
              ? "Doctor visit fee charged per online clinic booking via Razorpay."
              : "Field inactive: Online payment is turned OFF. Bookings are free or paid at reception."}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <span className="inline-flex items-center gap-2 text-[11px] text-slate-600"><Info size={14} />Changes take effect after saving.</span>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || loading}
          className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-teal-700 disabled:opacity-50"
        >
          {saving ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
          <span>{saving ? "Saving…" : "Save policy"}</span>
        </button>
      </div>
      </div>
    </details>
  );
}

