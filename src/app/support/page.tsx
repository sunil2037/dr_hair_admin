"use client";

import { useState } from "react";
import { LegalShell } from "@/features/legal/components/legal-shell";
import {
  ArrowRight,
  CheckCircle,
  Clock,
  HelpCircle,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Send,
  ShieldCheck,
} from "lucide-react";

const TOC = [
  { id: "direct-channels", label: "Direct Support Channels" },
  { id: "submit-ticket", label: "Send a Support Message" },
  { id: "faqs", label: "Frequently Asked Questions" },
  { id: "clinic-location", label: "Clinic Location & Hours" },
];

const FAQS = [
  {
    q: "How does the digital hair assessment work in the app?",
    a: "The hair assessment guides you through questions regarding your hair loss patterns, duration, lifestyle factors, and allows you to upload photos of your scalp. Our certified trichologists and Dr. Jai Bansal evaluate this information to provide an expert recommendation and customized treatment plan.",
  },
  {
    q: "Are my uploaded scalp photographs secure and private?",
    a: "Yes, absolutely. All scalp photos are stored in an encrypted vault and are accessible only to licensed medical specialists evaluating your condition. We never share or sell medical media to third-party advertisers.",
  },
  {
    q: "How can I book or reschedule an in-person clinic consultation?",
    a: "You can book directly through the Dr. Hair App by choosing your preferred date, time slot, and clinic branch. If you need to reschedule, you can do so free of charge via the App or by calling our clinic desk at least 2 hours before your visit.",
  },
  {
    q: "What should I do if I am experiencing an unexpected reaction to a prescription?",
    a: "Stop applying or consuming the product immediately and contact our medical support desk at +91 91191 19965 or visit our clinic. If you experience severe symptoms like facial swelling or breathing difficulty, seek emergency medical care immediately.",
  },
  {
    q: "How can I request permanent deletion of my account and data?",
    a: "You can request account deletion directly from the mobile app (Profile -> Account Settings -> Delete Account) or by visiting our public Data Deletion Portal at /delete-account.",
  },
];

