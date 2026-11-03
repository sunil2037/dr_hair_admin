import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, backendUrl, noStoreJson, readJson } from "@/app/api/_lib/backend";

async function adminToken() {
  return (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const token = await adminToken();
  if (!token) return noStoreJson({ message: "Sign in as Super Admin to change account status." }, 401);

  const { id } = await context.params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return noStoreJson({ message: "Invalid status payload." }, 400);
  }

  try {
    const upstream = await fetch(backendUrl(`/api/v1/admin/accounts/${encodeURIComponent(id)}/status`), {
      method: "PATCH",
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
    return noStoreJson({ message: "Admin status could not be updated." }, 503);
  }
}
