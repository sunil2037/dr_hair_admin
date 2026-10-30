"use client";

import { ArrowRight, Check, CheckCircle2, LockKeyhole, Mail, ShieldCheck, Sparkles, Stethoscope, UserCheck } from "lucide-react";
import { useState } from "react";
import type { Role } from "../types";
import { BrandLogo } from "./brand-logo";

const demoAccounts: {
  role: Role;
  name: string;
  roleTitle: string;
  email: string;
  badge: string;
  badgeColor: string;
  icon: typeof Stethoscope;
}[] = [
  {
    role: "super-admin",
    name: "Dr. Jai Bansal",
    roleTitle: "Clinic Owner & Chief Surgeon",
    email: "jai.bansal@drhair.health",
    badge: "Super Admin",
    badgeColor: "bg-[#1A365D] text-white",
    icon: Stethoscope,
  },
  {
    role: "admin",
    name: "Nandini Rao",
    roleTitle: "Clinical Operations & Prescriptions",
    email: "nandini.rao@drhair.health",
    badge: "Clinical Admin",
    badgeColor: "bg-teal-700 text-white",
    icon: UserCheck,
  },
  {
    role: "admin",
    name: "Vikram Sethi",
    roleTitle: "OPD Queue & Appointments Desk",
    email: "vikram.sethi@drhair.health",
    badge: "Operations Admin",
    badgeColor: "bg-slate-700 text-white",
    icon: UserCheck,
  },
  {
    role: "admin",
    name: "Aisha Khan",
    roleTitle: "App Media & Content Management",
    email: "aisha.khan@drhair.health",
    badge: "Content Admin",
    badgeColor: "bg-indigo-700 text-white",
    icon: UserCheck,
  },
];

export function SignIn({ onSignIn }: { onSignIn: (role: Role, email: string) => void }) {
  const [email, setEmail] = useState("jai.bansal@drhair.health");
  const [password, setPassword] = useState("demopassword");
  const [resetNotice, setResetNotice] = useState(false);

  const handleQuickLogin = (role: Role, accountEmail: string) => {
    setEmail(accountEmail);
    onSignIn(role, accountEmail);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const loginId = email.trim().toLowerCase();

    // Specific match
    const foundDemo = demoAccounts.find((item) => item.email.toLowerCase() === loginId);
    if (foundDemo) {
      onSignIn(foundDemo.role, foundDemo.email);
      return;
    }

    // Smart flexible detection so user is never blocked:
    const isSuper =
      loginId.includes("jai") ||
      loginId.includes("bansal") ||
      loginId.includes("super") ||
      loginId.includes("owner") ||
      loginId.includes("chief") ||
      loginId.includes("doctor") ||
      loginId.includes("dr") ||
      loginId === "admin" ||
      loginId === "admin@drhair.health" ||
      loginId === "admin@drhair.com";

    const resolvedRole: Role = isSuper ? "super-admin" : "admin";
    const resolvedEmail = loginId.includes("@") ? loginId : `${loginId}@drhair.health`;

    onSignIn(resolvedRole, resolvedEmail);
  };

  return (
    <main className="signin-page min-h-screen lg:grid lg:grid-cols-2">
      {/* Left Visual Branding Side */}
      <section className="signin-visual hidden lg:flex">
        <div className="brand signin-brand">
          <BrandLogo width={158} priority />
        </div>
        <div className="signin-message">
          <span className="signin-tag">
            <span className="signin-dot" />
            Clinical care, thoughtfully managed
          </span>
          <h1>Better care starts with a clearer view.</h1>
          <p>A calm, connected workspace for Dr. Jai Bansal and the clinic team caring for every hair health journey.</p>
          <div className="signin-illustration">
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <div className="care-symbol">
              <Sparkles size={27} />
            </div>
            <div className="float-card float-card-one">
              <span className="float-icon">
                <Check size={15} />
              </span>
              <span>
                <strong>OPD Token Issued</strong>
                <small>Room 101 · Dr. Jai Bansal</small>
              </span>
            </div>
            <div className="float-card float-card-two">
              <span className="float-mini-avatar">JB</span>
              <span>
                <strong>Super Admin Active</strong>
                <small>Full Clinical Control</small>
              </span>
            </div>
          </div>
        </div>
        <div className="signin-foot">
          <span>Dr. Hair Clinical Admin Panel</span>
          <span>Version 2.0.0</span>
        </div>
      </section>

      {/* Right Login Form Side */}
      <section className="signin-side">
        <div className="signin-form-wrap max-w-[420px] w-full">
          <div className="signin-mobile-brand">
            <BrandLogo width={142} priority />
          </div>
          <div className="signin-kicker">TEAM WORKSPACE</div>
          <h2>Welcome back</h2>
          <p className="signin-subtitle">Sign in to continue to your Dr. Hair admin workspace.</p>

          {/* Quick One-Click Login Pills */}
          <div className="mb-5 space-y-2">
            <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase block">
              ⚡ One-Click Quick Login:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => handleQuickLogin(acc.role, acc.email)}
                  className={`p-2.5 rounded-xl border text-left transition-all hover:scale-[1.02] flex items-center justify-between ${
                    email === acc.email
                      ? "border-[#1A365D] bg-[#F0F7FF] shadow-sm"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="min-w-0 pr-1">
                    <div className="flex items-center gap-1.5">
                      <strong className="text-xs text-slate-800 truncate block">{acc.name}</strong>
                    </div>
                    <span className="text-[10px] text-slate-500 truncate block">{acc.roleTitle}</span>
                  </div>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap ${acc.badgeColor}`}>
                    {acc.badge}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <label className="signin-field">
              <span>Work email</span>
              <div>
                <Mail size={15} />
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  type="text"
                  placeholder="e.g. jai.bansal@drhair.health"
                  required
                />
              </div>
            </label>

            <label className="signin-field">
              <span>Password</span>
              <div>
                <LockKeyhole size={15} />
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Any password"
                  required
                />
                <button
                  type="button"
                  className="show-password text-[11px] text-slate-500 hover:text-slate-800"
                  onClick={(event) => {
                    const input = event.currentTarget.parentElement?.querySelector("input");
                    if (input) input.type = input.type === "password" ? "text" : "password";
                  }}
                >
                  Show
                </button>
              </div>
            </label>

            <div className="flex items-center justify-between">
              <span className="text-[11px] text-emerald-700 flex items-center gap-1">
                <CheckCircle2 size={13} />
                Any password accepted in demo mode
              </span>
              <button
                type="button"
                className="forgot-link text-[11px] text-teal-700 hover:underline"
                onClick={() => setResetNotice((visible) => !visible)}
              >
                Forgot?
              </button>
            </div>

            {resetNotice && (
              <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 text-xs">
                To reset password or manage clinic credentials, contact Super Admin Dr. Jai Bansal.
              </div>
            )}

            <button type="submit" className="button button-primary signin-submit flex items-center justify-center gap-2">
              Continue to workspace <ArrowRight size={15} />
            </button>
          </form>

          <div className="signin-secure mt-4">
            <ShieldCheck size={14} />
            <span>Secure team access · Dr. Hair Restoration Center</span>
          </div>
        </div>

        <div className="signin-legal mt-4">
          © 2026 Dr. Hair <span>•</span> Terms <span>•</span> Privacy
        </div>
      </section>
    </main>
  );
}
