import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, backendUrl, noStoreJson, readJson } from "../../_lib/backend";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return noStoreJson({ authenticated: false }, 401);

  try {
    const upstream = await fetch(backendUrl("/api/v1/admin/me"), {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      cache: "no-store",
    });
    const result = await readJson(upstream);
    const identity = result.data && typeof result.data === "object" ? result.data as Record<string, unknown> : {};
    if (
      upstream.ok
      && result.status === "success"
      && typeof identity.email === "string"
      && (identity.role === "admin" || identity.role === "super_admin")
    ) {
      return noStoreJson({ authenticated: true, admin: identity });
    }
    if (upstream.status >= 500) {
      return noStoreJson({ authenticated: false, message: "The sign-in service is temporarily unavailable." }, 503);
    }

    const response = NextResponse.json(
      { authenticated: false },
      { status: 401, headers: { "Cache-Control": "no-store, max-age=0" } },
    );
    response.cookies.set(ADMIN_SESSION_COOKIE, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 0,
    });
    return response;
  } catch {
    return noStoreJson({ authenticated: false, message: "The sign-in service is temporarily unavailable." }, 503);
  }
}
