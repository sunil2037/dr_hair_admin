import { redirect } from "next/navigation";

export default function PatientsPage() {
  redirect("/?panel=overview#registered-patients");
}
