import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, backendUrl, noStoreJson, readJson } from "../../../_lib/backend";

async function adminToken() {
  return (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const token = await adminToken();
  if (!token) return noStoreJson({ message: "Sign in to update coupons." }, 401);

  const { id } = await context.params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return noStoreJson({ message: "Send coupon updates as JSON." }, 400);
  }

  try {
    const upstream = await fetch(backendUrl(`/api/v1/admin/coupons/${encodeURIComponent(id)}`), {
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
    return noStoreJson({ message: "Coupons service is temporarily unavailable." }, 503);
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const token = await adminToken();
  if (!token) return noStoreJson({ message: "Sign in to delete coupons." }, 401);

  const { id } = await context.params;
  try {
    const upstream = await fetch(backendUrl(`/api/v1/admin/coupons/${encodeURIComponent(id)}`), {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });
    return noStoreJson(await readJson(upstream), upstream.status);
  } catch {
    return noStoreJson({ message: "Coupons service is temporarily unavailable." }, 503);
  }
}

