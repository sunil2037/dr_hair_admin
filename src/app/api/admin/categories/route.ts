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

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization") || "";
    const body = await request.json();
    const upstream = await fetch(backendUrl("/api/v1/categories"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(token ? { Authorization: token } : {}),
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const data = await readJson(upstream);
    return noStoreJson(data, upstream.status);
  } catch (err) {
    return noStoreJson({ status: "error", message: "Failed to create category" }, 500);
  }
}
