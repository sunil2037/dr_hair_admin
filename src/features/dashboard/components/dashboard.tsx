"use client";

import {
  Activity, ArrowRight, ArrowUpRight, CalendarCheck2, CalendarDays,
  ChevronDown, ClipboardCheck, Edit2, FileText, HeartPulse, MoreHorizontal,
  Plus, ShieldCheck, Users, UsersRound,
} from "lucide-react";
import { useMemo, useState } from "react";
import { StatusPill } from "../../shared/components/ui";
import { useSessionState } from "../../shared/lib/use-session-state";
import { admins as initialAdmins, bookings as initialBookings, orders as initialOrders, patients as initialPatients } from "../../shared/lib/demo-data";
import { patientClinicalProfiles } from "../../operations/lib/patient-profiles";
import { initialHairTests } from "../../operations/lib/hair-test-demo";
import type { AdminRecord, AuditEventRecord, BookingRecord, PageKey, Role } from "../../shared/types";
import type { OrderRecord, PatientRecord } from "../../shared/types";
import type { HairTestRecord, PatientClinicalProfile, PatientReportNotification } from "../../operations/types";

export function Dashboard({
  role,
  userName,
  onNavigate,
  permissions = [],
  events = [],
  admins = initialAdmins,
}: {
  role: Role;
  userName: string;
  onNavigate: (page: PageKey) => void;
  permissions?: string[];
  events?: AuditEventRecord[];
  admins?: AdminRecord[];
}) {
  const isSuper = role === "super-admin";
  const [selectedMonth, setSelectedMonth] = useState("October");
  const [dailyTarget, setDailyTarget] = useState(8500);
  const [editingTarget, setEditingTarget] = useState(false);
  const [targetInput, setTargetInput] = useState("8500");

  const [patients] = useSessionState<PatientRecord[]>("drhair-demo-patients", initialPatients);
  const [bookings] = useSessionState<BookingRecord[]>("drhair-demo-bookings", initialBookings);
  const [orders] = useSessionState<OrderRecord[]>("drhair-demo-orders", initialOrders);
  const [profiles] = useSessionState<Record<string, PatientClinicalProfile>>("drhair-demo-patient-profiles", patientClinicalProfiles);
  const [hairTests] = useSessionState<HairTestRecord[]>("drhair-demo-hair-tests", initialHairTests);
  const [notifications] = useSessionState<PatientReportNotification[]>("drhair-demo-patient-notifications", []);

  const reviewPatients = patients.filter((patient) => patient.status === "Review" || patient.status === "Pending");
  const currentDate = new Date();
  const today = currentDate.toDateString();
  const appointmentsToday = bookings.filter(
    (b) => (b.startsAt ? new Date(b.startsAt).toDateString() === today : b.date.toLowerCase().includes("today")) &&
      !["Cancelled", "No show"].includes(b.status)
  );
  const upcomingBooking = bookings
    .filter((b) => ["Pending", "Active"].includes(b.status) && b.opdStatus !== "No show")
    .filter((b) => !b.startsAt || new Date(b.startsAt).getTime() >= currentDate.getTime())
    .sort((l, r) => (l.startsAt ? new Date(l.startsAt).getTime() : Number.MAX_SAFE_INTEGER) - (r.startsAt ? new Date(r.startsAt).getTime() : Number.MAX_SAFE_INTEGER))[0];

  const ordersToFulfil = orders.filter((o) => ["New", "Pending", "Needs attention"].includes(o.status)).length;
  const reportsReady = Object.entries(profiles).flatMap(([patientId, profile]) =>
    profile.reports.filter(
      (r) => r.status === "Ready" && !notifications.some((n) => n.patientId === patientId && n.reportId === r.id)
    )
  );

  const permitted = (permission: string) => isSuper || permissions.includes(permission);

  // Month days matrix matching image structure
  const calendarDays = [
    { day: 1, status: "done" },
    { day: 2, status: "scheduled" },
    { day: 3, status: "scheduled" },
    { day: 4, status: "scheduled" },
    { day: 5, status: "done" },
    { day: 6, status: "none" },
    { day: 7, status: "none" },
    { day: 8, status: "scheduled" },
    { day: 9, status: "scheduled" },
    { day: 10, status: "scheduled" },
    { day: 11, status: "none" },
    { day: 12, status: "scheduled" },
    { day: 14, status: "none" },
    { day: 15, status: "scheduled" },
    { day: 16, status: "none" },
    { day: 17, status: "scheduled" },
    { day: 18, status: "none" },
    { day: 19, status: "scheduled" },
    { day: 20, status: "none" },
    { day: 21, status: "scheduled" },
    { day: 22, status: "none" },
    { day: 23, status: "scheduled" },
    { day: 24, status: "none" },
    { day: 25, status: "none" },
    { day: 26, status: "scheduled" },
    { day: 27, status: "current" },
    { day: 28, status: "scheduled" },
    { day: 29, status: "scheduled" },
    { day: 30, status: "none" },
  ];

  // Active patient regimens with real clinic patient data
  const patientHabits = [
    {
      id: "reg-1",
      patient: patients[0]?.name || "Sunil Sharma",
      therapy: "Follicle Booster Therapy",
      clinician: "Dr. Jai Bansal",
      completed: 9,
      total: 12,
      avatarInitials: "SS",
    },
    {
      id: "reg-2",
      patient: patients[1]?.name || "Priya Patel",
      therapy: "Laser Density & Scalp Detox",
      clinician: "Dr. Nandini Rao",
      completed: 6,
      total: 10,
      avatarInitials: "PP",
    },
    {
      id: "reg-3",
      patient: patients[2]?.name || "Vikram Sethi",
      therapy: "PRP Cellular Maintenance",
      clinician: "Dr. Vikram Sethi",
      completed: 4,
      total: 8,
      avatarInitials: "VS",
    },
    {
      id: "reg-4",
      patient: patients[3]?.name || "Ananya Roy",
      therapy: "DHT Blocker & Density Plan",
      clinician: "Dr. Aisha Khan",
      completed: 8,
      total: 10,
      avatarInitials: "AR",
    },
  ];

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300">
      {/* 2-Column Responsive Bento Grid (Exact Image Structure + Dr. Hair App Colors) */}
      <div className="grid grid-cols-12 gap-6 items-stretch">
        {/* ==================================================================== */}
        {/* BENTO CARD 1: Hero Clinic Results (Top-Left, 7 Cols)                  */}
        {/* ==================================================================== */}
        <section
          className="col-span-12 lg:col-span-7 bg-white rounded-[32px] p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden min-h-[350px] shadow-sm border border-slate-200/80"
          aria-label="Clinic Results for Today"
        >
          {/* Header Row */}
          <div className="flex items-start justify-between relative z-10">
            <div>
              <span className="text-[11px] font-bold tracking-wider uppercase text-[#0D9488]">
                Today&apos;s Clinical Overview
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#1A365D] leading-snug mt-0.5">
                Clinic Hair Assessment<br />Results for Today
              </h2>
            </div>

            {/* Top Right Navy Badge Button */}
            <button
              type="button"
              onClick={() => onNavigate("patients")}
              aria-label="View clinic details"
              className="w-10 h-10 rounded-full bg-[#1A365D] text-white hover:bg-[#152c4d] flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md"
            >
              <ArrowUpRight size={18} strokeWidth={2.5} className="text-[#0D9488]" />
            </button>
          </div>

          {/* Graphic Area: Floating Glow Overlapping Circles with Dr. Hair Navy & Teal Accents */}
          <div className="relative my-4 flex items-center justify-center sm:justify-end sm:mr-8 h-48 select-none">
            {/* Navy OPD Time Badge */}
            <div className="absolute left-4 sm:left-auto sm:right-56 top-4 z-20 w-20 h-20 rounded-full bg-[#1A365D] text-white flex flex-col items-center justify-center shadow-xl border-2 border-white">
              <span className="text-sm font-bold leading-none text-[#0D9488]">2.30</span>
              <span className="text-[10px] text-slate-300 mt-0.5">hours OPD</span>
            </div>

            {/* Large Teal Glowing Circle (Consultations / Patients) */}
            <div className="relative z-10 w-44 h-44 rounded-full bg-gradient-to-br from-[#0D9488] to-[#047481] text-white flex flex-col items-center justify-center shadow-[0_0_40px_rgba(13,148,136,0.35)] border-4 border-white">
              <span className="text-xl font-black leading-tight">1,875</span>
              <span className="text-[10px] font-bold text-teal-100 uppercase tracking-wider">consults</span>
            </div>

            {/* Overlapping Navy Glowing Circle (Hair Tests) */}
            <div className="absolute right-24 -bottom-2 z-15 w-36 h-36 rounded-full bg-gradient-to-br from-[#1A365D] to-[#0f2442] text-white flex flex-col items-center justify-center shadow-[0_0_35px_rgba(26,54,93,0.3)] border-4 border-white">
              <span className="text-lg font-black leading-tight text-white">850</span>
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">tests</span>
            </div>
          </div>

          {/* Bottom Left Legend Items */}
          <div className="space-y-2 relative z-10 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-3 text-xs font-semibold text-slate-700">
              <span className="w-5 h-2 rounded-full bg-[#0D9488]" />
              <span>Consultations completed (1,875)</span>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold text-slate-700">
              <span className="w-5 h-2 rounded-full bg-[#1A365D]" />
              <span>Hair tests submitted (850)</span>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold text-slate-700">
              <span className="w-5 h-2 rounded-full bg-slate-400" />
              <span>Active clinic OPD time (2.30h)</span>
            </div>
          </div>
        </section>

        {/* ==================================================================== */}
        {/* BENTO CARD 2: Appointment Calendar (Top-Right, 5 Cols)               */}
        {/* ==================================================================== */}
        <section
          className="col-span-12 lg:col-span-5 bg-[#1A365D] text-white rounded-[32px] p-6 sm:p-8 flex flex-col justify-between shadow-sm"
          aria-label="Appointment Schedule"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#0D9488]">
                OPD Schedule
              </span>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                Your Clinic Days
              </h2>
            </div>
            <div className="relative">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="appearance-none bg-transparent text-slate-200 font-semibold text-xs pr-5 outline-none cursor-pointer hover:text-white"
              >
                <option value="October" className="bg-[#1A365D]">October</option>
                <option value="November" className="bg-[#1A365D]">November</option>
                <option value="December" className="bg-[#1A365D]">December</option>
              </select>
              <ChevronDown size={14} className="absolute right-0 top-0.5 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Weekday Letters */}
          <div className="grid grid-cols-7 text-center text-[11px] font-bold text-slate-400 tracking-wider py-2">
            <span>M</span>
            <span>T</span>
            <span>W</span>
            <span>T</span>
            <span>F</span>
            <span>S</span>
            <span>S</span>
          </div>

          {/* Days Matrix */}
          <div className="grid grid-cols-7 gap-y-2 text-center text-xs font-medium py-1">
            {calendarDays.map((item, index) => {
              if (item.status === "done") {
                return (
                  <div key={index} className="flex items-center justify-center">
                    <span className="w-8 h-8 rounded-full bg-[#0D9488] text-white font-bold flex items-center justify-center shadow-sm">
                      {item.day}
                    </span>
                  </div>
                );
              }
              if (item.status === "current") {
                return (
                  <div key={index} className="flex items-center justify-center">
                    <span className="w-8 h-8 rounded-full border-2 border-white text-white font-bold flex items-center justify-center">
                      {item.day}
                    </span>
                  </div>
                );
              }
              if (item.status === "scheduled") {
                return (
                  <div key={index} className="flex items-center justify-center">
                    <span className="w-8 h-8 rounded-full text-slate-200 hover:bg-white/10 flex items-center justify-center transition-colors">
                      {item.day}
                    </span>
                  </div>
                );
              }
              return (
                <div key={index} className="flex items-center justify-center text-slate-400">
                  <span className="w-8 h-8 flex items-center justify-center">
                    {item.day}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Calendar Foot Legend */}
          <div className="flex items-center justify-between text-[11px] text-slate-300 pt-3 border-t border-white/10 font-medium">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full border border-slate-300" />
              Current day
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0D9488]" />
              Completed
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
              Scheduled
            </span>
          </div>
        </section>

        {/* ==================================================================== */}
        {/* ROW 2: BOTTOM SECTION                                                */}
        {/* ==================================================================== */}

        {/* Left Stacked Column: (4 Cols - 2 cards stacked) */}
        <div className="col-span-12 lg:col-span-5 xl:col-span-4 space-y-6">
          {/* BENTO CARD 3: Hair Tests Gauge Card */}
          <section
            className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-200/80 flex items-center justify-between"
            aria-label="Hair Tests Goal"
          >
            <div className="space-y-3">
              <div>
                <h3 className="text-base font-bold text-[#1A365D] leading-tight">
                  Hair Tests for Today
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Keep clinical queue on track
                </p>
              </div>

              {/* Change Goal Button */}
              {editingTarget ? (
                <div className="flex items-center gap-1.5 pt-1">
                  <input
                    type="number"
                    value={targetInput}
                    onChange={(e) => setTargetInput(e.target.value)}
                    className="w-20 px-2 py-1 text-xs border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-[#1A365D]"
                  />
                  <button
                    onClick={() => {
                      setDailyTarget(parseInt(targetInput, 10) || 8500);
                      setEditingTarget(false);
                    }}
                    className="px-2 py-1 bg-[#1A365D] text-white text-[10px] rounded-md font-bold"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setEditingTarget(true)}
                  className="flex items-center gap-2 text-xs font-bold text-[#1A365D] hover:text-[#0D9488] transition-colors"
                >
                  <span>Change Target</span>
                  <span className="w-6 h-6 rounded-full bg-[#0D9488] text-white flex items-center justify-center shadow-sm">
                    <Edit2 size={11} strokeWidth={2.5} />
                  </span>
                </button>
              )}
            </div>

            {/* Circular Gauge Meter (SVG Arc with Teal Gradient) */}
            <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#E2E8F0"
                  strokeWidth="8"
                  strokeDasharray="200"
                  strokeDashoffset="50"
                  strokeLinecap="round"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="url(#tealArcGrad)"
                  strokeWidth="8"
                  strokeDasharray="200"
                  strokeDashoffset="85"
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="tealArcGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#1A365D" />
                    <stop offset="100%" stop-color="#0D9488" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Inside Center Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] text-slate-400 font-medium">Goal</span>
                <span className="text-sm font-extrabold text-[#1A365D] leading-tight">
                  {dailyTarget.toLocaleString()}
                </span>
                <span className="text-[9px] font-bold text-[#0D9488] mt-0.5">5,201 tests</span>
              </div>
            </div>
          </section>

          {/* BENTO CARD 4: Treatment Care Plans Progress */}
          <section
            className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-200/80 space-y-4"
            aria-label="Treatment Regimen Progress"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-[#1A365D]">
                  Clinical Treatment Plans
                </h3>
                <p className="text-xs text-slate-400">Active patient compliance</p>
              </div>
              <div className="text-right">
                <span className="text-base font-extrabold text-[#1A365D]">68%</span>
                <p className="text-[11px] text-[#0D9488] font-bold">Completed</p>
              </div>
            </div>

            {/* Progress Slider Track with Thumb Pill */}
            <div className="space-y-2">
              <div className="relative w-full h-8 flex items-center">
                {/* Track Line */}
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-[#1A365D] rounded-full w-[68%]" />
                </div>
                {/* Floating Thumb Pill */}
                <div className="absolute left-[54%] -top-1 px-3 py-1 rounded-full bg-[#1A365D] text-white text-[11px] font-bold shadow-md">
                  68.2%
                </div>
              </div>

              {/* Min & Max Labels */}
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                <span>58 Active</span>
                <span>50 Goal</span>
              </div>
            </div>
          </section>
        </div>

        {/* BENTO CARD 5: Active Patient Regimens (Habits List - 8 Cols) */}
        <section
          className="col-span-12 lg:col-span-7 xl:col-span-8 bg-white rounded-[32px] p-6 sm:p-8 shadow-sm border border-slate-200/80 flex flex-col justify-between"
          aria-label="Active Patient Regimens"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <span className="text-[11px] font-bold tracking-wider uppercase text-[#0D9488]">
                Patient Care Flow
              </span>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-[#1A365D] mt-0.5">
                Active Patient Regimens
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate("patients")}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#1A365D] text-white text-xs font-semibold hover:bg-[#152c4d] transition-all shadow-sm active:scale-95"
            >
              <span>Add New</span>
              <Plus size={14} />
            </button>
          </div>

          {/* List of Real Patient Regimens */}
          <div className="divide-y divide-slate-100">
            {patientHabits.map((item) => (
              <div
                key={item.id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group hover:bg-slate-50/70 rounded-2xl px-2 transition-colors"
              >
                {/* Left: Patient Avatar & Therapy */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-[#1A365D] text-white flex items-center justify-center shrink-0 font-bold text-xs shadow-sm">
                    {item.avatarInitials}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-bold text-[#1A365D] truncate">
                      {item.therapy}
                    </h4>
                    <p className="text-[11px] text-slate-500 truncate">
                      Patient: <strong className="text-slate-800">{item.patient}</strong> · {item.clinician}
                    </p>
                  </div>
                </div>

                {/* Right: Sessions Completed Battery Dots & More */}
                <div className="flex items-center justify-between sm:justify-end gap-5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-600 font-medium">
                      Sessions: <strong className="text-[#1A365D]">{item.completed}/{item.total}</strong>
                    </span>

                    {/* Battery Dots (Teal Active, Slate Inactive) */}
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: item.total }).map((_, barIdx) => (
                        <span
                          key={barIdx}
                          className={`w-1.5 h-3.5 rounded-full ${
                            barIdx < item.completed
                              ? "bg-[#0D9488]"
                              : "bg-slate-200"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Actions Button */}
                  <button
                    type="button"
                    onClick={() => onNavigate("patients")}
                    aria-label="Actions"
                    className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-[#1A365D] hover:bg-slate-100 transition-colors"
                  >
                    <MoreHorizontal size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
