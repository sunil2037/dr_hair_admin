"use client";

import {
  Activity, Bell, CalendarDays, ChevronDown, ChevronLeft, ChevronUp, Flag,
  Gauge, LayoutDashboard, LogOut, Package, PanelsTopLeft, Search, Settings,
  ShieldCheck, ShoppingBag, X,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { HeaderSearch } from "./header-search";
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
  showSearch?: boolean;
  headerTitle?: string;
  headerSubtitle?: string;
  onHeaderBack?: () => void;
  previewAdminId?: string;
  adminOptions?: { id: string; name: string; role: string; status: string }[];
  children: React.ReactNode;
  onRoleChange: (role: Role) => void;
  onAdminPreviewChange?: (id: string) => void;
  onPageChange: (page: PageKey) => void;
  onSearchChange: (value: string) => void;
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
  showSearch = true,
  headerTitle,
  headerSubtitle,
  onHeaderBack,
  children,
  onRoleChange,
  onPageChange,
  onSearchChange,
  onSignOut,
}: AdminShellProps) {
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);

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
  const mobileNavRef = useRef<HTMLDivElement>(null);

  const nav = visibleNavigation(role, panelAccess, permissions);
  const preferredMobileKeys: PageKey[] = ["overview", "patients", "bookings", "tests"];
  const mobilePrimaryNav = [
    ...preferredMobileKeys.map((key) => nav.find((item) => item.key === key)).filter((item) => item !== undefined),
    ...nav.filter((item) => !preferredMobileKeys.includes(item.key)),
  ].slice(0, 3);
  const primaryMobileKeys = mobilePrimaryNav.map((item) => item.key);
  const mobileMoreNav = nav.filter((item) => !primaryMobileKeys.includes(item.key));

  // Close menus on outside click or escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setNotificationsOpen(false);
        setProfileMenuOpen(false);
        setMobileMoreOpen(false);
        setSettingsModalOpen(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
      if (mobileNavRef.current && !mobileNavRef.current.contains(e.target as Node)) {
        setMobileMoreOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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

  const defaultPageHeaders: Record<PageKey, { title: string; subtitle: string }> = {
    overview: {
      title: "Hi, " + greetingName + "!",
      subtitle: "Let's take a look at your clinic activity today",
    },
    patients: {
      title: "Patients & Assessments",
      subtitle: "Scalp diagnostics, consultation history, and patient registry",
    },
    catalog: {
      title: "Commerce & Products",
      subtitle: "Manage medical hair catalog, pricing, SKUs, and inventory levels",
    },
    orders: {
      title: "Orders & Fulfillment",
      subtitle: "Track patient product purchases, prescription kits, and deliveries",
    },
    tests: {
      title: "Hair Tests & Diagnostics",
      subtitle: "Review AI scalp test submissions, image captures, and trichology reports",
    },
    bookings: {
      title: "Appointments & Consultations",
      subtitle: "Schedule, reassign, and track clinic consultations and doctor OPD visits",
    },
    content: {
      title: "App Management & CMS",
      subtitle: "Mobile app banners, clinic stories, home promotions, and content feeds",
    },
    team: {
      title: "Admin Team & Access",
      subtitle: "Manage clinic staff accounts, feature permissions, and role security",
    },
    activity: {
      title: "Audit Log & Security",
      subtitle: "System audit trail, security events, and administrative actions",
    },
    notifications: {
      title: "Clinic Alerts & Notifications",
      subtitle: "Live clinical notifications, emergency consults, and system alerts",
    },
  };

  const pageHeader = defaultPageHeaders[page] || {
    title: pageLabels[page] || "Dr. Hair Clinic",
    subtitle: "Clinic administrative workspace",
  };
  const activeTitle = headerTitle || pageHeader.title;
  const activeSubtitle = headerSubtitle || pageHeader.subtitle;

  // Navigation icon mapper
  const getNavIcon = (key: string, isActive: boolean) => {
    if (key === "overview") {
      return (
        <svg
          viewBox="0 0 24 24"
          className={`w-5 h-5 transition-transform ${isActive ? "text-[#0D9488] fill-[#0D9488]" : "text-slate-600 group-hover:text-[#1A365D]"
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
      {/* Floating desktop rail: grouped icon capsules with a transparent outer rail. */}
      <aside
        id="admin-navigation"
        className="fixed inset-y-0 left-3 z-40 hidden w-[68px] flex-col items-center justify-between py-5 select-none md:flex lg:left-5"
        aria-label="Main navigation"
      >
        <div className="flex h-11 w-11 items-center justify-center">
          <Image src="/logo-badge.png" alt="Dr. Hair" width={40} height={40} priority className="h-10 w-10 rounded-full object-cover" />
        </div>

        <nav className="flex max-h-[calc(100vh-220px)] w-fit flex-col items-center gap-1 overflow-y-auto rounded-full bg-white/95 p-1.5 shadow-[0_2px_10px_rgba(26,54,93,0.09)] [scrollbar-width:none]" aria-label="Workspace tabs">
          {nav.map((item) => {
            const isActive = page === item.key;
            return (
              <button
                key={item.key}
                type="button"
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
                title={item.label}
                onClick={() => onPageChange(item.key)}
                className={[
                  "group relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors duration-150",
                  isActive ? "bg-[#F5F8FB] text-[#0D9488]" : "bg-transparent text-slate-600 hover:bg-transparent hover:text-[#1A365D]",
                ].join(" ")}
              >
                {getNavIcon(item.key, isActive)}
                {Boolean(item.count) && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[#0D9488] ring-2 ring-white" />}
                <span className="pointer-events-none absolute left-[calc(100%+12px)] z-50 whitespace-nowrap rounded-lg bg-[#1A365D] px-2.5 py-1 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        <div className="rounded-full bg-white/95 p-1.5 shadow-[0_2px_10px_rgba(26,54,93,0.09)]">
          <button type="button" aria-label="Settings" title="Settings" onClick={() => setSettingsModalOpen(true)} className="group relative flex h-11 w-11 items-center justify-center rounded-full bg-transparent text-slate-600 transition-colors hover:bg-transparent hover:text-[#1A365D]">
            <Settings size={19} strokeWidth={1.75} />
            <span className="pointer-events-none absolute left-[calc(100%+12px)] z-50 whitespace-nowrap rounded-lg bg-[#1A365D] px-2.5 py-1 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">Settings</span>
          </button>
        </div>

        <div ref={profileRef} className="relative flex flex-col items-center gap-1 rounded-full bg-white/95 p-1.5 shadow-[0_2px_10px_rgba(26,54,93,0.09)]">
          <button type="button" aria-label={"Profile: " + userName} title={userName} onClick={() => setProfileMenuOpen(!profileMenuOpen)} className="group flex h-11 w-11 items-center justify-center rounded-full bg-transparent">
            <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-[#1A365D] text-xs font-bold text-white shadow-sm transition-shadow group-hover:ring-2 group-hover:ring-[#0D9488]">{initials}</span>
          </button>
          <button type="button" aria-label="Sign out" title="Sign out" onClick={onSignOut} className="group flex h-10 w-11 items-center justify-center rounded-full bg-transparent text-slate-500 transition-colors hover:bg-transparent hover:text-red-600">
            <LogOut size={18} strokeWidth={1.75} />
          </button>

          {profileMenuOpen && (
            <div className="absolute bottom-0 left-[calc(100%+12px)] z-50 w-64 space-y-3 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xl animate-in fade-in slide-in-from-left-2 duration-200">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1A365D] text-sm font-bold text-white shadow-sm">{initials}</div>
                <div className="min-w-0"><h4 className="truncate text-xs font-bold text-[#1A365D]">{userName}</h4><p className="text-[10px] capitalize text-slate-400">{role.replace("-", " ")}</p></div>
              </div>
              {isOwner && <div className="space-y-1"><label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Preview Role</label><select value={role} onChange={(event) => { onRoleChange(event.target.value as Role); setProfileMenuOpen(false); }} className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs font-bold text-[#1A365D] outline-none"><option value="super-admin">Super Admin</option><option value="admin">Clinician</option></select></div>}
              <div className="space-y-1 border-t border-slate-100 pt-2">
                <button type="button" onClick={() => { setSettingsModalOpen(true); setProfileMenuOpen(false); }} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50"><Settings size={15} />Workspace Settings</button>
                <button type="button" onClick={onSignOut} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-red-600 hover:bg-red-50"><LogOut size={15} />Sign Out</button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main workspace and responsive app bar. */}
      <div className="min-h-screen min-w-0 flex flex-col md:ml-[92px] lg:ml-[108px]">
        <header className={[
          "sticky top-0 z-30 px-4 py-3 transition-[background-color,backdrop-filter] duration-200 sm:px-6 lg:px-8",
          headerScrolled ? "bg-[#F7F9FC]/80 backdrop-blur-xl" : "bg-[#F7F9FC]",
        ].join(" ")}>
          <div className="mx-auto flex w-full max-w-[1560px] 2xl:max-w-[1680px] items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              {onHeaderBack && <button type="button" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#1A365D]" onClick={onHeaderBack} aria-label="Go back"><ChevronLeft size={18} /></button>}
              <div className="min-w-0">
                <h1 className="text-lg font-bold leading-tight tracking-tight text-[#1A365D] sm:text-2xl">{activeTitle}</h1>
                <p className="truncate text-xs font-medium text-slate-500 sm:text-sm">{activeSubtitle}</p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              {showSearch && (
                <HeaderSearch
                  page={page}
                  globalSearch={globalSearch}
                  onSearchChange={onSearchChange}
                  onNavigate={onPageChange}
                />
              )}

              <div ref={notificationsRef} className="relative">
                <button type="button" aria-label={"Notifications" + (unreadCount ? ", " + unreadCount + " unread" : "")} title="Notifications" onClick={() => setNotificationsOpen(!notificationsOpen)} className={[
                  "relative flex h-10 w-10 items-center justify-center rounded-full transition-colors",
                  notificationsOpen || page === "notifications" ? "text-[#0D9488]" : "text-slate-600 hover:text-[#1A365D]",
                ].join(" ")}>
                  <Bell size={19} strokeWidth={1.8} />
                  {unreadCount > 0 && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#0D9488] ring-2 ring-[#F7F9FC]" />}
                </button>

                {notificationsOpen && <div className="absolute right-0 top-[calc(100%+10px)] z-50 w-[min(340px,calc(100vw-24px))] rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2"><h3 className="text-sm font-bold text-[#1A365D]">Clinic Alerts</h3>{unreadCount > 0 && <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-bold text-[#0D9488]">{unreadCount} new</span>}</div>
                    {unreadCount > 0 && <button type="button" onClick={markAllRead} className="text-[11px] font-semibold text-[#0D9488] hover:underline">Mark all read</button>}
                  </div>
                  <div className="max-h-64 divide-y divide-slate-100 overflow-y-auto py-1">
                    {notifications.map((notification) => <button key={notification.id} type="button" onClick={() => { if (notification.page) onPageChange(notification.page); setNotificationsOpen(false); }} className="w-full space-y-1 rounded-xl px-1.5 py-2.5 text-left hover:bg-slate-50">
                      <span className="flex items-start justify-between gap-2"><span className="text-xs font-medium leading-snug text-slate-800">{notification.title}</span>{!notification.read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#0D9488]" />}</span>
                      <span className="block text-[10px] font-semibold text-slate-400">{notification.time}</span>
                    </button>)}
                  </div>
                  <div className="border-t border-slate-100 pt-2"><button type="button" onClick={() => { onPageChange("notifications"); setNotificationsOpen(false); }} className="block w-full py-1.5 text-center text-xs font-bold text-[#1A365D] hover:text-[#0D9488]">View all notifications →</button></div>
                </div>}
              </div>
            </div>
          </div>
        </header>

        <main className="w-full min-w-0 flex-1 px-4 py-5 pb-28 sm:px-6 lg:px-8 md:pb-8">
          <div className="mx-auto w-full max-w-[1560px] 2xl:max-w-[1680px] min-w-0">
            {children}
          </div>
        </main>
      </div>

      {/* Rounded floating mobile dock. More sections expand upward without a sheet or backdrop. */}
      <div ref={mobileNavRef} className="fixed bottom-[calc(env(safe-area-inset-bottom)+12px)] left-1/2 z-40 w-[min(360px,calc(100vw-28px))] -translate-x-1/2 md:hidden">
        {mobileMoreOpen && mobileMoreNav.length > 0 && <nav aria-label="More admin sections" className="absolute bottom-[calc(100%+10px)] right-0 grid w-[min(340px,calc(100vw-28px))] grid-cols-4 justify-items-center gap-1.5 rounded-[28px] bg-white/95 p-3 shadow-[0_8px_32px_rgba(26,54,93,0.16)] animate-in fade-in slide-in-from-bottom-2 duration-200">
          {mobileMoreNav.map((item) => {
            const isActive = page === item.key;
            return <button key={item.key} type="button" aria-label={item.label} title={item.label} aria-current={isActive ? "page" : undefined} onClick={() => { onPageChange(item.key); setMobileMoreOpen(false); }} className={[
              "flex flex-col items-center justify-center p-2 rounded-2xl transition-colors gap-1 text-center w-full",
              isActive ? "text-[#0D9488] bg-teal-50/80 font-bold" : "text-slate-500 hover:text-[#1A365D] hover:bg-slate-50",
            ].join(" ")}>
              {getNavIcon(item.key, isActive)}
              <span className="text-[10px] leading-tight line-clamp-1 max-w-[56px] truncate">{item.label.split(" ")[0]}</span>
            </button>;
          })}
        </nav>}

        <nav aria-label="Primary mobile navigation" className="flex items-center justify-around gap-1 rounded-full border border-slate-200/80 bg-white/95 p-2 shadow-[0_4px_22px_rgba(26,54,93,0.14)] backdrop-blur-xl">
          {mobilePrimaryNav.map((item) => {
            const isActive = page === item.key;
            return <button key={item.key} type="button" aria-label={item.label} title={item.label} aria-current={isActive ? "page" : undefined} onClick={() => onPageChange(item.key)} className={[
              "flex h-11 w-11 items-center justify-center rounded-full bg-transparent transition-colors",
              isActive ? "text-[#0D9488]" : "text-slate-500 hover:text-[#1A365D]",
            ].join(" ")}>{getNavIcon(item.key, isActive)}</button>;
          })}
          {mobileMoreNav.length > 0 && <button type="button" aria-label={mobileMoreOpen ? "Hide more navigation" : "Show more navigation"} aria-expanded={mobileMoreOpen} onClick={() => setMobileMoreOpen((open) => !open)} className={[
            "flex h-11 w-11 items-center justify-center rounded-full bg-transparent transition-colors",
            mobileMoreOpen ? "text-[#0D9488]" : "text-slate-500 hover:text-[#1A365D]",
          ].join(" ")}>{mobileMoreOpen ? <ChevronDown size={20} /> : <ChevronUp size={20} />}</button>}
        </nav>
      </div>

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

              <div className="p-3.5 rounded-2xl bg-slate-50 space-y-2">
                <div className="text-[11px] font-bold text-[#1A365D]">Google Play &amp; App Store Links</div>
                <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                  <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-[#0D9488] hover:underline font-semibold flex items-center gap-1">
                    Privacy Policy ↗
                  </a>
                  <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-[#0D9488] hover:underline font-semibold flex items-center gap-1">
                    Terms &amp; Conditions ↗
                  </a>
                  <a href="/delete-account" target="_blank" rel="noopener noreferrer" className="text-[#0D9488] hover:underline font-semibold flex items-center gap-1">
                    Delete Account ↗
                  </a>
                  <a href="/support" target="_blank" rel="noopener noreferrer" className="text-[#0D9488] hover:underline font-semibold flex items-center gap-1">
                    Support &amp; Contact ↗
                  </a>
                </div>
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
