import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, backendUrl, noStoreJson, readJson } from "../../../../_lib/backend";

type RouteContext = { params: Promise<{ date: string }> };

export async function DELETE(_request: Request, { params }: RouteContext) {
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return noStoreJson({ message: "Sign in to reopen clinic availability." }, 401);
  const { date } = await params;
  try {
    const upstream = await fetch(backendUrl(`/api/v1/admin/appointments/closed-dates/${encodeURIComponent(date)}`), { method: "DELETE", headers: { Authorization: `Bearer ${token}`, Accept: "application/json" }, cache: "no-store" });
    return noStoreJson(await readJson(upstream), upstream.status);
  } catch { return noStoreJson({ message: "Clinic date could not be reopened." }, 503); }
}
