"use client";

import { ArrowRight, ArrowUpRight, CalendarDays, ClipboardCheck, Eye, EyeOff, KeyRound, ShieldCheck, UsersRound } from "lucide-react";
import { useState } from "react";
import { BrandLogo } from "./brand-logo";

export type AdminIdentity = {
  id: string;
  email: string;
  name?: string | null;
  role: "admin" | "super_admin";
};

export function SignIn({ onAuthenticated }: { onAuthenticated: (admin: AdminIdentity) => void }) {
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function signIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!loginId.trim() || !password) {
      setError("Enter your admin email or ID and password.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginId.trim(), password }),
        cache: "no-store",
      });
      const result = await response.json().catch(() => ({}));
      const admin = result?.admin as AdminIdentity | undefined;
      if (
        !response.ok
        || result?.authenticated !== true
        || !admin?.email
        || !["admin", "super_admin"].includes(admin.role)
      ) {
        throw new Error(result?.message || "Admin ID or password is incorrect.");
      }
      onAuthenticated(admin);
    } catch (signInError) {
      setError(signInError instanceof Error ? signInError.message : "Could not sign in. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="signin-page min-h-screen">
      <section className="signin-visual">
        <div className="signin-brand-row">
          <div className="brand signin-brand"><BrandLogo width={158} priority /></div>
          <span className="signin-brand-note"><span className="signin-dot" />Clinic workspace</span>
        </div>
        <div className="signin-message">
          <span className="signin-tag"><span className="signin-dot" />Clinical care, thoughtfully managed</span>
          <h1>Better care starts with a clearer view.</h1>
          <p>A private workspace to keep patient records, appointments and care plans moving together.</p>

          <div className="signin-workspace-preview" aria-label="Admin workspace features">
            <div className="signin-preview-head">
              <span className="signin-preview-title">YOUR CLINIC WORKSPACE</span>
              <span className="signin-preview-private"><ShieldCheck size={13} /> Private access</span>
            </div>
            <div className="signin-preview-grid">
              <article className="signin-preview-card signin-preview-patients">
                <span className="signin-preview-icon"><UsersRound size={17} /></span>
                <div><strong>Patient records</strong><small>Profiles, assessments & reports</small></div>
                <ArrowUpRight className="signin-preview-arrow" size={15} />
                <span className="signin-preview-lines"><i /><i /><i /></span>
              </article>
              <article className="signin-preview-card signin-preview-appointments">
                <span className="signin-preview-icon signin-icon-teal"><CalendarDays size={17} /></span>
                <div><strong>Appointments</strong><small>Clinic schedule & visit status</small></div>
                <span className="signin-preview-accent" />
              </article>
              <article className="signin-preview-card signin-preview-care">
                <span className="signin-preview-icon signin-icon-blue"><ClipboardCheck size={17} /></span>
                <div><strong>Care plans</strong><small>Guidance for each journey</small></div>
                <span className="signin-preview-accent signin-accent-short" />
              </article>
            </div>
            <div className="signin-preview-foot"><span className="signin-preview-check"><ShieldCheck size={13} /></span><span>Role-based access for your clinic team</span><span className="signin-preview-foot-line" /></div>
          </div>
        </div>
        <div className="signin-foot"><span>Dr. Hair Clinical Admin Panel</span><span>Version 2.0.0</span></div>
      </section>

      <section className="signin-side">
        <div className="signin-form-wrap">
          <div className="signin-mobile-brand"><BrandLogo width={142} priority /></div>
          <h2>Welcome back</h2>
          <p className="signin-subtitle">Sign in with the admin credentials provided by your Super Admin.</p>

          <form onSubmit={signIn} className="signin-form">
            <label className="signin-field">
              <span>Email or admin ID</span>
              <div><KeyRound size={15} /><input autoCapitalize="none" autoCorrect="off" autoComplete="username" value={loginId} onChange={(event) => setLoginId(event.target.value)} type="text" placeholder="name@clinic.com" required /></div>
            </label>
            <label className="signin-field">
              <span>Password</span>
              <div><ShieldCheck size={15} /><input autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} type={showPassword ? "text" : "password"} placeholder="Enter your password" required /><button className="signin-password-toggle" type="button" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div>
            </label>

            {error && <p className="signin-error" role="alert">{error}</p>}

            <button disabled={busy} type="submit" className="button button-primary signin-submit disabled:opacity-60">
              <span>{busy ? "Signing in…" : "Sign in to workspace"}</span>
              {!busy && <ArrowRight size={15} />}
            </button>
          </form>

          <div className="signin-secure"><ShieldCheck size={14} /><span>Your password is checked securely and never saved in this browser.</span></div>
          <div className="signin-help"><span className="signin-help-icon"><KeyRound size={14} /></span><span><strong>Need a staff login?</strong><small>Ask your Super Admin to create your account.</small></span><ArrowUpRight size={14} /></div>
        </div>
      </section>
    </main>
  );
}
