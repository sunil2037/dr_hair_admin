"use client";

import { Copy, KeyRound, Plus, ShieldCheck, UsersRound } from "lucide-react";
import { useEffect, useState } from "react";
import { PageHeader } from "../../shared/components/ui";

type Account = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "super_admin";
  active: boolean;
  created_at: string | null;
};

type Credentials = { loginId: string; password: string };

export function AdminAccountManagement() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/admin/accounts", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.message || "Could not load admin accounts.");
        return result;
      })
      .then((result) => setAccounts(Array.isArray(result?.data?.items) ? result.data.items as Account[] : []))
      .catch((loadError) => {
        if (!controller.signal.aborted) {
          setError(loadError instanceof Error ? loadError.message : "Could not load admin accounts.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  async function createAccount(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    setCredentials(null);
    try {
      const response = await fetch("/api/admin/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim().toLowerCase() }),
        cache: "no-store",
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message || "Could not create the admin account.");

      const created = result?.data?.admin as Account | undefined;
      const issued = result?.data?.credentials as { login_id?: unknown; password?: unknown } | undefined;
      if (!created || typeof issued?.login_id !== "string" || typeof issued.password !== "string") {
        throw new Error("The server did not return the new admin credentials.");
      }
      setAccounts((current) => [created, ...current.filter((item) => item.email !== created.email)]);
      setCredentials({ loginId: issued.login_id, password: issued.password });
      setName("");
      setEmail("");
      setNotice("Copy these credentials now. The generated password is shown only once.");
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Could not create the admin account.");
    } finally {
      setBusy(false);
    }
  }

  async function copyCredentials() {
    if (!credentials) return;
    try {
      await navigator.clipboard.writeText(`Login ID: ${credentials.loginId}\nPassword: ${credentials.password}`);
      setNotice("Credentials copied. Share them privately with the new admin.");
    } catch {
      setNotice("Copy is unavailable here. Select the credentials and share them privately.");
    }
  }

  return (
    <main className="page-wrap mx-auto w-full max-w-[1420px] px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader eyebrow="Management · Super Admin" title="Admin accounts" description="Create staff logins and share each generated password privately." />

      <div className="notice" style={{ marginBottom: 15 }}>
        <ShieldCheck size={14} />
        <span>Only a signed-in Super Admin can create admin accounts. Passwords are stored as hashes and are not shown again after this screen closes.</span>
      </div>

      <section className="card" style={{ marginBottom: 16 }}>
        <div className="section-row">
          <div><h2 className="card-title">Create an admin login</h2><p className="card-note">The work email is the login ID; a secure temporary password is generated automatically.</p></div>
        </div>
        <form onSubmit={createAccount} className="access-identity-grid grid min-w-0 grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
          <div className="field"><label htmlFor="admin-account-name">Full name</label><input id="admin-account-name" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Aisha Khan" required maxLength={100} /></div>
          <div className="field"><label htmlFor="admin-account-email">Work email / login ID</label><input id="admin-account-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@clinic.com" required /></div>
          <div className="flex min-w-0 items-end"><button className="button button-primary w-full sm:w-auto lg:w-full" type="submit" disabled={busy}><Plus size={15} />{busy ? "Creating…" : "Generate admin login"}</button></div>
        </form>

        {error && <p className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">{error}</p>}
        {notice && <p className="mt-3 text-sm text-slate-600" role="status">{notice}</p>}
        {credentials && <div className="mt-4 rounded-xl border border-teal-200 bg-teal-50 p-4" aria-label="Generated admin credentials">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-teal-950"><KeyRound size={16} />New admin credentials</div>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div><dt className="text-xs text-slate-600">Login ID</dt><dd className="mt-1 break-all font-medium text-slate-900">{credentials.loginId}</dd></div>
            <div><dt className="text-xs text-slate-600">Generated password</dt><dd className="mt-1 break-all font-mono font-medium text-slate-900">{credentials.password}</dd></div>
          </dl>
          <button className="button button-secondary button-small mt-3" type="button" onClick={() => void copyCredentials()}><Copy size={13} />Copy credentials</button>
        </div>}
      </section>

      <section className="card">
        <div className="section-row"><div><h2 className="card-title">Team access</h2><p className="card-note">Admin accounts that can access the clinic workspace</p></div><span className="role-demo"><UsersRound size={13} />{accounts.length} accounts</span></div>
        <div className="table-wrap"><table><thead><tr><th>Name</th><th>Login ID</th><th>Role</th><th>Status</th></tr></thead><tbody>
          {accounts.map((account) => <tr key={account.id}><td><strong>{account.name}</strong></td><td>{account.email}</td><td>{account.role === "super_admin" ? "Super Admin" : "Admin"}</td><td><span className={`status ${account.active ? "status-active" : "status-inactive"}`}>{account.active ? "Active" : "Suspended"}</span></td></tr>)}
          {!loading && accounts.length === 0 && <tr><td colSpan={4}><div className="empty-state">No admin accounts are configured.</div></td></tr>}
          {loading && <tr><td colSpan={4}><div className="empty-state">Loading admin accounts…</div></td></tr>}
          {error && accounts.length === 0 && !loading && <tr><td colSpan={4}><div className="empty-state">Account list could not be loaded.</div></td></tr>}
        </tbody></table></div>
      </section>
    </main>
  );
}
