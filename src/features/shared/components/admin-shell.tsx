"use client";

import {
  Activity, CalendarDays, ChevronRight, FileCheck2, History, LayoutDashboard, LogOut, Menu, Package, PanelsTopLeft,
  Search, ShieldCheck, ShoppingBag, UsersRound, Bell, type LucideIcon,
} from "lucide-react";
import { useEffect } from "react";
import { BrandLogo } from "./brand-logo";
import { visibleNavigation, type PanelFeatureAccess } from "../lib/permissions";
import type { AdminPermissionId, PageKey, Role } from "../types";

const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard, UsersRound, Package, PanelsTopLeft, ShoppingBag, FileCheck2,
  CalendarDays, ShieldCheck, History,
};

const pageLabels: Record<PageKey, string> = {
  overview: "Overview",
  patients: "Patients & assessments",
  catalog: "Commerce",
  content: "App Management",
  orders: "Orders",
  tests: "Hair tests & reports",
  bookings: "Bookings",
  team: "Admin users",
  activity: "Audit log",
};

interface AdminShellProps {
  role: Role;
  page: PageKey;
  globalSearch: string;
  panelAccess: PanelFeatureAccess;
  permissions: AdminPermissionId[];
  isOwner: boolean;
  userName: string;
  previewAdminId: string;
  adminOptions: { id: string; name: string; role: string; status: string }[];
  mobileOpen: boolean;
  children: React.ReactNode;
  onRoleChange: (role: Role) => void;
  onAdminPreviewChange: (id: string) => void;
  onPageChange: (page: PageKey) => void;
  onSearchChange: (value: string) => void;
  onMobileOpenChange: (open: boolean) => void;
  onToast: (message: string) => void;
  onSignOut: () => void;
}

export function AdminShell({
  role, page, globalSearch, panelAccess, permissions, isOwner, userName, previewAdminId, adminOptions, mobileOpen, children, onRoleChange, onAdminPreviewChange, onPageChange,
  onSearchChange, onMobileOpenChange, onToast, onSignOut,
}: AdminShellProps) {
  const nav = visibleNavigation(role, panelAccess, permissions);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onMobileOpenChange(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onMobileOpenChange]);

  return (
    <div className="admin-shell">
      <button className={`mobile-scrim ${mobileOpen ? "show" : ""}`} aria-label="Close menu" onClick={() => onMobileOpenChange(false)} />
      <aside id="admin-navigation" className={`sidebar fixed inset-y-0 left-0 z-30 flex flex-col transition-transform duration-200 ease-out ${mobileOpen ? "open" : ""}`} aria-label="Main navigation">
        <div className="brand">
          <BrandLogo priority />
        </div>
        <div className="sidebar-label">Workspace</div>
        <nav className="nav-list">
          {nav.filter((item) => item.group === "Workspace").map((item) => {
            const Icon = iconMap[item.icon];
            return <button key={item.key} className={`nav-item ${page === item.key ? "active" : ""}`} onClick={() => { onPageChange(item.key); onMobileOpenChange(false); }}>
              <span className="nav-icon"><Icon size={17} strokeWidth={1.8} /></span><span>{item.label}</span>{item.count && <span className="nav-count">{item.count}</span>}
            </button>;
          })}
        </nav>
        {role === "super-admin" && <>
          <div className="sidebar-label">Management</div>
          <nav className="nav-list">
            {nav.filter((item) => item.group === "Management").map((item) => {
              const Icon = iconMap[item.icon];
              return <button key={item.key} className={`nav-item ${page === item.key ? "active" : ""}`} onClick={() => { onPageChange(item.key); onMobileOpenChange(false); }}>
                <span className="nav-icon"><Icon size={17} strokeWidth={1.8} /></span><span>{item.label}</span>
              </button>;
            })}
          </nav>
        </>}
        <div className="sidebar-bottom">
          <div className="help-card"><strong>Need a hand?</strong><p>Visit the operations guide for help managing Dr. Hair.</p></div>
          <div className="user-tile">
            <div className="avatar">{role === "super-admin" ? "JB" : "NR"}</div>
            <div style={{ minWidth: 0, flex: 1 }}><div className="user-name">{userName}</div><div className="user-role">{role === "super-admin" ? "Super Admin · Doctor" : isOwner ? "Admin preview" : "Admin"}</div></div>
            <button className="row-action" aria-label="Sign out" title="Sign out" onClick={onSignOut}><LogOut size={15} /></button>
          </div>
        </div>
      </aside>
      <div className="main-column min-h-screen">
        <header className="topbar">
          <div className="topbar-left">
            <button className="icon-button mobile-menu" aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"} aria-expanded={mobileOpen} aria-controls="admin-navigation" onClick={() => onMobileOpenChange(!mobileOpen)}><Menu size={17} /></button>
            <div className="breadcrumbs"><span>Dr. Hair</span><ChevronRight size={13} /><strong>{pageLabels[page]}</strong></div>
          </div>
          <div className="topbar-actions">
            <label className="search-box"><Search size={15} /><input aria-label="Search the admin panel" value={globalSearch} onChange={(event) => onSearchChange(event.target.value)} placeholder="Search anything..." /></label>
            <button className="icon-button hidden sm:grid" aria-label="Notifications" onClick={() => onToast("You’re all caught up.")}><Bell size={16} /><span className="notification-dot" /></button>
            {isOwner ? <>
              <span className="role-demo hidden xl:inline-flex"><Activity size={13} /> Preview role</span>
              <select className="role-select h-8 max-w-[5.25rem] sm:h-9 sm:max-w-[7rem]" aria-label="Preview role" value={role} onChange={(event) => onRoleChange(event.target.value as Role)}>
                <option value="admin">Admin</option><option value="super-admin">Super Admin</option>
              </select>
              {role === "admin" && <select className="role-select admin-preview-select h-8 max-w-[5.25rem] sm:h-9 sm:max-w-[8rem]" aria-label="Preview admin account" title="Preview admin account" value={previewAdminId} onChange={(event) => onAdminPreviewChange(event.target.value)}>
                {adminOptions.map((admin) => <option key={admin.id} value={admin.id}>{admin.name.split(" ")[0]}{admin.status === "Suspended" ? " · Suspended" : ""}</option>)}
              </select>}
            </> : <span className="role-demo"><ShieldCheck size={13} /> {permissions.length} permissions assigned</span>}
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}

export function getPageLabel(page: PageKey) { return pageLabels[page]; }
