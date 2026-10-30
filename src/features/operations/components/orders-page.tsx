"use client";

import { useMemo, useState } from "react";
import {
  Activity, ArrowRight, BadgeIndianRupee, Boxes, Check, Download,
  Filter, MapPin, PackageCheck, ShieldAlert, Truck, Undo2, UserRound,
} from "lucide-react";
import { Avatar, Modal, PageHeader, StatusPill, TableToolbar } from "../../shared/components/ui";
import { useSessionState } from "../../shared/lib/use-session-state";
import { formatCurrency } from "../../commerce/lib/format";
import { orders as initialOrders } from "../../shared/lib/demo-data";
import type { OrderFulfillmentStatus, OrderRecord } from "../../shared/types";

type QueueTab = "All orders" | "New" | "Preparing" | "Shipped" | "Needs attention" | "Returns" | "Delivered" | "Cancelled & refunded";
type OrderDateFilter = "All dates" | "Last 7 days" | "Last 30 days";
const queueTabs: QueueTab[] = ["All orders", "New", "Preparing", "Shipped", "Needs attention", "Returns", "Delivered", "Cancelled & refunded"];

function parseAmount(order: OrderRecord) {
  return order.totalAmount ?? (Number(order.amount.replace(/[^0-9.]/g, "")) || 0);
}

function normalizeOrder(order: OrderRecord): OrderRecord {
  const oldStatus = order.status as string;
  const status: OrderFulfillmentStatus = oldStatus === "Pending" ? "New" : oldStatus === "Review" ? "Needs attention" : oldStatus === "Completed" ? "Delivered" : oldStatus as OrderFulfillmentStatus;
  return { ...order, status, totalAmount: parseAmount(order), timeline: order.timeline ?? [] };
}

function dateFromOrder(order: OrderRecord) {
  const parsed = new Date(order.date);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function timestamp() {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date());
}

function appendTimeline(order: OrderRecord, label: string): OrderRecord["timeline"] {
  return [...(order.timeline ?? []), { label, date: timestamp(), done: true }];
}

function progressFor(order: OrderRecord): string {
  switch (order.status) {
    case "New": return "Payment received · awaiting fulfilment";
    case "Preparing": return "Being packed for dispatch";
    case "Shipped": return order.trackingNumber ? `${order.courier ?? "Courier"} · ${order.trackingNumber}` : "In transit";
    case "Needs attention": return "Resolve the flagged order issue";
    case "Return requested": return order.returnReason ? `Return · ${order.returnReason}` : "Return request received";
    case "Delivered": return "Delivery complete";
    case "Cancelled": return order.cancellationReason ?? "Order cancelled";
    case "Refunded": return "Refund recorded";
  }
}

function nextAction(order: OrderRecord) {
  if ((order.status === "New" || order.status === "Needs attention") && order.paymentStatus === "Paid") return order.status === "New" ? "Start preparing" : "Resume fulfilment";
  if (order.status === "Preparing") return "Add tracking & ship";
  if (order.status === "Shipped") return "Mark delivered";
  return "Close details";
}

function canCancel(order: OrderRecord) {
  return ["New", "Preparing", "Needs attention"].includes(order.status);
}

function canRefund(order: OrderRecord) {
  return order.paymentStatus === "Paid" || order.paymentStatus === "Partially refunded";
}

function canStartPreparing(order: OrderRecord) {
  return (order.status === "New" || order.status === "Needs attention") && order.paymentStatus === "Paid";
}

