import { AdminApplication } from "@/features/shared/components/admin-application";
import type { PageKey } from "@/features/shared/types";

const pageKeys: PageKey[] = ["overview", "catalog", "content", "orders", "tests", "bookings", "team", "activity", "notifications"];

export default async function HomePage({ searchParams }: PageProps<"/">) {
  const { panel, date } = await searchParams;
  const initialPage = pageKeys.includes(panel as PageKey) ? panel as PageKey : "overview";
  const initialBookingDate = typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : "";
  return <AdminApplication initialPage={initialPage} initialBookingDate={initialBookingDate} />;
}
