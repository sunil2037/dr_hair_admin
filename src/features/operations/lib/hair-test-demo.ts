import type { HairTestRecord } from "../types";

export const initialHairTests: HairTestRecord[] = [
  { id: "HT-1084", patientId: "DH-10482", patientName: "Aarav Mehta", testName: "Scalp analysis", testDate: "2026-10-28", fileName: "aarav-scalp-analysis.pdf", fileType: "application/pdf", fileSize: 248000, status: "In review", createdAt: "Oct 28, 2026", uploadedBy: "Vikram Sethi" },
  { id: "HT-1082", patientId: "DH-10481", patientName: "Priya Kapoor", testName: "Blood panel", testDate: "2026-10-26", fileName: "priya-blood-panel.jpg", fileType: "image/jpeg", fileSize: 804000, status: "Approved", createdAt: "Oct 26, 2026", uploadedBy: "Vikram Sethi" },
];
