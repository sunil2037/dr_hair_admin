import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, backendUrl, noStoreJson, readJson } from "@/app/api/_lib/backend";

async function adminToken() {
  return (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
}

async function handleUpdate(request: Request, context: { params: Promise<{ id: string }> }) {
  const token = await adminToken();
  if (!token) return noStoreJson({ message: "Sign in as Super Admin to manage access." }, 401);

  const { id } = await context.params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return noStoreJson({ message: "Invalid access update payload." }, 400);
  }

  try {
    const upstream = await fetch(backendUrl(`/api/v1/admin/accounts/${encodeURIComponent(id)}/access`), {
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
    return noStoreJson({ message: "Admin access could not be updated." }, 503);
  }
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  return handleUpdate(request, context);
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  return handleUpdate(request, context);
}
