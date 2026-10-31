import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, backendUrl, noStoreJson, readJson } from "../../../../_lib/backend";

type RouteContext = { params: Promise<{ userId: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return noStoreJson({ message: "Sign in to view archived patient reports." }, 401);
  const { userId } = await params;
  try {
    const upstream = await fetch(backendUrl(`/api/v1/admin/users/${encodeURIComponent(userId)}/archive`), { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" }, cache: "no-store" });
    return noStoreJson(await readJson(upstream), upstream.status);
  } catch { return noStoreJson({ message: "Archived reports are temporarily unavailable." }, 503); }
}
