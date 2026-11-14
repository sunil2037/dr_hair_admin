import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, backendUrl, noStoreJson, readJson } from "../../../../_lib/backend";

export async function GET(_request: Request, props: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await props.params;
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return noStoreJson({ message: "Sign in to view shipment tracking." }, 401);

  try {
    const upstream = await fetch(backendUrl(`/api/v1/admin/orders/${encodeURIComponent(orderId)}/tracking`), {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      cache: "no-store",
    });
    return noStoreJson(await readJson(upstream), upstream.status);
  } catch {
    return noStoreJson({ message: "Shipment tracking is temporarily unavailable." }, 503);
  }
}
