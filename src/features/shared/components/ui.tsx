"use client";

import { Check, Search, X } from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect } from "react";
import type { Status } from "../types";

export function StatusPill({ status }: { status: Status | string }) {
  const key = status.toLowerCase();
  const className = key === "active" ? "status-active" :
    key === "new" ? "status-new" :
    key === "preparing" ? "status-preparing" :
    key === "shipped" ? "status-shipped" :
    key === "needs attention" ? "status-review" :
    key === "return requested" ? "status-review" :
    key === "paid" ? "status-completed" :
    key === "partially refunded" ? "status-review" :
    key === "failed" ? "status-cancelled" :
    key === "refunded" ? "status-cancelled" :
    key === "published" ? "status-published" :
    key === "completed" ? "status-completed" :
    key === "pending" ? "status-pending" :
    key === "review" ? "status-review" :
    key === "draft" ? "status-draft" :
    key === "suspended" ? "status-suspended" :
    key === "no show" ? "status-cancelled" :
    key === "cancelled" ? "status-cancelled" : "status-inactive";
  return <span className={`status ${className}`}>{status}</span>;
}

export function Avatar({ initials }: { initials: string }) {
  return <span className="avatar" aria-hidden="true">{initials}</span>;
}

export function PageHeader({
  eyebrow, title, description, action,
}: { eyebrow?: string; title: string; description: string; action?: React.ReactNode }) {
  return <div className="page-head max-[900px]:flex-col max-[900px]:items-stretch"><div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h1 className="page-title">{title}</h1><p className="page-subtitle">{description}</p></div>{action && <div className="head-actions max-[900px]:w-full max-[900px]:justify-end">{action}</div>}</div>;
}

export function TableToolbar({
  value, onChange, placeholder = "Search...", right,
}: { value: string; onChange: (value: string) => void; placeholder?: string; right?: React.ReactNode }) {
  return <div className="toolbar"><div className="toolbar-left"><label className="input-search"><Search size={14} /><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} /></label></div><div className="toolbar-right">{right}</div></div>;
}

export function ToggleSwitch({ checked, onChange, disabled, label }: { checked: boolean; onChange: () => void; disabled?: boolean; label: string }) {
  return <button type="button" role="switch" aria-checked={checked} aria-label={label} disabled={disabled} onClick={onChange} className={`switch ${checked ? "on" : ""}`} />;
}

export function Modal({
  title, description, children, submitLabel = "Save changes", submitDisabled = false, className = "", onClose, onSubmit,
}: { title: string; description: string; children: React.ReactNode; submitLabel?: string; submitDisabled?: boolean; className?: string; onClose: () => void; onSubmit: () => void }) {
  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [onClose]);
  if (typeof document === "undefined") return null;
  return createPortal(<div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className={`modal ${className}`} role="dialog" aria-modal="true" aria-labelledby="modal-title">
    <div className="modal-head"><div><h2 id="modal-title">{title}</h2><p>{description}</p></div><button className="row-action" aria-label="Close dialog" onClick={onClose}><X size={17} /></button></div>
    <div className="modal-body">{children}</div>
    <div className="modal-actions"><button className="button button-secondary" onClick={onClose}>Cancel</button><button className="button button-primary" disabled={submitDisabled} onClick={onSubmit}><Check size={14} />{submitLabel}</button></div>
  </section></div>, document.body);
}

export function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => { const timer = window.setTimeout(onClose, 3200); return () => window.clearTimeout(timer); }, [message, onClose]);
  return <div className="toast" role="status"><Check size={15} />{message}<button className="row-action" aria-label="Dismiss notification" onClick={onClose}><X size={14} /></button></div>;
}
