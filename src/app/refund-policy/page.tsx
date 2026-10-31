import type { Metadata } from "next";
import { LegalShell } from "@/features/legal/components/legal-shell";
import { AlertCircle, Clock, CreditCard, RefreshCw, RotateCcw, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Refund and Cancellation Policy | Dr. Hair App & Clinic",
  description: "Official Refund and Cancellation Policy for Dr. Hair clinic appointments, OPD consultations, and hair care products.",
};

const TOC = [
  { id: "overview", label: "Overview & Principles" },
  { id: "clinic-appointments", label: "OPD Appointment Cancellations" },
  { id: "clinical-procedures", label: "Clinical Procedures (PRP, GFC, Transplants)" },
  { id: "products-returns", label: "Hair Care Products & Prescriptions" },
  { id: "refund-timelines", label: "Refund Processing & Timelines" },
  { id: "non-refundable", label: "Non-Refundable Items" },
  { id: "contact-billing", label: "Billing & Refund Support" },
];

export default function RefundPolicyPage() {
  return (
    <LegalShell
      title="Refund & Cancellation Policy"
      badge="Clear & Fair Patient Billing"
      subtitle="Transparent cancellation and refund guidelines for Dr. Hair OPD doctor consultations, clinic procedures, and prescribed hair care products."
      lastUpdated="October 31, 2026"
      effectiveDate="October 31, 2026"
      tableOfContents={TOC}
    >
      <div className="space-y-8">
        {/* Quick Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-2">
          <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] shadow-xs">
            <Clock size={20} className="text-[#0D9488] mb-2" />
            <h4 className="text-xs font-bold text-[#1A365D]">Free Rescheduling</h4>
            <p className="text-[11px] text-[#596E8C] mt-1">Reschedule your OPD appointment anytime up to 2 hours prior to the slot.</p>
          </div>
          <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] shadow-xs">
            <RotateCcw size={20} className="text-[#0D9488] mb-2" />
            <h4 className="text-xs font-bold text-[#1A365D]">7-Day Product Return</h4>
            <p className="text-[11px] text-[#596E8C] mt-1">Returns accepted for sealed, damaged, or incorrect products within 7 days.</p>
          </div>
          <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] shadow-xs">
            <CreditCard size={20} className="text-[#0D9488] mb-2" />
            <h4 className="text-xs font-bold text-[#1A365D]">5-7 Day SLA</h4>
            <p className="text-[11px] text-[#596E8C] mt-1">Direct refund to original payment source (UPI / Card / Netbanking).</p>
          </div>
        </div>

        {/* Section 1 */}
        <section id="overview">
          <h2>1. Overview &amp; Principles</h2>
          <p>
            At <strong>Dr. Hair &amp; Cosmodent Clinic</strong>, led by <strong>Dr. Jai Bansal</strong>, we are committed to providing transparent, patient-centric clinical services. We recognize that medical emergencies and schedule changes happen. This policy sets out the terms under which cancellations, returns, and refunds are handled for appointments, clinic treatments, and products purchased through our mobile application or website.
          </p>
        </section>

        {/* Section 2 */}
        <section id="clinic-appointments">
          <h2>2. OPD Clinic Appointments &amp; Consultations</h2>
          <ul>
            <li>
              <strong>Cancellation Window:</strong> If you booked a consultation slot and wish to cancel, you may do so at least <strong>2 hours before</strong> the scheduled appointment time for a <strong>100% full refund</strong> of any pre-paid consultation fee.
            </li>
            <li>
              <strong>Free Rescheduling:</strong> You may reschedule your appointment to another convenient date or time slot at no extra charge up to 2 hours before the visit.
            </li>
            <li>
              <strong>Late Cancellations &amp; No-Shows:</strong> If a patient fails to show up without prior notification or cancels within less than 2 hours of the slot, the booking consultation fee may be retained to cover clinic doctor slot allocation.
            </li>
            <li>
              <strong>Clinic-Initiated Rescheduling:</strong> In rare circumstances where a surgical emergency prevents Dr. Jai Bansal or the attending specialist from attending your slot, you will be offered immediate priority rescheduling or a 100% full refund at your choice.
            </li>
          </ul>
        </section>

        {/* Section 3 */}
        <section id="clinical-procedures">
          <h2>3. Clinical Procedures (PRP, GFC, Mesotherapy, Hair Transplants)</h2>
          <p>
            Advanced regenerative therapies (PRP, GFC) and surgical hair restoration require dedicated clinical operating room preparation, medical consumables, and specialized staff reservation:
          </p>
          <ul>
            <li>
              <strong>Procedure Advance Deposits:</strong> For surgical procedures (e.g., FUE Hair Transplant), advance reservation deposits are refundable if cancellation is requested at least <strong>48 hours before</strong> the procedure date.
            </li>
            <li>
              <strong>Medical Unfitness on Procedure Day:</strong> If our clinical team deems a patient medically unfit for a scheduled procedure on the day of surgery (e.g., uncontrolled hypertension or scalp infection), the deposit will be retained as a clinic credit or refunded after deducting laboratory blood test costs.
            </li>
          </ul>
        </section>

        {/* Section 4 */}
        <section id="products-returns">
          <h2>4. Hair Care Products &amp; Prescriptions</h2>
          <p>
            For hair care items (such as anti-dandruff shampoos, hair serums, nutritional supplements, and derma rollers) ordered via the app:
          </p>
          <ul>
            <li>
              <strong>Damaged or Incorrect Items:</strong> If you receive a damaged product, leakage, or an incorrect item, please notify us within <strong>48 hours of delivery</strong> with photos at <a href="mailto:support@drhair.in" className="text-[#0D9488] font-bold">support@drhair.in</a>. We will provide an immediate free replacement or full refund.
            </li>
            <li>
              <strong>Unopened Items:</strong> You may return sealed, unopened, and undamaged products within <strong>7 days of delivery</strong>. The product packaging and security seals must remain fully intact.
            </li>
            <li>
              <strong>Prescription Topical Formulations:</strong> Due to health and drug safety regulations under the Indian Drugs and Cosmetics Act, opened medicinal products, compounding serums, or dispensed pharmaceutical formulations cannot be returned once opened.
            </li>
          </ul>
        </section>

        {/* Section 5 */}
        <section id="refund-timelines">
          <h2>5. Refund Processing Timelines &amp; Methods</h2>
          <p>All approved refunds are initiated promptly:</p>
          <ul>
            <li><strong>Initiation:</strong> Approved refunds are triggered within <strong>24 to 48 hours</strong> of verification.</li>
            <li><strong>Bank Processing:</strong> The credited amount will reflect in your original payment method (Bank Account, UPI ID, or Credit/Debit Card) within <strong>5 to 7 business working days</strong>, depending on your banking provider.</li>
            <li><strong>Cash at Clinic:</strong> For payments made in cash at the clinic front desk, refunds will be issued via UPI transfer or bank NEFT.</li>
          </ul>
        </section>

        {/* Section 6 */}
        <section id="non-refundable">
          <h2>6. Non-Refundable Items &amp; Services</h2>
          <ul>
            <li>Completed doctor consultations and physical examinations.</li>
            <li>Completed clinical procedures (PRP sessions, GFC sessions, or hair transplant surgeries already performed).</li>
            <li>Laboratory blood test fees paid to third-party diagnostic pathology labs.</li>
            <li>Opened, used, or partially consumed topical lotions, serums, or oral supplements.</li>
          </ul>
        </section>

        {/* Section 7 */}
        <section id="contact-billing">
          <h2>7. Billing &amp; Refund Inquiries</h2>
          <p>To request a cancellation, check the status of your refund, or dispute a charge:</p>
          <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] text-xs space-y-2">
            <p><strong>Email:</strong> <a href="mailto:support@drhair.in" className="text-[#0D9488] font-bold">support@drhair.in</a> (Subject: &quot;Refund Request - [Booking/Order ID]&quot;)</p>
            <p><strong>Helpline:</strong> <a href="tel:+919119119965" className="text-[#0D9488] font-bold">+91 91191 19965</a> (Mon - Sat: 10:00 AM – 7:30 PM)</p>
            <p><strong>Clinic Address:</strong> Dr. Hair &amp; Cosmodent Clinic, Jaipur, Rajasthan, India</p>
          </div>
        </section>
      </div>
    </LegalShell>
  );
}

