import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, backendUrl, noStoreJson, readJson } from "../../../../_lib/backend";

export async function PATCH(request: Request, props: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await props.params;
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return noStoreJson({ message: "Sign in to update order fulfillment." }, 401);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return noStoreJson({ message: "Send fulfillment details as JSON." }, 400);
  }

  try {
    const upstream = await fetch(backendUrl(`/api/v1/admin/orders/${orderId}/fulfillment`), {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    return noStoreJson(await readJson(upstream), upstream.status);
  } catch {
    return noStoreJson({ message: "Order fulfillment could not be updated." }, 503);
  }
}
