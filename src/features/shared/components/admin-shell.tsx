"use client";

import {
  Activity, Bell, CalendarDays, ChevronRight, CircleHelp,
  FileCheck2, Flag, Gauge, LayoutDashboard, LogOut, Menu, PanelsTopLeft, Search,
  Settings, ShieldCheck, UsersRound, X, type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { visibleNavigation, type PanelFeatureAccess } from "../lib/permissions";
import type { AdminPermissionId, PageKey, Role } from "../types";

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
  role,
  page,
  globalSearch,
  panelAccess,
  permissions,
  isOwner,
  userName,
  previewAdminId,
  adminOptions,
  mobileOpen,
  children,
  onRoleChange,
  onAdminPreviewChange,
  onPageChange,
  onSearchChange,
  onMobileOpenChange,
  onToast,
  onSignOut,
}: AdminShellProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const nav = visibleNavigation(role, panelAccess, permissions);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onMobileOpenChange(false);
        setSettingsOpen(false);
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onMobileOpenChange]);

  const firstName = userName ? userName.split(" ")[0] : "Admin";
  const initials = userName
    ? userName
        .split(/\s+/)
        .map((p) => p[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "DH";

  // Capsule rail icon mapper
  const getNavIcon = (key: string, isActive: boolean) => {
    if (key === "overview") {
      return (
        <svg
          viewBox="0 0 24 24"
          className={`w-5 h-5 transition-transform ${
            isActive ? "text-[#0D9488] fill-[#0D9488]" : "text-slate-600"
          }`}
          fill={isActive ? "currentColor" : "none"}
          stroke={isActive ? "none" : "currentColor"}
          strokeWidth={1.8}
        >
          <path d="M4 10.5L12 4L20 10.5V19C20 19.5523 19.5523 20 19 20H15V14H9V20H5C4.44772 20 4 19.5523 4 19V10.5Z" />
        </svg>
      );
    }
    if (key === "patients") return <Gauge size={20} strokeWidth={1.75} />;
    if (key === "tests") return <Flag size={20} strokeWidth={1.75} />;
    if (key === "bookings") return <CalendarDays size={20} strokeWidth={1.75} />;
    if (key === "content") return <PanelsTopLeft size={20} strokeWidth={1.75} />;
    if (key === "team") return <ShieldCheck size={20} strokeWidth={1.75} />;
    return <Activity size={20} strokeWidth={1.75} />;
  };

  return (
    <div className="min-h-screen w-full bg-[#F7F9FC] text-[#1A365D] font-sans antialiased overflow-x-clip">
      {/* Mobile Backdrop Scrim */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => onMobileOpenChange(false)}
          aria-hidden="true"
        />
      )}

      {/* Floating 3-Capsule Sidebar Rail (Matching Image Layout + Dr. Hair App Colors) */}
      <aside
        id="admin-navigation"
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col items-center justify-between py-5 px-3 w-[84px] bg-[#F7F9FC] transition-transform duration-300 ease-out select-none ${
          mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0"
        }`}
        aria-label="Main navigation"
      >
        {/* Brand / Logo Top */}
        <div className="flex flex-col items-center gap-1 pt-1">
          <div className="w-9 h-9 rounded-full bg-[#1A365D] text-white flex items-center justify-center shadow-sm">
            <span className="font-extrabold text-xs tracking-tighter text-[#0D9488]">DR</span>
          </div>
          <span className="font-bold text-[12px] tracking-tight text-[#1A365D]">
            Dr.hair
          </span>
        </div>

        {/* Capsule 1: Main Navigation (Top Floating White Pill) */}
        <nav
          className="bg-white rounded-[34px] p-2 shadow-sm border border-slate-200/80 flex flex-col items-center gap-2"
          aria-label="Workspace tabs"
        >
          {nav.map((item) => {
            const isActive = page === item.key;
            return (
              <button
                key={item.key}
                type="button"
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
                title={item.label}
                onClick={() => {
                  onPageChange(item.key);
                  onMobileOpenChange(false);
                }}
                className={`group relative w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 ${
                  isActive
                    ? "bg-[#1A365D] text-white shadow-md scale-105"
                    : "text-slate-600 hover:text-[#1A365D] hover:bg-slate-100"
                }`}
              >
                {getNavIcon(item.key, isActive)}
                {/* Count badge */}
                {Boolean(item.count) && !isActive && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-[#0D9488] text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white">
                    {item.count}
                  </span>
                )}
                {/* Clean hover tooltip */}
                <span className="absolute left-[calc(100%+12px)] px-2.5 py-1 rounded-lg bg-[#1A365D] text-white text-xs font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-lg z-50">
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Capsule 2: Utilities (Middle Floating White Pill) */}
        <div
          className="bg-white rounded-[34px] p-2 shadow-sm border border-slate-200/80 flex flex-col items-center gap-2"
        >
          {/* Notifications Button with App Teal Dot */}
          <button
            type="button"
            aria-label="Notifications"
            title="Notifications"
            onClick={() => onToast("You’re all caught up with clinic updates.")}
            className="group relative w-11 h-11 rounded-full flex items-center justify-center text-slate-600 hover:text-[#1A365D] hover:bg-slate-100 transition-all duration-200"
          >
            <Bell size={19} strokeWidth={1.75} />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[#0D9488] ring-2 ring-white" />
            <span className="absolute left-[calc(100%+12px)] px-2.5 py-1 rounded-lg bg-[#1A365D] text-white text-xs font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-lg z-50">
              Notifications
            </span>
          </button>

          {/* Settings Button */}
          <button
            type="button"
            aria-label="Settings"
            title="Settings & Preferences"
            onClick={() => setSettingsOpen(true)}
            className="group relative w-11 h-11 rounded-full flex items-center justify-center text-slate-600 hover:text-[#1A365D] hover:bg-slate-100 transition-all duration-200"
          >
            <Settings size={19} strokeWidth={1.75} />
            <span className="absolute left-[calc(100%+12px)] px-2.5 py-1 rounded-lg bg-[#1A365D] text-white text-xs font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-lg z-50">
              Settings
            </span>
          </button>
        </div>

        {/* Capsule 3: Sign Out & Profile (Bottom Floating White Pill) */}
        <div
          className="bg-white rounded-[34px] p-2 shadow-sm border border-slate-200/80 flex flex-col items-center gap-2"
        >
          {/* Logout Button */}
          <button
            type="button"
            aria-label="Sign out"
            title="Sign out"
            onClick={onSignOut}
            className="group relative w-11 h-11 rounded-full flex items-center justify-center text-slate-600 hover:text-red-600 hover:bg-red-50 transition-all duration-200"
          >
            <LogOut size={18} strokeWidth={1.75} />
            <span className="absolute left-[calc(100%+12px)] px-2.5 py-1 rounded-lg bg-[#1A365D] text-white text-xs font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-lg z-50">
              Sign out
            </span>
          </button>

          {/* User Profile Avatar */}
          <div
            title={`${userName} · ${role === "super-admin" ? "Super Admin" : "Admin"}`}
            onClick={() => setSettingsOpen(true)}
            className="w-10 h-10 rounded-full bg-[#1A365D] text-white font-bold text-xs flex items-center justify-center border-2 border-white shadow-sm cursor-pointer hover:ring-2 hover:ring-[#0D9488] transition-all"
          >
            {initials}
          </div>
        </div>
      </aside>

      {/* Main Column */}
      <div className="min-h-screen min-w-0 lg:ml-[88px] flex flex-col">
        {/* Top Header Bar matching reference image structure */}
        <header className="sticky top-0 z-30 bg-[#F7F9FC]/90 backdrop-blur-md px-4 sm:px-8 py-4 flex items-center justify-between gap-4 border-b border-slate-200/60">
          {/* Left Greeting */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              className="lg:hidden w-10 h-10 rounded-xl bg-white shadow-sm border border-slate-200 flex items-center justify-center text-slate-700"
              onClick={() => onMobileOpenChange(!mobileOpen)}
              aria-label="Toggle navigation"
            >
              <Menu size={18} />
            </button>

            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1A365D] leading-tight">
                Hi, {firstName}!
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Let&apos;s take a look at your clinic activity today
              </p>
            </div>
          </div>

          {/* Right Header Actions: Search Pill + Action Button */}
          <div className="flex items-center gap-3">
            {/* Search Pill */}
            <div className="hidden sm:flex items-center gap-2.5 bg-white rounded-full px-4 py-2 shadow-sm border border-slate-200/80 w-52 md:w-64 focus-within:w-72 focus-within:ring-2 focus-within:ring-[#1A365D] transition-all">
              <Search size={14} className="text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Search patient data..."
                value={globalSearch}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full bg-transparent border-0 outline-none text-xs text-slate-800 placeholder:text-slate-400"
              />
            </div>

            {/* Action Button */}
            <button
              type="button"
              onClick={() => {
                if (page !== "patients") onPageChange("patients");
                onToast("Opening patient records");
              }}
              className="rounded-full bg-[#1A365D] text-white px-5 sm:px-6 py-2.5 text-xs sm:text-sm font-semibold hover:bg-[#152c4d] transition-all shadow-sm active:scale-95"
            >
              Patient Care
            </button>

            {/* Role Switch for owner preview */}
            {isOwner && (
              <div className="hidden xl:flex items-center gap-1.5 bg-white rounded-full px-3 py-1.5 border border-slate-200 text-xs font-semibold text-slate-700 shadow-sm">
                <span className="text-slate-400">Role:</span>
                <select
                  value={role}
                  onChange={(e) => onRoleChange(e.target.value as Role)}
                  className="bg-transparent border-0 outline-none font-bold text-[#1A365D] cursor-pointer"
                >
                  <option value="super-admin">Super Admin</option>
                  <option value="admin">Clinician</option>
                </select>
              </div>
            )}
          </div>
        </header>

        {/* Children Page Content */}
        <main className="flex-1 px-4 sm:px-8 py-6 max-w-[1460px] w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Settings Modal */}
      {settingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-[28px] max-w-md w-full p-6 shadow-2xl border border-slate-100 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-[#1A365D]">
                  <Settings size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#1A365D]">Dr. Hair Workspace</h3>
                  <p className="text-xs text-slate-500">Session preferences & status</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSettingsOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 hover:text-black flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 py-1 text-xs text-slate-600">
              <div className="p-3.5 rounded-2xl bg-slate-50 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-[#1A365D]">{userName}</div>
                  <div className="text-slate-500 text-[11px]">
                    {role === "super-admin" ? "Super Admin" : "Clinical Admin"}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onSignOut}
                  className="px-3 py-1.5 rounded-full bg-red-50 text-red-600 font-semibold text-[11px] hover:bg-red-100"
                >
                  Sign out
                </button>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-[#1A365D]">Backend API Endpoint</div>
                  <div className="text-slate-500 text-[10px] truncate max-w-[220px]">
                    https://backend-ten-kappa-69.vercel.app
                  </div>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" title="Connected" />
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSettingsOpen(false)}
              className="w-full py-2.5 rounded-full bg-[#1A365D] text-white font-semibold text-xs hover:bg-[#152c4d] transition-all"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function getPageLabel(page: PageKey) {
  return pageLabels[page];
}
