import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, backendUrl, noStoreJson, readJson } from "@/app/api/_lib/backend";

async function adminToken() {
  return (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const token = await adminToken();
  if (!token) return noStoreJson({ message: "Sign in as Super Admin to rotate passwords." }, 401);

  const { id } = await context.params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return noStoreJson({ message: "Invalid password rotation payload." }, 400);
  }

  try {
    const upstream = await fetch(backendUrl(`/api/v1/admin/accounts/${encodeURIComponent(id)}/rotate-password`), {
      method: "POST",
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
    return noStoreJson({ message: "Admin password could not be rotated." }, 503);
  }
}
