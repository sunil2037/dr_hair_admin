"use client";

import {
  Activity,
  ArrowRight,
  Calendar,
  ChevronRight,
  Command,
  Flag,
  Gauge,
  LayoutDashboard,
  Loader2,
  Package,
  PanelsTopLeft,
  Search,
  ShieldCheck,
  ShoppingBag,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PageKey } from "../types";

export interface HeaderSearchProps {
  page: PageKey;
  globalSearch: string;
  onSearchChange: (value: string) => void;
  onNavigate: (page: PageKey) => void;
}

interface PatientSearchResult {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  patientCode?: string;
  gender?: string;
  age?: number;
}

interface ProductSearchResult {
  id: string;
  name: string;
  sku?: string;
  price?: number;
  stock?: number;
  status?: string;
  category?: string;
}

interface BookingSearchResult {
  id: string;
  customer: string;
  service: string;
  date: string;
  startsAt?: string;
  status: string;
  doctorName?: string;
  tokenNumber?: string;
}

interface ScreenShortcut {
  key: PageKey;
  title: string;
  category: string;
  description: string;
  icon: typeof LayoutDashboard;
}

const adminScreens: ScreenShortcut[] = [
  { key: "overview", title: "Overview", category: "Workspace", description: "Clinic dashboard, stats, and patient triage", icon: LayoutDashboard },
  { key: "patients", title: "Patients & Assessments", category: "Clinical", description: "Scalp diagnostics, consultation history, profiles", icon: Gauge },
  { key: "catalog", title: "Commerce & Products", category: "Inventory", description: "Product catalog, inventory stock, pricing, SKUs", icon: ShoppingBag },
  { key: "orders", title: "Orders & Fulfillment", category: "Operations", description: "Patient orders, delivery status, invoices", icon: Package },
  { key: "tests", title: "Hair Tests & Diagnostics", category: "Diagnostics", description: "AI scalp scans, trichologist review, clinical reports", icon: Flag },
  { key: "bookings", title: "Appointments & Consultations", category: "Scheduling", description: "Doctor schedules, clinic visits, OPD queues", icon: Calendar },
  { key: "content", title: "App Management & CMS", category: "Content", description: "Banners, clinic stories, home promotions, feeds", icon: PanelsTopLeft },
  { key: "team", title: "Admin Team & Access", category: "Security", description: "Staff accounts, role permissions, audit security", icon: ShieldCheck },
  { key: "activity", title: "Audit Log & Security", category: "Security", description: "Administrative access logs, system changes", icon: Activity },
];

const screenPlaceholders: Record<PageKey, string> = {
  overview: "Search patients, products, appointments... (⌘K)",
  patients: "Search patients by name, phone, email, ID... (⌘K)",
  catalog: "Search products, SKU, category, price... (⌘K)",
  orders: "Search patient orders, tracking ID, invoice... (⌘K)",
  tests: "Search scalp assessments, test IDs, symptoms... (⌘K)",
  bookings: "Search doctor appointments, patient, token... (⌘K)",
  content: "Search banners, articles, app stories... (⌘K)",
  team: "Search admin accounts, staff names, roles... (⌘K)",
  activity: "Search audit logs, actions, admin emails... (⌘K)",
  notifications: "Search clinic alerts, notifications... (⌘K)",
};

type FilterCategory = "all" | "patients" | "products" | "bookings" | "pages";

