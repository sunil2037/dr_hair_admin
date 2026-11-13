import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, fetchBackend, noStoreJson, readJson } from "../../../_lib/backend";

type RouteContext = { params: Promise<{ id: string }> };

async function adminToken() {
  return (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
}

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  if (!id) return noStoreJson({ message: "Product ID is required." }, 400);

  try {
    const upstream = await fetchBackend(`/api/v1/products/${encodeURIComponent(id)}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    return noStoreJson(await readJson(upstream), upstream.status);
  } catch {
    return noStoreJson({ message: "The product service is temporarily unavailable." }, 503);
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const token = await adminToken();
  if (!token) return noStoreJson({ message: "Sign in to update products." }, 401);
  const { id } = await params;
  if (!id) return noStoreJson({ message: "Product ID is required." }, 400);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return noStoreJson({ message: "Send product updates as JSON." }, 400);
  }

  try {
    const upstream = await fetchBackend(`/api/v1/admin/products/${encodeURIComponent(id)}`, {
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
    return noStoreJson({ message: "The product service is temporarily unavailable." }, 503);
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const token = await adminToken();
  if (!token) return noStoreJson({ message: "Sign in to delete products." }, 401);
  const { id } = await params;
  if (!id) return noStoreJson({ message: "Product ID is required." }, 400);

  try {
    const upstream = await fetchBackend(`/api/v1/admin/products/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });
    return noStoreJson(await readJson(upstream), upstream.status);
  } catch {
    return noStoreJson({ message: "The product service is temporarily unavailable." }, 503);
  }
}
