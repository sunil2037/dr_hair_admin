import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, backendUrl, noStoreJson, readJson } from "../../../../_lib/backend";

export async function POST(request: Request, { params }: { params: Promise<{ userId: string }> }) {
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return noStoreJson({ message: "Sign in to upload a patient report." }, 401);
  const { userId } = await params;
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.toLowerCase().startsWith("multipart/form-data;")) return noStoreJson({ message: "Upload a report as multipart form data." }, 400);
  try {
    const upstream = await fetch(backendUrl(`/api/v1/admin/users/${encodeURIComponent(userId)}/reports`), {
      method: "POST", headers: { Authorization: `Bearer ${token}`, Accept: "application/json", "Content-Type": contentType },
      body: request.body, cache: "no-store", duplex: "half",
    } as RequestInit & { duplex: "half" });
    return noStoreJson(await readJson(upstream), upstream.status);
  } catch {
    return noStoreJson({ message: "The report storage service is temporarily unavailable." }, 503);
  }
}