export function OrdersPage({ globalSearch, onToast, onAudit = () => {}, canExport = false }: { globalSearch: string; onToast: (message: string) => void; onAudit?: (action: string, target: string) => void; canExport?: boolean }) {
  const [orders, setOrders] = useSessionState<OrderRecord[]>("drhair-demo-orders", initialOrders);
  const [tab, setTab] = useState<QueueTab>("All orders");
  const [query, setQuery] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("Any payment");
  const [dateFilter, setDateFilter] = useState<OrderDateFilter>("All dates");
  const [dateCutoff, setDateCutoff] = useState<number | null>(null);
  const [productFilter, setProductFilter] = useState("All products");
  const [couponFilter, setCouponFilter] = useState("All coupons");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [dispatchByOrder, setDispatchByOrder] = useState<Record<string, { courier: string; trackingNumber: string }>>({});
  const [cancelOrder, setCancelOrder] = useState<OrderRecord | null>(null);
  const [cancelReason, setCancelReason] = useState("Customer requested cancellation");
  const [refundOrder, setRefundOrder] = useState<OrderRecord | null>(null);
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("Customer return");
  const [returnOrder, setReturnOrder] = useState<OrderRecord | null>(null);
  const [returnReason, setReturnReason] = useState("Changed my mind");

  const normalizedOrders = useMemo(() => orders.map(normalizeOrder), [orders]);
  const selectedOrder = normalizedOrders.find((order) => order.id === selectedOrderId) ?? null;
  const dispatchDetails = selectedOrder ? dispatchByOrder[selectedOrder.id] ?? { courier: selectedOrder.courier ?? "", trackingNumber: selectedOrder.trackingNumber ?? "" } : { courier: "", trackingNumber: "" };
  const search = `${globalSearch} ${query}`.trim().toLowerCase();
  const productOptions = [...new Set(normalizedOrders.map((order) => order.item))].sort();
  const couponOptions = [...new Set(normalizedOrders.map((order) => order.couponCode).filter((code): code is string => Boolean(code)))].sort();
  const filteredOrders = useMemo(() => normalizedOrders.filter((order) => {
    const text = `${order.id} ${order.customer} ${order.customerEmail ?? ""} ${order.item} ${order.couponCode ?? ""} ${order.trackingNumber ?? ""}`.toLowerCase();
    const matchesTab = tab === "All orders" || (tab === "Cancelled & refunded" ? ["Cancelled", "Refunded"].includes(order.status) : tab === "Returns" ? order.status === "Return requested" : order.status === tab);
    const matchesPayment = paymentFilter === "Any payment" || order.paymentStatus === paymentFilter;
    const matchesProduct = productFilter === "All products" || order.item === productFilter;
    const matchesCoupon = couponFilter === "All coupons" || order.couponCode === couponFilter;
    const date = dateFromOrder(order);
    const matchesDate = !dateCutoff || !date || date.getTime() >= dateCutoff;
    return text.includes(search) && matchesTab && matchesPayment && matchesProduct && matchesCoupon && matchesDate;
  }), [normalizedOrders, tab, search, paymentFilter, productFilter, couponFilter, dateCutoff]);
  const eligibleSelected = filteredOrders.filter((order) => selectedIds.includes(order.id) && canStartPreparing(order));

  const updateOrder = (id: string, updater: (order: OrderRecord) => OrderRecord) => setOrders((current) => current.map((order) => order.id === id ? updater(normalizeOrder(order)) : order));

  const startPreparation = (order: OrderRecord) => {
    if (!canStartPreparing(order)) {
      onToast("Payment must be confirmed before fulfilment can start.");
      return;
    }
    updateOrder(order.id, (current) => ({ ...current, status: "Preparing", timeline: appendTimeline(current, "Fulfilment started · preparing order") }));
    onAudit("started fulfilment for", order.id);
    onToast(`${order.id} moved to Preparing in this browser preview.`);
  };

  const handlePrimaryAction = () => {
    if (!selectedOrder) return;
    if (selectedOrder.status === "New" || selectedOrder.status === "Needs attention") {
      startPreparation(selectedOrder);
      return;
    }
    if (selectedOrder.status === "Preparing") {
      if (!dispatchDetails.courier.trim() || !dispatchDetails.trackingNumber.trim()) {
        onToast("Add a courier and tracking number before marking this order shipped.");
        return;
      }
      updateOrder(selectedOrder.id, (current) => ({ ...current, status: "Shipped", courier: dispatchDetails.courier.trim(), trackingNumber: dispatchDetails.trackingNumber.trim(), timeline: appendTimeline(current, `Shipped · ${dispatchDetails.courier.trim()} · ${dispatchDetails.trackingNumber.trim()}`) }));
      onAudit("shipped order", selectedOrder.id);
      onToast(`${selectedOrder.id} marked as shipped in this browser preview.`);
      return;
    }
    if (selectedOrder.status === "Shipped") {
      updateOrder(selectedOrder.id, (current) => ({ ...current, status: "Delivered", timeline: appendTimeline(current, "Marked delivered") }));
      onAudit("marked order delivered", selectedOrder.id);
      onToast(`${selectedOrder.id} marked delivered in this browser preview.`);
      return;
    }
    setSelectedOrderId(null);
  };

  const confirmCancellation = () => {
    if (!cancelOrder) return;
    updateOrder(cancelOrder.id, (current) => ({
      ...current, status: "Cancelled", cancellationReason: cancelReason,
      timeline: appendTimeline(current, `Cancelled · ${cancelReason}`),
    }));
    onAudit("cancelled order", `${cancelOrder.id} · ${cancelReason}`);
    onToast("Cancellation recorded locally. Use Refund to record the payment action separately.");
    setCancelOrder(null);
    setSelectedOrderId(null);
  };

  const confirmReturn = () => {
    if (!returnOrder) return;
    updateOrder(returnOrder.id, (current) => ({
      ...current, status: "Return requested", returnReason,
      timeline: appendTimeline(current, `Return requested · ${returnReason}`),
    }));
    onAudit("recorded return request", `${returnOrder.id} · ${returnReason}`);
    onToast("Return request saved locally. Arrange the return with your courier after API integration.");
    setReturnOrder(null);
    setSelectedOrderId(null);
  };

  const confirmRefund = () => {
    if (!refundOrder) return;
    const amount = Math.round(Number(refundAmount));
    const previousRefund = refundOrder.refundAmount ?? 0;
    const remaining = parseAmount(refundOrder) - previousRefund;
    if (!Number.isFinite(amount) || amount <= 0 || amount > remaining || !refundReason.trim()) {
      onToast(`Enter a refund between ₹1 and ${formatCurrency(remaining)} and add a reason.`);
      return;
    }
    const nextRefund = previousRefund + amount;
    const fullRefund = nextRefund >= parseAmount(refundOrder);
    updateOrder(refundOrder.id, (current) => ({
      ...current, refundAmount: nextRefund, refundReason,
      paymentStatus: fullRefund ? "Refunded" : "Partially refunded",
      status: fullRefund && current.status !== "Cancelled" ? "Refunded" : current.status,
      timeline: appendTimeline(current, `${fullRefund ? "Refunded" : "Partially refunded"} · ${formatCurrency(amount)} · ${refundReason}`),
    }));
    onAudit("recorded refund", `${refundOrder.id} · ${formatCurrency(amount)}`);
    onToast(`${formatCurrency(amount)} refund recorded locally. No payment provider was contacted.`);
    setRefundOrder(null);
    setSelectedOrderId(null);
  };

  const moveSelectedToPreparing = () => {
    const selected = new Set(eligibleSelected.map((order) => order.id));
    if (!selected.size) return;
    setOrders((current) => current.map((rawOrder) => {
      const order = normalizeOrder(rawOrder);
      return selected.has(order.id) ? { ...order, status: "Preparing", timeline: appendTimeline(order, "Fulfilment started · bulk action") } : rawOrder;
    }));
    onAudit("started bulk fulfilment for", `${selected.size} orders`);
    setSelectedIds((current) => current.filter((id) => !selected.has(id)));
    onToast(`${selected.size} paid order${selected.size === 1 ? "" : "s"} moved to Preparing.`);
  };

  const exportCsv = () => {
    if (!canExport) {
      onToast("This admin account does not have commerce export access.");
      return;
    }
    const header = ["Order ID", "Customer", "Email", "Date", "Items", "Total", "Payment status", "Fulfilment status", "Coupon", "Courier", "Tracking"];
    const rows = filteredOrders.map((order) => [order.id, order.customer, order.customerEmail ?? "", order.date, order.item, String(parseAmount(order)), order.paymentStatus ?? "", order.status, order.couponCode ?? "", order.courier ?? "", order.trackingNumber ?? ""]);
    const csv = [header, ...rows].map((row) => row.map((value) => `"${value.replaceAll('"', '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = "dr-hair-orders-preview.csv"; link.click(); URL.revokeObjectURL(url);
    onToast(`Exported ${filteredOrders.length} filtered sample orders.`);
  };

  const changeDateFilter = (value: OrderDateFilter) => {
    setDateFilter(value);
    const days = value === "Last 7 days" ? 7 : value === "Last 30 days" ? 30 : 0;
    setDateCutoff(days ? Date.now() - days * 24 * 60 * 60 * 1000 : null);
  };
  const clearFilters = () => { setQuery(""); setPaymentFilter("Any payment"); setDateFilter("All dates"); setDateCutoff(null); setProductFilter("All products"); setCouponFilter("All coupons"); setTab("All orders"); setSelectedIds([]); };
  const setRefundTarget = (order: OrderRecord) => { setRefundOrder(order); setRefundAmount(String(Math.max(0, parseAmount(order) - (order.refundAmount ?? 0)))); setRefundReason("Customer return"); };
  const toggleSelection = (id: string, checked: boolean) => setSelectedIds((current) => checked ? [...new Set([...current, id])] : current.filter((item) => item !== id));
  const selectableVisible = filteredOrders.filter(canStartPreparing).map((order) => order.id);
  const allVisibleSelected = selectableVisible.length > 0 && selectableVisible.every((id) => selectedIds.includes(id));

  const counts: Record<QueueTab, number> = {
    "All orders": normalizedOrders.length,
    New: normalizedOrders.filter((order) => order.status === "New").length,
    Preparing: normalizedOrders.filter((order) => order.status === "Preparing").length,
    Shipped: normalizedOrders.filter((order) => order.status === "Shipped").length,
    "Needs attention": normalizedOrders.filter((order) => order.status === "Needs attention").length,
    Returns: normalizedOrders.filter((order) => order.status === "Return requested").length,
    Delivered: normalizedOrders.filter((order) => order.status === "Delivered").length,
    "Cancelled & refunded": normalizedOrders.filter((order) => ["Cancelled", "Refunded"].includes(order.status)).length,
  };

  return <main className="page-wrap mx-auto w-full max-w-[1420px] px-4 py-6 sm:px-6 lg:px-8">
    <PageHeader eyebrow="Commerce · Fulfilment" title="Orders" description="Work through paid orders, shipping updates, and customer refund requests." action={canExport ? <button className="button button-secondary" onClick={exportCsv}><Download size={14} />Export filtered CSV</button> : undefined} />
    <div className="notice operations-notice"><Activity size={14} /><span>Sample order records only. Status changes, refunds, and exports are local previews; payments, notifications, and courier updates require commerce APIs.</span></div>

    <div className="kpi-grid order-queue-metrics grid grid-cols-2 gap-3 lg:grid-cols-4">
      <QueueMetric icon={<PackageCheck size={15} />} label="New · paid" value={String(normalizedOrders.filter((order) => order.status === "New" && order.paymentStatus === "Paid").length)} foot="Ready to begin fulfilment" tone="blue" />
      <QueueMetric icon={<Boxes size={15} />} label="Preparing" value={String(counts.Preparing)} foot="Pack and assign dispatch" tone="violet" />
      <QueueMetric icon={<Truck size={15} />} label="In transit" value={String(counts.Shipped)} foot="Orders with courier tracking" tone="teal" />
      <QueueMetric icon={<ShieldAlert size={15} />} label="Needs attention" value={String(counts["Needs attention"])} foot="Resolve before fulfilment" tone="amber" />
    </div>

    <section className="card order-workspace-card">
      <div className="order-workspace-heading"><div><h2 className="card-title">Fulfilment queue</h2><p className="card-note">Select a queue to focus the work that needs doing next.</p></div><span className="small-caption">{normalizedOrders.length} sample orders</span></div>
      <div className="order-queue-tabs" role="tablist" aria-label="Filter orders by fulfilment status">{queueTabs.map((queue) => <button key={queue} role="tab" aria-selected={tab === queue} className={tab === queue ? "selected" : ""} onClick={() => setTab(queue)}>{queue}<span>{counts[queue]}</span></button>)}</div>
      <TableToolbar value={query} onChange={setQuery} placeholder="Search order, customer, product, coupon, or tracking..." right={<>
        <select className="period-select" aria-label="Filter by payment" value={paymentFilter} onChange={(event) => setPaymentFilter(event.target.value)}><option>Any payment</option><option>Paid</option><option>Pending</option><option>Failed</option><option>Partially refunded</option><option>Refunded</option></select>
        <select className="period-select" aria-label="Filter orders by date" value={dateFilter} onChange={(event) => changeDateFilter(event.target.value as OrderDateFilter)}><option>All dates</option><option>Last 7 days</option><option>Last 30 days</option></select>
        <select className="period-select order-product-filter" aria-label="Filter by product" value={productFilter} onChange={(event) => setProductFilter(event.target.value)}><option>All products</option>{productOptions.map((product) => <option key={product}>{product}</option>)}</select>
        <select className="period-select" aria-label="Filter by coupon" value={couponFilter} onChange={(event) => setCouponFilter(event.target.value)}><option>All coupons</option>{couponOptions.map((coupon) => <option key={coupon}>{coupon}</option>)}</select>
        <button className="filter-button" onClick={clearFilters}><Filter size={13} />Reset</button>
      </>} />

      {eligibleSelected.length > 0 && <div className="order-bulk-toolbar"><span><Check size={14} />{eligibleSelected.length} selected paid order{eligibleSelected.length === 1 ? "" : "s"} can start fulfilment</span><button className="button button-secondary button-small" onClick={moveSelectedToPreparing}>Move to preparing <ArrowRight size={13} /></button></div>}

      <div className="table-wrap"><table className="orders-workflow-table"><thead><tr><th><input type="checkbox" aria-label="Select all paid orders ready for fulfilment" checked={allVisibleSelected} onChange={(event) => {
        const eligible = new Set(selectableVisible);
        setSelectedIds((current) => event.target.checked ? [...new Set([...current, ...eligible])] : current.filter((id) => !eligible.has(id)));
      }} /></th><th>Order</th><th>Customer</th><th>Placed</th><th>Total</th><th>Payment</th><th>Fulfilment</th><th>Next step</th><th /></tr></thead><tbody>
        {filteredOrders.map((order) => <tr key={order.id}>
          <td><input type="checkbox" aria-label={`Select order ${order.id}`} checked={selectedIds.includes(order.id)} disabled={!canStartPreparing(order)} onChange={(event) => toggleSelection(order.id, event.target.checked)} /></td>
          <td><div className="person order-person"><span className="activity-icon"><PackageCheck size={14} /></span><div><div className="person-name">{order.id}</div><div className="person-sub">{order.item}{order.couponCode ? ` · ${order.couponCode}` : ""}</div></div></div></td>
          <td><div className="order-customer-cell"><Avatar initials={order.customer.split(" ").map((part) => part[0]).join("")} /><span><strong>{order.customer}</strong><small>{order.customerEmail ?? "Email not recorded"}</small></span></div></td>
          <td>{order.date}</td><td><strong>{formatCurrency(parseAmount(order))}</strong></td>
          <td><div className="order-payment-cell"><StatusPill status={order.paymentStatus ?? "Pending"} />{order.paymentMethod && <small>{order.paymentMethod}</small>}</div></td>
          <td><div className="order-fulfillment-cell"><StatusPill status={order.status} /><small>{progressFor(order)}</small></div></td>
          <td><span className={`order-next-step ${order.status === "Needs attention" ? "attention" : ""}`}>{nextAction(order)}</span></td>
          <td><button className="row-action" aria-label={`Open order ${order.id}`} onClick={() => setSelectedOrderId(order.id)}><ArrowRight size={15} /></button></td>
        </tr>)}
        {filteredOrders.length === 0 && <tr><td colSpan={9}><div className="empty-state">No orders match these filters. Try a different queue or reset the filters.</div></td></tr>}
      </tbody></table></div>
      <div className="table-footer"><span>{filteredOrders.length} orders · sample data</span><span>Page 1 of 1</span></div>
    </section>

    {selectedOrder && <Modal className="order-details-modal order-workflow-modal" title={`Order ${selectedOrder.id}`} description={`${selectedOrder.customer} · ${selectedOrder.date}`} submitLabel={nextAction(selectedOrder)} onClose={() => setSelectedOrderId(null)} onSubmit={handlePrimaryAction}>
      <OrderDetails order={selectedOrder} relatedOrders={normalizedOrders.filter((order) => order.customerEmail && order.customerEmail === selectedOrder.customerEmail && order.id !== selectedOrder.id).slice(0, 4)} />
      {selectedOrder.status === "Preparing" && <div className="shipping-entry"><div className="field-heading"><Truck size={14} />Dispatch details</div><div className="form-grid-two"><div className="field"><label htmlFor="order-courier">Courier</label><input id="order-courier" value={dispatchDetails.courier} onChange={(event) => setDispatchByOrder((current) => ({ ...current, [selectedOrder.id]: { ...dispatchDetails, courier: event.target.value } }))} placeholder="e.g. Delhivery" /></div><div className="field"><label htmlFor="order-tracking">Tracking / AWB number</label><input id="order-tracking" value={dispatchDetails.trackingNumber} onChange={(event) => setDispatchByOrder((current) => ({ ...current, [selectedOrder.id]: { ...dispatchDetails, trackingNumber: event.target.value } }))} placeholder="Enter courier tracking number" /></div></div><p className="form-help">Both fields are required before recording dispatch.</p></div>}
      {selectedOrder.paymentStatus !== "Paid" && ["New", "Needs attention"].includes(selectedOrder.status) && <div className="order-action-notice"><ShieldAlert size={14} /><span>Payment is {selectedOrder.paymentStatus?.toLowerCase() ?? "not confirmed"}. Confirm payment before starting fulfilment.</span></div>}
      <div className="order-modal-actions">{canCancel(selectedOrder) && <button className="button button-secondary danger-button" onClick={() => { setCancelOrder(selectedOrder); setCancelReason("Customer requested cancellation"); }}>Cancel order</button>}{canRefund(selectedOrder) && <button className="button button-secondary" onClick={() => setRefundTarget(selectedOrder)}><Undo2 size={13} />Record refund</button>}</div>
      {selectedOrder.status === "Delivered" && <div className="order-modal-actions"><button className="button button-secondary" onClick={() => { setReturnOrder(selectedOrder); setReturnReason("Changed my mind"); }}>Log a return request</button></div>}
      <p className="form-help order-demo-footnote">Actions update this local preview only. No customer notification, payment refund, or courier booking is sent.</p>
    </Modal>}

    {cancelOrder && <Modal title="Cancel order" description={`${cancelOrder.id} · ${cancelOrder.customer}`} submitLabel="Record cancellation" onClose={() => setCancelOrder(null)} onSubmit={confirmCancellation}><div className="field"><label htmlFor="cancel-reason">Cancellation reason</label><select id="cancel-reason" value={cancelReason} onChange={(event) => setCancelReason(event.target.value)}>{["Customer requested cancellation", "Payment issue", "Item unavailable", "Address issue", "Other"].map((reason) => <option key={reason}>{reason}</option>)}</select></div><div className="order-action-notice"><ShieldAlert size={14} /><span>Cancellation does not refund a captured payment automatically. Record the refund separately after confirming it with the payment provider.</span></div></Modal>}
    {returnOrder && <Modal title="Log a return request" description={`${returnOrder.id} · ${returnOrder.customer}`} submitLabel="Save return request" onClose={() => setReturnOrder(null)} onSubmit={confirmReturn}><div className="field"><label htmlFor="return-reason">Return reason</label><select id="return-reason" value={returnReason} onChange={(event) => setReturnReason(event.target.value)}>{["Changed my mind", "Damaged item", "Wrong item sent", "Product quality issue", "Other"].map((reason) => <option key={reason}>{reason}</option>)}</select></div><div className="order-action-notice"><Truck size={14} /><span>This creates a return review task. Courier collection and customer messages are not sent in this preview.</span></div></Modal>}
    {refundOrder && <Modal title="Record a refund" description={`${refundOrder.id} · ${refundOrder.customer}`} submitLabel="Save refund record" onClose={() => setRefundOrder(null)} onSubmit={confirmRefund}><div className="order-refund-context"><BadgeIndianRupee size={16} /><span>Remaining refundable amount<strong>{formatCurrency(Math.max(0, parseAmount(refundOrder) - (refundOrder.refundAmount ?? 0)))}</strong></span></div><div className="form-grid-two"><div className="field"><label htmlFor="refund-amount">Refund amount (₹)</label><input id="refund-amount" type="number" min="1" step="1" max={Math.max(0, parseAmount(refundOrder) - (refundOrder.refundAmount ?? 0))} value={refundAmount} onChange={(event) => setRefundAmount(event.target.value)} /></div><div className="field"><label htmlFor="refund-reason">Reason</label><select id="refund-reason" value={refundReason} onChange={(event) => setRefundReason(event.target.value)}>{["Customer return", "Damaged item", "Wrong item sent", "Partial order issue", "Customer goodwill", "Other"].map((reason) => <option key={reason}>{reason}</option>)}</select></div></div><div className="order-action-notice"><ShieldAlert size={14} /><span>This records the refund in the preview only. It does not move money; process the refund through the payment provider separately.</span></div></Modal>}
  </main>;
}

function OrderDetails({ order, relatedOrders }: { order: OrderRecord; relatedOrders: OrderRecord[] }) {
  return <>
    <div className="order-customer-card"><span className="activity-icon"><UserRound size={16} /></span><div><strong>{order.customer}</strong><span>{order.customerEmail ?? "Customer email unavailable"}{order.customerPhone ? ` · ${order.customerPhone}` : ""}</span></div><StatusPill status={order.paymentStatus ?? "Pending"} /></div>
    {relatedOrders.length > 0 && <div className="order-customer-history"><div className="field-heading"><UserRound size={14} />Recent customer orders</div>{relatedOrders.map((related) => <div key={related.id}><span><strong>{related.id}</strong><small>{related.date} · {related.item}</small></span><span><StatusPill status={related.status} /><strong>{formatCurrency(parseAmount(related))}</strong></span></div>)}</div>}
    <div className="order-detail-block"><div className="field-heading"><PackageCheck size={14} />Items ordered</div>{(order.items ?? [{ name: order.item, quantity: 1, unitPrice: 0 }]).map((item, index) => <div className="order-line-item" key={`${item.name}-${index}`}><div><strong>{item.name}</strong><span>Qty {item.quantity}</span></div><strong>{formatCurrency(item.unitPrice * item.quantity)}</strong></div>)}</div>
    <div className="order-total-card"><MoneyLine label="Subtotal" amount={order.subtotal ?? 0} /><MoneyLine label="Discount" amount={-(order.discount ?? 0)} />{order.couponCode && <MoneyLine label="Coupon code" text={order.couponCode} />}<MoneyLine label="Shipping" amount={order.shipping ?? 0} /><MoneyLine label="Tax" amount={order.tax ?? 0} /><MoneyLine label="Order total" amount={0} totalText={formatCurrency(parseAmount(order))} />{(order.refundAmount ?? 0) > 0 && <MoneyLine label="Refunded" amount={-(order.refundAmount ?? 0)} />}</div>
    <div className="order-detail-grid"><div className="detail-item"><span>Payment method</span><strong>{order.paymentMethod ?? "Not recorded"}</strong></div><div className="detail-item"><span>Payment state</span><StatusPill status={order.paymentStatus ?? "Pending"} /></div><div className="detail-item"><span>Fulfilment</span><StatusPill status={order.status} /></div><div className="detail-item"><span>Courier & tracking</span><strong>{order.courier ? `${order.courier} · ${order.trackingNumber ?? "No tracking number"}` : "Not dispatched"}</strong></div><div className="detail-item order-address"><span><MapPin size={12} /> Delivery address</span><strong>{order.shippingAddress ?? "Not recorded"}</strong></div>{order.refundReason && <div className="detail-item"><span>Last refund reason</span><strong>{order.refundReason}</strong></div>}{order.cancellationReason && <div className="detail-item"><span>Cancellation reason</span><strong>{order.cancellationReason}</strong></div>}{order.returnReason && <div className="detail-item"><span>Return reason</span><strong>{order.returnReason}</strong></div>}</div>
    <div className="order-detail-block"><div className="field-heading"><Activity size={14} />Order history</div><div className="order-timeline">{(order.timeline ?? []).map((event, index) => <div className="order-timeline-item" key={`${event.label}-${index}`}><span className={event.done ? "done" : ""}>{event.done ? <Check size={11} /> : <span />}</span><div><strong>{event.label}</strong><small>{event.date}</small></div></div>)}</div></div>
  </>;
}

function QueueMetric({ icon, label, value, foot, tone }: { icon: React.ReactNode; label: string; value: string; foot: string; tone: string }) {
  return <article className="card kpi-card commerce-metric"><div className="kpi-top"><span className="kpi-label">{label}</span><span className={`kpi-icon ${tone}`}>{icon}</span></div><div className="kpi-value">{value}</div><div className="kpi-foot">{foot}</div></article>;
}

function MoneyLine({ label, amount, totalText, text }: { label: string; amount?: number; totalText?: string; text?: string }) {
  const value = text ?? totalText ?? `${(amount ?? 0) < 0 ? "−" : ""}${formatCurrency(Math.abs(amount ?? 0))}`;
  return <div className={`money-line ${totalText ? "total" : ""}`}><span>{label}</span><strong>{value}</strong></div>;
}
