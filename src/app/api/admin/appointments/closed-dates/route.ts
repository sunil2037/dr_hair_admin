import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, backendUrl, noStoreJson, readJson } from "../../../_lib/backend";

export async function GET() {
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return noStoreJson({ message: "Sign in to view clinic availability." }, 401);
  try {
    const upstream = await fetch(backendUrl("/api/v1/admin/appointments/closed-dates"), { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" }, cache: "no-store" });
    return noStoreJson(await readJson(upstream), upstream.status);
  } catch { return noStoreJson({ message: "Clinic availability is temporarily unavailable." }, 503); }
}

export async function POST(request: Request) {
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return noStoreJson({ message: "Sign in to change clinic availability." }, 401);
  let body: unknown;
  try { body = await request.json(); } catch { return noStoreJson({ message: "Send the clinic date as JSON." }, 400); }
  try {
    const upstream = await fetch(backendUrl("/api/v1/admin/appointments/closed-dates"), { method: "POST", headers: { Authorization: `Bearer ${token}`, Accept: "application/json", "Content-Type": "application/json" }, body: JSON.stringify(body), cache: "no-store" });
    return noStoreJson(await readJson(upstream), upstream.status);
  } catch { return noStoreJson({ message: "Clinic availability could not be changed." }, 503); }
}
