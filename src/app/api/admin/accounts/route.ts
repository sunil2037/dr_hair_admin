import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, backendUrl, noStoreJson, readJson } from "../../_lib/backend";

async function adminToken() {
  return (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
}

export async function GET() {
  const token = await adminToken();
  if (!token) return noStoreJson({ message: "Sign in as Super Admin to view team accounts." }, 401);
  try {
    const upstream = await fetch(backendUrl("/api/v1/admin/accounts"), {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      cache: "no-store",
    });
    return noStoreJson(await readJson(upstream), upstream.status);
  } catch {
    return noStoreJson({ message: "Admin accounts are temporarily unavailable." }, 503);
  }
}

export async function POST(request: Request) {
  const token = await adminToken();
  if (!token) return noStoreJson({ message: "Sign in as Super Admin to create admin accounts." }, 401);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return noStoreJson({ message: "Enter the admin name and work email." }, 400);
  }
  const data = body && typeof body === "object" ? body as Record<string, unknown> : {};
  if (typeof data.name !== "string" || typeof data.email !== "string") {
    return noStoreJson({ message: "Enter the admin name and work email." }, 400);
  }

  const payload: Record<string, unknown> = {
    name: data.name,
    email: data.email,
  };
  if (typeof data.password === "string" && data.password.trim().length > 0) {
    payload.password = data.password.trim();
  }
  if (typeof data.roleTemplate === "string") {
    payload.roleTemplate = data.roleTemplate;
  }
  if (Array.isArray(data.permissions)) {
    payload.permissions = data.permissions;
  }
  if (data.permissionOverrides && typeof data.permissionOverrides === "object") {
    payload.permissionOverrides = data.permissionOverrides;
  }

  try {
    const upstream = await fetch(backendUrl("/api/v1/admin/accounts"), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    return noStoreJson(await readJson(upstream), upstream.status);
  } catch {
    return noStoreJson({ message: "Admin account could not be created. Try again." }, 503);
  }
}
