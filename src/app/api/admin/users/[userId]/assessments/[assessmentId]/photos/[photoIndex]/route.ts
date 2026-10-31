import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, backendUrl, noStoreJson, readJson } from "../../../../../../../_lib/backend";

type RouteContext = { params: Promise<{ userId: string; assessmentId: string; photoIndex: string }> };

export async function DELETE(_request: Request, { params }: RouteContext) {
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return noStoreJson({ message: "Sign in to remove this scalp photo." }, 401);
  const { userId, assessmentId, photoIndex } = await params;
  try {
    const upstream = await fetch(backendUrl(`/api/v1/admin/users/${encodeURIComponent(userId)}/assessments/${encodeURIComponent(assessmentId)}/photos/${encodeURIComponent(photoIndex)}`), {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      cache: "no-store",
    });
    return noStoreJson(await readJson(upstream), upstream.status);
  } catch {
    return noStoreJson({ message: "The scalp photo could not be removed right now." }, 503);
  }
}
