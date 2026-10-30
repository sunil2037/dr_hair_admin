import type { AdminPermissionId, PageKey, Role } from "../types";

export interface NavigationItem {
  key: PageKey;
  label: string;
  group: "Workspace" | "Management";
  icon: string;
  superAdminOnly?: boolean;
  count?: string;
}

export const navigationItems: NavigationItem[] = [
  { key: "overview", label: "Overview", group: "Workspace", icon: "LayoutDashboard" },
  { key: "patients", label: "Patients & assessments", group: "Workspace", icon: "UsersRound" },
  { key: "catalog", label: "Commerce", group: "Workspace", icon: "Package" },
  { key: "content", label: "App Management", group: "Workspace", icon: "PanelsTopLeft" },
  { key: "tests", label: "Hair tests & reports", group: "Workspace", icon: "FileCheck2" },
  { key: "bookings", label: "Clinic appointments", group: "Workspace", icon: "CalendarDays" },
  { key: "team", label: "Admin users", group: "Management", icon: "ShieldCheck", superAdminOnly: true },
  { key: "activity", label: "Audit log", group: "Management", icon: "History", superAdminOnly: true },
];

export type PanelFeatureAccess = Record<string, boolean>;

export function canAccessPage(role: Role, page: PageKey, panelAccess?: PanelFeatureAccess, permissions?: AdminPermissionId[]): boolean {
  const item = navigationItems.find((entry) => entry.key === page);
  if (!item || (item.superAdminOnly && role !== "super-admin")) return false;
  if (role === "super-admin") return true;
  if (page === "catalog") {
    const hasCommercePermission = permissions
      ? ["products.manage", "orders.manage", "promotions.manage"].some((id) => permissions.includes(id as AdminPermissionId))
      : true;
    const hasEnabledCommerceArea = permissions
      ? ((permissions.includes("products.manage") || permissions.includes("promotions.manage")) && panelAccess?.catalog !== false)
        || (permissions.includes("orders.manage") && panelAccess?.orders !== false)
      : panelAccess?.catalog !== false || panelAccess?.orders !== false;
    return hasCommercePermission && hasEnabledCommerceArea;
  }
  const moduleId: Partial<Record<PageKey, string>> = {
    patients: "patients", content: "content", orders: "orders", tests: "tests", bookings: "bookings",
  };
  const accessKey = moduleId[page];
  if (accessKey && panelAccess?.[accessKey] === false) return false;
  if (!permissions) return true;
  const has = (...needed: AdminPermissionId[]) => needed.some((permission) => permissions.includes(permission));
  if (page === "patients") return has("patients.view", "assessments.review", "progress.review", "care-plans.edit")
    || permissions.includes("patients.lookup") && has("documents.view", "documents.upload", "documents.share");
  if (page === "orders") return permissions.includes("orders.manage") && panelAccess?.orders !== false;
  if (page === "content") return has("content.edit", "media.upload", "content.publish", "notifications.manage");
  if (page === "tests") return has("hair-tests.view", "hair-tests.upload", "reports.approve", "reports.share");
  if (page === "bookings") return permissions.includes("bookings.manage");
  return true;
}

export function visibleNavigation(role: Role, panelAccess?: PanelFeatureAccess, permissions?: AdminPermissionId[]) {
  return navigationItems.filter((item) => canAccessPage(role, item.key, panelAccess, permissions));
}
