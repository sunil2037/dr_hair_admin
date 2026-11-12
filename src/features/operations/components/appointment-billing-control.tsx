"use client";

import { useEffect, useState } from "react";
import { Check, DollarSign, Info, RefreshCw, Save, ShieldCheck } from "lucide-react";

export function AppointmentBillingControl({
  onToast,
  onAudit = () => {},
}: {
  onToast: (message: string) => void;
  onAudit?: (action: string, target: string) => void;
}) {
  const [paymentRequired, setPaymentRequired] = useState(false);
  const [fee, setFee] = useState<number>(500);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/appointments/billing");
      if (res.ok) {
        const json = await res.json();
        const data = json.data || {};
        setPaymentRequired(Boolean(data.payment_required));
        setFee(Number(data.consultation_fee ?? 500));
      }
    } catch {
      onToast("Could not load appointment billing settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

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
        }),
      });

      if (res.ok) {
        onToast(`Appointment billing updated: Payment ${paymentRequired ? "Required (ON)" : "Optional / Free (OFF)"} with fee ₹${fee}.`);
        onAudit(
          paymentRequired
            ? `enabled mandatory online appointment payment (₹${fee})`
            : `disabled mandatory appointment payment (pay at clinic / free booking)`,
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
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-teal-50 text-teal-700 rounded-lg">
              <DollarSign size={16} />
            </span>
            <h3 className="text-sm font-bold text-slate-800">
              Appointment Payment & Consultation Fee
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Configure whether patients must pay online via Razorpay to confirm clinic sittings, or allow free booking / pay at clinic counter.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-sm transition disabled:opacity-50"
        >
          {saving ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
          <span>{saving ? "Saving…" : "Save Policy"}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
        {/* Toggle Card */}
        <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 flex items-center justify-between">
          <div>
            <div className="font-bold text-xs text-slate-800">
              Require Online Payment
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {paymentRequired
                ? "Active: Patient must pay fee via Razorpay to book slot."
                : "Inactive: Patient can book slot without online payment."}
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer ml-4">
            <input
              type="checkbox"
              checked={paymentRequired}
              onChange={(e) => setPaymentRequired(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
          </label>
        </div>

        {/* Custom Fee Card */}
        <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 flex items-center justify-between gap-4">
          <div>
            <div className="font-bold text-xs text-slate-800">
              Consultation Fee (₹)
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Doctor visit fee charged per clinic booking.
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold text-slate-400">₹</span>
            <input
              type="number"
              min={0}
              step={50}
              value={fee}
              onChange={(e) => setFee(Math.max(0, Number(e.target.value)))}
              className="w-24 px-3 py-1.5 text-xs font-bold border border-slate-300 rounded-lg text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 text-right"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 p-3 bg-teal-50/60 rounded-xl border border-teal-100 text-[11px] text-teal-800">
        <Info size={14} className="shrink-0 text-teal-600" />
        <span>
          Changes take effect immediately across the patient mobile app and reception booking desk.
        </span>
      </div>
    </div>
  );
}

