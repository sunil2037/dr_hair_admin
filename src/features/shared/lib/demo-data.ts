import type { AdminRecord, BookingRecord, ContentRecord, FeatureRecord, OrderRecord, PatientRecord } from "../types";

export const patients: PatientRecord[] = [
  { id: "DRH-2024-8849", name: "Yashveer Soni", initials: "YS", email: "yashveer@example.com", assessment: "Stage 2 · Receding hairline", submitted: "Today, 9:03 AM", status: "Completed" },
  { id: "DH-10482", name: "Aarav Mehta", initials: "AM", email: "aarav.mehta@email.com", assessment: "Androgenetic alopecia · Stage II", submitted: "Today, 10:42 AM", status: "Review" },
  { id: "DH-10481", name: "Priya Kapoor", initials: "PK", email: "priya.k@email.com", assessment: "Hair shedding · Moderate", submitted: "Today, 9:18 AM", status: "Pending" },
  { id: "DH-10479", name: "Rohan Shah", initials: "RS", email: "rohan.shah@email.com", assessment: "Scalp dryness · Mild", submitted: "Yesterday", status: "Completed" },
  { id: "DH-10476", name: "Ananya Iyer", initials: "AI", email: "ananya.iyer@email.com", assessment: "Pattern thinning · Stage I", submitted: "Oct 27, 2026", status: "Pending" },
  { id: "DH-10472", name: "Kabir Nair", initials: "KN", email: "kabir.nair@email.com", assessment: "Hair shedding · Moderate", submitted: "Oct 26, 2026", status: "Completed" },
  { id: "DH-10469", name: "Meera Rao", initials: "MR", email: "meera.rao@email.com", assessment: "Scalp sensitivity · Mild", submitted: "Oct 25, 2026", status: "Review" },
];

export const admins: AdminRecord[] = [
  { id: "ADM-001", name: "Nandini Rao", initials: "NR", email: "nandini.rao@drhair.health", role: "Clinical Admin", roleTemplate: "clinical-admin", access: "Patients & assessments", actions: ["Review assessments", "Review progress check-ins", "Upload patient documents"], lastActive: "2 min ago", status: "Active" },
  { id: "ADM-002", name: "Vikram Sethi", initials: "VS", email: "vikram.sethi@drhair.health", role: "Operations Admin", roleTemplate: "operations-admin", access: "Orders, clinic appointments", actions: ["Manage orders", "Manage clinic appointments"], lastActive: "18 min ago", status: "Active" },
  { id: "ADM-003", name: "Aisha Khan", initials: "AK", email: "aisha.khan@drhair.health", role: "Content & media editor", roleTemplate: "content-admin", access: "App content & media", actions: ["Create and edit app content", "Upload app images and videos"], lastActive: "Yesterday", status: "Active" },
  { id: "ADM-004", name: "Ritesh Sharma", initials: "RS", email: "ritesh.sharma@drhair.health", role: "Operations Admin", roleTemplate: "operations-admin", permissionOverrides: { "bookings.manage": "deny" }, access: "Orders", actions: ["Manage orders"], lastActive: "Oct 21, 2026", status: "Suspended" },
];

