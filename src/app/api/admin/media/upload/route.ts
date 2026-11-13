import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, fetchBackend, noStoreJson, readJson } from "../../../_lib/backend";

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
    const incomingFormData = await request.formData();
    const purpose = request.headers.get("x-media-purpose") || "product";

    const outgoingFormData = new FormData();
    for (const [key, value] of incomingFormData.entries()) {
      if (value instanceof Blob) {
        const buffer = Buffer.from(await value.arrayBuffer());
        const fileType = value.type || "image/jpeg";
        const fileName = (value as File).name || "upload.jpg";
        const fileBlob = new Blob([buffer], { type: fileType });
        outgoingFormData.append(key, fileBlob, fileName);
      } else {
        outgoingFormData.append(key, value);
      }
    }

    const upstream = await fetchBackend("/api/v1/media/upload", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "X-Media-Purpose": purpose,
      },
      body: outgoingFormData,
      cache: "no-store",
    });

    const body = await readJson(upstream);
    return noStoreJson(body, upstream.status);
  } catch (err) {
    return noStoreJson({ message: err instanceof Error ? err.message : "The media service is temporarily unavailable." }, 503);
  }
}
