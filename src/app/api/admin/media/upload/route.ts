import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, backendUrl, noStoreJson, readJson } from "../../../_lib/backend";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization") || "";
  const headerToken = authHeader.replace(/^Bearer\s+/i, "").trim();
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value || headerToken;
  if (!token) return noStoreJson({ message: "Sign in to upload media." }, 401);

  const contentType = request.headers.get("content-type") || "";
  if (!contentType.toLowerCase().startsWith("multipart/form-data")) {
    return noStoreJson({ message: "Upload one file as multipart form data." }, 400);
  }

  try {
    const formData = await request.formData();
    const purpose = request.headers.get("x-media-purpose") || "product";

    const upstream = await fetch(backendUrl("/api/v1/media/upload"), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "X-Media-Purpose": purpose,
      },
      body: formData,
      cache: "no-store",
    });

    const body = await readJson(upstream);
    return noStoreJson(body, upstream.status);
  } catch (err) {
    return noStoreJson({ message: err instanceof Error ? err.message : "The media service is temporarily unavailable." }, 503);
  }
}
