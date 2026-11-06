import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, backendUrl, noStoreJson, readJson } from "../../_lib/backend";

async function adminToken() {
  return (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
}

export async function GET(request: Request) {
  const token = await adminToken();
  const { searchParams } = new URL(request.url);
  if (!searchParams.has("limit")) searchParams.set("limit", "100");
  if (!searchParams.has("status")) searchParams.set("status", "all");
  const queryString = searchParams.toString();
  const path = `/api/v1/admin/products?${queryString}`;

  try {
    const upstream = await fetch(backendUrl(path), {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        Accept: "application/json",
      },
      cache: "no-store",
    });
    return noStoreJson(await readJson(upstream), upstream.status);
  } catch {
    return noStoreJson({ message: "The product service is temporarily unavailable." }, 503);
  }
}

export async function POST(request: Request) {
  const token = await adminToken();
  if (!token) return noStoreJson({ message: "Sign in to add products." }, 401);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return noStoreJson({ message: "Send product details as JSON." }, 400);
  }

  try {
    const upstream = await fetch(backendUrl("/api/v1/admin/products"), {
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
    return noStoreJson({ message: "The product service is temporarily unavailable." }, 503);
  }
}
