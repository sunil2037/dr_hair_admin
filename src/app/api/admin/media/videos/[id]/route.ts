import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, backendUrl, noStoreJson, readJson } from "../../../../_lib/backend";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, { params }: RouteContext) {
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return noStoreJson({ message: "Sign in to delete videos." }, 401);
  const { id } = await params;
  if (!id) return noStoreJson({ message: "Video ID is required." }, 400);

  try {
    const upstream = await fetch(
      backendUrl(`/api/v1/admin/media/videos/${encodeURIComponent(id)}`),
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        cache: "no-store",
      }
    );
    return noStoreJson(await readJson(upstream), upstream.status);
  } catch {
    return noStoreJson({ message: "Video could not be deleted." }, 503);
  }
}
