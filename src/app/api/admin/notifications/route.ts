import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, backendUrl, noStoreJson, readJson } from "../../_lib/backend";

async function adminToken() {
  return (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
}

export async function GET(request: Request) {
  const token = await adminToken();
  const { searchParams } = new URL(request.url);
  const queryString = searchParams.toString();
  const path = queryString ? `/api/v1/admin/notifications/history?${queryString}` : "/api/v1/admin/notifications/history";

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
    return noStoreJson({ message: "The notification service is temporarily unavailable." }, 503);
  }
}

export async function POST(request: Request) {
  const token = await adminToken();
  if (!token) return noStoreJson({ message: "Sign in to manage notifications." }, 401);

  let body: any;
  try {
    body = await request.json();
  } catch {
    return noStoreJson({ message: "Send notification details as JSON." }, 400);
  }

  const endpoint = body?.user_id
    ? "/api/v1/admin/notifications/send-to-user"
    : "/api/v1/admin/notifications/broadcast";

  try {
    const upstream = await fetch(backendUrl(endpoint), {
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
    return noStoreJson({ message: "The notification service is temporarily unavailable." }, 503);
  }
}
