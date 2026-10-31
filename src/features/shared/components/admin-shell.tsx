"use client";

import {
  Activity, Bell, CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight,
  ChevronUp, CircleHelp, ExternalLink, FileCheck2, Flag, Gauge, LayoutDashboard,
  LogOut, Menu, MoreHorizontal, Package, PanelsTopLeft, Search, Settings,
  ShieldCheck, ShoppingBag, UsersRound, X, type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
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
  notifications: "Notifications",
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
  onSignOut: () => void;
}

interface NotificationItem {
  id: string;
  title: string;
  time: string;
  read: boolean;
  page?: PageKey;
  type: "assessment" | "booking" | "report" | "system";
}

const sampleNotifications: NotificationItem[] = [
  {
    id: "notif-1",
    title: "Sunil Sharma submitted a new hair test assessment",
    time: "5m ago",
    read: false,
    page: "tests",
    type: "assessment",
  },
  {
    id: "notif-2",
    title: "Upcoming OPD consultation: Priya Patel at 11:30 AM",
    time: "32m ago",
    read: false,
    page: "bookings",
    type: "booking",
  },
  {
    id: "notif-3",
    title: "Clinical report ready for review: Ref #HT-2026-0042",
    time: "2h ago",
    read: false,
    page: "tests",
    type: "report",
  },
  {
    id: "notif-4",
    title: "Dr. Jai Bansal completed a trichology case review",
    time: "Yesterday",
    read: true,
    page: "overview",
    type: "system",
  },
];

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
  onSignOut,
}: AdminShellProps) {
  // Desktop expand/collapse rail state
  const [isExpanded, setIsExpanded] = useState(false);

  // Mobile bottom sheet drawer expand state
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Dropdown states
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);

  // Notifications state
  const [notifications, setNotifications] = useState<NotificationItem[]>(sampleNotifications);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const [headerScrolled, setHeaderScrolled] = useState(false);

  const notificationsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const nav = visibleNavigation(role, panelAccess, permissions);

  // Close menus on outside click or escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setNotificationsOpen(false);
        setProfileMenuOpen(false);
        setMobileDrawerOpen(false);
        setSettingsModalOpen(false);
        onMobileOpenChange(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onMobileOpenChange]);

  // Header scroll shadow effect
  useEffect(() => {
    const onScroll = () => {
      setHeaderScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const firstName = userName ? userName.split(" ")[0] : "Admin";
  const greetingName = userName.includes("@") || firstName === "Dr." ? "Dr. Hair" : firstName;
  const initials = userName
    ? userName
        .split(/\s+/)
        .map((p) => p[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "DH";

  // Navigation icon mapper
  const getNavIcon = (key: string, isActive: boolean) => {
    if (key === "overview") {
      return (
        <svg
          viewBox="0 0 24 24"
          className={`w-5 h-5 transition-transform ${
            isActive ? "text-[#0D9488] fill-[#0D9488]" : "text-slate-600 group-hover:text-[#1A365D]"
          }`}
          fill={isActive ? "currentColor" : "none"}
          stroke={isActive ? "none" : "currentColor"}
          strokeWidth={1.8}
        >
          <path d="M4 10.5L12 4L20 10.5V19C20 19.5523 19.5523 20 19 20H15V14H9V20H5C4.44772 20 4 19.5523 4 19V10.5Z" />
        </svg>
      );
    }
    if (key === "patients") return <Gauge size={19} strokeWidth={1.75} />;
    if (key === "tests") return <Flag size={19} strokeWidth={1.75} />;
    if (key === "bookings") return <CalendarDays size={19} strokeWidth={1.75} />;
    if (key === "content") return <PanelsTopLeft size={19} strokeWidth={1.75} />;
    if (key === "catalog") return <ShoppingBag size={19} strokeWidth={1.75} />;
    if (key === "orders") return <Package size={19} strokeWidth={1.75} />;
    if (key === "team") return <ShieldCheck size={19} strokeWidth={1.75} />;
    if (key === "activity") return <Activity size={19} strokeWidth={1.75} />;
    return <LayoutDashboard size={19} strokeWidth={1.75} />;
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <div className="min-h-screen w-full bg-[#F7F9FC] text-[#1A365D] font-sans antialiased overflow-x-clip">
      {/* ==================================================================== */}
      {/* 1. DESKTOP & TABLET FLOATING 3-CAPULE SIDEBAR RAIL (md:flex)         */}
      {/* ==================================================================== */}
      <aside
        id="admin-navigation"
        className={`fixed top-0 bottom-0 left-0 z-40 hidden md:flex flex-col items-center justify-between py-5 px-3 bg-[#F7F9FC] transition-[width] duration-300 ease-out select-none ${
          isExpanded ? "w-[240px]" : "w-[84px]"
        }`}
        aria-label="Main navigation"
      >
        {/* Brand Top + Expand/Collapse Button */}
        <div className="w-full flex items-center justify-between px-1.5 pt-1">
          <div className="flex items-center gap-2.5">
            <Image
              src="/logo-badge.png"
              alt="Dr. Hair"
              width={40}
              height={40}
              priority
              className="h-10 w-10 rounded-full object-cover shadow-sm shrink-0"
            />
            {isExpanded && (
              <div className="overflow-hidden whitespace-nowrap animate-in fade-in duration-200">
                <span className="font-extrabold text-sm tracking-tight text-[#1A365D] block">
                  Dr. Hair
                </span>
                <span className="text-[10px] text-slate-500 font-semibold block">
                  Clinical Admin
                </span>
              </div>
            )}
          </div>

          {/* Desktop Rail Expand/Collapse Toggle Button */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? "Collapse Sidebar" : "Expand Sidebar (Show Labels)"}
            aria-label={isExpanded ? "Collapse Sidebar" : "Expand Sidebar"}
            className="w-7 h-7 rounded-full bg-white shadow-sm border border-slate-200/80 text-slate-500 hover:text-[#1A365D] hover:bg-slate-100 flex items-center justify-center transition-all ml-auto"
          >
            {isExpanded ? <ChevronLeft size={15} /> : <ChevronRight size={15} />}
          </button>
        </div>

        {/* Capsule 1: Main Navigation (Top Floating Pill) */}
        <nav
          className={`w-full bg-white shadow-sm border border-slate-200/80 flex flex-col gap-1.5 transition-all duration-300 ${
            isExpanded ? "rounded-[24px] p-2.5" : "rounded-[34px] p-2 items-center"
          }`}
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
                title={!isExpanded ? item.label : undefined}
                onClick={() => onPageChange(item.key)}
                className={`group relative flex items-center transition-all duration-200 ${
                  isExpanded
                    ? `w-full px-3 py-2.5 rounded-xl gap-3 text-xs font-bold ${
                        isActive
                          ? "bg-[#1A365D] text-white shadow-md"
                          : "text-slate-600 hover:text-[#1A365D] hover:bg-slate-100"
                      }`
                    : `w-11 h-11 rounded-full justify-center ${
                        isActive
                          ? "bg-[#1A365D] text-white shadow-md scale-105"
                          : "text-slate-600 hover:text-[#1A365D] hover:bg-slate-100"
                      }`
                }`}
              >
                {/* Active Indicator on Expanded Rail */}
                {isExpanded && isActive && (
                  <span className="w-1.5 h-4 rounded-full bg-[#0D9488] shrink-0" />
                )}

                <span className="shrink-0">{getNavIcon(item.key, isActive)}</span>

                {/* Text Label on Expanded Rail */}
                {isExpanded && (
                  <span className="truncate flex-1 text-left">{item.label}</span>
                )}

                {/* Count Badge */}
                {Boolean(item.count) && (
                  <span
                    className={`min-w-4 h-4 px-1 rounded-full text-[9px] font-bold flex items-center justify-center ${
                      isExpanded
                        ? isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
                        : "absolute -top-0.5 -right-0.5 bg-[#0D9488] text-white ring-2 ring-white"
                    }`}
                  >
                    {item.count}
                  </span>
                )}

                {/* Hover Tooltip on Collapsed Rail */}
                {!isExpanded && (
                  <span className="absolute left-[calc(100%+12px)] px-2.5 py-1 rounded-lg bg-[#1A365D] text-white text-xs font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-lg z-50">
                    {item.label}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Capsule 2: Utilities (Notifications & Settings) */}
        <div
          ref={notificationsRef}
          className={`w-full relative bg-white shadow-sm border border-slate-200/80 flex flex-col gap-1.5 transition-all duration-300 ${
            isExpanded ? "rounded-[24px] p-2.5" : "rounded-[34px] p-2 items-center"
          }`}
        >
          {/* Notifications Button with Teal Dot */}
          <button
            type="button"
            aria-label="Notifications"
            title={!isExpanded ? "Notifications" : undefined}
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className={`group relative flex items-center transition-all duration-200 ${
              isExpanded
                ? "w-full px-3 py-2.5 rounded-xl gap-3 text-xs font-bold text-slate-600 hover:text-[#1A365D] hover:bg-slate-100"
                : "w-11 h-11 rounded-full justify-center text-slate-600 hover:text-[#1A365D] hover:bg-slate-100"
            }`}
          >
            <div className="relative shrink-0">
              <Bell size={19} strokeWidth={1.75} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#0D9488] ring-2 ring-white" />
              )}
            </div>

            {isExpanded && (
              <>
                <span className="truncate flex-1 text-left">Notifications</span>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-[#0D9488] text-white text-[9px] font-bold">
                    {unreadCount}
                  </span>
                )}
              </>
            )}

            {!isExpanded && (
              <span className="absolute left-[calc(100%+12px)] px-2.5 py-1 rounded-lg bg-[#1A365D] text-white text-xs font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-lg z-50">
                Notifications ({unreadCount})
              </span>
            )}
          </button>

          {/* Desktop Notifications Flyout Popover */}
          {notificationsOpen && (
            <div className="absolute left-[calc(100%+12px)] bottom-0 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200/90 p-4 z-50 animate-in fade-in slide-in-from-left-2 duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-[#1A365D]">Clinic Alerts</h3>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-teal-50 text-[#0D9488] text-[10px] font-bold">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[11px] font-semibold text-[#0D9488] hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto py-1">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => {
                      if (n.page) onPageChange(n.page);
                      setNotificationsOpen(false);
                    }}
                    className="py-2.5 px-1.5 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors space-y-1"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs text-slate-800 font-medium leading-snug">
                        {n.title}
                      </p>
                      {!n.read && (
                        <span className="w-2 h-2 rounded-full bg-[#0D9488] shrink-0 mt-1" />
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-semibold">{n.time}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-100">
                <button
                  onClick={() => {
                    onPageChange("notifications");
                    setNotificationsOpen(false);
                  }}
                  className="w-full py-1.5 text-center text-xs font-bold text-[#1A365D] hover:text-[#0D9488] block"
                >
                  View all activity →
                </button>
              </div>
            </div>
          )}

          {/* Settings Button */}
          <button
            type="button"
            aria-label="Settings"
            title={!isExpanded ? "Settings & Preferences" : undefined}
            onClick={() => setSettingsModalOpen(true)}
            className={`group relative flex items-center transition-all duration-200 ${
              isExpanded
                ? "w-full px-3 py-2.5 rounded-xl gap-3 text-xs font-bold text-slate-600 hover:text-[#1A365D] hover:bg-slate-100"
                : "w-11 h-11 rounded-full justify-center text-slate-600 hover:text-[#1A365D] hover:bg-slate-100"
            }`}
          >
            <Settings size={19} strokeWidth={1.75} className="shrink-0" />
            {isExpanded && <span className="truncate flex-1 text-left">Settings</span>}

            {!isExpanded && (
              <span className="absolute left-[calc(100%+12px)] px-2.5 py-1 rounded-lg bg-[#1A365D] text-white text-xs font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-lg z-50">
                Settings
              </span>
            )}
          </button>
        </div>

        {/* Capsule 3: Sign Out & Profile (Bottom Floating Pill) */}
        <div
          ref={profileRef}
          className={`w-full relative bg-white shadow-sm border border-slate-200/80 flex flex-col gap-1.5 transition-all duration-300 ${
            isExpanded ? "rounded-[24px] p-2.5" : "rounded-[34px] p-2 items-center"
          }`}
        >
          {/* User Profile Avatar / Trigger */}
          <button
            type="button"
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            className={`group relative flex items-center transition-all duration-200 ${
              isExpanded
                ? "w-full p-1.5 rounded-xl gap-3 hover:bg-slate-50"
                : "w-11 h-11 rounded-full justify-center"
            }`}
          >
            <div className="w-9 h-9 rounded-full bg-[#1A365D] text-white font-bold text-xs flex items-center justify-center border-2 border-white shadow-sm hover:ring-2 hover:ring-[#0D9488] shrink-0">
              {initials}
            </div>

            {isExpanded && (
              <div className="min-w-0 text-left flex-1">
                <div className="text-xs font-bold text-[#1A365D] truncate">{userName}</div>
                <div className="text-[10px] text-slate-500 font-medium truncate capitalize">
                  {role.replace("-", " ")}
                </div>
              </div>
            )}

            {!isExpanded && (
              <span className="absolute left-[calc(100%+12px)] px-2.5 py-1 rounded-lg bg-[#1A365D] text-white text-xs font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-lg z-50">
                Profile ({userName})
              </span>
            )}
          </button>

          {/* Desktop Profile Dropdown Popover */}
          {profileMenuOpen && (
            <div className="absolute left-[calc(100%+12px)] bottom-0 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200/90 p-4 z-50 animate-in fade-in slide-in-from-left-2 duration-200 space-y-3">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-10 h-10 rounded-full bg-[#1A365D] text-white font-bold text-sm flex items-center justify-center shadow-sm">
                  {initials}
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-[#1A365D] truncate">{userName}</h4>
                  <p className="text-[10px] text-slate-400 capitalize">{role.replace("-", " ")}</p>
                </div>
              </div>

              {isOwner && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Preview Role
                  </label>
                  <select
                    value={role}
                    onChange={(e) => {
                      onRoleChange(e.target.value as Role);
                      setProfileMenuOpen(false);
                    }}
                    className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg p-2 text-[#1A365D] outline-none"
                  >
                    <option value="super-admin">Super Admin</option>
                    <option value="admin">Clinician</option>
                  </select>
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 space-y-1">
                <button
                  onClick={() => {
                    setSettingsModalOpen(true);
                    setProfileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 text-left"
                >
                  <Settings size={15} />
                  Workspace Settings
                </button>
                <button
                  onClick={onSignOut}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 text-left"
                >
                  <LogOut size={15} />
                  Sign Out
                </button>
              </div>
            </div>
          )}

          {/* Quick Logout Button */}
          <button
            type="button"
            aria-label="Sign out"
            title={!isExpanded ? "Sign out" : undefined}
            onClick={onSignOut}
            className={`group relative flex items-center transition-all duration-200 ${
              isExpanded
                ? "w-full px-3 py-2 rounded-xl gap-3 text-xs font-bold text-slate-500 hover:text-red-600 hover:bg-red-50"
                : "w-11 h-11 rounded-full justify-center text-slate-500 hover:text-red-600 hover:bg-red-50"
            }`}
          >
            <LogOut size={18} strokeWidth={1.75} className="shrink-0" />
            {isExpanded && <span className="truncate flex-1 text-left">Sign Out</span>}

            {!isExpanded && (
              <span className="absolute left-[calc(100%+12px)] px-2.5 py-1 rounded-lg bg-[#1A365D] text-white text-xs font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-lg z-50">
                Sign out
              </span>
            )}
          </button>
        </div>
      </aside>

      {/* ==================================================================== */}
      {/* 2. MAIN COLUMN WITH DYNAMIC LEFT MARGIN & TOPBAR                     */}
      {/* ==================================================================== */}
      <div
        className={`min-h-screen min-w-0 flex flex-col transition-[margin] duration-300 ease-out ${
          isExpanded ? "md:ml-[240px]" : "md:ml-[88px]"
        }`}
      >
        {/* Top Header Bar */}
        <header
          className={`sticky top-0 z-30 px-4 sm:px-8 py-4 flex items-center justify-between gap-4 transition-[background-color,backdrop-filter] duration-200 ${
            headerScrolled ? "bg-[#F7F9FC]/80 backdrop-blur-xl border-b border-slate-200/60 shadow-sm" : "bg-[#F7F9FC]"
          }`}
        >
          {/* Left Greeting & Mobile Drawer Button */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              className="md:hidden w-10 h-10 rounded-xl bg-white shadow-sm border border-slate-200 flex items-center justify-center text-[#1A365D]"
              onClick={() => setMobileDrawerOpen(true)}
              aria-label="Open mobile menu"
            >
              <Menu size={18} />
            </button>

            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1A365D] leading-tight">
                Hi, {greetingName}!
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Let&apos;s take a look at your clinic activity today
              </p>
            </div>
          </div>

          {/* Right Header Search & Role */}
          <div className="flex items-center gap-3">
            {/* Search Pill */}
            <div className="hidden sm:flex items-center gap-2.5 bg-white rounded-full px-4 py-2 shadow-sm border border-slate-200/80 w-52 md:w-64 focus-within:w-72 focus-within:ring-2 focus-within:ring-[#1A365D] transition-all">
              <Search size={14} className="text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Search patient records..."
                value={globalSearch}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full bg-transparent border-0 outline-none text-xs text-slate-800 placeholder:text-slate-400"
              />
            </div>

            {/* Quick action button */}
            <button
              type="button"
              onClick={() => onPageChange("patients")}
              className="rounded-full bg-[#1A365D] text-white px-4 sm:px-6 py-2 text-xs sm:text-sm font-semibold hover:bg-[#152c4d] transition-all shadow-sm active:scale-95"
            >
              Patient Care
            </button>
          </div>
        </header>

        {/* Page Content View (Extra bottom padding on mobile so bottom nav never blocks content) */}
        <main className="flex-1 px-4 sm:px-8 py-6 pb-28 md:pb-8 max-w-[1460px] w-full mx-auto">
          {children}
        </main>
      </div>

      {/* ==================================================================== */}
      {/* 3. MOBILE ONLY FLOATING BOTTOM NAVIGATION BAR (md:hidden)            */}
      {/* Exactly 3 options + 1 expand arrow button on the right                */}
      {/* ==================================================================== */}
      <div
        className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-white/95 backdrop-blur-xl border-t border-slate-200/90 shadow-[0_-4px_25px_rgba(0,0,0,0.08)] px-4 py-2 flex items-center justify-between"
        aria-label="Mobile Bottom Navigation"
      >
        {/* Option 1: Overview / Home */}
        <button
          type="button"
          onClick={() => onPageChange("overview")}
          className={`flex flex-col items-center justify-center gap-1 flex-1 py-1 transition-all ${
            page === "overview" ? "text-[#1A365D]" : "text-slate-400 hover:text-slate-700"
          }`}
        >
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              page === "overview" ? "bg-[#1A365D] text-white shadow-md scale-105" : "hover:bg-slate-100"
            }`}
          >
            <LayoutDashboard size={19} />
          </div>
          <span className="text-[10px] font-bold">Home</span>
        </button>

        {/* Option 2: Tests & Reports */}
        <button
          type="button"
          onClick={() => onPageChange("tests")}
          className={`flex flex-col items-center justify-center gap-1 flex-1 py-1 transition-all ${
            page === "tests" ? "text-[#1A365D]" : "text-slate-400 hover:text-slate-700"
          }`}
        >
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              page === "tests" ? "bg-[#1A365D] text-white shadow-md scale-105" : "hover:bg-slate-100"
            }`}
          >
            <Flag size={19} />
          </div>
          <span className="text-[10px] font-bold">Tests</span>
        </button>

        {/* Option 3: OPD Bookings */}
        <button
          type="button"
          onClick={() => onPageChange("bookings")}
          className={`flex flex-col items-center justify-center gap-1 flex-1 py-1 transition-all ${
            page === "bookings" ? "text-[#1A365D]" : "text-slate-400 hover:text-slate-700"
          }`}
        >
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              page === "bookings" ? "bg-[#1A365D] text-white shadow-md scale-105" : "hover:bg-slate-100"
            }`}
          >
            <CalendarDays size={19} />
          </div>
          <span className="text-[10px] font-bold">OPD</span>
        </button>

        {/* Option 4: Right Expand Arrow Button (Tap expands upward to show all options) */}
        <button
          type="button"
          onClick={() => setMobileDrawerOpen(true)}
          className="flex flex-col items-center justify-center gap-1 flex-1 py-1 text-[#1A365D] hover:text-[#0D9488] transition-colors"
          aria-label="Expand all navigation options"
        >
          <div className="w-10 h-10 rounded-full bg-[#1A365D] text-white flex items-center justify-center shadow-md active:scale-95 transition-transform hover:bg-[#152c4d]">
            <ChevronUp size={20} strokeWidth={2.5} className="animate-pulse" />
          </div>
          <span className="text-[10px] font-extrabold text-[#1A365D]">Expand</span>
        </button>
      </div>

      {/* ==================================================================== */}
      {/* 4. EXPANDABLE BOTTOM SHEET DRAWER (Mobile Only - Slides Up on Arrow) */}
      {/* ==================================================================== */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end animate-in fade-in duration-200">
          {/* Backdrop Scrim */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setMobileDrawerOpen(false)}
            aria-hidden="true"
          />

          {/* Slide-Up Drawer Container */}
          <div className="relative z-10 w-full max-h-[85vh] bg-white rounded-t-[32px] p-6 shadow-2xl border-t border-slate-200/90 overflow-y-auto animate-in slide-in-from-bottom duration-300">
            {/* Top Drag Pill */}
            <div className="w-12 h-1.5 rounded-full bg-slate-300 mx-auto mb-4" />

            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <Image
                  src="/logo-badge.png"
                  alt="Dr. Hair"
                  width={38}
                  height={38}
                  className="rounded-full shadow-sm"
                />
                <div>
                  <h3 className="text-base font-extrabold text-[#1A365D]">Dr. Hair Clinic Portal</h3>
                  <p className="text-xs text-slate-500">All features & management</p>
                </div>
              </div>

              <button
                onClick={() => setMobileDrawerOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 hover:text-black flex items-center justify-center"
                aria-label="Close menu"
              >
                <ChevronDown size={18} />
              </button>
            </div>

            {/* Grid of ALL Navigation Features */}
            <div className="py-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3 block">
                Workspace Sections
              </span>
              <div className="grid grid-cols-2 gap-3">
                {nav.map((item) => {
                  const isActive = page === item.key;
                  return (
                    <button
                      key={item.key}
                      onClick={() => {
                        onPageChange(item.key);
                        setMobileDrawerOpen(false);
                      }}
                      className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                        isActive
                          ? "bg-[#1A365D] text-white border-[#1A365D] shadow-md"
                          : "bg-slate-50/80 border-slate-200/70 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <div className={`p-2 rounded-xl ${isActive ? "bg-white/20 text-white" : "bg-white text-[#1A365D] shadow-sm"}`}>
                        {getNavIcon(item.key, isActive)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold leading-snug truncate">{item.label}</div>
                        {item.count && (
                          <span className={`text-[10px] font-semibold ${isActive ? "text-teal-200" : "text-[#0D9488]"}`}>
                            {item.count} items
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Preferences & Staff Profile */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <div className="p-3.5 rounded-2xl bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#1A365D] text-white font-bold text-xs flex items-center justify-center shadow-sm">
                    {initials}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#1A365D]">{userName}</div>
                    <div className="text-[11px] text-slate-500 capitalize">{role.replace("-", " ")}</div>
                  </div>
                </div>

                <button
                  onClick={onSignOut}
                  className="px-3.5 py-1.5 rounded-xl bg-red-50 text-red-600 font-bold text-xs hover:bg-red-100"
                >
                  Sign Out
                </button>
              </div>

              <button
                onClick={() => {
                  setSettingsModalOpen(true);
                  setMobileDrawerOpen(false);
                }}
                className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 flex items-center justify-center gap-2"
              >
                <Settings size={15} />
                Workspace Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 5. WORKSPACE SETTINGS MODAL                                          */}
      {/* ==================================================================== */}
      {settingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-[28px] max-w-md w-full p-6 shadow-2xl border border-slate-100 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-[#1A365D]">
                  <Settings size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#1A365D]">Dr. Hair Workspace</h3>
                  <p className="text-xs text-slate-500">Session preferences & system status</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSettingsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 hover:text-black flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 py-1 text-xs text-slate-600">
              <div className="p-3.5 rounded-2xl bg-slate-50 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-[#1A365D]">{userName}</div>
                  <div className="text-slate-500 text-[11px] capitalize">
                    {role.replace("-", " ")}
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
              onClick={() => setSettingsModalOpen(false)}
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
