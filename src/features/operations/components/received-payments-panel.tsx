"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Copy, CreditCard, DollarSign, ExternalLink, Filter, RefreshCw, Search, ShieldAlert, ShoppingBag, Stethoscope } from "lucide-react";
import { Modal, PageHeader, StatusPill } from "../../shared/components/ui";

export interface PaymentItem {
  id: string;
  type: "Order" | "Appointment";
  reference_id: string;
  opd_token?: string | null;
  customer_name: string;
  customer_phone?: string;
  customer_email?: string;
  amount: number;
  gateway: string;
  method: string;
  status: string;
  transaction_id?: string | null;
  intent_id?: string | null;
  created_at: string;
}

interface PaymentSummary {
  total_collected: number;
  order_revenue: number;
  appointment_revenue: number;
  paid_count: number;
  total_transactions: number;
}

export function ReceivedPaymentsPanel({ onToast }: { onToast: (message: string) => void }) {
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [summary, setSummary] = useState<PaymentSummary>({
    total_collected: 0,
    order_revenue: 0,
    appointment_revenue: 0,
    paid_count: 0,
    total_transactions: 0,
  });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [typeFilter, setTypeFilter] = useState<"all" | "order" | "appointment">("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedPayment, setSelectedPayment] = useState<PaymentItem | null>(null);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "25",
        type: typeFilter,
        status: statusFilter,
        search,
      });
      const res = await fetch(`/api/admin/payments?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        const data = json.data || {};
        setPayments(data.items || []);
        if (data.summary) setSummary(data.summary);
        if (data.pagination) setTotalPages(data.pagination.totalPages || 1);
      } else {
        onToast("Could not load payment records.");
      }
    } catch {
      onToast("Network error loading received payments.");
    } finally {
      setLoading(false);
    }
  }, [onToast, page, search, statusFilter, typeFilter]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    onToast(`Copied ${label} to clipboard.`);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header with Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Received Payments</h2>
          <p className="text-xs text-slate-500 mt-1">
            Real-time ledger of Razorpay online transactions, OPD tokens, and cash on delivery.
          </p>
        </div>
        <button
          onClick={fetchPayments}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl bg-white border border-slate-200 text-slate-700 shadow-sm hover:bg-slate-50 transition"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          <span>Refresh Ledger</span>
        </button>
      </div>

      {/* 2. KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Collected</span>
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <DollarSign size={18} />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-800">
              ₹{summary.total_collected.toLocaleString("en-IN")}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">{summary.paid_count} successful payments</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Order Revenue</span>
            <span className="p-2 bg-sky-50 text-sky-600 rounded-xl">
              <ShoppingBag size={18} />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-800">
              ₹{summary.order_revenue.toLocaleString("en-IN")}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">E-commerce products & regimens</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Consultation Revenue</span>
            <span className="p-2 bg-teal-50 text-teal-600 rounded-xl">
              <Stethoscope size={18} />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-800">
              ₹{summary.appointment_revenue.toLocaleString("en-IN")}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">In-clinic OPD consultation fees</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Transactions</span>
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <CreditCard size={18} />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-800">
              {summary.total_transactions}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Combined orders & appointments</div>
          </div>
        </div>
      </div>

      {/* 3. Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Type filters */}
          <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
            <button
              onClick={() => { setTypeFilter("all"); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg transition ${typeFilter === "all" ? "bg-white text-slate-800 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
            >
              All Types
            </button>
            <button
              onClick={() => { setTypeFilter("order"); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg transition ${typeFilter === "order" ? "bg-white text-slate-800 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
            >
              Orders
            </button>
            <button
              onClick={() => { setTypeFilter("appointment"); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg transition ${typeFilter === "appointment" ? "bg-white text-slate-800 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
            >
              Appointments
            </button>
          </div>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="all">All Statuses</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by ID, customer, txn…"
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50/50"
          />
        </div>
      </div>

      {/* 4. Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Date & Time</th>
                <th className="py-3.5 px-4">Type & Reference</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Method & Gateway</th>
                <th className="py-3.5 px-4">Razorpay Txn ID</th>
                <th className="py-3.5 px-4 text-right">Amount</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    {loading ? "Loading transactions…" : "No payment records match the selected filters."}
                  </td>
                </tr>
              ) : (
                payments.map((payment) => {
                  const formattedDate = new Intl.DateTimeFormat("en-IN", {
                    dateStyle: "medium",
                    timeStyle: "short",
                    timeZone: "Asia/Kolkata",
                  }).format(new Date(payment.created_at));

                  return (
                    <tr key={payment.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">{formattedDate}</td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold text-[10px] ${
                              payment.type === "Order"
                                ? "bg-sky-50 text-sky-700 border border-sky-200"
                                : "bg-teal-50 text-teal-700 border border-teal-200"
                            }`}
                          >
                            {payment.type === "Order" ? <ShoppingBag size={10} /> : <Stethoscope size={10} />}
                            {payment.type}
                          </span>
                          <span className="font-semibold text-slate-800">{payment.reference_id}</span>
                        </div>
                        {payment.opd_token && (
                          <div className="text-[10px] text-slate-400 mt-0.5">Token: {payment.opd_token}</div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{payment.customer_name}</div>
                        {payment.customer_phone && (
                          <div className="text-[11px] text-slate-400">{payment.customer_phone}</div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-700">{payment.method}</div>
                        <div className="text-[10px] text-slate-400 uppercase">{payment.gateway}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        {payment.transaction_id ? (
                          <button
                            onClick={() => copyToClipboard(payment.transaction_id!, "Razorpay ID")}
                            className="inline-flex items-center gap-1 font-mono text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded transition"
                            title="Click to copy Razorpay ID"
                          >
                            <span>{payment.transaction_id}</span>
                            <Copy size={11} className="text-slate-400" />
                          </button>
                        ) : (
                          <span className="text-slate-400 italic">Pay at counter / COD</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right font-bold text-slate-800 whitespace-nowrap">
                        ₹{Number(payment.amount).toLocaleString("en-IN")}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <StatusPill status={payment.status} />
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => setSelectedPayment(payment)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg transition"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50/50 border-t border-slate-200 text-xs">
            <span className="text-slate-500">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 5. Detail Modal */}
      {selectedPayment && (
        <Modal
          title={`Payment Details · ${selectedPayment.reference_id}`}
          description={`Gateway Transaction ID: ${selectedPayment.transaction_id || "None (Cash / In-clinic)"}`}
          onClose={() => setSelectedPayment(null)}
          submitLabel="Close"
          onSubmit={() => setSelectedPayment(null)}
        >
          <div className="space-y-4 text-xs">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Transaction ID:</span>
                <span className="font-mono font-bold text-slate-800">
                  {selectedPayment.transaction_id || "None (Cash / In-clinic)"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Service Category:</span>
                <span className="font-bold text-slate-800">{selectedPayment.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Amount Paid:</span>
                <span className="font-black text-slate-800 text-sm">
                  ₹{Number(selectedPayment.amount).toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <StatusPill status={selectedPayment.status} />
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Gateway:</span>
                <span className="font-semibold text-slate-800 uppercase">{selectedPayment.gateway}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Customer:</span>
                <span className="font-semibold text-slate-800">{selectedPayment.customer_name}</span>
              </div>
              {selectedPayment.customer_phone && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Phone:</span>
                  <span className="text-slate-800">{selectedPayment.customer_phone}</span>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
