import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, backendUrl, noStoreJson, readJson } from "../../_lib/backend";

export async function GET(request: Request) {
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return noStoreJson({ message: "Sign in to view orders." }, 401);
  const query = new URL(request.url).search;
  try {
    const upstream = await fetch(backendUrl(`/api/v1/admin/orders${query}`), {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      cache: "no-store",
    });
    return noStoreJson(await readJson(upstream), upstream.status);
  } catch {
    return noStoreJson({ message: "Commerce orders are temporarily unavailable." }, 503);
  }
}
