import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, backendUrl, noStoreJson, readJson } from "../../_lib/backend";

async function adminToken() {
  return (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
}

export async function GET(request: Request) {
  const token = await adminToken();
  if (!token) return noStoreJson({ message: "Sign in to view hair tests." }, 401);

  const { searchParams } = new URL(request.url);
  const query = searchParams.toString() ? `?${searchParams.toString()}` : "";

  try {
    const upstream = await fetch(backendUrl(`/api/v1/admin/hair-tests${query}`), {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });
    return noStoreJson(await readJson(upstream), upstream.status);
  } catch {
    return noStoreJson({ message: "Hair tests service is temporarily unavailable." }, 503);
  }
}

