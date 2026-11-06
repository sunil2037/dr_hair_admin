"use client";

import { Check, Copy, ExternalLink, FileText, Globe, LifeBuoy, ShieldCheck, Trash2, Undo2 } from "lucide-react";
import { useState } from "react";

interface PolicyItem {
  id: string;
  title: string;
  path: string;
  badge: string;
  description: string;
  googlePlayRequired: boolean;
  appleAppStoreRequired: boolean;
  icon: typeof ShieldCheck;
}

const POLICIES: PolicyItem[] = [
  {
    id: "privacy",
    title: "Privacy Policy",
    path: "/privacy",
    badge: "Play Store & App Store Mandatory",
    description: "Covers patient data confidentiality, scalp photographs, camera permissions, DPDP Act 2023 compliance, and medical record protections.",
    googlePlayRequired: true,
    appleAppStoreRequired: true,
    icon: ShieldCheck,
  },
  {
    id: "terms",
    title: "Terms & Conditions",
    path: "/terms",
    badge: "Clinical Care & Commerce",
    description: "Governs clinic consultations, Dr. Jai Bansal OPD appointment bookings, prescription protocols, and store purchases.",
    googlePlayRequired: true,
    appleAppStoreRequired: true,
    icon: FileText,
  },
  {
    id: "delete-account",
    title: "Account & Data Deletion URL",
    path: "/delete-account",
    badge: "Play Store Mandatory (2024+ Policy)",
    description: "Mandatory web-accessible deletion portal required by Google Play Data Safety for patients to delete their account and personal data.",
    googlePlayRequired: true,
    appleAppStoreRequired: true,
    icon: Trash2,
  },
  {
    id: "refund-policy",
    title: "Refund & Cancellation Policy",
    path: "/refund-policy",
    badge: "Payment Gateway & Store Compliance",
    description: "Specifies terms for clinic booking cancellations, OPD token refunds, and product returns/refunds via Razorpay/UPI.",
    googlePlayRequired: false,
    appleAppStoreRequired: false,
    icon: Undo2,
  },
  {
    id: "support",
    title: "Customer Support & Grievance Contact",
    path: "/support",
    badge: "Store Listing Requirement",
    description: "Official clinic contact info, Grievance Officer details under Indian IT Rules, email, phone, and physical clinic address.",
    googlePlayRequired: true,
    appleAppStoreRequired: true,
    icon: LifeBuoy,
  },
  {
    id: "legal",
    title: "Master Legal & Compliance Hub",
    path: "/legal",
    badge: "Single Portal",
    description: "Comprehensive multi-policy portal that links to all policies and legal documents in one responsive overview.",
    googlePlayRequired: false,
    appleAppStoreRequired: false,
    icon: Globe,
  },
];

export function StorePoliciesPanel({ onToast }: { onToast: (message: string) => void }) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const getFullUrl = (path: string) => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}${path}`;
    }
    return `https://adminpanal-ruby.vercel.app${path}`;
  };

  const copyToClipboard = async (id: string, path: string) => {
    const fullUrl = getFullUrl(path);
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopiedId(id);
      onToast(`Copied ${fullUrl} to clipboard!`);
      setTimeout(() => setCopiedId(null), 2500);
    } catch {
      onToast(`URL: ${fullUrl}`);
    }
  };

  return (
    <div className="space-y-5">
      {/* Play Store Guidance Banner */}
      <div className="notice border border-[#D6E0FC] bg-[#F0F7FF] text-[#1A365D]">
        <ShieldCheck size={16} className="text-[#0D9488] shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed">
          <strong>Google Play Console &amp; App Store Ready:</strong> Copy these public URLs directly into your <strong>Google Play Console</strong> (under <em>Policy and Programs &gt; App Content &gt; Privacy Policy</em> and <em>Data Safety &gt; Delete Account URL</em>). All links are public, HTTPS-secured, mobile-responsive, and compliant with store review guidelines.
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {POLICIES.map((policy) => {
          const Icon = policy.icon;
          const fullUrl = getFullUrl(policy.path);
          const isCopied = copiedId === policy.id;

          return (
            <article key={policy.id} className="card p-5 flex flex-col justify-between rounded-2xl hover:shadow-md transition-shadow">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#F0F7FF] text-[#1A365D]">
                      <Icon size={18} />
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-[#1A365D]">{policy.title}</h3>
                      <span className="inline-block mt-0.5 rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-bold text-[#0D9488]">
                        {policy.badge}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {policy.description}
                </p>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 font-mono text-[11px] text-slate-700 break-all select-all flex items-center justify-between gap-2">
                  <span className="truncate">{fullUrl}</span>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => copyToClipboard(policy.id, policy.path)}
                  className="button button-secondary button-small flex-1 flex items-center justify-center gap-1.5"
                  aria-label={`Copy URL for ${policy.title}`}
                >
                  {isCopied ? <Check size={14} className="text-teal-600" /> : <Copy size={14} />}
                  <span>{isCopied ? "Copied!" : "Copy URL"}</span>
                </button>

                <a
                  href={policy.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="button button-primary button-small flex items-center justify-center gap-1.5"
                  aria-label={`Preview ${policy.title} in new tab`}
                >
                  <span>Preview</span>
                  <ExternalLink size={13} />
                </a>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
