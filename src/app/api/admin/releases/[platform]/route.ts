import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, backendUrl, noStoreJson, readJson } from "@/app/api/_lib/backend";

async function adminToken() {
  return (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
}

export async function PUT(request: Request, context: { params: Promise<{ platform: string }> }) {
  const token = await adminToken();
  if (!token) return noStoreJson({ message: "Sign in to update release policies." }, 401);

  const { platform } = await context.params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return noStoreJson({ message: "Invalid release policy payload." }, 400);
  }

  try {
    const upstream = await fetch(backendUrl(`/api/v1/admin/releases/${encodeURIComponent(platform)}`), {
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
    return noStoreJson({ message: "Release policy could not be updated." }, 503);
  }
}