export const initialFeatures: FeatureRecord[] = [
  { id: "shop", title: "Pharmacy & Haircare Store", description: "Product catalog, cart, and checkout ordering in the patient app.", group: "Commerce", enabled: true, admins: "Operations Admin" },
  { id: "clinic_appointment", title: "Clinic OPD Consultations", description: "In-person clinic consultation appointments with Dr. Jai Bansal.", group: "Clinical care", enabled: true, admins: "Operations Admin" },
  { id: "assessment", title: "Hair Screening & Assessment", description: "Mobile hair assessment questionnaire and scalp photo analysis.", group: "Clinical care", enabled: true, admins: "Clinical Admin" },
  { id: "videos", title: "Doctor Videos & Educational Reels", description: "Video reels feed and educational content for patients.", group: "Content & media", enabled: true, admins: "Content & media editor" },
  { id: "reviews", title: "Patient Reviews & Stories", description: "Verified patient testimonials, transformation stories, and reviews tab.", group: "Content & media", enabled: true, admins: "Content & media editor" },
  { id: "routine", title: "Daily Care Routine Tracker", description: "Morning & evening daily medication regimen checklist and habit tracking.", group: "Patient care tools", enabled: true, admins: "Clinical Admin" },
  { id: "reminders", title: "Medication & Care Reminders", description: "Personalized alerts for minoxidil, serums, and supplements.", group: "Patient care tools", enabled: true, admins: "Clinical Admin" },
  { id: "reports", title: "Clinical Reports & Test Vault", description: "Trichoscopy scans and clinical test PDF reports shared with the patient.", group: "Clinical care", enabled: true, admins: "Dr. Jai Bansal" },
];

export const contentRecords: ContentRecord[] = [
  { id: "CNT-021", title: "Your hair health journey starts here", section: "Home · Hero banner", updated: "Oct 28, 2026", status: "Published" },
  { id: "CNT-020", title: "How to use your scalp serum", section: "Video · Product education", updated: "Oct 26, 2026", status: "Published" },
  { id: "CNT-018", title: "Understanding your assessment result", section: "FAQ · Hair assessment", updated: "Oct 24, 2026", status: "Review" },
  { id: "CNT-015", title: "October care routine tips", section: "Home · Expert tips", updated: "Oct 22, 2026", status: "Draft" },
  { id: "CNT-013", title: "Privacy policy · October 2026", section: "Policy · Legal", updated: "Oct 18, 2026", status: "Published" },
];

