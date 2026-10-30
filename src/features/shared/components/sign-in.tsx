"use client";

import { ArrowRight, ChevronLeft, Mail, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { BrandLogo } from "./brand-logo";

export type AdminIdentity = {
  email: string;
  name?: string | null;
  role: "admin";
};

export function SignIn({
  onAuthenticated,
}: {
  onAuthenticated: (admin: AdminIdentity) => void;
}) {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [resendCountdown, setResendCountdown] = useState(0);

  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = window.setTimeout(() => setResendCountdown((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [resendCountdown]);

  async function requestCode() {
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError("Enter a valid work email address.");
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail }),
        cache: "no-store",
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message || "Could not send a verification code.");
      setEmail(normalizedEmail);
      setOtp("");
      setNotice(result.message || `Verification code sent to ${normalizedEmail}.`);
      setResendCountdown(30);
      setStep("otp");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not send a verification code.");
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!/^\d{6}$/.test(otp)) {
      setError("Enter the six-digit verification code.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), otp }),
        cache: "no-store",
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.authenticated !== true || !result.admin) {
        throw new Error(result.message || "The code could not be verified.");
      }
      onAuthenticated(result.admin as AdminIdentity);
    } catch (verifyError) {
      setError(verifyError instanceof Error ? verifyError.message : "The code could not be verified.");
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
              <span><strong>Verified team access</strong><small>One-time code sign-in</small></span>
            </div>
          </div>
        </div>
        <div className="signin-foot"><span>Dr. Hair Clinical Admin Panel</span><span>Version 2.0.0</span></div>
      </section>

      <section className="signin-side">
        <div className="signin-form-wrap max-w-[420px] w-full">
          <div className="signin-mobile-brand"><BrandLogo width={142} priority /></div>
          <div className="signin-kicker">TEAM WORKSPACE</div>
          <h2>{step === "email" ? "Welcome back" : "Verify your email"}</h2>
          <p className="signin-subtitle">
            {step === "email"
              ? "Sign in with an email address approved by your clinic owner."
              : `Enter the six-digit code sent to ${email}.`}
          </p>

          <form onSubmit={step === "email" ? (event) => { event.preventDefault(); void requestCode(); } : verifyCode} className="space-y-3.5">
            {step === "email" ? (
              <label className="signin-field">
                <span>Work email</span>
                <div><Mail size={15} /><input autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="name@clinic.com" required /></div>
              </label>
            ) : (
              <>
                <label className="signin-field">
                  <span>Six-digit verification code</span>
                  <div><ShieldCheck size={15} /><input autoComplete="one-time-code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="••••••" required /></div>
                </label>
                {notice && <p className="text-xs text-slate-600" role="status">{notice}</p>}
              </>
            )}

            {error && <p className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-800" role="alert">{error}</p>}

            <button disabled={busy} type="submit" className="button button-primary signin-submit flex items-center justify-center gap-2 disabled:opacity-60">
              {busy ? "Please wait…" : step === "email" ? "Send verification code" : "Verify and continue"}
              {!busy && <ArrowRight size={15} />}
            </button>
          </form>

          {step === "otp" && (
            <div className="mt-3 flex items-center justify-between text-xs">
              <button type="button" className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900" onClick={() => { setStep("email"); setError(""); setNotice(""); }}>
                <ChevronLeft size={14} /> Change email
              </button>
              <button type="button" disabled={busy || resendCountdown > 0} className="text-teal-700 disabled:text-slate-400" onClick={() => void requestCode()}>
                {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : "Resend code"}
              </button>
            </div>
          )}

          <div className="signin-secure mt-4"><ShieldCheck size={14} /><span>Only allowlisted admin email addresses can sign in.</span></div>
        </div>
        <div className="signin-legal mt-4">© 2026 Dr. Hair <span>•</span> Terms <span>•</span> Privacy</div>
      </section>
    </main>
  );
}
