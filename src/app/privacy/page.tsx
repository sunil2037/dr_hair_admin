import type { Metadata } from "next";
import { LegalShell } from "@/features/legal/components/legal-shell";
import { AlertTriangle, CheckCircle, Database, Eye, Lock, ShieldCheck, UserCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy | Dr. Hair App & Clinic",
  description: "Official Privacy Policy of Dr. Hair mobile application and Dr. Hair & Cosmodent Clinic. Compliant with Google Play Store, Apple App Store, and the Indian Digital Personal Data Protection Act 2023.",
};

const TOC = [
  { id: "introduction", label: "Introduction & Scope" },
  { id: "information-collected", label: "Information We Collect" },
  { id: "scalp-photos", label: "Scalp Photos & Medical Data" },
  { id: "device-permissions", label: "Device Permissions (Camera & Storage)" },
  { id: "how-we-use-data", label: "How We Use Your Information" },
  { id: "data-sharing", label: "Data Sharing & Third-Party Processors" },
  { id: "data-security", label: "Data Security & Encryption" },
  { id: "retention-deletion", label: "Data Retention & Your Deletion Rights" },
  { id: "children-privacy", label: "Children's Privacy" },
  { id: "grievance-officer", label: "Grievance Redressal & Contact" },
];

export default function PrivacyPolicyPage() {
  return (
    <LegalShell
      title="Privacy Policy"
      badge="App Store & Play Store Compliant"
      subtitle="Your clinical privacy, personal health data, and scalp photographs are strictly protected under medical confidentiality and modern encryption standards."
      lastUpdated="October 31, 2026"
      effectiveDate="October 31, 2026"
      tableOfContents={TOC}
    >
      <div className="space-y-8">
        {/* Compliance Banner */}
        <div className="p-4 rounded-xl bg-[#F0F7FF] border border-[#D6E0FC] flex items-start gap-3">
          <ShieldCheck size={20} className="text-[#0D9488] shrink-0 mt-0.5" />
          <div className="text-xs text-[#2E486D] leading-relaxed">
            <strong>Commitment to Patient Privacy:</strong> Dr. Hair Clinic &amp; Cosmodent adheres strictly to the <strong>Indian Information Technology Act, 2000</strong>, the <strong>Digital Personal Data Protection (DPDP) Act, 2023</strong>, <strong>Google Play Developer Data Safety Policies</strong>, and <strong>Apple App Store Guideline 5.1.1</strong>. We do not sell, rent, or trade your personal health data to any advertising broker.
          </div>
        </div>

        {/* Section 1 */}
        <section id="introduction">
          <h2>1. Introduction &amp; Scope</h2>
          <p>
            Welcome to the <strong>Dr. Hair</strong> mobile application (&quot;App&quot;), operated by <strong>Dr. Hair &amp; Cosmodent Clinic</strong> (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;), under the clinical leadership of <strong>Dr. Jai Bansal</strong>.
          </p>
          <p>
            This Privacy Policy governs the manner in which Dr. Hair collects, uses, maintains, protects, and discloses information collected from users (&quot;Patients&quot;, &quot;Users&quot;, or &quot;You&quot;) of our mobile application (iOS &amp; Android) and related clinical consultation services. By installing, accessing, or using the Dr. Hair App, you expressly acknowledge and agree to the practices described herein.
          </p>
        </section>

        {/* Section 2 */}
        <section id="information-collected">
          <h2>2. Information We Collect</h2>
          <p>
            We collect only the minimum necessary information required to deliver high-quality trichology care, manage clinic appointments, and facilitate hair health monitoring:
          </p>
          <ul>
            <li>
              <strong>Account Identification:</strong> Full Name, Mobile Phone Number, Email Address, Age, and Gender. Phone numbers are verified via secure One-Time Password (OTP).
            </li>
            <li>
              <strong>Hair Health &amp; Lifestyle Data:</strong> Assessment responses regarding hair loss patterns (e.g., Norwood scale stages), scalp conditions (dandruff, itchiness, oiliness), duration of hair fall, family history, dietary habits, stress levels, and past hair treatments.
            </li>
            <li>
              <strong>Appointment &amp; Clinical Booking Data:</strong> Preferred visit date, time slot, chosen clinic branch, doctor consultation type (OPD in-person or tele-triage), and visit status.
            </li>
            <li>
              <strong>Device &amp; Technical Identifiers:</strong> Device model, operating system version (Android / iOS), unique device identifiers, IP address, and Firebase application diagnostic logs to ensure app stability and prevent fraud.
            </li>
          </ul>
        </section>

        {/* Section 3 */}
        <section id="scalp-photos">
          <h2>3. Scalp Photographs &amp; Sensitive Health Data</h2>
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-3 my-4">
            <Eye size={18} className="shrink-0 text-amber-700 mt-0.5" />
            <div>
              <strong>Special Protection for Scalp Images:</strong> Photos submitted during the hair assessment (Crown, Frontal hairline, Vertex, Sides) are classified as <em>Sensitive Personal Medical Data</em>. They are encrypted and made accessible <strong>only</strong> to authorized clinical doctors and dermatologists reviewing your treatment plan.
            </div>
          </div>
          <p>
            When you complete our digital hair test, you may optionally capture or upload close-up photos of your scalp. These images are used strictly for:
          </p>
          <ol>
            <li>Enabling Dr. Hair trichologists to evaluate hair thinning grade, follicular density, and scalp health.</li>
            <li>Tracking longitudinal regrowth progress before and after clinic procedures (e.g., PRP, GFC, Meso, or Hair Transplant).</li>
            <li>Formulating personalized topical serums, shampoos, and nutritional regimens.</li>
          </ol>
          <p>
            Scalp images are never published publicly, used for commercial marketing without explicit signed written consent, or shared with third-party advertising networks.
          </p>
        </section>

        {/* Section 4 */}
        <section id="device-permissions">
          <h2>4. Device Permissions (Camera &amp; Storage)</h2>
          <p>
            To provide core clinical functionality, the Dr. Hair App requests the following explicit device permissions on Android and iOS:
          </p>
          <div className="overflow-x-auto my-4">
            <table className="w-full text-xs text-left border border-[#E2E8F0] rounded-lg">
              <thead className="bg-[#F0F7FF] text-[#1A365D] font-bold">
                <tr>
                  <th className="p-3 border-b border-[#E2E8F0]">Permission</th>
                  <th className="p-3 border-b border-[#E2E8F0]">Platform</th>
                  <th className="p-3 border-b border-[#E2E8F0]">Purpose &amp; Usage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                <tr>
                  <td className="p-3 font-semibold text-[#1A365D]">Camera (<code>CAMERA</code>)</td>
                  <td className="p-3 text-[#596E8C]">iOS &amp; Android</td>
                  <td className="p-3 text-[#444655]">Enables you to take live photos of your scalp or prescription slips for clinical review. Only active when you tap the camera button.</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-[#1A365D]">Photo Library (<code>READ_MEDIA_IMAGES</code>)</td>
                  <td className="p-3 text-[#596E8C]">iOS &amp; Android</td>
                  <td className="p-3 text-[#444655]">Allows you to choose existing scalp photos from your gallery. We only access the specific images you select.</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-[#1A365D]">Push Notifications (<code>POST_NOTIFICATIONS</code>)</td>
                  <td className="p-3 text-[#596E8C]">iOS &amp; Android</td>
                  <td className="p-3 text-[#444655]">Sends timely appointment confirmations, doctor consultation reminders, and daily hair treatment regimen alerts. You can disable this anytime in OS settings.</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            We do <strong>not</strong> access your microphone, contacts, location in the background, or financial SMS messages.
          </p>
        </section>

        {/* Section 5 */}
        <section id="how-we-use-data">
          <h2>5. How We Use Your Information</h2>
          <p>Your data is processed for the following lawful clinical and operational purposes:</p>
          <ul>
            <li><strong>Medical Diagnosis:</strong> Assessing your hair condition, follicular patterns, and preparing personalized treatment regimens.</li>
            <li><strong>Appointment Scheduling:</strong> Booking, confirming, rescheduling, and sending reminders for in-clinic OPD visits at Dr. Hair Clinic.</li>
            <li><strong>Account Verification:</strong> Authenticating you via secure SMS OTP to prevent fraudulent access to your medical history.</li>
            <li><strong>Customer Care:</strong> Answering inquiries, providing trichology advice, and coordinating post-procedure follow-ups.</li>
            <li><strong>Clinical Compliance:</strong> Maintaining medical audit records as required by the National Medical Commission (NMC) and Indian clinical establishment laws.</li>
          </ul>
        </section>

        {/* Section 6 */}
        <section id="data-sharing">
          <h2>6. Data Sharing &amp; Third-Party Processors</h2>
          <p>
            We partner only with industry-leading, enterprise-grade cloud service providers who comply with international privacy standards (ISO 27001, SOC 2, HIPAA/GDPR alignment):
          </p>
          <ul>
            <li><strong>Cloudinary:</strong> Secure cloud storage for encrypted clinical images with authenticated URL signatures.</li>
            <li><strong>Firebase / Google Cloud:</strong> Secure authentication tokens, crash analytics, and transactional push notifications.</li>
            <li><strong>MongoDB Atlas:</strong> Encrypted production database with automated backups and network firewall isolation.</li>
            <li><strong>SMS Gateways (Transactional):</strong> Routing one-time passwords (OTP) and booking SMS notifications to your mobile carrier.</li>
          </ul>
          <p>
            <strong>No Sale of Data:</strong> We will never sell, lease, or monetize your health data, personal profile, or scalp images to third parties.
          </p>
        </section>

        {/* Section 7 */}
        <section id="data-security">
          <h2>7. Data Security &amp; Encryption Standards</h2>
          <p>We deploy robust organizational, technical, and physical safeguards:</p>
          <ul>
            <li><strong>Encryption in Transit:</strong> All communications between the mobile app, admin portal, and backend APIs are secured with TLS 1.3 cryptographic protocols.</li>
            <li><strong>Encryption at Rest:</strong> Database records and media assets are stored with AES-256 bit hardware-level encryption.</li>
            <li><strong>Role-Based Access Control (RBAC):</strong> Only licensed medical personnel and authorized clinic administrators can view patient profiles.</li>
            <li><strong>Zero Sensitive Logging:</strong> Passwords, session tokens, and clinical photos are strictly omitted from public server logs.</li>
          </ul>
        </section>

        {/* Section 8 */}
        <section id="retention-deletion">
          <h2>8. Data Retention &amp; Your Right to Deletion</h2>
          <p>
            We retain your personal data only as long as necessary to provide clinical care, maintain continuity of treatment, or fulfill statutory requirements under Indian law (e.g., NMC guidelines mandate retaining clinical records for a minimum statutory period).
          </p>
          <p>
            <strong>Right to Erase / Delete:</strong> Under Google Play and Apple App Store rules, you have the right to request deletion of your account and personal data at any time.
          </p>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-[#2E486D]">
            Visit our dedicated <a href="/delete-account" className="font-bold underline text-[#0D9488]">Account &amp; Data Deletion Portal</a> to submit an instant deletion request, or email <a href="mailto:support@drhair.in" className="font-bold underline text-[#0D9488]">support@drhair.in</a> with your registered phone number.
          </div>
        </section>

        {/* Section 9 */}
        <section id="children-privacy">
          <h2>9. Children&apos;s Privacy</h2>
          <p>
            The Dr. Hair App is intended for individuals aged 18 and older. We do not knowingly solicit or collect personal information from children under 18 without verifiable parental or legal guardian consent. If we become aware that an unsupervised minor has registered, we will promptly purge that account.
          </p>
        </section>

        {/* Section 10 */}
        <section id="grievance-officer">
          <h2>10. Grievance Redressal &amp; Data Protection Officer</h2>
          <p>
            In accordance with the <strong>Information Technology Act, 2000</strong>, the rules made thereunder, and the <strong>Digital Personal Data Protection Act, 2023</strong>, the details of our designated Grievance Officer are provided below:
          </p>
          <div className="p-5 rounded-xl bg-white border border-[#E2E8F0] shadow-xs space-y-2 text-xs">
            <p><strong>Designation:</strong> Data Protection &amp; Patient Grievance Officer</p>
            <p><strong>Clinic:</strong> Dr. Hair &amp; Cosmodent Clinic</p>
            <p><strong>Supervising Doctor:</strong> Dr. Jai Bansal, Hair Transplant Surgeon &amp; Trichologist</p>
            <p><strong>Address:</strong> Dr. Hair Clinic, Jaipur, Rajasthan 302017, India</p>
            <p><strong>Email:</strong> <a href="mailto:support@drhair.in" className="text-[#0D9488] font-bold">support@drhair.in</a> / <a href="mailto:grievance@drhair.in" className="text-[#0D9488] font-bold">grievance@drhair.in</a></p>
            <p><strong>Helpline:</strong> <a href="tel:+919119119965" className="text-[#0D9488] font-bold">+91 91191 19965</a></p>
            <p><strong>Response Timeline:</strong> We acknowledge all grievances within 24 hours and resolve them within 15 working days.</p>
          </div>
        </section>
      </div>
    </LegalShell>
  );
}

