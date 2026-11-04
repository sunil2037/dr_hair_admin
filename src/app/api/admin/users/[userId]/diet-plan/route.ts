import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, backendUrl, noStoreJson, readJson } from "../../../../_lib/backend";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return noStoreJson({ message: "Sign in to update patient diet plan." }, 401);
  const { userId } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return noStoreJson({ message: "Send diet meal details as JSON." }, 400);
  }
  try {
    const upstream = await fetch(
      backendUrl(`/api/v1/admin/users/${encodeURIComponent(userId)}/diet-plan`),
      {
        method: "POST",
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
    return noStoreJson({ message: "Diet plan update is temporarily unavailable." }, 503);
  }
}
