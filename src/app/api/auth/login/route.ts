import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, apiMessage, backendUrl, noStoreJson, readJson } from "../../_lib/backend";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return noStoreJson({ message: "Enter your admin ID/email and password." }, 400);
  }

  const data = body && typeof body === "object" ? body as { email?: unknown; password?: unknown } : {};
  const email = typeof data.email === "string" ? data.email.trim().toLowerCase() : "";
  const password = typeof data.password === "string" ? data.password : "";
  if (!email || email.length > 254 || /\s/.test(email) || !password || password.length > 256) {
    return noStoreJson({ message: "Enter your admin ID/email and password." }, 400);
  }

  try {
    const upstream = await fetch(backendUrl("/api/v1/admin-auth/login"), {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
    });
    const result = await readJson(upstream);
    if (!upstream.ok) {
      return noStoreJson({ message: apiMessage(result, "Admin ID or password is incorrect.") }, upstream.status);
    }

    const data = result.data && typeof result.data === "object" ? result.data as Record<string, unknown> : {};
    const admin = data.admin && typeof data.admin === "object" ? data.admin as Record<string, unknown> : {};
    const token = typeof data.token === "string" ? data.token : "";
    const role = admin.role;
    if (
      !token
      || typeof admin.email !== "string"
      || (role !== "admin" && role !== "super_admin")
    ) {
      return noStoreJson({ message: "The sign-in service returned an invalid admin session." }, 502);
    }

    const response = NextResponse.json(
      {
        authenticated: true,
        admin: {
          id: typeof admin.id === "string" ? admin.id : "",
          email: admin.email,
          name: typeof admin.name === "string" ? admin.name : null,
          role,
        },
      },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
    response.cookies.set(ADMIN_SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 12 * 60 * 60,
    });
    return response;
  } catch {
    return noStoreJson({ message: "The sign-in service is unavailable. Try again shortly." }, 503);
  }
}
