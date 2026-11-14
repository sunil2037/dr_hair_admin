import { AdminApplication } from "@/features/shared/components/admin-application";

export default async function PatientAssessmentPage({
  params,
}: {
  params: Promise<{ patientId: string; referenceNo: string }>;
}) {
  const { patientId, referenceNo } = await params;
  return <AdminApplication initialPage="patients" initialPatientId={patientId} initialAssessmentRef={referenceNo} />;
}