export function HeaderSearch({
  page,
  globalSearch,
  onSearchChange,
  onNavigate,
}: HeaderSearchProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [localQuery, setLocalQuery] = useState(globalSearch);
  const [filterCategory, setFilterCategory] = useState<FilterCategory>("all");
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Search Results
  const [patients, setPatients] = useState<PatientSearchResult[]>([]);
  const [products, setProducts] = useState<ProductSearchResult[]>([]);
  const [bookings, setBookings] = useState<BookingSearchResult[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Sync incoming globalSearch if updated externally
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocalQuery(globalSearch);
  }, [globalSearch]);

  // Global Keyboard Shortcut: ⌘K or Ctrl+K to open search
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsOpen(true);
        if (window.innerWidth < 640) {
          setMobileSearchOpen(true);
          setTimeout(() => mobileInputRef.current?.focus(), 50);
        } else {
          inputRef.current?.focus();
        }
      } else if (event.key === "Escape") {
        setIsOpen(false);
        setMobileSearchOpen(false);
        inputRef.current?.blur();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close palette on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Matching screen shortcuts based on query
  const matchingScreens = useMemo(() => {
    const q = localQuery.trim().toLowerCase();
    if (!q) return adminScreens.slice(0, 4);
    return adminScreens.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q)
    );
  }, [localQuery]);

  // Debounced API search
  const performSearch = useCallback(
    async (queryText: string) => {
      const trimmed = queryText.trim();
      if (!trimmed) {
        setPatients([]);
        setProducts([]);
        setBookings([]);
        setIsSearching(false);
        return;
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;
      setIsSearching(true);

      try {
        const queryParam = encodeURIComponent(trimmed);
        const [usersRes, productsRes, appointmentsRes] = await Promise.allSettled([
          fetch(`/api/admin/users?search=${queryParam}&limit=5`, {
            signal: controller.signal,
            cache: "no-store",
          }),
          fetch(`/api/admin/products?search=${queryParam}&limit=5`, {
            signal: controller.signal,
            cache: "no-store",
          }),
          fetch(`/api/admin/appointments?search=${queryParam}&limit=5`, {
            signal: controller.signal,
            cache: "no-store",
          }),
        ]);

        if (controller.signal.aborted) return;

        // Process Patients
        if (usersRes.status === "fulfilled" && usersRes.value.ok) {
          const json = await usersRes.value.json().catch(() => ({}));
          const items = Array.isArray(json?.data?.items) ? json.data.items : [];
          setPatients(
            items.map((u: Record<string, unknown>) => ({
              id: String(u.id ?? ""),
              name: String(u.name || "Patient"),
              email: typeof u.email === "string" ? u.email : undefined,
              phone: typeof u.phone === "string" ? u.phone : undefined,
              patientCode: typeof u.patient_code === "string" ? u.patient_code : (typeof u.reference_no === "string" ? u.reference_no : undefined),
              gender: typeof u.gender === "string" ? u.gender : undefined,
              age: typeof u.age === "number" ? u.age : undefined,
            }))
          );
        } else {
          setPatients([]);
        }

        // Process Products
        if (productsRes.status === "fulfilled" && productsRes.value.ok) {
          const json = await productsRes.value.json().catch(() => ({}));
          const items = Array.isArray(json?.data?.items)
            ? json.data.items
            : Array.isArray(json?.data)
            ? json.data
            : [];
          setProducts(
            items.map((p: Record<string, unknown>) => ({
              id: String(p.id ?? ""),
              name: String(p.name || p.title || "Product"),
              sku: typeof p.sku === "string" ? p.sku : undefined,
              price: typeof p.price === "number" ? p.price : undefined,
              stock: typeof p.stock === "number" ? p.stock : undefined,
              status: typeof p.status === "string" ? p.status : undefined,
              category: typeof p.category === "string" ? p.category : undefined,
            }))
          );
        } else {
          setProducts([]);
        }

        // Process Appointments
        if (appointmentsRes.status === "fulfilled" && appointmentsRes.value.ok) {
          const json = await appointmentsRes.value.json().catch(() => ({}));
          const items = Array.isArray(json?.data?.items) ? json.data.items : [];
          setBookings(
            items.map((b: Record<string, unknown>) => ({
              id: String(b.id ?? ""),
              customer: String(b.customer || b.name || "Patient"),
              service: String(b.service || b.reason || "Clinic consultation"),
              date: String(b.date || ""),
              startsAt: typeof b.startsAt === "string" ? b.startsAt : (typeof b.starts_at === "string" ? b.starts_at : undefined),
              status: String(b.status || "Confirmed"),
              doctorName: typeof b.doctorName === "string" ? b.doctorName : (typeof b.doctor_name === "string" ? b.doctor_name : undefined),
              tokenNumber: typeof b.tokenNumber === "string" ? b.tokenNumber : (typeof b.opd_token === "string" ? b.opd_token : undefined),
            }))
          );
        } else {
          setBookings([]);
        }
      } catch {
        // Ignored aborted request errors
      } finally {
        if (!controller.signal.aborted) {
          setIsSearching(false);
        }
      }
    },
    []
  );

  // Debounced input change
  const handleQueryChange = (val: string) => {
    setLocalQuery(val);
    onSearchChange(val);
    setSelectedIndex(0);

    const timer = setTimeout(() => {
      performSearch(val);
    }, 250);
    return () => clearTimeout(timer);
  };

  const handleClear = () => {
    setLocalQuery("");
    onSearchChange("");
    setPatients([]);
    setProducts([]);
    setBookings([]);
    setSelectedIndex(0);
    inputRef.current?.focus();
    mobileInputRef.current?.focus();
  };

  // Compile flat items for keyboard arrow navigation
  interface FlatItem {
    type: "patient" | "product" | "booking" | "page";
    id: string;
    action: () => void;
  }

  const flatItems = useMemo<FlatItem[]>(() => {
    const list: FlatItem[] = [];

    if (filterCategory === "all" || filterCategory === "patients") {
      patients.forEach((p) => {
        list.push({
          type: "patient",
          id: `patient-${p.id}`,
          action: () => {
            router.push(`/patients/${encodeURIComponent(p.id)}`);
            setIsOpen(false);
            setMobileSearchOpen(false);
          },
        });
      });
    }

    if (filterCategory === "all" || filterCategory === "products") {
      products.forEach((p) => {
        list.push({
          type: "product",
          id: `product-${p.id}`,
          action: () => {
            onNavigate("catalog");
            onSearchChange(p.name);
            setIsOpen(false);
            setMobileSearchOpen(false);
          },
        });
      });
    }

    if (filterCategory === "all" || filterCategory === "bookings") {
      bookings.forEach((b) => {
        list.push({
          type: "booking",
          id: `booking-${b.id}`,
          action: () => {
            onNavigate("bookings");
            onSearchChange(b.customer);
            setIsOpen(false);
            setMobileSearchOpen(false);
          },
        });
      });
    }

    if (filterCategory === "all" || filterCategory === "pages") {
      matchingScreens.forEach((s) => {
        list.push({
          type: "page",
          id: `screen-${s.key}`,
          action: () => {
            onNavigate(s.key);
            setIsOpen(false);
            setMobileSearchOpen(false);
          },
        });
      });
    }

    return list;
  }, [bookings, filterCategory, matchingScreens, onNavigate, onSearchChange, patients, products, router]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelectedIndex((prev) => (flatItems.length ? (prev + 1) % flatItems.length : 0));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelectedIndex((prev) => (flatItems.length ? (prev - 1 + flatItems.length) % flatItems.length : 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (flatItems[selectedIndex]) {
        flatItems[selectedIndex].action();
      }
    }
  };

  const totalResultsCount = patients.length + products.length + bookings.length + (localQuery ? matchingScreens.length : 0);
  const placeholderText = screenPlaceholders[page] || screenPlaceholders.overview;

  return (
    <div ref={containerRef} className="relative z-40">
      {/* ==================================================================== */}
      {/* 1. DESKTOP SEARCH BAR (Animated expanding pill)                     */}
      {/* ==================================================================== */}
      <div
        className={[
          "hidden sm:flex items-center gap-2.5 rounded-full border bg-white/95 px-3.5 py-1.5 shadow-xs transition-all duration-300 ease-out",
          isOpen
            ? "w-80 md:w-96 lg:w-[440px] border-[#0D9488]/80 shadow-[0_8px_24px_rgba(13,148,136,0.12)] ring-4 ring-[#0D9488]/10"
            : "w-56 md:w-64 lg:w-72 border-slate-200/90 hover:border-slate-300",
        ].join(" ")}
      >
        <div className="relative flex shrink-0 items-center justify-center text-slate-400">
          {isSearching ? (
            <Loader2 size={15} className="animate-spin text-[#0D9488]" />
          ) : (
            <Search
              size={15}
              className={`transition-colors ${isOpen ? "text-[#0D9488]" : "text-slate-400"}`}
            />
          )}
        </div>

        <input
          ref={inputRef}
          type="text"
          value={localQuery}
          onFocus={() => {
            setIsOpen(true);
            if (localQuery.trim() && patients.length === 0 && products.length === 0) {
              performSearch(localQuery);
            }
          }}
          onChange={(e) => handleQueryChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholderText}
          aria-label="Universal admin search"
          className="w-full border-0 bg-transparent text-xs text-slate-800 outline-none placeholder:text-slate-400 font-medium"
        />

        {localQuery && (
          <button
            type="button"
            onClick={handleClear}
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700"
            aria-label="Clear search query"
          >
            <X size={12} />
          </button>
        )}

        <kbd className="hidden shrink-0 items-center gap-0.5 rounded border border-slate-200/90 bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium font-mono text-slate-400 md:inline-flex">
          ⌘K
        </kbd>
      </div>

      {/* ==================================================================== */}
      {/* 2. MOBILE SEARCH TRIGGER (Shown on < 640px)                          */}
      {/* ==================================================================== */}
      <button
        type="button"
        onClick={() => {
          setMobileSearchOpen(true);
          setIsOpen(true);
          setTimeout(() => mobileInputRef.current?.focus(), 60);
        }}
        aria-label="Open search"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200/80 bg-white text-slate-600 shadow-xs hover:text-[#1A365D] sm:hidden active:scale-95 transition-all"
      >
        <Search size={18} strokeWidth={1.8} />
      </button>

      {/* Mobile Slide-Down Search Overlay */}
      {mobileSearchOpen && (
        <div className="fixed inset-x-0 top-0 z-50 bg-white/95 px-4 py-3 shadow-lg backdrop-blur-xl sm:hidden animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2">
            <div className="flex flex-1 items-center gap-2.5 rounded-full border border-[#0D9488]/80 bg-slate-50/80 px-3.5 py-2 ring-2 ring-[#0D9488]/15">
              {isSearching ? (
                <Loader2 size={16} className="animate-spin text-[#0D9488]" />
              ) : (
                <Search size={16} className="text-[#0D9488]" />
              )}
              <input
                ref={mobileInputRef}
                type="text"
                value={localQuery}
                onChange={(e) => handleQueryChange(e.target.value)}
                placeholder="Search clinic records..."
                className="w-full border-0 bg-transparent text-xs text-slate-800 outline-none placeholder:text-slate-400"
              />
              {localQuery && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-slate-600"
                >
                  <X size={12} />
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setMobileSearchOpen(false);
                setIsOpen(false);
              }}
              className="text-xs font-semibold text-slate-600 hover:text-black px-2 py-1"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 3. DROPDOWN COMMAND PALETTE                                          */}
      {/* ==================================================================== */}
      {isOpen && (
        <div
          ref={listRef}
          className="absolute right-0 top-[calc(100%+8px)] z-50 w-[min(540px,calc(100vw-24px))] rounded-2xl border border-slate-200/90 bg-white p-2 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden"
        >
          {/* Header Bar with Category Filters */}
          <div className="flex items-center gap-1.5 border-b border-slate-100 px-2 pb-2.5 pt-1 overflow-x-auto [scrollbar-width:none]">
            {(
              [
                { id: "all", label: "All" },
                { id: "patients", label: `Patients (${patients.length})` },
                { id: "products", label: `Products (${products.length})` },
                { id: "bookings", label: `Appointments (${bookings.length})` },
                { id: "pages", label: "Pages" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setFilterCategory(tab.id);
                  setSelectedIndex(0);
                }}
                className={[
                  "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors",
                  filterCategory === tab.id
                    ? "bg-[#1A365D] text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                ].join(" ")}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="max-h-[min(420px,65vh)] overflow-y-auto px-1 py-1.5 divide-y divide-slate-100">
            {/* 3A. PATIENTS RESULTS */}
            {(filterCategory === "all" || filterCategory === "patients") && patients.length > 0 && (
              <div className="py-2 first:pt-1">
                <div className="flex items-center justify-between px-2 py-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Patients & Assessments
                  </span>
                  <span className="text-[10px] text-teal-600 font-semibold">
                    {patients.length} found
                  </span>
                </div>
                <div className="space-y-0.5">
                  {patients.map((p) => {
                    const isSelected = flatItems[selectedIndex]?.id === `patient-${p.id}`;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          router.push(`/patients/${encodeURIComponent(p.id)}`);
                          setIsOpen(false);
                          setMobileSearchOpen(false);
                        }}
                        className={[
                          "group flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left transition-colors",
                          isSelected ? "bg-teal-50/80" : "hover:bg-slate-50",
                        ].join(" ")}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1A365D] text-xs font-bold text-white shadow-xs">
                            {p.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="truncate text-xs font-bold text-[#1A365D]">
                                {p.name}
                              </span>
                              {p.patientCode && (
                                <span className="rounded bg-teal-50 px-1 py-0.2 text-[9px] font-semibold text-[#0D9488]">
                                  {p.patientCode}
                                </span>
                              )}
                            </div>
                            <p className="truncate text-[11px] text-slate-500">
                              {[p.phone, p.email, p.gender, p.age ? `${p.age}y` : null]
                                .filter(Boolean)
                                .join(" · ")}
                            </p>
                          </div>
                        </div>
                        <ChevronRight
                          size={15}
                          className="shrink-0 text-slate-300 group-hover:text-[#0D9488] transition-colors"
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3B. PRODUCTS RESULTS */}
            {(filterCategory === "all" || filterCategory === "products") && products.length > 0 && (
              <div className="py-2 first:pt-1">
                <div className="flex items-center justify-between px-2 py-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Products & Catalog
                  </span>
                  <span className="text-[10px] text-teal-600 font-semibold">
                    {products.length} found
                  </span>
                </div>
                <div className="space-y-0.5">
                  {products.map((prod) => {
                    const isSelected = flatItems[selectedIndex]?.id === `product-${prod.id}`;
                    return (
                      <button
                        key={prod.id}
                        type="button"
                        onClick={() => {
                          onNavigate("catalog");
                          onSearchChange(prod.name);
                          setIsOpen(false);
                          setMobileSearchOpen(false);
                        }}
                        className={[
                          "group flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left transition-colors",
                          isSelected ? "bg-teal-50/80" : "hover:bg-slate-50",
                        ].join(" ")}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                            <ShoppingBag size={15} />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="truncate text-xs font-bold text-[#1A365D]">
                                {prod.name}
                              </span>
                              {prod.sku && (
                                <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1 py-0.5 rounded">
                                  {prod.sku}
                                </span>
                              )}
                            </div>
                            <p className="truncate text-[11px] text-slate-500">
                              {prod.price !== undefined ? `₹${prod.price}` : "Medical product"}
                              {prod.stock !== undefined ? ` · ${prod.stock} in stock` : ""}
                              {prod.category ? ` · ${prod.category}` : ""}
                            </p>
                          </div>
                        </div>
                        <span className="text-[11px] font-semibold text-[#0D9488] opacity-0 group-hover:opacity-100 flex items-center gap-0.5">
                          View <ArrowRight size={12} />
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3C. APPOINTMENTS RESULTS */}
            {(filterCategory === "all" || filterCategory === "bookings") && bookings.length > 0 && (
              <div className="py-2 first:pt-1">
                <div className="flex items-center justify-between px-2 py-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Appointments & Consultations
                  </span>
                  <span className="text-[10px] text-teal-600 font-semibold">
                    {bookings.length} found
                  </span>
                </div>
                <div className="space-y-0.5">
                  {bookings.map((b) => {
                    const isSelected = flatItems[selectedIndex]?.id === `booking-${b.id}`;
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => {
                          onNavigate("bookings");
                          onSearchChange(b.customer);
                          setIsOpen(false);
                          setMobileSearchOpen(false);
                        }}
                        className={[
                          "group flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left transition-colors",
                          isSelected ? "bg-teal-50/80" : "hover:bg-slate-50",
                        ].join(" ")}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
                            <Calendar size={15} />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="truncate text-xs font-bold text-[#1A365D]">
                                {b.customer}
                              </span>
                              {b.tokenNumber && (
                                <span className="rounded bg-indigo-50 px-1 py-0.2 text-[9px] font-bold text-indigo-700">
                                  Token {b.tokenNumber}
                                </span>
                              )}
                            </div>
                            <p className="truncate text-[11px] text-slate-500">
                              {b.service}
                              {b.date ? ` · ${b.date}` : ""}
                              {b.doctorName ? ` · ${b.doctorName}` : ""}
                            </p>
                          </div>
                        </div>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                          {b.status}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3D. WORKSPACE NAVIGATION SHORTCUTS */}
            {(filterCategory === "all" || filterCategory === "pages") && matchingScreens.length > 0 && (
              <div className="py-2 first:pt-1">
                <div className="px-2 py-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Jump to Workspace Section
                  </span>
                </div>
                <div className="space-y-0.5">
                  {matchingScreens.map((s) => {
                    const Icon = s.icon;
                    const isSelected = flatItems[selectedIndex]?.id === `screen-${s.key}`;
                    return (
                      <button
                        key={s.key}
                        type="button"
                        onClick={() => {
                          onNavigate(s.key);
                          setIsOpen(false);
                          setMobileSearchOpen(false);
                        }}
                        className={[
                          "group flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left transition-colors",
                          isSelected ? "bg-teal-50/80" : "hover:bg-slate-50",
                        ].join(" ")}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-[#1A365D] group-hover:bg-[#1A365D] group-hover:text-white transition-colors">
                            <Icon size={15} />
                          </div>
                          <div className="min-w-0">
                            <span className="truncate text-xs font-bold text-[#1A365D]">
                              {s.title}
                            </span>
                            <p className="truncate text-[11px] text-slate-500">{s.description}</p>
                          </div>
                        </div>
                        <span className="text-[11px] text-slate-400 group-hover:text-[#0D9488] font-medium flex items-center gap-1">
                          Open <ArrowRight size={12} />
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3E. EMPTY STATE */}
            {localQuery.trim() && totalResultsCount === 0 && !isSearching && (
              <div className="px-4 py-8 text-center">
                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                  <Search size={18} />
                </div>
                <h4 className="text-xs font-bold text-[#1A365D]">No clinic records found</h4>
                <p className="mt-1 text-[11px] text-slate-500 max-w-xs mx-auto">
                  No matching patients, products, or appointments for &ldquo;{localQuery}&rdquo;.
                </p>
                <div className="mt-3 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={handleClear}
                    className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                  >
                    Clear search
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onNavigate("patients");
                      setIsOpen(false);
                      setMobileSearchOpen(false);
                    }}
                    className="rounded-full bg-[#1A365D] px-3 py-1 text-xs font-semibold text-white hover:bg-[#152c4d]"
                  >
                    View All Patients
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer Bar with Keyboard Navigation Hints */}
          <div className="flex items-center justify-between border-t border-slate-100 px-3 pt-2 pb-1 text-[10px] text-slate-400">
            <div className="flex items-center gap-3">
              <span>
                <kbd className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[9px] text-slate-600">↑↓</kbd> to navigate
              </span>
              <span>
                <kbd className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[9px] text-slate-600">↵</kbd> to select
              </span>
              <span>
                <kbd className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[9px] text-slate-600">esc</kbd> to close
              </span>
            </div>
            <span className="font-medium text-[#0D9488]">Dr. Hair Global Search</span>
          </div>
        </div>
      )}
    </div>
  );
}
