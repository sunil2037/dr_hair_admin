import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, backendUrl, noStoreJson, readJson } from "@/app/api/_lib/backend";

async function adminToken() {
  return (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
}

export async function PATCH(request: Request, context: { params: Promise<{ key: string }> }) {
  const token = await adminToken();
  if (!token) return noStoreJson({ message: "Sign in to update feature flags." }, 401);

  const { key } = await context.params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return noStoreJson({ message: "Invalid feature update payload." }, 400);
  }

  try {
    const upstream = await fetch(backendUrl(`/api/v1/admin/features/${encodeURIComponent(key)}`), {
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
    return noStoreJson({ message: "Feature flag could not be updated." }, 503);
  }
}
