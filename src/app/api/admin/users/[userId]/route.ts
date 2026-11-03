import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, backendUrl, noStoreJson, readJson } from "../../../_lib/backend";

type RouteContext = { params: Promise<{ userId: string }> };

async function adminToken(request: Request) {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (cookieToken) return cookieToken;
  const authHeader = request.headers.get("authorization") || request.headers.get("Authorization");
  if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
    return authHeader.slice(7).trim();
  }
  return undefined;
}

export async function GET(request: Request, { params }: RouteContext) {
  const token = await adminToken(request);
  if (!token) return noStoreJson({ message: "Sign in to view patient details." }, 401);
  const { userId } = await params;
  try {
    const upstream = await fetch(backendUrl(`/api/v1/admin/users/${encodeURIComponent(userId)}`), { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" }, cache: "no-store" });
    return noStoreJson(await readJson(upstream), upstream.status);
  } catch {
    return noStoreJson({ message: "Patient details are temporarily unavailable." }, 503);
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const token = await adminToken(request);
  if (!token) return noStoreJson({ message: "Sign in to update patient details." }, 401);
  const { userId } = await params;
  let body: unknown;
  try { body = await request.json(); } catch { return noStoreJson({ message: "Send profile fields as JSON." }, 400); }
  try {
    const upstream = await fetch(backendUrl(`/api/v1/admin/users/${encodeURIComponent(userId)}`), { method: "PATCH", headers: { Authorization: `Bearer ${token}`, Accept: "application/json", "Content-Type": "application/json" }, body: JSON.stringify(body), cache: "no-store" });
    return noStoreJson(await readJson(upstream), upstream.status);
  } catch {
    return noStoreJson({ message: "Patient profile could not be updated." }, 503);
  }
}

export async function DELETE(request: Request, { params }: RouteContext) {
  const token = await adminToken(request);
  if (!token) return noStoreJson({ message: "Sign in as Super Admin to delete user account." }, 401);
  const { userId } = await params;
  try {
    const upstream = await fetch(backendUrl(`/api/v1/admin/users/${encodeURIComponent(userId)}`), {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      cache: "no-store",
    });
    return noStoreJson(await readJson(upstream), upstream.status);
  } catch {
    return noStoreJson({ message: "User account could not be deleted." }, 503);
  }
}
