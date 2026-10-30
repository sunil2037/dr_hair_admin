"use client";

import { ArrowRight, KeyRound, ShieldCheck } from "lucide-react";
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
    <main className="signin-page min-h-screen lg:grid lg:grid-cols-2">
      <section className="signin-visual hidden lg:flex">
        <div className="brand signin-brand"><BrandLogo width={158} priority /></div>
        <div className="signin-message">
          <span className="signin-tag"><span className="signin-dot" />Clinical care, thoughtfully managed</span>
          <h1>Better care starts with a clearer view.</h1>
          <p>A private workspace for the Dr. Hair clinic team to support every patient journey.</p>
          <div className="signin-illustration">
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <div className="care-symbol"><ShieldCheck size={27} /></div>
            <div className="float-card float-card-one">
              <span className="float-icon"><ShieldCheck size={15} /></span>
              <span><strong>Password-protected access</strong><small>Admin and Super Admin roles</small></span>
            </div>
          </div>
        </div>
        <div className="signin-foot"><span>Dr. Hair Clinical Admin Panel</span><span>Version 2.0.0</span></div>
      </section>

      <section className="signin-side">
        <div className="signin-form-wrap max-w-[420px] w-full">
          <div className="signin-mobile-brand"><BrandLogo width={142} priority /></div>
          <div className="signin-kicker">TEAM WORKSPACE</div>
          <h2>Welcome back</h2>
          <p className="signin-subtitle">Sign in with the admin credentials provided by your Super Admin.</p>

          <form onSubmit={signIn} className="space-y-3.5">
            <label className="signin-field">
              <span>Email or admin ID</span>
              <div><KeyRound size={15} /><input autoComplete="username" value={loginId} onChange={(event) => setLoginId(event.target.value)} type="text" placeholder="name@clinic.com" required /></div>
            </label>
            <label className="signin-field">
              <span>Password</span>
              <div><ShieldCheck size={15} /><input autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} type="password" placeholder="Enter your password" required /></div>
            </label>

            {error && <p className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-800" role="alert">{error}</p>}

            <button disabled={busy} type="submit" className="button button-primary signin-submit flex items-center justify-center gap-2 disabled:opacity-60">
              {busy ? "Signing in…" : "Sign in"}
              {!busy && <ArrowRight size={15} />}
            </button>
          </form>

          <div className="signin-secure mt-4"><ShieldCheck size={14} /><span>Your password is checked securely and never saved in this browser.</span></div>
        </div>
      </section>
    </main>
  );
}
