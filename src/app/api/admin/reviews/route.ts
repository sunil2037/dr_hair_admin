import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, backendUrl, noStoreJson, readJson } from "../_lib/backend";

export async function GET(request: Request) {
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return noStoreJson({ message: "Sign in to manage patient reviews." }, 401);

  const { searchParams } = new URL(request.url);
  const upstreamUrl = backendUrl(`/api/v1/admin/reviews?${searchParams.toString()}`);

  try {
    const upstream = await fetch(upstreamUrl, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      cache: "no-store",
    });
    return noStoreJson(await readJson(upstream), upstream.status);
  } catch {
    return noStoreJson({ message: "Reviews service is temporarily unavailable." }, 503);
  }
}

export async function PATCH(request: Request) {
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return noStoreJson({ message: "Sign in to moderate reviews." }, 401);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return noStoreJson({ message: "Send moderation action as JSON." }, 400);
  }

  try {
    const upstream = await fetch(backendUrl("/api/v1/admin/reviews/status"), {
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
    return noStoreJson({ message: "Failed to update review moderation status." }, 503);
  }
}
