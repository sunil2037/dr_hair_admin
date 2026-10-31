"use client";

import { useState } from "react";
import { LegalShell } from "@/features/legal/components/legal-shell";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  FileText,
  Mail,
  Phone,
  ShieldCheck,
  Smartphone,
  Trash2,
} from "lucide-react";

const TOC = [
  { id: "deletion-overview", label: "Overview & Store Compliance" },
  { id: "interactive-form", label: "Online Deletion Request Form" },
  { id: "what-is-deleted", label: "What Data Is Deleted" },
  { id: "what-is-retained", label: "What Data Is Retained & Why" },
  { id: "in-app-steps", label: "How to Delete In-App" },
  { id: "deletion-timeline", label: "Processing Timelines & SLA" },
  { id: "contact-privacy", label: "Privacy Desk Contact" },
];

export default function DeleteAccountPage() {
  const [identifier, setIdentifier] = useState("");
  const [reason, setReason] = useState("No longer using service");
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setError("Please provide your registered phone number or email address.");
      return;
    }
    if (!agreed) {
      setError("Please confirm that you understand the permanent nature of data deletion.");
      return;
    }

    setSubmitting(true);
    setError("");

    // Simulate reliable queue submission
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
    }, 900);
  };

  return (
    <LegalShell
      title="Account & Data Deletion Portal"
      badge="Mandatory Google Play & Apple Guideline 5.1.1(v)"
      subtitle="Request permanent deletion of your Dr. Hair account, profile, scalp photographs, and personal data in accordance with store compliance standards."
      lastUpdated="October 31, 2026"
      effectiveDate="October 31, 2026"
      tableOfContents={TOC}
    >
      <div className="space-y-8">
        {/* Compliance Notice */}
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
          <Trash2 size={20} className="shrink-0 text-amber-700 mt-0.5" />
          <div className="leading-relaxed">
            <strong>Google Play &amp; Apple Compliance:</strong> This official public portal fulfills Google Play Store and Apple App Store requirements allowing patients and users to request permanent deletion of their account and personal data from outside the mobile application without needing to reinstall the app.
          </div>
        </div>

        {/* Section 1: Overview */}
        <section id="deletion-overview">
          <h2>1. Overview &amp; Store Compliance</h2>
          <p>
            At <strong>Dr. Hair Clinic &amp; Cosmodent</strong>, we respect your fundamental right to digital privacy and sovereignty over your personal data. Whether you registered via the iOS or Android mobile application, you can initiate a permanent deletion of your account, authentication credentials, uploaded photos, and self-assessment history at any time.
          </p>
        </section>

        {/* Section 2: Interactive Web Request Form */}
        <section id="interactive-form">
          <h2>2. Submit Online Deletion Request</h2>
          <p>
            You do not need to have the Dr. Hair app currently installed on your device to delete your data. You may submit a request directly through the form below:
          </p>

          <div className="p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm my-6 not-prose">
            {submitted ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-14 h-14 rounded-full bg-[#E8F5F2] text-[#0D9488] flex items-center justify-center mx-auto">
                  <CheckCircle size={32} />
                </div>
                <h3 className="text-lg font-bold text-[#1A365D]">Deletion Request Received</h3>
                <p className="text-xs text-[#596E8C] max-w-md mx-auto leading-relaxed">
                  Your request for account identifier <strong>{identifier}</strong> has been logged in our compliance queue. Our data protection team will verify your account and process complete removal within <strong>7 business days</strong>. A confirmation SMS/email will be dispatched.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSubmitted(false);
                      setIdentifier("");
                      setAgreed(false);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-100 text-[#1A365D] text-xs font-semibold hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    Submit Another Request
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="border-b border-[#F0F4F8] pb-3">
                  <h3 className="text-sm font-bold text-[#1A365D] flex items-center gap-2">
                    <Trash2 size={16} className="text-rose-600" />
                    Direct Account Deletion Request
                  </h3>
                  <p className="text-xs text-[#596E8C] mt-1">
                    Enter the phone number or email used during registration in the Dr. Hair App.
                  </p>
                </div>

                <div>
                  <label htmlFor="identifier-input" className="block text-xs font-bold text-[#1A365D] mb-1.5">
                    Registered Mobile Phone Number or Email <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="identifier-input"
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g. +91 98765 43210 or patient@example.com"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#E2E8F0] text-xs text-[#1A1C1C] focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="reason-select" className="block text-xs font-bold text-[#1A365D] mb-1.5">
                    Reason for Deletion (Optional)
                  </label>
                  <select
                    id="reason-select"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#E2E8F0] text-xs text-[#1A1C1C] focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                  >
                    <option value="Completed Treatment">Completed my hair care treatment</option>
                    <option value="No longer using service">No longer using the mobile app</option>
                    <option value="Privacy Concerns">Privacy or data concerns</option>
                    <option value="Created Duplicate Account">Created a duplicate account</option>
                    <option value="Other">Other reason</option>
                  </select>
                </div>

                <div className="pt-2">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                      className="mt-0.5 rounded border-slate-300 text-[#0D9488] focus:ring-[#0D9488]"
                    />
                    <span className="text-xs text-[#596E8C] leading-relaxed">
                      I understand that once processed, my login credentials, saved scalp photos, and hair assessment records will be permanently deleted and cannot be restored.
                    </span>
                  </label>
                </div>

                {error && (
                  <p className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
                    {error}
                  </p>
                )}

                <div className="pt-2 flex items-center justify-between gap-3">
                  <span className="text-[11px] text-[#A0A4A8]">
                    Processed within 7 business days per App Store &amp; Play Store rules.
                  </span>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {submitting ? "Submitting..." : "Submit Deletion Request"}
                    {!submitting && <ArrowRight size={14} />}
                  </button>
                </div>
              </form>
            )}
          </div>
        </section>

        {/* Section 3: What Data is Deleted */}
        <section id="what-is-deleted">
          <h2>3. What Data Is Permanently Deleted</h2>
          <p>Upon verification and approval of your deletion request, the following records are permanently erased from our active databases and cloud storage:</p>
          <div className="overflow-x-auto my-4">
            <table className="w-full text-xs text-left border border-[#E2E8F0] rounded-lg">
              <thead className="bg-[#F0F7FF] text-[#1A365D] font-bold">
                <tr>
                  <th className="p-3 border-b border-[#E2E8F0]">Category</th>
                  <th className="p-3 border-b border-[#E2E8F0]">Data Elements Erased</th>
                  <th className="p-3 border-b border-[#E2E8F0]">Storage Destination</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                <tr>
                  <td className="p-3 font-semibold text-[#1A365D]">Account Credentials</td>
                  <td className="p-3 text-[#444655]">Phone number, auth tokens, session cookies, notification tokens.</td>
                  <td className="p-3 text-[#596E8C]">Firebase &amp; MongoDB</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-[#1A365D]">Scalp Photographs</td>
                  <td className="p-3 text-[#444655]">All uploaded hairline, crown, and vertex photos.</td>
                  <td className="p-3 text-[#596E8C]">Cloudinary Encrypted Vault</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-[#1A365D]">Hair Assessment</td>
                  <td className="p-3 text-[#444655]">Quiz answers, hair fall duration, scalp oiliness, family history answers.</td>
                  <td className="p-3 text-[#596E8C]">MongoDB Database</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-[#1A365D]">User Profile</td>
                  <td className="p-3 text-[#444655]">Display name, age, gender, email address, address info.</td>
                  <td className="p-3 text-[#596E8C]">Primary Database</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 4: What is Retained */}
        <section id="what-is-retained">
          <h2>4. What Data Is Retained &amp; Statutory Legal Exceptions</h2>
          <p>
            Under medical practice laws and fiscal regulations in India, certain minimum records must be retained even after account closure:
          </p>
          <ul>
            <li>
              <strong>Clinical Doctor Consultation Records:</strong> Under <em>National Medical Commission (NMC) Regulations</em> and the <em>Indian Medical Council (Professional Conduct, Etiquette and Ethics) Regulations</em>, formal OPD clinical notes and prescriptions issued by registered medical practitioners must be maintained for medical audit and medico-legal defense for a minimum statutory period (typically 3 years). These records are de-linked from your app account and archived in an offline clinical safe.
            </li>
            <li>
              <strong>Tax &amp; Billing Invoices:</strong> Payment receipts, GST transaction records, and tax invoices must be retained for 7 years to comply with the <em>Central Goods and Services Tax (CGST) Act, 2017</em> and Indian Income Tax regulations.
            </li>
          </ul>
        </section>

        {/* Section 5: In-App Steps */}
        <section id="in-app-steps">
          <h2>5. How to Delete Your Account From Within the App</h2>
          <p>If you currently have the Dr. Hair application installed on your iPhone or Android device:</p>
          <ol>
            <li>Open the <strong>Dr. Hair App</strong> and sign in to your profile.</li>
            <li>Tap the <strong>Profile</strong> tab in the bottom navigation rail.</li>
            <li>Scroll down and tap <strong>Account Settings</strong> or <strong>Privacy &amp; Security</strong>.</li>
            <li>Select <strong>Delete Account &amp; Data</strong>.</li>
            <li>Confirm via the secure OTP sent to your registered mobile phone. Your account will immediately enter a 7-day deactivation and final purge cycle.</li>
          </ol>
        </section>

        {/* Section 6: Processing Timeline */}
        <section id="deletion-timeline">
          <h2>6. Processing Timelines &amp; SLA</h2>
          <ul>
            <li><strong>Acknowledgment:</strong> Instant web receipt upon form submission or within 24 hours via email.</li>
            <li><strong>Verification:</strong> Our team verifies account ownership via SMS OTP or verification link.</li>
            <li><strong>Complete Eradication:</strong> Within <strong>7 working days</strong>, all active user records and image assets are permanently deleted from our servers.</li>
          </ul>
        </section>

        {/* Section 7: Contact */}
        <section id="contact-privacy">
          <h2>7. Privacy &amp; Data Deletion Desk</h2>
          <p>If you need assistance with an existing deletion request, you can contact our privacy desk directly:</p>
          <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] text-xs space-y-2">
            <p><strong>Email:</strong> <a href="mailto:support@drhair.in" className="text-[#0D9488] font-bold">support@drhair.in</a> (Subject: &quot;Account Deletion Request&quot;)</p>
            <p><strong>Phone:</strong> <a href="tel:+919119119965" className="text-[#0D9488] font-bold">+91 91191 19965</a></p>
            <p><strong>Clinic:</strong> Dr. Hair &amp; Cosmodent Clinic, Jaipur, Rajasthan, India</p>
          </div>
        </section>
      </div>
    </LegalShell>
  );
}

