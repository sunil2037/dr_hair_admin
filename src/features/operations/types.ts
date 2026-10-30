export interface PatientReport {
  id: string;
  title: string;
  date: string;
  status: "Ready" | "In review" | "Draft" | "Approved" | "Shared";
  summary: string;
  fileName?: string;
  format?: "PDF" | "DOC" | "IMAGE";
  fileSize?: string;
  uploadedBy?: string;
  uploaderRole?: "Super Admin" | "Admin";
  department?: string;
  metrics?: Record<string, string>;
}

export interface ScalpPhoto {
  angle: "Front" | "Top" | "Left" | "Right" | "Back" | "Crown";
  status: "Uploaded" | "Not submitted" | "Pending";
  url?: string;
  caption?: string;
}

export interface CareRoutineStep {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  timeOfDay: "Morning" | "Evening" | "Night" | "Daily";
}

export interface DietMealPlan {
  type: "Breakfast" | "Lunch" | "Snack" | "Dinner";
  name: string;
  nutrients: string;
  benefit: string;
}

export interface PrescribedProduct {
  id: string;
  name: string;
  dose: string;
  frequency: string;
  instructions?: string;
}

export interface PrescriptionPlan {
  id: string;
  date: string;
  stage: string;
  diagnosis: string;
  doctorName: string;
  duration: string;
  instructions: string;
  products: PrescribedProduct[];
  routineSteps: CareRoutineStep[];
  dietMeals: DietMealPlan[];
  nextReviewDate: string;
  status: "Active" | "Completed" | "Pending Review";
}

export interface ProgressCheckInEntry {
  id: string;
  date: string;
  densityRating: number;
  scalpRegion: string;
  sheddingLevel: string;
  label: string;
  note: string;
  doctorReviewed: boolean;
  doctorNote?: string;
  photoAngles: string[];
  photos?: { angle: string; url: string }[];
}

export interface PatientClinicalProfile {
  age: number;
  pronouns: string;
  phone: string;
  joined: string;
  assessmentAnswers: {
    gender: string;
    stage: string;
    primaryConcern: string;
    duration: string;
    dandruff: string;
    gutHealth: string;
    stressLevel: string;
    familyHistory: string;
    photos: ScalpPhoto[];
  };
  concerns: string[];
  allergies: string[];
  medications: { name: string; dose: string; frequency: string; status: "Current" | "Completed" }[];
  history: { date: string; title: string; details: string; kind: string }[];
  diagnoses: { date: string; name: string; stage: string; note: string; clinician: string }[];
  progress: ProgressCheckInEntry[];
  reports: PatientReport[];
  documents?: PatientDocument[];
  prescriptionPlan?: PrescriptionPlan;
}

export interface PatientDocument {
  id: string;
  fileName: string;
  fileType: string;
  size: number;
  category: "Lab result" | "Prescription" | "Consent" | "Other";
  uploadedAt: string;
  visibility: "Private" | "Shared";
  uploadedBy?: string;
  uploaderRole?: "Super Admin" | "Admin";
}

export type HairTestStatus = "Draft" | "In review" | "Approved" | "Shared";

export interface HairTestRecord {
  id: string;
  patientId: string;
  patientName: string;
  testName: string;
  testDate: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  status: HairTestStatus;
  createdAt: string;
  uploadedBy: string;
}

export interface PatientReportNotification {
  id: string;
  patientId: string;
  reportId: string;
  title: string;
  body: string;
  createdAt: string;
  queuedAt: string;
}
