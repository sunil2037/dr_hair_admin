import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, backendUrl, noStoreJson, readJson } from "../../../_lib/backend";

export async function GET() {
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return noStoreJson({ message: "Sign in to view appointment billing settings." }, 401);
  try {
    const upstream = await fetch(backendUrl("/api/v1/admin/appointment-billing"), {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      cache: "no-store",
    });
    return noStoreJson(await readJson(upstream), upstream.status);
  } catch {
    return noStoreJson({ message: "Appointment billing settings are temporarily unavailable." }, 503);
  }
}

export async function PUT(request: Request) {
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return noStoreJson({ message: "Sign in to update appointment billing settings." }, 401);
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return noStoreJson({ message: "Send billing settings as JSON." }, 400);
  }
  try {
    const upstream = await fetch(backendUrl("/api/v1/admin/appointment-billing"), {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    return noStoreJson(await readJson(upstream), upstream.status);
  } catch {
    return noStoreJson({ message: "Could not update appointment billing settings." }, 503);
  }
}

