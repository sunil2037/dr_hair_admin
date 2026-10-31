"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  FileCheck2,
  FileText,
  HelpCircle,
  Mail,
  MapPin,
  Phone,
  Printer,
  RotateCcw,
  Shield,
  Trash2,
} from "lucide-react";
import { BrandLogo } from "@/features/shared/components/brand-logo";

export interface LegalShellProps {
  title: string;
  badge: string;
  subtitle: string;
  lastUpdated?: string;
  effectiveDate?: string;
  children: React.ReactNode;
  tableOfContents?: { id: string; label: string }[];
}

const NAV_LINKS = [
  { href: "/legal", label: "Legal Hub", icon: FileCheck2 },
  { href: "/privacy", label: "Privacy Policy", icon: Shield },
  { href: "/terms", label: "Terms of Service", icon: FileText },
  { href: "/delete-account", label: "Delete Account & Data", icon: Trash2 },
  { href: "/refund-policy", label: "Refund Policy", icon: RotateCcw },
  { href: "/support", label: "Help & Support", icon: HelpCircle },
];

export function LegalShell({
  title,
  badge,
  subtitle,
  lastUpdated = "October 31, 2026",
  effectiveDate = "October 31, 2026",
  children,
  tableOfContents = [],
}: LegalShellProps) {
  const pathname = usePathname();

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-[#1A1C1C] flex flex-col selection:bg-[#0D9488]/20 selection:text-[#1A365D]">
      {/* Top Compliance Bar */}
      <div className="bg-[#1A365D] text-white text-[11px] sm:text-xs py-2 px-4 border-b border-[#2E486D]">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-[#0D9488] animate-pulse" />
            <span className="font-semibold tracking-wide">Dr. Hair Clinic &amp; Cosmodent</span>
            <span className="text-[#B4BFCD] hidden sm:inline">•</span>
            <span className="text-[#D6E0FC] hidden sm:inline">Official App Store &amp; Google Play Compliance Document</span>
          </div>
          <div className="flex items-center gap-4 text-[#D6E0FC] text-[11px]">
            <a href="mailto:support@drhair.in" className="hover:text-white transition-colors flex items-center gap-1">
              <Mail size={12} /> support@drhair.in
            </a>
            <span className="hidden md:inline text-[#2E486D]">|</span>
            <span className="hidden md:flex items-center gap-1 text-[#D6E0FC]">
              <MapPin size={12} /> Jaipur, Rajasthan, India
            </span>
          </div>
        </div>
      </div>

      {/* Main Navigation Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E2E8F0] shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/legal" className="flex items-center transition-opacity hover:opacity-90">
              <BrandLogo width={135} priority />
            </Link>
            <div className="hidden lg:block h-6 w-px bg-[#E2E8F0]" />
            <span className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E8F5F2] text-[#0D9488] text-[11px] font-bold">
              <CheckCircle2 size={12} /> Compliance Certified
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={handlePrint}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E2E8F0] bg-white text-[#596E8C] text-xs font-semibold hover:bg-slate-50 hover:text-[#1A365D] transition-colors cursor-pointer"
              title="Print document"
            >
              <Printer size={14} />
              <span className="hidden sm:inline">Print / PDF</span>
            </button>
            <Link
              href="/"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#1A365D] text-white text-xs font-semibold hover:bg-[#2E486D] transition-colors"
            >
              <ArrowLeft size={14} />
              <span>Admin Portal</span>
            </Link>
          </div>
        </div>

        {/* Policy Tab Navigation */}
        <div className="border-t border-[#F0F4F8] bg-[#FAFBFD] overflow-x-auto scrollbar-none">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center gap-1 py-1 min-w-max">
            {NAV_LINKS.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-white text-[#1A365D] shadow-xs border border-[#E2E8F0] font-bold"
                      : "text-[#596E8C] hover:text-[#1A365D] hover:bg-white/60"
                  }`}
                >
                  <Icon size={14} className={isActive ? "text-[#0D9488]" : "text-[#A0A4A8]"} />
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="bg-gradient-to-b from-white to-[#F0F7FF]/50 border-b border-[#E2E8F0] py-8 sm:py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8F5F2] text-[#0D9488] text-xs font-bold mb-3 border border-[#0D9488]/20">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0D9488]" />
              {badge}
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#1A365D] tracking-tight leading-tight">
              {title}
            </h1>
            <p className="mt-3 text-sm sm:text-base text-[#596E8C] leading-relaxed">
              {subtitle}
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-3 sm:gap-6 text-xs text-[#596E8C]">
              <div className="flex items-center gap-1.5">
                <Calendar size={14} className="text-[#0D9488]" />
                <span>Last Updated: <strong>{lastUpdated}</strong></span>
              </div>
              <span className="text-slate-300 hidden sm:inline">•</span>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-[#0D9488]" />
                <span>Effective Date: <strong>{effectiveDate}</strong></span>
              </div>
              <span className="text-slate-300 hidden sm:inline">•</span>
              <span className="px-2 py-0.5 rounded-sm bg-slate-100 text-[#435B7C] font-mono text-[11px]">
                App Version: 2.0+ (iOS &amp; Android)
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Layout with Sidebar */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 flex-1 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Content Article */}
          <main className="lg:col-span-8 bg-white p-6 sm:p-10 rounded-2xl border border-[#E2E8F0] shadow-xs">
            <div className="prose prose-slate max-w-none prose-headings:text-[#1A365D] prose-headings:font-bold prose-h2:text-xl sm:prose-h2:text-2xl prose-h2:border-b prose-h2:border-[#F0F4F8] prose-h2:pb-2.5 prose-h2:mt-8 prose-h3:text-lg prose-p:text-[#444655] prose-p:leading-relaxed prose-li:text-[#444655] prose-strong:text-[#1A365D] prose-a:text-[#0D9488] prose-a:font-semibold">
              {children}
            </div>
          </main>

          {/* Sticky Quick-Info Sidebar */}
          <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-36">
            {tableOfContents.length > 0 && (
              <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs">
                <h3 className="text-xs font-bold text-[#1A365D] uppercase tracking-wider mb-3 flex items-center gap-2">
                  <FileText size={14} className="text-[#0D9488]" />
                  Contents in this Document
                </h3>
                <nav className="space-y-1.5">
                  {tableOfContents.map((item, idx) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      className="block text-xs text-[#596E8C] hover:text-[#0D9488] hover:bg-[#F0F7FF] px-2.5 py-1.5 rounded-md transition-colors"
                    >
                      <span className="font-semibold text-[#1A365D] mr-1.5">{idx + 1}.</span>
                      {item.label}
                    </a>
                  ))}
                </nav>
              </div>
            )}

            {/* Quick Contact & Grievance Card */}
            <div className="bg-gradient-to-br from-[#1A365D] to-[#0D9488] p-5 rounded-2xl text-white shadow-sm">
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold tracking-wide uppercase mb-2">
                Need Help or Have Concerns?
              </span>
              <h4 className="font-bold text-sm sm:text-base text-white">Clinical &amp; Legal Grievance</h4>
              <p className="mt-1 text-xs text-white/85 leading-relaxed">
                Reach out to our Data Protection &amp; Patient Grievance Redressal desk directly.
              </p>

              <div className="mt-4 space-y-2 text-xs">
                <a
                  href="mailto:support@drhair.in"
                  className="flex items-center gap-2 text-white bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg transition-colors"
                >
                  <Mail size={14} className="text-[#D6E0FC]" />
                  <span className="truncate">support@drhair.in</span>
                </a>
                <a
                  href="tel:+919119119965"
                  className="flex items-center gap-2 text-white bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg transition-colors"
                >
                  <Phone size={14} className="text-[#D6E0FC]" />
                  <span>+91 91191 19965</span>
                </a>
              </div>

              <div className="mt-4 pt-3 border-t border-white/15 text-[11px] text-white/75 flex items-start gap-1.5">
                <MapPin size={13} className="shrink-0 mt-0.5 text-white/90" />
                <span>Dr. Hair &amp; Cosmodent Clinic, Jaipur, Rajasthan, India</span>
              </div>
            </div>

            {/* Store Compliance Badges Card */}
            <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-3">
              <h4 className="text-xs font-bold text-[#1A365D] uppercase tracking-wider">
                Store Compliance Assurances
              </h4>
              <div className="space-y-2.5 text-xs text-[#596E8C]">
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={15} className="text-[#0D9488] shrink-0 mt-0.5" />
                  <span><strong>Google Play:</strong> Fully adheres to Play Console Data Safety &amp; Health Apps Guidelines.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={15} className="text-[#0D9488] shrink-0 mt-0.5" />
                  <span><strong>Apple App Store:</strong> Conforms to App Store Review Guidelines 5.1.1 (Data Privacy) &amp; 3.1.2 (EULA).</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={15} className="text-[#0D9488] shrink-0 mt-0.5" />
                  <span><strong>Indian Law:</strong> Compliant with Digital Personal Data Protection Act 2023 &amp; IT Rules 2011.</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Global Legal Footer */}
      <footer className="mt-auto bg-white border-t border-[#E2E8F0] py-8 sm:py-10 text-xs text-[#596E8C]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2 space-y-3">
              <div className="brand signin-brand"><BrandLogo width={138} /></div>
              <p className="text-xs text-[#596E8C] max-w-md leading-relaxed">
                Dr. Hair &amp; Cosmodent Clinic offers advanced trichology, hair loss diagnosis, PRP/GFC therapies, and hair restoration surgeries led by Dr. Jai Bansal. Our mobile app empowers patients to evaluate hair health, connect with specialists, and track recovery regimens securely.
              </p>
              <p className="text-[11px] text-[#A0A4A8]">
                Medical Disclaimer: Preliminary app hair assessments do not substitute an in-person clinical diagnosis by a registered medical practitioner.
              </p>
            </div>

            <div>
              <h5 className="font-bold text-[#1A365D] mb-3 uppercase tracking-wider text-[11px]">Compliance &amp; Legal</h5>
              <ul className="space-y-2 text-xs">
                <li><Link href="/privacy" className="hover:text-[#0D9488] transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-[#0D9488] transition-colors">Terms of Service (EULA)</Link></li>
                <li><Link href="/delete-account" className="hover:text-[#0D9488] transition-colors">Account &amp; Data Deletion</Link></li>
                <li><Link href="/refund-policy" className="hover:text-[#0D9488] transition-colors">Refund &amp; Cancellation Policy</Link></li>
                <li><Link href="/legal" className="hover:text-[#0D9488] transition-colors">Compliance Directory</Link></li>
              </ul>
            </div>

            <div>
              <h5 className="font-bold text-[#1A365D] mb-3 uppercase tracking-wider text-[11px]">Support &amp; Contact</h5>
              <ul className="space-y-2 text-xs">
                <li><Link href="/support" className="hover:text-[#0D9488] transition-colors">Patient Support Center</Link></li>
                <li><a href="mailto:support@drhair.in" className="hover:text-[#0D9488] transition-colors">support@drhair.in</a></li>
                <li><a href="tel:+919119119965" className="hover:text-[#0D9488] transition-colors">+91 91191 19965</a></li>
                <li className="text-[11px] text-[#A0A4A8]">Mon - Sat: 10:00 AM - 7:30 PM</li>
                <li><Link href="/" className="inline-flex items-center gap-1 font-semibold text-[#1A365D] hover:text-[#0D9488] mt-2">Clinic Staff Login &rarr;</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-[#F0F4F8] flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[#A0A4A8]">
            <p>&copy; {new Date().getFullYear()} Dr. Hair &amp; Cosmodent Clinic. All rights reserved.</p>
            <p>Designed for Google Play Store &amp; Apple App Store Global Distribution.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