export const orders: OrderRecord[] = [
  { id: "ORD-2841", customer: "Nisha Verma", customerEmail: "nisha.v@email.com", customerPhone: "+91 98765 44321", item: "Follicle Booster Serum · 3 Months", date: "Oct 29, 2026", amount: "₹2,799", totalAmount: 2799, status: "New", paymentMethod: "UPI ·•••• 4021", paymentStatus: "Paid", subtotal: 3199, discount: 400, couponCode: "GROW15", shipping: 0, tax: 0, shippingAddress: "Indiranagar, Bengaluru · 560038", items: [{ name: "Follicle Booster Serum · 60ml + Scalp Roller", quantity: 1, unitPrice: 3199 }], timeline: [{ label: "Order placed", date: "Oct 29 · 10:42 AM", done: true }, { label: "Payment confirmed", date: "Oct 29 · 10:42 AM", done: true }] },
  { id: "ORD-2840", customer: "Sanjay Gupta", customerEmail: "sanjay.g@email.com", customerPhone: "+91 98220 31216", item: "Complete Hair Care Kit", date: "Oct 29, 2026", amount: "₹4,499", totalAmount: 4499, status: "Delivered", paymentMethod: "Card ·•••• 2216", paymentStatus: "Paid", subtotal: 5299, discount: 800, shipping: 0, tax: 0, shippingAddress: "Bandra West, Mumbai · 400050", courier: "Delhivery", trackingNumber: "DLV238410058", items: [{ name: "Complete Hair Care Kit · Complete kit", quantity: 1, unitPrice: 5299 }], timeline: [{ label: "Order placed", date: "Oct 29 · 9:12 AM", done: true }, { label: "Payment confirmed", date: "Oct 29 · 9:13 AM", done: true }, { label: "Packed", date: "Oct 29 · 12:10 PM", done: true }, { label: "Shipped · DLV238410058", date: "Oct 29 · 2:30 PM", done: true }, { label: "Delivered", date: "Oct 30 · 4:22 PM", done: true }] },
  { id: "ORD-2839", customer: "Kabir Nair", customerEmail: "kabir.n@email.com", customerPhone: "+91 99012 65844", item: "Follicle Booster Serum · 1 Month", date: "Oct 29, 2026", amount: "₹1,299", totalAmount: 1299, status: "Preparing", paymentMethod: "UPI ·•••• 7730", paymentStatus: "Paid", subtotal: 1699, discount: 400, couponCode: "WELCOME10", shipping: 0, tax: 0, shippingAddress: "Alwarpet, Chennai · 600018", items: [{ name: "Follicle Booster Serum · 30ml", quantity: 1, unitPrice: 1699 }], timeline: [{ label: "Order placed", date: "Oct 29 · 8:40 AM", done: true }, { label: "Payment confirmed", date: "Oct 29 · 8:40 AM", done: true }, { label: "Preparing", date: "Oct 29 · 9:10 AM", done: true }] },
  { id: "ORD-2838", customer: "Riya Desai", customerEmail: "riya.d@email.com", customerPhone: "+91 98231 00551", item: "Scalp Balance Shampoo", date: "Oct 28, 2026", amount: "₹899", totalAmount: 899, status: "Needs attention", paymentMethod: "UPI ·•••• 1120", paymentStatus: "Paid", subtotal: 999, discount: 100, shipping: 0, tax: 0, shippingAddress: "Koregaon Park, Pune · 411001", items: [{ name: "Scalp Balance Shampoo · 200ml", quantity: 1, unitPrice: 999 }], timeline: [{ label: "Order placed", date: "Oct 28 · 3:08 PM", done: true }, { label: "Payment confirmed", date: "Oct 28 · 3:08 PM", done: true }, { label: "Address verification", date: "Needs attention", done: false }] },
  { id: "ORD-2837", customer: "Meera Rao", customerEmail: "meera.r@email.com", item: "Complete Hair Care Kit", date: "Oct 28, 2026", amount: "₹4,499", totalAmount: 4499, status: "Shipped", paymentMethod: "Card ·•••• 4087", paymentStatus: "Paid", subtotal: 5299, discount: 800, shipping: 0, tax: 0, shippingAddress: "Jubilee Hills, Hyderabad · 500033", courier: "Blue Dart", trackingNumber: "BD834107922", items: [{ name: "Complete Hair Care Kit · Complete kit", quantity: 1, unitPrice: 5299 }], timeline: [{ label: "Order placed", date: "Oct 28 · 10:15 AM", done: true }, { label: "Payment confirmed", date: "Oct 28 · 10:15 AM", done: true }, { label: "Packed", date: "Oct 28 · 1:10 PM", done: true }, { label: "Shipped · BD834107922", date: "Oct 28 · 4:36 PM", done: true }] },
  { id: "ORD-2835", customer: "Ananya Iyer", customerEmail: "ananya.i@email.com", item: "Scalp Balance Shampoo", date: "Oct 27, 2026", amount: "₹899", totalAmount: 899, status: "Return requested", paymentMethod: "UPI ·•••• 5411", paymentStatus: "Paid", subtotal: 999, discount: 100, shipping: 0, tax: 0, shippingAddress: "Indiranagar, Bengaluru · 560038", returnReason: "Damaged item", items: [{ name: "Scalp Balance Shampoo · 200ml", quantity: 1, unitPrice: 999 }], timeline: [{ label: "Order placed", date: "Oct 27 · 10:15 AM", done: true }, { label: "Payment confirmed", date: "Oct 27 · 10:15 AM", done: true }, { label: "Delivered", date: "Oct 29 · 3:22 PM", done: true }, { label: "Return requested · damaged item", date: "Oct 29 · 4:05 PM", done: true }] },
  { id: "ORD-2834", customer: "Arjun Bhat", customerEmail: "arjun.b@email.com", item: "Follicle Booster Serum · 1 Month", date: "Oct 27, 2026", amount: "₹1,299", totalAmount: 1299, status: "Cancelled", paymentMethod: "Card ·•••• 9301", paymentStatus: "Refunded", subtotal: 1399, discount: 100, shipping: 0, tax: 0, refundAmount: 1299, refundReason: "Customer cancellation", cancellationReason: "Customer requested cancellation", shippingAddress: "Jubilee Hills, Hyderabad · 500033", items: [{ name: "Follicle Booster Serum · 30ml", quantity: 1, unitPrice: 1399 }], timeline: [{ label: "Order placed", date: "Oct 27 · 11:45 AM", done: true }, { label: "Order cancelled", date: "Oct 27 · 11:52 AM", done: true }, { label: "Refund initiated", date: "Oct 28 · 9:30 AM", done: true }] },
];

