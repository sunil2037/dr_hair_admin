import type { Metadata } from "next";
import Link from "next/link";
import { LegalShell } from "@/features/legal/components/legal-shell";
import {
  ArrowUpRight,
  CheckCircle2,
  ExternalLink,
  FileCheck2,
  FileText,
  HelpCircle,
  Lock,
  RotateCcw,
  Scale,
  Shield,
  Smartphone,
  Trash2,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Compliance & Legal Hub | Dr. Hair App & Clinic",
  description: "Official Legal & Store Compliance Directory for Dr. Hair mobile application. Public compliance URLs for Google Play Store and Apple App Store submission.",
};

const COMPLIANCE_ITEMS = [
  {
    href: "/privacy",
    title: "Privacy Policy",
    icon: Shield,
    badge: "Play Store & App Store Mandatory",
    summary:
      "Details how scalp photographs, clinical quiz responses, phone numbers, and patient records are collected, encrypted, and processed in compliance with the Indian DPDP Act 2023, Google Play Data Safety, and Apple Guideline 5.1.1.",
    appStoreField: "Privacy Policy URL",
    playStoreField: "Data Safety & Privacy Policy URL",
  },
  {
    href: "/terms",
    title: "Terms of Service & EULA",
    icon: FileText,
    badge: "Apple Guideline 3.1.2 Compliant",
    summary:
      "Standard End User License Agreement (EULA), medical tele-triage disclaimers, clinic appointment terms, user responsibilities, and intellectual property protections for Dr. Hair services.",
    appStoreField: "App Store EULA / Terms of Use",
    playStoreField: "Terms & Conditions URL",
  },
  {
    href: "/delete-account",
    title: "Account & Data Deletion Portal",
    icon: Trash2,
    badge: "Play Store & Apple 5.1.1(v) Mandatory",
    summary:
      "Publicly accessible web portal allowing users to request permanent deletion of their account credentials, scalp images, and assessment responses without requiring the app to be installed.",
    appStoreField: "Account Deletion URL",
    playStoreField: "Data Deletion Request URL (Data Safety)",
  },
  {
    href: "/refund-policy",
    title: "Refund & Cancellation Policy",
    icon: RotateCcw,
    badge: "Commerce & Billing Standard",
    summary:
      "Clear policies on OPD appointment cancellations, doctor consultation rescheduling windows, hair care product returns (7 days), and automated bank refund timelines (5-7 business days).",
    appStoreField: "Purchases & In-App Terms",
    playStoreField: "Billing & Cancellation Policy",
  },
  {
    href: "/support",
    title: "Patient Support & Helpdesk",
    icon: HelpCircle,
    badge: "Apple Mandatory Support URL",
    summary:
      "Official clinic support desk, doctor consultation assistance, direct WhatsApp helpline, phone numbers, Jaipur clinic address, FAQs, and ticket inquiry portal.",
    appStoreField: "Support URL (Mandatory)",
    playStoreField: "Developer Contact & Support URL",
  },
];

