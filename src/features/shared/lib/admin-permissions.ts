import type { AdminPermissionId, AdminRoleTemplate, AdminRecord } from "../types";

export interface AdminPermissionDefinition {
  id: AdminPermissionId;
  label: string;
  description: string;
  elevated?: boolean;
}

export interface AdminPermissionCategory {
  id: string;
  title: string;
  description: string;
  permissions: AdminPermissionDefinition[];
}

export const adminPermissionCategories: AdminPermissionCategory[] = [
  {
    id: "clinical",
    title: "Patients & clinical records",
    description: "Access to assessments, care plans, progress, and patient files.",
    permissions: [
      { id: "patients.view", label: "View patient clinical profile", description: "See patient details, assessment, diagnosis, and history." },
      { id: "assessments.review", label: "Review assessments", description: "Review submitted answers and scalp photos." },
      { id: "care-plans.edit", label: "Create or edit care plans", description: "Update a patient's prescribed regimen and care plan.", elevated: true },
      { id: "progress.review", label: "Review progress check-ins", description: "Review patient progress notes and photos." },
      { id: "documents.view", label: "View patient documents", description: "Open private patient documents and reports." },
      { id: "documents.upload", label: "Upload patient documents", description: "Add a document to a patient's private record." },
      { id: "documents.share", label: "Share approved documents", description: "Make a patient document available in the patient app.", elevated: true },
      { id: "patients.export", label: "Export patient records", description: "Download patient data outside the panel.", elevated: true },
    ],
  },
  {
    id: "testing",
    title: "Hair tests & reports",
    description: "Capture test results and control when reports reach the patient.",
    permissions: [
      { id: "patients.lookup", label: "Find a patient by name or ID", description: "Limited patient lookup for test files or documents without opening the clinical chart." },
      { id: "hair-tests.view", label: "View hair test records", description: "See test entries and their review status." },
      { id: "hair-tests.upload", label: "Upload test results", description: "Attach image, PDF, or document test files." },
      { id: "hair-tests.submit", label: "Submit tests for doctor review", description: "Send uploaded results into the doctor's review queue." },
      { id: "reports.approve", label: "Approve clinical reports", description: "Mark a report approved for patient sharing.", elevated: true },
      { id: "reports.share", label: "Share reports with patients", description: "Make an approved report available in the app.", elevated: true },
    ],
  },
  {
    id: "app-content",
    title: "App management",
    description: "Manage app content, placements, and patient notifications.",
    permissions: [
      { id: "content.edit", label: "Create and edit app content", description: "Edit app copy, educational videos, stories, and home placements." },
      { id: "media.upload", label: "Upload app images and videos", description: "Add media for app-facing content." },
      { id: "content.publish", label: "Publish app content and media", description: "Make draft content visible to app users.", elevated: true },
      { id: "notifications.manage", label: "Manage app notifications", description: "Draft and schedule patient-facing app notifications." },
    ],
  },
  {
    id: "commerce",
    title: "Commerce & orders",
    description: "Manage products, fulfilment, coupons, and referrals.",
    permissions: [
      { id: "products.manage", label: "Manage product catalog", description: "Edit product information, pricing, and stock." },
      { id: "orders.manage", label: "Manage orders", description: "Update fulfilment, returns, and order status." },
      { id: "promotions.manage", label: "Manage coupons and referrals", description: "Create or pause customer promotions." },
      { id: "commerce.export", label: "Export commerce data", description: "Download order and sales data.", elevated: true },
    ],
  },
  {
    id: "appointments",
    title: "Clinic appointments",
    description: "Track appointments arranged with the clinic outside the app.",
    permissions: [
      { id: "bookings.manage", label: "Manage clinic appointments", description: "View, record, and update appointments arranged with the doctor." },
    ],
  },
];

export const roleTemplates: Record<AdminRoleTemplate, { label: string; description: string; permissions: AdminPermissionId[] }> = {
  "clinical-admin": {
    label: "Clinical Admin",
    description: "Patient review and care coordination. The doctor retains report approval by default.",
    permissions: ["patients.view", "assessments.review", "progress.review", "documents.view", "documents.upload", "hair-tests.view"],
  },
  "operations-admin": {
    label: "Operations Admin",
    description: "Product catalog, promotions, order fulfilment, and the clinic schedule.",
    permissions: ["products.manage", "orders.manage", "promotions.manage", "bookings.manage"],
  },
  "content-admin": {
    label: "Content & media editor",
    description: "App-facing content and media only. Patient records stay private.",
    permissions: ["content.edit", "media.upload"],
  },
  "hair-test-operator": {
    label: "Hair test operator",
    description: "Upload test files and submit them to the doctor for review.",
    permissions: ["patients.lookup", "hair-tests.view", "hair-tests.upload", "hair-tests.submit"],
  },
  "custom-admin": {
    label: "Custom Admin",
    description: "Start with no access and grant only the permissions needed for this person.",
    permissions: [],
  },
};

export const ownerOnlyControls = [
  "Invite, edit, and suspend admin accounts",
  "Manage app updates and global feature availability",
  "View the full audit log",
];

export function getRoleTemplate(admin: Pick<AdminRecord, "role" | "roleTemplate">): AdminRoleTemplate {
  if (admin.roleTemplate) return admin.roleTemplate;
  const role = admin.role.toLowerCase();
  if (role.includes("clinical")) return "clinical-admin";
  if (role.includes("operation")) return "operations-admin";
  if (role.includes("content")) return "content-admin";
  if (role.includes("hair test")) return "hair-test-operator";
  return "custom-admin";
}

export function getEffectivePermissions(
  roleTemplate: AdminRoleTemplate,
  overrides: Partial<Record<AdminPermissionId, "allow" | "deny">> = {},
): AdminPermissionId[] {
  const base = new Set(roleTemplates[roleTemplate].permissions);
  for (const [permission, value] of Object.entries(overrides) as [AdminPermissionId, "allow" | "deny"][]) {
    if (value === "allow") base.add(permission);
    else base.delete(permission);
  }
  return [...base];
}

export function getPermissionSummary(permissions: AdminPermissionId[]) {
  return adminPermissionCategories
    .filter((category) => category.permissions.some((permission) => permissions.includes(permission.id)))
    .map((category) => category.title.replace(" & clinical records", "").replace(" & reports", "").replace(" & media", ""));
}
