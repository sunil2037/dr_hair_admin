import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, backendUrl, noStoreJson, readJson } from "@/app/api/_lib/backend";

async function adminToken() {
  return (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
}

export async function GET(request: Request) {
  const token = await adminToken();
  if (!token) return noStoreJson({ message: "Sign in as Super Admin to view audit logs." }, 401);

  const { searchParams } = new URL(request.url);
  const query = searchParams.toString() ? `?${searchParams.toString()}` : "";

  try {
    const upstream = await fetch(backendUrl(`/api/v1/admin/audit-logs${query}`), {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      cache: "no-store",
    });
    return noStoreJson(await readJson(upstream), upstream.status);
  } catch {
    return noStoreJson({ message: "Audit logs are temporarily unavailable." }, 503);
  }
}
