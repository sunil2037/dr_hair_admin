import { NextRequest, NextResponse } from "next/server";
import { apiMessage, ADMIN_SESSION_COOKIE, backendUrl, noStoreJson, readJson } from "../../_lib/backend";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return noStoreJson({ message: "Enter the six-digit verification code." }, 400);
  }

  const data = body && typeof body === "object" ? body as { email?: unknown; otp?: unknown } : {};
  const login = String(data.email ?? "").trim().toLowerCase();
  const otp = String(data.otp ?? "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(login) || !/^\d{6}$/.test(otp)) {
    return noStoreJson({ message: "Enter a valid work email and six-digit code." }, 400);
  }

  try {
    const upstream = await fetch(backendUrl("/api/v1/auth/verify_login_otp"), {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ login, otp }),
      cache: "no-store",
    });
    const result = await readJson(upstream);
    if (!upstream.ok) {
      return noStoreJson({ message: apiMessage(result, "The code could not be verified.") }, upstream.status);
    }
    if (result.is_admin !== true || typeof result.token !== "string" || !result.token) {
      return noStoreJson({ message: "This email is not approved for admin access. Contact the account owner." }, 403);
    }

    const response = NextResponse.json(
      { authenticated: true, admin: { email: login, role: "admin" } },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
    response.cookies.set(ADMIN_SESSION_COOKIE, result.token, {
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
