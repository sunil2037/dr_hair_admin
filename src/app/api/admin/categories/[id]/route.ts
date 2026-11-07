import { NextRequest } from "next/server";
import { backendUrl, noStoreJson, readJson } from "../../../_lib/backend";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = request.headers.get("authorization") || "";
    const body = await request.json();
    const upstream = await fetch(backendUrl(`/api/v1/categories/${encodeURIComponent(id)}`), {
      method: "PUT",
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
  } catch {
    return noStoreJson({ status: "error", message: "Failed to update category" }, 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = request.headers.get("authorization") || "";
    const upstream = await fetch(backendUrl(`/api/v1/categories/${encodeURIComponent(id)}`), {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        ...(token ? { Authorization: token } : {}),
      },
      cache: "no-store",
    });
    const data = await readJson(upstream);
    return noStoreJson(data, upstream.status);
  } catch {
    return noStoreJson({ status: "error", message: "Failed to delete category" }, 500);
  }
}

