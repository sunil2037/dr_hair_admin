import { AdminApplication } from "@/features/shared/components/admin-application";

export default async function PatientPage({ params }: PageProps<"/patients/[patientId]">) {
  const { patientId } = await params;
  return <AdminApplication initialPage="patients" initialPatientId={patientId} />;
}
