import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, backendUrl, noStoreJson } from "../../../_lib/backend";

const MAX_IMAGE_BYTES = 25 * 1024 * 1024;

function attachmentName(value: string | null) {
  const name = (value || "patient-image.jpg").replace(/[\r\n\\/\"]+/g, "-").replace(/[^\w.() -]/g, "_").trim().slice(0, 140) || "patient-image.jpg";
  return name;
}

export async function GET(request: Request) {
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return noStoreJson({ message: "Sign in to download this patient image." }, 401);

  const params = new URL(request.url).searchParams;
  const source = params.get("src");
  let imageUrl: URL;
  try { imageUrl = new URL(source || ""); } catch { return noStoreJson({ message: "A valid image URL is required." }, 400); }
  if (imageUrl.protocol !== "https:" || imageUrl.hostname !== "res.cloudinary.com" || !imageUrl.pathname.includes("/image/upload/") || imageUrl.href.length > 2048) {
    return noStoreJson({ message: "Only Cloudinary patient images can be downloaded." }, 400);
  }

  try {
    const session = await fetch(backendUrl("/api/v1/admin/me"), {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });
    if (!session.ok) return noStoreJson({ message: "Your admin session is no longer valid." }, 401);

    const upstream = await fetch(imageUrl, { cache: "no-store", redirect: "error", signal: AbortSignal.timeout(12_000) });
    if (!upstream.ok || !upstream.body) return noStoreJson({ message: "The image could not be downloaded." }, upstream.status === 404 ? 404 : 502);
    const mimeType = upstream.headers.get("content-type")?.split(";")[0].trim().toLowerCase() || "";
    if (!mimeType.startsWith("image/")) return noStoreJson({ message: "The requested file is not an image." }, 415);
    const contentLength = Number(upstream.headers.get("content-length") || 0);
    if (contentLength > MAX_IMAGE_BYTES) return noStoreJson({ message: "This image exceeds the download size limit." }, 413);
    const bytes = await upstream.arrayBuffer();
    if (bytes.byteLength > MAX_IMAGE_BYTES) return noStoreJson({ message: "This image exceeds the download size limit." }, 413);

    const fileName = attachmentName(params.get("name"));
    return new Response(bytes, {
      headers: {
        "Content-Type": mimeType,
        "Content-Length": String(bytes.byteLength),
        "Content-Disposition": `attachment; filename="${fileName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return noStoreJson({ message: "The image download is temporarily unavailable." }, 502);
  }
}