export default function SupportPage() {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [category, setCategory] = useState("Appointment Inquiry");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !contact.trim() || !message.trim()) {
      setError("Please fill in your name, contact details, and message.");
      return;
    }

    setSubmitting(true);
    setError("");

    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
    }, 700);
  };

  return (
    <LegalShell
      title="Patient Support & Help Center"
      badge="Apple App Store & Play Store Support URL"
      subtitle="Have questions about appointments, hair assessments, treatment plans, or technical app support? Our clinical care team is here to assist you."
      lastUpdated="October 31, 2026"
      effectiveDate="October 31, 2026"
      tableOfContents={TOC}
    >
      <div className="space-y-8">
        {/* Support Channel Cards */}
        <section id="direct-channels">
          <h2>1. Direct Support Channels</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 not-prose my-4">
            <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-[#E8F5F2] text-[#0D9488] flex items-center justify-center mb-3">
                <Phone size={20} />
              </div>
              <h4 className="text-xs font-bold text-[#1A365D]">Clinic Phone Helpline</h4>
              <p className="text-[11px] text-[#596E8C] mt-1">Direct phone line for clinic bookings and trichology inquiries.</p>
              <a href="tel:+919119119965" className="inline-block mt-3 text-xs font-bold text-[#0D9488] hover:underline">
                +91 91191 19965
              </a>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-[#F0F7FF] text-[#1A365D] flex items-center justify-center mb-3">
                <Mail size={20} />
              </div>
              <h4 className="text-xs font-bold text-[#1A365D]">Email Support</h4>
              <p className="text-[11px] text-[#596E8C] mt-1">App bugs, privacy requests, billing questions, and care support.</p>
              <a href="mailto:support@drhair.in" className="inline-block mt-3 text-xs font-bold text-[#0D9488] hover:underline">
                support@drhair.in
              </a>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-[#E8F8EE] text-[#25D366] flex items-center justify-center mb-3">
                <MessageCircle size={20} />
              </div>
              <h4 className="text-xs font-bold text-[#1A365D]">WhatsApp Care Desk</h4>
              <p className="text-[11px] text-[#596E8C] mt-1">Fast answers for treatment regimens and clinic follow-ups.</p>
              <a
                href="https://wa.me/919119119965?text=Hi%20Dr.%20Hair%20Clinic,%20I%20need%20assistance%20with%20my%20hair%20care."
                target="_blank"
                rel="noreferrer"
                className="inline-block mt-3 text-xs font-bold text-[#25D366] hover:underline"
              >
                Chat on WhatsApp &rarr;
              </a>
            </div>
          </div>
        </section>

        {/* Section 2: Ticket Form */}
        <section id="submit-ticket">
          <h2>2. Send a Support Message</h2>
          <p>
            Have a question for our clinical team or experiencing technical difficulty in the Dr. Hair app? Submit a message below and we will get back to you within 24 hours:
          </p>

          <div className="p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm my-6 not-prose">
            {submitted ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-14 h-14 rounded-full bg-[#E8F5F2] text-[#0D9488] flex items-center justify-center mx-auto">
                  <CheckCircle size={32} />
                </div>
                <h3 className="text-lg font-bold text-[#1A365D]">Message Received!</h3>
                <p className="text-xs text-[#596E8C] max-w-md mx-auto leading-relaxed">
                  Thank you, <strong>{name}</strong>. Our clinical support coordinator will review your message regarding <em>{category}</em> and contact you shortly at <strong>{contact}</strong>.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSubmitted(false);
                      setName("");
                      setContact("");
                      setMessage("");
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-100 text-[#1A365D] text-xs font-semibold hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    Send Another Inquiry
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="support-name" className="block text-xs font-bold text-[#1A365D] mb-1.5">
                      Your Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="support-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Ramesh Kumar"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[#E2E8F0] text-xs text-[#1A1C1C] focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="support-contact" className="block text-xs font-bold text-[#1A365D] mb-1.5">
                      Phone Number or Email <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="support-contact"
                      type="text"
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      placeholder="+91 98765 43210 or email"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[#E2E8F0] text-xs text-[#1A1C1C] focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="support-category" className="block text-xs font-bold text-[#1A365D] mb-1.5">
                    Inquiry Category
                  </label>
                  <select
                    id="support-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#E2E8F0] text-xs text-[#1A1C1C] focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                  >
                    <option value="Appointment Inquiry">OPD Clinic Appointment Booking / Rescheduling</option>
                    <option value="Hair Assessment / Doctor Review">Hair Assessment &amp; Doctor Review Questions</option>
                    <option value="Technical App Support">Technical App Support / OTP Issues</option>
                    <option value="Prescription & Orders">Prescription Clarification / Product Orders</option>
                    <option value="Billing & Refunds">Billing, Payments &amp; Refunds</option>
                    <option value="General Feedback">General Clinic Inquiries</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="support-message" className="block text-xs font-bold text-[#1A365D] mb-1.5">
                    How can we help? <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    id="support-message"
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe your question or issue in detail..."
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#E2E8F0] text-xs text-[#1A1C1C] focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                    required
                  />
                </div>

                {error && (
                  <p className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
                    {error}
                  </p>
                )}

                <div className="pt-2 flex items-center justify-between gap-3">
                  <span className="text-[11px] text-[#A0A4A8]">
                    We respond to all clinical inquiries within 24 working hours.
                  </span>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1A365D] text-white text-xs font-bold hover:bg-[#2E486D] transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {submitting ? "Sending..." : "Send Message"}
                    {!submitting && <Send size={14} />}
                  </button>
                </div>
              </form>
            )}
          </div>
        </section>

        {/* Section 3: FAQs */}
        <section id="faqs">
          <h2>3. Frequently Asked Questions (FAQs)</h2>
          <div className="space-y-3 not-prose my-4">
            {FAQS.map((faq, i) => (
              <div key={i} className="p-4 rounded-xl bg-white border border-[#E2E8F0] shadow-xs">
                <h4 className="text-xs font-bold text-[#1A365D] flex items-center gap-2">
                  <HelpCircle size={15} className="text-[#0D9488] shrink-0" />
                  {faq.q}
                </h4>
                <p className="text-xs text-[#444655] mt-2 pl-6 leading-relaxed">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Section 4: Clinic Location */}
        <section id="clinic-location">
          <h2>4. Clinic Location &amp; Visiting Hours</h2>
          <div className="p-5 rounded-xl bg-white border border-[#E2E8F0] shadow-xs space-y-2 text-xs">
            <p><strong>Clinic Name:</strong> Dr. Hair &amp; Cosmodent Clinic</p>
            <p><strong>Chief Trichologist &amp; Surgeon:</strong> Dr. Jai Bansal</p>
            <p><strong>Physical Address:</strong> Dr. Hair Clinic, Jaipur, Rajasthan 302017, India</p>
            <p><strong>Operating Hours:</strong> Monday – Saturday: 10:00 AM – 7:30 PM | Sunday: By Prior Appointment</p>
            <p><strong>Emergency Medical Support:</strong> For urgent medical issues, please visit your nearest hospital emergency center.</p>
          </div>
        </section>
      </div>
    </LegalShell>
  );
}

