import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, backendUrl, noStoreJson, readJson } from "../../../_lib/backend";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return noStoreJson({ message: "Sign in to upload media." }, 401);

  const contentType = request.headers.get("content-type") || "";
  if (!contentType.toLowerCase().startsWith("multipart/form-data;")) {
    return noStoreJson({ message: "Upload one file as multipart form data." }, 400);
  }

  try {
    const init = {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Content-Type": contentType,
        "X-Media-Purpose": request.headers.get("x-media-purpose") || "content",
      },
      body: request.body,
      cache: "no-store" as RequestCache,
      duplex: "half" as const,
    } as RequestInit & { duplex: "half" };
    const upstream = await fetch(backendUrl("/api/v1/media/upload"), init);
    return noStoreJson(await readJson(upstream), upstream.status);
  } catch {
    return noStoreJson({ message: "The media service is temporarily unavailable." }, 503);
  }
}
