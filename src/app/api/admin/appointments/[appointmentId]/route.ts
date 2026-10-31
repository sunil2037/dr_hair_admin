import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, backendUrl, noStoreJson, readJson } from "../../../_lib/backend";

type RouteContext = { params: Promise<{ appointmentId: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return noStoreJson({ message: "Sign in to update this appointment." }, 401);
  const { appointmentId } = await params;
  let body: unknown;
  try { body = await request.json(); } catch { return noStoreJson({ message: "Send appointment changes as JSON." }, 400); }
  try {
    const upstream = await fetch(backendUrl(`/api/v1/admin/appointments/${encodeURIComponent(appointmentId)}`), { method: "PATCH", headers: { Authorization: `Bearer ${token}`, Accept: "application/json", "Content-Type": "application/json" }, body: JSON.stringify(body), cache: "no-store" });
    return noStoreJson(await readJson(upstream), upstream.status);
  } catch { return noStoreJson({ message: "Appointment could not be updated." }, 503); }
}
