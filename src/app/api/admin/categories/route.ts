import { NextRequest } from "next/server";
import { backendUrl, noStoreJson, readJson } from "../../_lib/backend";

export async function GET(request: NextRequest) {
  try {
    const type = request.nextUrl.searchParams.get("type");
    const path = type
      ? `/api/v1/categories?type=${encodeURIComponent(type)}`
      : "/api/v1/categories";
    const upstream = await fetch(backendUrl(path), {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    const data = await readJson(upstream);
    return noStoreJson(data, upstream.status);
  } catch (err) {
    return noStoreJson({ status: "error", message: "Failed to fetch categories" }, 500);
  }
}

