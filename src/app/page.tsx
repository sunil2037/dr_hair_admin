import { AdminApplication } from "@/features/shared/components/admin-application";
import type { PageKey } from "@/features/shared/types";

const pageKeys: PageKey[] = ["overview", "patients", "catalog", "content", "orders", "tests", "bookings", "team", "activity"];

export default async function HomePage({ searchParams }: PageProps<"/">) {
  const { panel } = await searchParams;
  const initialPage = pageKeys.includes(panel as PageKey) ? panel as PageKey : "overview";
  return <AdminApplication initialPage={initialPage} />;
}