const clinicTime = (daysFromToday: number, hour: number, minute: number) => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromToday);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
};

export const bookings: BookingRecord[] = [
  { id: "APT-APP-DEMO", patientId: "DRH-2024-8849", customer: "Yashveer Soni", service: "In-Person Hair & Scalp Consultation", date: "Today · 11:30 AM", startsAt: clinicTime(0, 11, 30), source: "App", status: "Active", type: "Physical Clinic Visit", doctorName: "Dr. Jai Bansal", room: "Room 101 - Chamber A", tokenNumber: "OPD-01", opdStatus: "Arrived" },
  { id: "APT-0921", patientId: "DH-10482", customer: "Aarav Mehta", service: "Microscopic Scalp Scan (Trichoscopy)", date: "Today · 12:30 PM", startsAt: clinicTime(0, 12, 30), source: "Phone", status: "Active", type: "Physical Clinic Visit", doctorName: "Dr. Jai Bansal", room: "Room 101 - Chamber A", tokenNumber: "OPD-02", opdStatus: "In Consultation" },
  { id: "APT-0920", patientId: "DH-10481", customer: "Priya Kapoor", service: "Clinical Follow-Up with Dr. Jai Bansal", date: "Today · 2:00 PM", startsAt: clinicTime(0, 14, 0), source: "Reception", status: "Completed", type: "Physical Clinic Visit", doctorName: "Dr. Jai Bansal", room: "Room 101 - Chamber A", tokenNumber: "OPD-03", opdStatus: "Completed" },
  { id: "APT-0918", patientId: "DH-10479", customer: "Rohan Shah", service: "Pre-Transplant Graft Assessment", date: "Tomorrow · 10:00 AM", startsAt: clinicTime(1, 10, 0), source: "App", status: "Pending", type: "Physical Clinic Visit", doctorName: "Dr. Jai Bansal", room: "Room 101 - Chamber A", tokenNumber: "OPD-04", opdStatus: "Requested" },
  { id: "APT-0915", patientId: "DH-10469", customer: "Meera Rao", service: "In-Person Hair & Scalp Consultation", date: "Tomorrow · 4:30 PM", startsAt: clinicTime(1, 16, 30), source: "Phone", status: "Pending", type: "Physical Clinic Visit", doctorName: "Dr. Jai Bansal", room: "Room 101 - Chamber A", tokenNumber: "OPD-05", opdStatus: "Confirmed" },
];

export const auditEvents = [
  { who: "Aisha Khan", initials: "AK", action: "published", target: "How to use your scalp serum", time: "Today, 10:26 AM", type: "Content" },
  { who: "Super Admin", initials: "SM", action: "updated access for", target: "Clinical Admin role", time: "Today, 9:52 AM", type: "Access" },
  { who: "Vikram Sethi", initials: "VS", action: "updated order status for", target: "ORD-2840", time: "Today, 9:15 AM", type: "Orders" },
  { who: "Super Admin", initials: "SM", action: "enabled app feature", target: "Progress tracking", time: "Yesterday, 5:42 PM", type: "Feature" },
  { who: "Dr. Jai Bansal", initials: "JB", action: "reviewed assessment", target: "DH-10479 · Rohan Shah", time: "Yesterday, 4:12 PM", type: "Clinical" },
  { who: "Aisha Khan", initials: "AK", action: "saved as draft", target: "October care routine tips", time: "Yesterday, 2:30 PM", type: "Content" },
];
