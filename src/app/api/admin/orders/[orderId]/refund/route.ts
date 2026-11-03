import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, backendUrl, noStoreJson, readJson } from "../../../../_lib/backend";

export async function POST(request: Request, props: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await props.params;
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return noStoreJson({ message: "Sign in to process refund." }, 401);

  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    // optional body
  }

  try {
    const upstream = await fetch(backendUrl(`/api/v1/admin/orders/${orderId}/refund`), {
      method: "POST",
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
    return noStoreJson({ message: "Refund could not be processed." }, 503);
  }
}
