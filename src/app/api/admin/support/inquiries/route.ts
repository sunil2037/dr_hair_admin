import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, backendUrl, noStoreJson, readJson } from "../../../_lib/backend";

export async function GET(request: Request) {
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return noStoreJson({ message: "Sign in to view support inquiries." }, 401);
  const url = new URL(request.url);
  const query = url.search ? url.search : "";
  try {
    const upstream = await fetch(backendUrl(`/api/v1/admin/support/inquiries${query}`), {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      cache: "no-store",
    });
    return noStoreJson(await readJson(upstream), upstream.status);
  } catch {
    return noStoreJson({ message: "Support inquiries are temporarily unavailable." }, 503);
  }
}
