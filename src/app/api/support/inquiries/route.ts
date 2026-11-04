import { backendUrl, noStoreJson, readJson } from "../../_lib/backend";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return noStoreJson({ message: "Send inquiry details as JSON." }, 400);
  }
  try {
    const upstream = await fetch(backendUrl("/api/v1/support/inquiries"), {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    return noStoreJson(await readJson(upstream), upstream.status);
  } catch {
    return noStoreJson({ message: "Support service is temporarily unavailable." }, 503);
  }
}
