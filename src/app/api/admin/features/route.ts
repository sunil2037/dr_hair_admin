import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, backendUrl, noStoreJson, readJson } from "@/app/api/_lib/backend";

async function adminToken() {
  return (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
}

export async function GET(request: Request) {
  const token = await adminToken();
  if (!token) return noStoreJson({ message: "Sign in to view feature flags." }, 401);

  const { searchParams } = new URL(request.url);
  const platform = searchParams.get("platform");
  const query = platform ? `?platform=${encodeURIComponent(platform)}` : "";

  try {
    const upstream = await fetch(backendUrl(`/api/v1/admin/features${query}`), {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      cache: "no-store",
    });
    return noStoreJson(await readJson(upstream), upstream.status);
  } catch {
    return noStoreJson({ message: "Feature flags are temporarily unavailable." }, 503);
  }
}
