import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, backendUrl, noStoreJson, readJson } from "@/app/api/_lib/backend";

async function adminToken() {
  return (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ referenceNo: string }> }
) {
  const token = await adminToken();
  if (!token) return noStoreJson({ message: "Sign in to update hair test status." }, 401);

  const { referenceNo } = await context.params;
  try {
    const body = await request.json();
    const upstream = await fetch(
      backendUrl(`/api/v1/admin/hair-tests/${encodeURIComponent(referenceNo)}/status`),
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(body),
        cache: "no-store",
      }
    );
    return noStoreJson(await readJson(upstream), upstream.status);
  } catch {
    return noStoreJson({ message: "Failed to update assessment status." }, 503);
  }
}
