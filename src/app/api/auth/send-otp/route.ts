import { NextRequest } from "next/server";
import { apiMessage, backendUrl, noStoreJson, readJson } from "../../_lib/backend";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return noStoreJson({ message: "Enter a valid work email address." }, 400);
  }

  const login = body && typeof body === "object" && "email" in body
    ? String((body as { email?: unknown }).email ?? "").trim().toLowerCase()
    : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(login)) {
    return noStoreJson({ message: "Enter a valid work email address." }, 400);
  }

  try {
    const upstream = await fetch(backendUrl("/api/v1/auth/send_login_otp"), {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ login }),
      cache: "no-store",
    });
    const result = await readJson(upstream);
    return noStoreJson(
      { message: apiMessage(result, upstream.ok ? "Verification code sent." : "Could not send a code.") },
      upstream.status,
    );
  } catch {
    return noStoreJson({ message: "The sign-in service is unavailable. Try again shortly." }, 503);
  }
}
