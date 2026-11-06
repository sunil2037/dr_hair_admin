import { AdminApplication } from "@/features/shared/components/admin-application";
import type { PageKey } from "@/features/shared/types";
import { notFound } from "next/navigation";

const validPanelKeys: readonly string[] = [
  "overview",
  "catalog",
  "content",
  "orders",
  "tests",
  "bookings",
  "team",
  "activity",
  "notifications",
  "patients",
];

export default async function DynamicPanelPage({
  params,
  searchParams,
}: {
  params: Promise<{ panel: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { panel } = await params;
  if (!validPanelKeys.includes(panel)) {
    notFound();
  }

  const resolvedSearchParams = await searchParams;
  const dateParam = resolvedSearchParams.date;
  const initialBookingDate = typeof dateParam === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : "";

  return (
    <AdminApplication
      initialPage={panel as PageKey}
      initialBookingDate={initialBookingDate}
    />
  );
}

