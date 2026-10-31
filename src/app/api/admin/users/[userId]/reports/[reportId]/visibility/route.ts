import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, backendUrl, noStoreJson, readJson } from "../../../../../../_lib/backend";

type RouteContext = { params: Promise<{ userId: string; reportId: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return noStoreJson({ message: "Sign in to change patient report visibility." }, 401);
  let body: unknown;
  try { body = await request.json(); } catch { return noStoreJson({ message: "Send the report visibility as JSON." }, 400); }
  const { userId, reportId } = await params;
  try {
    const upstream = await fetch(backendUrl(`/api/v1/admin/users/${encodeURIComponent(userId)}/reports/${encodeURIComponent(reportId)}/visibility`), {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    return noStoreJson(await readJson(upstream), upstream.status);
  } catch {
    return noStoreJson({ message: "Patient report visibility could not be updated." }, 503);
  }
}
