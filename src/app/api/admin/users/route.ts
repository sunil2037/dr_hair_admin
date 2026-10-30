import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, backendUrl, noStoreJson, readJson } from "../../_lib/backend";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return noStoreJson({ message: "Sign in to view patient profiles." }, 401);

  const incomingUrl = new URL(request.url);
  const query = new URLSearchParams();
  for (const key of ["page", "limit", "search"]) {
    const value = incomingUrl.searchParams.get(key);
    if (value) query.set(key, value);
  }

  try {
    const queryString = query.toString();
    const suffix = queryString ? `?${queryString}` : "";
    const upstream = await fetch(backendUrl(`/api/v1/admin/users${suffix}`), {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      cache: "no-store",
    });
    const result = await readJson(upstream);
    return noStoreJson(result, upstream.status);
  } catch {
    return noStoreJson({ message: "Patient profiles are temporarily unavailable." }, 503);
  }
}
