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

export async function PUT(request: Request, { params }: RouteContext) {
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return noStoreJson({ message: "Sign in to update videos." }, 401);
  const { id } = await params;
  if (!id) return noStoreJson({ message: "Video ID is required." }, 400);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return noStoreJson({ message: "Invalid update payload." }, 400);
  }

  try {
    const upstream = await fetch(
      backendUrl(`/api/v1/admin/media/videos/${encodeURIComponent(id)}`),
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        cache: "no-store",
      }
    );
    return noStoreJson(await readJson(upstream), upstream.status);
  } catch {
    return noStoreJson({ message: "Video could not be updated." }, 503);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  return PUT(request, context);
}
