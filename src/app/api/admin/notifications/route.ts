import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, backendUrl, noStoreJson, readJson } from "../../_lib/backend";

async function adminToken() {
  return (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
}

export async function GET(request: Request) {
  const token = await adminToken();
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  let path = "/api/v1/admin/notifications/history";
  if (action === "audience-count") {
    const audience = searchParams.get("audience") || "All app users";
    path = `/api/v1/admin/notifications/audience-count?audience=${encodeURIComponent(audience)}`;
  } else {
    const queryString = searchParams.toString();
    path = queryString ? `/api/v1/admin/notifications/history?${queryString}` : "/api/v1/admin/notifications/history";
  }

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

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return noStoreJson({ message: "Send notification details as JSON." }, 400);
  }

  let endpoint = body?.user_id
    ? "/api/v1/admin/notifications/send-to-user"
    : "/api/v1/admin/notifications/broadcast";

  if (body?.action === "cancel" && body?.campaign_id) {
    endpoint = `/api/v1/admin/notifications/campaigns/${body.campaign_id}/cancel`;
  }

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
