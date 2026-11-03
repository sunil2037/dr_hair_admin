import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, backendUrl, noStoreJson, readJson } from "@/app/api/_lib/backend";

async function adminToken() {
  return (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
}

export async function GET() {
  const token = await adminToken();
  if (!token) {
    return noStoreJson({ message: "Sign in to access dashboard analytics." }, 401);
  }

  try {
    const upstream = await fetch(backendUrl("/api/v1/admin/dashboard/summary"), {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });
    return noStoreJson(await readJson(upstream), upstream.status);
  } catch {
    return noStoreJson({ message: "Dashboard summary is temporarily unavailable." }, 503);
  }
}
