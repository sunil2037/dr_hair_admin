import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, backendUrl, noStoreJson, readJson } from "@/app/api/_lib/backend";

async function adminToken() {
  return (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
}

export async function GET(request: Request, context: { params: Promise<{ type: string }> }) {
  const token = await adminToken();
  if (!token) return noStoreJson({ message: "Sign in to export operational data." }, 401);

  const { type } = await context.params;
  const safeType = encodeURIComponent(type);

  try {
    const upstream = await fetch(backendUrl(`/api/v1/admin/exports/${safeType}`), {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      cache: "no-store",
    });
    return noStoreJson(await readJson(upstream), upstream.status);
  } catch {
    return noStoreJson({ message: `Export for ${type} is temporarily unavailable.` }, 503);
  }
}
