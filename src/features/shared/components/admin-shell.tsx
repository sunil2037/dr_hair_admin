"use client";

import {
  Activity, Bell, CalendarDays, ChevronLeft, Flag,
  Gauge, LayoutDashboard, LogOut, Package, PanelsTopLeft, Settings,
  ShieldCheck, ShoppingBag, X,
} from "lucide-react";
import Image from "next/image";
import { createPortal } from "react-dom";
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
  // Dropdown states
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [navTooltip, setNavTooltip] = useState<{ label: string; left: number; top: number } | null>(null);

  // Notifications state
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const [headerScrolled, setHeaderScrolled] = useState(false);

  const notificationsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const desktopProfileRef = useRef<HTMLDivElement>(null);

  const nav = visibleNavigation(role, panelAccess, permissions);
  // Close menus on outside click or escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setNotificationsOpen(false);
        setProfileMenuOpen(false);
        setSettingsModalOpen(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
      if (!profileRef.current?.contains(e.target as Node) && !desktopProfileRef.current?.contains(e.target as Node)) {
        setProfileMenuOpen(false);
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

  const showNavTooltip = (element: HTMLElement, label: string) => {
    const rect = element.getBoundingClientRect();
    setNavTooltip({ label, left: rect.right + 14, top: rect.top + rect.height / 2 });
  };

  return (
    <div className="min-h-screen w-full bg-[#F7F9FC] text-[#1A365D] font-sans antialiased overflow-x-clip">
      <aside id="admin-sidebar" className="fixed inset-y-0 left-3 z-40 hidden w-[68px] flex-col items-center justify-between py-5 lg:left-[clamp(12px,1.2vw,28px)] lg:flex" aria-label="Main navigation">
        <button type="button" onClick={() => onPageChange("overview")} aria-label="Dr. Hair: open overview" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white p-1 shadow-sm ring-1 ring-teal-100 transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-md motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600">
          <Image src="/logo-badge.png" alt="" width={44} height={44} priority className="h-10 w-10 rounded-full object-cover" />
        </button>
        <nav onScroll={() => setNavTooltip(null)} className="flex max-h-[calc(100vh-220px)] w-fit flex-col items-center gap-1.5 overflow-y-auto overscroll-contain rounded-full border border-slate-100/80 bg-white/95 p-1.5 shadow-[0_2px_12px_rgba(26,54,93,0.08)] backdrop-blur-md [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Workspace tabs">
          {nav.map((item) => {
            const isActive = page === item.key;
            return <button key={item.key} type="button" aria-label={item.label} aria-current={isActive ? "page" : undefined} onMouseEnter={(event) => showNavTooltip(event.currentTarget, item.label)} onMouseLeave={() => setNavTooltip(null)} onFocus={(event) => showNavTooltip(event.currentTarget, item.label)} onBlur={() => setNavTooltip(null)} onClick={() => { setNavTooltip(null); onPageChange(item.key); }} className={`relative flex h-11 w-11 items-center justify-center rounded-full transition-[background-color,color,transform] duration-200 ease-out motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 ${isActive ? "bg-teal-50 text-teal-700" : "text-slate-500 hover:translate-x-0.5 hover:bg-slate-50 hover:text-slate-900"}`}>
              {getNavIcon(item.key, isActive)}
              {Boolean(item.count) && <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-teal-600" />}
            </button>;
          })}
        </nav>
        <div className="rounded-full border border-slate-100 bg-white/95 p-1.5 shadow-sm">
          <button type="button" aria-label="Settings" title="Settings" onClick={() => setSettingsModalOpen(true)} className="flex h-11 w-11 items-center justify-center rounded-full text-slate-500 transition-colors duration-200 hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"><Settings size={19} /></button>
        </div>
        <div ref={desktopProfileRef} className="relative flex flex-col items-center gap-1.5 rounded-full border border-slate-100/80 bg-white/95 p-1.5 shadow-sm backdrop-blur-md">
          <button type="button" aria-label={`Profile: ${userName}`} title={userName} aria-expanded={profileMenuOpen} onClick={() => setProfileMenuOpen((open) => !open)} className="flex h-11 w-11 items-center justify-center rounded-full transition-transform duration-200 hover:scale-105 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1A365D] text-xs font-bold text-white shadow-sm">{initials}</span>
          </button>
          <button type="button" aria-label="Sign out" title="Sign out" onClick={onSignOut} className="flex h-10 w-11 items-center justify-center rounded-full text-slate-400 transition-colors duration-200 hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"><LogOut size={18} /></button>
          {profileMenuOpen && <div className="absolute bottom-0 left-[calc(100%+14px)] z-50 w-64 space-y-3 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xl animate-in fade-in slide-in-from-left-3 duration-200 motion-reduce:animate-none">
            <div className="border-b border-slate-100 pb-3"><h4 className="truncate text-xs font-bold text-[#1A365D]">{userName}</h4><p className="text-[10px] capitalize text-slate-400">{role.replace("-", " ")}</p></div>
            {isOwner && <div className="space-y-1"><label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Preview role</label><select value={role} onChange={(event) => { onRoleChange(event.target.value as Role); setProfileMenuOpen(false); }} className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs font-bold text-[#1A365D] outline-none"><option value="super-admin">Super Admin</option><option value="admin">Clinician</option></select></div>}
            <div className="space-y-1 border-t border-slate-100 pt-2"><button type="button" onClick={() => { setSettingsModalOpen(true); setProfileMenuOpen(false); }} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50"><Settings size={15} />Workspace settings</button><button type="button" onClick={onSignOut} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-red-600 hover:bg-red-50"><LogOut size={15} />Sign out</button></div>
          </div>}
        </div>
      </aside>
      {/* Main workspace and responsive app bar. */}
      <div className="min-h-screen min-w-0 flex flex-col lg:ml-[clamp(92px,5.6vw,124px)]">
        <header className={[
          "sticky top-0 z-30 px-4 py-3 transition-[background-color,backdrop-filter] duration-200 sm:px-6 lg:px-8 xl:px-10 border-b border-slate-200/50",
          headerScrolled ? "bg-[#F7F9FC]/85 backdrop-blur-xl shadow-2xs" : "bg-[#F7F9FC]",
        ].join(" ")}>
          <div className="flex w-full max-w-[1560px] mx-auto items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white p-0.5 shadow-sm ring-1 ring-teal-100 lg:hidden" aria-hidden="true">
                <Image src="/logo-badge.png" alt="" width={36} height={36} priority className="h-9 w-9 rounded-full object-cover" />
              </span>
              {onHeaderBack && (
                <button
                  type="button"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#1A365D] border border-slate-200/80 shadow-2xs hover:bg-slate-50 transition-colors"
                  onClick={onHeaderBack}
                  aria-label="Go back"
                >
                  <ChevronLeft size={18} />
                </button>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  {page === "overview"
                    ? <h1 className="text-lg font-bold leading-tight tracking-tight text-[#1A365D] sm:text-2xl">{activeTitle}</h1>
                    : <span className="text-lg font-bold leading-tight tracking-tight text-[#1A365D] sm:text-2xl">Dr. Hair</span>}
                  <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white text-[11px] font-semibold text-slate-600 border border-slate-200/80 shadow-2xs">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#0D9488]" />
                    {new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" }).format(new Date())}
                  </span>
                </div>
                <p className="truncate text-xs font-medium text-slate-500 sm:text-sm">{page === "overview" ? activeSubtitle : "Clinic admin"}</p>
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
                  "relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200/80 bg-white transition-colors shadow-2xs",
                  notificationsOpen || page === "notifications" ? "text-[#0D9488] border-[#0D9488]/40" : "text-slate-600 hover:text-[#1A365D] hover:bg-slate-50",
                ].join(" ")}>
                  <Bell size={18} strokeWidth={1.8} />
                  {unreadCount > 0 && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#0D9488] ring-2 ring-white" />}
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
                    {notifications.length === 0 && <p className="py-4 text-center text-xs text-slate-500">No clinic alerts right now.</p>}
                  </div>
                  <div className="border-t border-slate-100 pt-2"><button type="button" onClick={() => { onPageChange("notifications"); setNotificationsOpen(false); }} className="block w-full py-1.5 text-center text-xs font-bold text-[#1A365D] hover:text-[#0D9488]">View all notifications →</button></div>
                </div>}
              </div>

              <div ref={profileRef} className="relative lg:hidden">
                <button type="button" aria-label={`Profile: ${userName}`} aria-expanded={profileMenuOpen} onClick={() => setProfileMenuOpen((open) => !open)} className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200/80 bg-white text-xs font-bold text-[#1A365D] shadow-2xs transition-colors hover:border-[#0D9488]/40 hover:text-[#0D9488]">
                  {initials}
                </button>
                {profileMenuOpen && <div className="absolute right-0 top-[calc(100%+10px)] z-50 w-64 space-y-3 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="border-b border-slate-100 pb-3">
                    <h4 className="truncate text-xs font-bold text-[#1A365D]">{userName}</h4>
                    <p className="text-[10px] capitalize text-slate-400">{role.replace("-", " ")}</p>
                  </div>
                  {isOwner && <div className="space-y-1"><label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Preview role</label><select value={role} onChange={(event) => { onRoleChange(event.target.value as Role); setProfileMenuOpen(false); }} className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs font-bold text-[#1A365D] outline-none"><option value="super-admin">Super Admin</option><option value="admin">Clinician</option></select></div>}
                  <div className="space-y-1 border-t border-slate-100 pt-2">
                    <button type="button" onClick={() => { setSettingsModalOpen(true); setProfileMenuOpen(false); }} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"><Settings size={15} />Workspace settings</button>
                    <button type="button" onClick={onSignOut} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-red-600 transition-colors hover:bg-red-50"><LogOut size={15} />Sign out</button>
                  </div>
                </div>}
              </div>
            </div>
          </div>
        </header>

        <nav id="admin-navigation" aria-label="Workspace tabs" className="sticky top-[73px] z-20 border-b border-slate-200/70 bg-[#F7F9FC]/95 px-4 py-2 backdrop-blur-xl sm:px-6 lg:hidden">
          <div className="mx-auto flex w-full max-w-[1560px] min-w-0 items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="tablist" aria-label="Admin sections">
            {nav.map((item) => {
              const isActive = page === item.key;
              return <button
                key={item.key}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-current={isActive ? "page" : undefined}
                onClick={() => onPageChange(item.key)}
                className={[
                  "inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl px-3 text-xs font-semibold transition-colors duration-150 sm:px-3.5 sm:text-sm",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488] focus-visible:ring-offset-2",
                  isActive ? "bg-white text-[#0D9488] shadow-xs ring-1 ring-slate-200/80" : "text-slate-600 hover:bg-white/70 hover:text-[#1A365D]",
                ].join(" ")}
              >
                {getNavIcon(item.key, isActive)}
                <span>{item.label}</span>
                {Boolean(item.count) && <span className="ml-0.5 h-1.5 w-1.5 rounded-full bg-[#0D9488]" />}
              </button>;
            })}
          </div>
        </nav>

        <main className="w-full min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 xl:px-10">
          <div className="w-full max-w-[1560px] mx-auto min-w-0">
            {children}
          </div>
        </main>
      </div>

      {navTooltip && createPortal(<div role="tooltip" className="pointer-events-none fixed z-[60] -translate-y-1/2 whitespace-nowrap rounded-xl bg-[#1A365D] px-3 py-1.5 text-xs font-semibold text-white shadow-lg animate-in fade-in slide-in-from-left-1 duration-150 motion-reduce:animate-none" style={{ left: navTooltip.left, top: navTooltip.top }}>{navTooltip.label}</div>, document.body)}

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
