import { NextResponse } from "next/server";

export const ADMIN_SESSION_COOKIE = "drhair_admin_session";

export const DEFAULT_PRODUCTION_BACKEND = "https://backend-ten-kappa-69.vercel.app";

export function backendUrl(path: string) {
  const origin = (process.env.DRHAIR_BACKEND_URL || DEFAULT_PRODUCTION_BACKEND).replace(/\/+$/, "");
  return `${origin}${path}`;
}

export async function fetchBackend(path: string, init?: RequestInit): Promise<Response> {
  return fetch(backendUrl(path), init);
}

export function noStoreJson(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}

export async function readJson(response: Response): Promise<Record<string, unknown>> {
  try {
    const value: unknown = await response.json();
    return value && typeof value === "object" ? value as Record<string, unknown> : {};
  } catch {
    return {};
  }
}

export function apiMessage(body: Record<string, unknown>, fallback: string) {
  return typeof body.message === "string" && body.message.trim()
    ? body.message
    : fallback;
}
