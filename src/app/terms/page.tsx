import type { Metadata } from "next";
import { LegalShell } from "@/features/legal/components/legal-shell";
import { AlertCircle, FileText, HeartPulse, Scale, ShieldAlert } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms and Conditions (EULA) | Dr. Hair App & Clinic",
  description: "Terms and Conditions and End User License Agreement (EULA) for Dr. Hair mobile app and clinic services. Compliant with Apple App Store and Google Play Store.",
};

const TOC = [
  { id: "acceptance", label: "Acceptance of Terms" },
  { id: "medical-disclaimer", label: "Medical & Tele-Triage Disclaimer" },
  { id: "user-accounts", label: "User Accounts & Security" },
  { id: "clinic-appointments", label: "Clinic Appointments & OPD Bookings" },
  { id: "prescriptions", label: "Prescriptions & Treatment Regimens" },
  { id: "user-content", label: "User Content & Scalp Photos" },
  { id: "intellectual-property", label: "Intellectual Property Rights" },
  { id: "prohibited-conduct", label: "Prohibited Conduct" },
  { id: "limitation-liability", label: "Limitation of Liability" },
  { id: "governing-law", label: "Governing Law & Jurisdiction" },
  { id: "contact-clinic", label: "Contact Information" },
];

export default function TermsAndConditionsPage() {
  return (
    <LegalShell
      title="Terms of Service & EULA"
      badge="Apple EULA & Play Store Compliant"
      subtitle="Please review these terms carefully before using the Dr. Hair mobile application, booking OPD clinic visits, or participating in digital hair health assessments."
      lastUpdated="October 31, 2026"
      effectiveDate="October 31, 2026"
      tableOfContents={TOC}
    >
      <div className="space-y-8">
        {/* Urgent Medical Callout */}
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-start gap-3">
          <HeartPulse size={20} className="shrink-0 text-rose-600 mt-0.5" />
          <div className="leading-relaxed">
            <strong>CRITICAL MEDICAL NOTICE:</strong> The Dr. Hair mobile application provides trichological wellness tracking, preliminary questionnaire-based analysis, and clinic booking facilities. It does <strong>not</strong> provide emergency medical intervention. If you are experiencing sudden severe allergic reactions, swelling, scalp infection, or medical emergencies, please visit an emergency healthcare center immediately.
          </div>
        </div>

        {/* Section 1 */}
        <section id="acceptance">
          <h2>1. Acceptance of Terms</h2>
          <p>
            These Terms of Service and End User License Agreement (&quot;Terms&quot; or &quot;EULA&quot;) constitute a legally binding agreement between you (&quot;User&quot;, &quot;Patient&quot;, or &quot;You&quot;) and <strong>Dr. Hair &amp; Cosmodent Clinic</strong> (&quot;Dr. Hair&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), governing your download, access, and use of the Dr. Hair mobile application on iOS and Android, and our official clinical web services.
          </p>
          <p>
            By downloading, installing, or tapping &quot;Get Started&quot; / &quot;Sign In&quot; in the App, you acknowledge that you have read, understood, and agreed to be bound by these Terms and our <a href="/privacy" className="text-[#0D9488] font-bold">Privacy Policy</a>. If you do not agree, do not install or use the App.
          </p>
        </section>

        {/* Section 2 */}
        <section id="medical-disclaimer">
          <h2>2. Medical &amp; Tele-Triage Disclaimer</h2>
          <p>
            <strong>2.1 Digital Assessments:</strong> The digital hair quiz and scalp image review available within the App serve solely as preliminary diagnostic triage aids to help you understand common patterns of hair thinning (such as Androgenetic Alopecia, Telogen Effluvium, or Alopecia Areata) and prepare for clinical evaluation.
          </p>
          <p>
            <strong>2.2 Doctor-Patient Relationship:</strong> Using the App to complete a questionnaire does not automatically establish a comprehensive doctor-patient relationship until an authorized consultation (either in-person OPD visit or confirmed clinical tele-consultation) is completed by <strong>Dr. Jai Bansal</strong> or a qualified medical specialist at Dr. Hair Clinic.
          </p>
          <p>
            <strong>2.3 Independent Judgment:</strong> All final diagnoses, procedural recommendations (e.g., PRP therapy, GFC, Mesotherapy, FUE hair restoration surgery), and pharmaceutical prescriptions are made solely at the clinical discretion of the attending doctor following standard medical protocols.
          </p>
        </section>

        {/* Section 3 */}
        <section id="user-accounts">
          <h2>3. User Accounts &amp; Security</h2>
          <ul>
            <li><strong>Age Requirement:</strong> You must be at least 18 years of age, or have the express supervision and consent of a parent or legal guardian, to create an account.</li>
            <li><strong>Accurate Information:</strong> You agree to provide accurate, truthful, and up-to-date information regarding your age, gender, medical history, and existing medications. Providing misleading information may compromise your medical care.</li>
            <li><strong>OTP Authentication:</strong> Your account is tied to your mobile phone number. You are responsible for maintaining the confidentiality of any OTPs received and for all activities that occur under your account.</li>
          </ul>
        </section>

        {/* Section 4 */}
        <section id="clinic-appointments">
          <h2>4. Clinic Appointments &amp; OPD Bookings</h2>
          <p>
            The App enables patients to schedule in-person appointments at Dr. Hair Clinic branches:
          </p>
          <ul>
            <li><strong>Slot Availability:</strong> While we strive to honor scheduled appointment times, clinic emergencies or complex surgical procedures may occasionally result in short wait times.</li>
            <li><strong>Rescheduling &amp; Cancellations:</strong> You may reschedule or cancel your appointment free of charge up to 2 hours prior to your slot via the App or by contacting clinic support. Refer to our <a href="/refund-policy" className="text-[#0D9488] font-bold">Refund Policy</a>.</li>
            <li><strong>Check-in Requirement:</strong> Patients are requested to arrive at least 10 minutes prior to their booked appointment for vitals and registration check-in.</li>
          </ul>
        </section>

        {/* Section 5 */}
        <section id="prescriptions">
          <h2>5. Prescriptions &amp; Treatment Regimens</h2>
          <p>
            Prescription medications (including topical Minoxidil solutions, oral supplements, and anti-dandruff formulations) are recommended exclusively after clinical evaluation by our certified doctors.
          </p>
          <ul>
            <li>Always follow the specific dosage, application technique, and frequency instructed by your doctor on the prescription.</li>
            <li>Do not share prescribed medications with other individuals, even if they experience similar hair loss symptoms.</li>
            <li>Report any unexpected adverse effects or skin sensitivities to Dr. Hair Clinic immediately.</li>
          </ul>
        </section>

        {/* Section 6 */}
        <section id="user-content">
          <h2>6. User Content &amp; Scalp Photos</h2>
          <p>
            By uploading photographs of your scalp, hairline, or medical history to the App, you grant Dr. Hair Clinic a secure, non-exclusive, royalty-free license to store, process, and display such media solely for your clinical diagnostic evaluation and treatment tracking.
          </p>
          <p>
            You represent and warrant that you own or possess the legitimate rights to all photos and data uploaded, and that such content does not infringe on any third party&apos;s privacy or legal rights.
          </p>
        </section>

        {/* Section 7 */}
        <section id="intellectual-property">
          <h2>7. Intellectual Property Rights</h2>
          <p>
            All software code, graphic designs, logos, text, clinical quiz structures, branding, and registered trademarks (&quot;Dr. Hair&quot;) displayed in the App and web admin portal are the exclusive intellectual property of Dr. Hair &amp; Cosmodent Clinic. You may not copy, reverse-engineer, decompile, distribute, or create derivative works without prior written permission.
          </p>
        </section>

        {/* Section 8 */}
        <section id="prohibited-conduct">
          <h2>8. Prohibited Conduct</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Upload fraudulent, abusive, obscene, or harmful content or photographs.</li>
            <li>Attempt to bypass authentication, probe application vulnerabilities, or disrupt servers.</li>
            <li>Impersonate another patient or healthcare provider.</li>
            <li>Use automated bots, scrapers, or scripts to access patient records or clinic schedules.</li>
          </ul>
        </section>

        {/* Section 9 */}
        <section id="limitation-liability">
          <h2>9. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by applicable Indian law, Dr. Hair Clinic, Dr. Jai Bansal, its medical staff, and technical developers shall not be liable for any indirect, punitive, incidental, or consequential damages resulting from:
          </p>
          <ul>
            <li>Inaccurate or incomplete medical information submitted by the user.</li>
            <li>Failure to adhere to the prescribed clinical dosage or follow-up instructions.</li>
            <li>Temporary service interruptions or network failures beyond our reasonable control.</li>
          </ul>
        </section>

        {/* Section 10 */}
        <section id="governing-law">
          <h2>10. Governing Law &amp; Dispute Resolution</h2>
          <p>
            These Terms shall be governed by and construed in accordance with the substantive laws of the Republic of India. In the event of any legal dispute, controversy, or claim arising out of or relating to these Terms or clinic services, the competent courts situated in <strong>Jaipur, Rajasthan, India</strong> shall have exclusive jurisdiction.
          </p>
        </section>

        {/* Section 11 */}
        <section id="contact-clinic">
          <h2>11. Contact Information</h2>
          <p>For questions or clarifications regarding these Terms of Service, contact:</p>
          <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] text-xs space-y-1.5">
            <p><strong>Dr. Hair &amp; Cosmodent Clinic</strong></p>
            <p><strong>Clinical Director:</strong> Dr. Jai Bansal</p>
            <p><strong>Address:</strong> Dr. Hair Clinic, Jaipur, Rajasthan 302017, India</p>
            <p><strong>Email:</strong> <a href="mailto:support@drhair.in" className="text-[#0D9488] font-bold">support@drhair.in</a></p>
            <p><strong>Helpline:</strong> <a href="tel:+919119119965" className="text-[#0D9488] font-bold">+91 91191 19965</a></p>
          </div>
        </section>
      </div>
    </LegalShell>
  );
}

