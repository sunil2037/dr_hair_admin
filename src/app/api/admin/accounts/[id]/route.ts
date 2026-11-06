import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, backendUrl, noStoreJson, readJson } from "@/app/api/_lib/backend";

async function adminToken() {
  return (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const token = await adminToken();
  if (!token) {
    return noStoreJson({ message: "Sign in as Super Admin to remove admin accounts." }, 401);
  }

  const { id } = await context.params;
  try {
    const upstream = await fetch(backendUrl(`/api/v1/admin/accounts/${encodeURIComponent(id)}`), {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });
    return noStoreJson(await readJson(upstream), upstream.status);
  } catch {
    return noStoreJson({ message: "Admin account could not be removed. Try again." }, 503);
  }
}
