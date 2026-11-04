import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, backendUrl, noStoreJson, readJson } from "../../../../_lib/backend";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return noStoreJson({ message: "Sign in to update support inquiries." }, 401);
  const { id } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return noStoreJson({ message: "Send update details as JSON." }, 400);
  }
  try {
    const upstream = await fetch(
      backendUrl(`/api/v1/admin/support/inquiries/${encodeURIComponent(id)}`),
      {
        method: "PATCH",
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
    return noStoreJson({ message: "Support inquiry update is temporarily unavailable." }, 503);
  }
}
