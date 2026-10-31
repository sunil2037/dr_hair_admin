import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, backendUrl, noStoreJson, readJson } from "../../../../../../_lib/backend";

type RouteContext = { params: Promise<{ userId: string; reportId: string }> };

export async function POST(_request: Request, { params }: RouteContext) {
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return noStoreJson({ message: "Sign in to restore this report." }, 401);
  const { userId, reportId } = await params;
  try {
    const upstream = await fetch(backendUrl(`/api/v1/admin/users/${encodeURIComponent(userId)}/reports/${encodeURIComponent(reportId)}/restore`), { method: "POST", headers: { Authorization: `Bearer ${token}`, Accept: "application/json" }, cache: "no-store" });
    return noStoreJson(await readJson(upstream), upstream.status);
  } catch { return noStoreJson({ message: "The archived report could not be restored." }, 503); }
}