export default function LegalHubPage() {
  return (
    <LegalShell
      title="Compliance & Legal Directory"
      badge="App Store & Google Play Ready"
      subtitle="Complete set of public compliance documents and developer URLs required for deploying Dr. Hair to Google Play Store and Apple App Store."
      lastUpdated="October 31, 2026"
      effectiveDate="October 31, 2026"
    >
      <div className="space-y-8">
        {/* Verification Overview */}
        <div className="p-5 rounded-2xl bg-[#F0F7FF] border border-[#D6E0FC]">
          <div className="flex items-start gap-3">
            <CheckCircle2 size={22} className="text-[#0D9488] shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs text-[#2E486D]">
              <h3 className="font-bold text-sm text-[#1A365D]">Store Submission Readiness Checklist</h3>
              <p>
                All URLs listed below are publicly accessible, mobile-responsive, print-ready, and adhere to the latest 2026 developer requirements mandated by Google Play Console and Apple App Store Connect.
              </p>
            </div>
          </div>
        </div>

        {/* Policy Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 not-prose">
          {COMPLIANCE_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.href}
                className="group p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs hover:border-[#0D9488]/40 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="w-10 h-10 rounded-xl bg-[#E8F5F2] text-[#0D9488] flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Icon size={20} />
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-[#435B7C]">
                      {item.badge}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-[#1A365D] group-hover:text-[#0D9488] transition-colors flex items-center gap-1.5">
                    {item.title}
                    <ArrowUpRight size={16} className="text-[#A0A4A8] group-hover:text-[#0D9488] transition-colors" />
                  </h3>

                  <p className="mt-2 text-xs text-[#596E8C] leading-relaxed">
                    {item.summary}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-[#F0F4F8] space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#A0A4A8]">Store Submission Keys:</span>
                    <span className="font-mono text-[#1A365D] font-semibold text-[10px] bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                      {item.href}
                    </span>
                  </div>
                  <Link
                    href={item.href}
                    className="inline-flex items-center justify-center w-full gap-1.5 px-3 py-2 rounded-lg bg-[#F0F7FF] text-[#1A365D] hover:bg-[#1A365D] hover:text-white text-xs font-bold transition-all"
                  >
                    <span>View Official Policy</span>
                    <ExternalLink size={13} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Play Store & App Store Copy Table */}
        <section className="mt-10">
          <h2>Store Console Fast-Copy Guide</h2>
          <p>
            When publishing the Dr. Hair app on Google Play Console and App Store Connect, copy and paste the respective production URLs into your listing setup:
          </p>

          <div className="overflow-x-auto my-4">
            <table className="w-full text-xs text-left border border-[#E2E8F0] rounded-lg">
              <thead className="bg-[#F0F7FF] text-[#1A365D] font-bold">
                <tr>
                  <th className="p-3 border-b border-[#E2E8F0]">Store Console Field</th>
                  <th className="p-3 border-b border-[#E2E8F0]">Platform</th>
                  <th className="p-3 border-b border-[#E2E8F0]">Live Submission URL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] font-mono text-[11px]">
                <tr>
                  <td className="p-3 font-sans font-semibold text-[#1A365D]">Privacy Policy URL</td>
                  <td className="p-3 font-sans text-[#596E8C]">Google Play &amp; Apple</td>
                  <td className="p-3 text-[#0D9488] font-bold">https://adminpanal-ruby.vercel.app/privacy</td>
                </tr>
                <tr>
                  <td className="p-3 font-sans font-semibold text-[#1A365D]">Account Deletion URL</td>
                  <td className="p-3 font-sans text-[#596E8C]">Google Play (Data Safety) &amp; Apple</td>
                  <td className="p-3 text-[#0D9488] font-bold">https://adminpanal-ruby.vercel.app/delete-account</td>
                </tr>
                <tr>
                  <td className="p-3 font-sans font-semibold text-[#1A365D]">Support URL</td>
                  <td className="p-3 font-sans text-[#596E8C]">Apple App Store (Mandatory)</td>
                  <td className="p-3 text-[#0D9488] font-bold">https://adminpanal-ruby.vercel.app/support</td>
                </tr>
                <tr>
                  <td className="p-3 font-sans font-semibold text-[#1A365D]">Marketing / EULA URL</td>
                  <td className="p-3 font-sans text-[#596E8C]">Apple App Store &amp; Play Store</td>
                  <td className="p-3 text-[#0D9488] font-bold">https://adminpanal-ruby.vercel.app/terms</td>
                </tr>
                <tr>
                  <td className="p-3 font-sans font-semibold text-[#1A365D]">Refund Policy URL</td>
                  <td className="p-3 font-sans text-[#596E8C]">Google Play &amp; Payments</td>
                  <td className="p-3 text-[#0D9488] font-bold">https://adminpanal-ruby.vercel.app/refund-policy</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </LegalShell>
  );
}

