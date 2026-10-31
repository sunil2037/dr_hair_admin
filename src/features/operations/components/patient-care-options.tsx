"use client";

export type CareArt = "serum" | "shampoo" | "supplement" | "roller" | "conditioner" | "wash" | "topical" | "scalp" | "progress" | "breakfast" | "lunch" | "snack" | "dinner";

export type CareProductOption = { id: string; name: string; category: string; form: string; art: CareArt };
export type RoutineOption = { id: string; title: string; subtitle: string; category: string; time_of_day: string; art: CareArt };
export type DietOption = { id: string; type: string; name: string; nutrients: string; benefit: string; art: CareArt };

export const careProductOptions: CareProductOption[] = [
  { id: "PRD-101", name: "Follicle Booster Serum", category: "Topical", form: "Serum", art: "serum" },
  { id: "PRD-102", name: "Scalp Balance Shampoo", category: "Shampoo", form: "Shampoo", art: "shampoo" },
  { id: "PRD-103", name: "Saw Palmetto & Biotin Complex", category: "Supplement", form: "Tablet", art: "supplement" },
  { id: "PRD-104", name: "Scalp Micro-Needling Roller", category: "Other", form: "Device", art: "roller" },
  { id: "PRD-105", name: "Keratin & Peptide Conditioner", category: "Other", form: "Conditioner", art: "conditioner" },
];

export const routineOptions: RoutineOption[] = [
  { id: "gentle-wash", title: "Gentle scalp wash", subtitle: "Wash and rinse as advised by the clinician.", category: "Cleansing", time_of_day: "Morning", art: "wash" },
  { id: "prescribed-topical", title: "Apply prescribed scalp treatment", subtitle: "Follow the product and amount in the care plan.", category: "Treatment", time_of_day: "Night", art: "topical" },
  { id: "scalp-care", title: "Gentle scalp care", subtitle: "Follow the clinician’s scalp-care instructions.", category: "Scalp care", time_of_day: "Evening", art: "scalp" },
  { id: "weekly-checkin", title: "Weekly progress check-in", subtitle: "Record progress and add photos if requested.", category: "Monitoring", time_of_day: "Weekly", art: "progress" },
];

export const dietOptions: DietOption[] = [
  { id: "breakfast", type: "Breakfast", name: "Protein-rich breakfast", nutrients: "Protein", benefit: "Choose according to the patient’s diet and preferences.", art: "breakfast" },
  { id: "lunch", type: "Lunch", name: "Balanced lunch with vegetables", nutrients: "Protein · Vegetables", benefit: "Adapt ingredients to the patient’s diet.", art: "lunch" },
  { id: "snack", type: "Snack", name: "Nuts, seeds or a suitable alternative", nutrients: "Healthy fats", benefit: "Confirm allergies and dietary restrictions.", art: "snack" },
  { id: "dinner", type: "Dinner", name: "Balanced dinner with protein", nutrients: "Protein", benefit: "Choose a suitable protein source.", art: "dinner" },
];

export function CareArtwork({ kind, className = "" }: { kind: CareArt; className?: string }) {
  return <svg className={className} viewBox="0 0 88 76" role="img" aria-label={`${kind} illustration`} fill="none">
    <rect width="88" height="76" rx="16" fill="#EEF7F7" />
    <circle cx="67" cy="18" r="12" fill="#D8EFED" />
    <circle cx="18" cy="60" r="15" fill="#E1F0F1" />
    {kind === "serum" && <g><rect x="31" y="22" width="26" height="39" rx="7" fill="white" stroke="#A7C8CA" /><rect x="37" y="14" width="14" height="9" rx="2" fill="#1A365D" /><rect x="36" y="34" width="16" height="14" rx="3" fill="#0D9488" /><path d="M40 40h8M44 36v8" stroke="white" strokeWidth="1.5" strokeLinecap="round" /><path d="M35 54h18" stroke="#D5E6E7" strokeWidth="2" strokeLinecap="round" /></g>}
    {kind === "shampoo" && <g><path d="M34 25h20l4 7v27a5 5 0 0 1-5 5H35a5 5 0 0 1-5-5V32l4-7Z" fill="white" stroke="#A7C8CA" /><path d="M38 19h12v6H38zM40 14h8v5h-8z" fill="#1A365D" /><rect x="34" y="38" width="20" height="12" rx="3" fill="#73C4BC" /><path d="M39 44h10" stroke="white" strokeWidth="2" strokeLinecap="round" /><path d="M63 30c3-4 3-7 0-9-3 2-3 5 0 9Z" fill="#55B7B0" /></g>}
    {kind === "supplement" && <g><rect x="28" y="25" width="32" height="35" rx="7" fill="white" stroke="#A7C8CA" /><rect x="34" y="18" width="20" height="8" rx="2" fill="#1A365D" /><rect x="31" y="35" width="26" height="15" rx="3" fill="#D9EFED" /><path d="M40 42.5a4 4 0 1 0 8 0 4 4 0 0 0-8 0Z" fill="#0D9488" /><path d="M44 39v7M41 42.5h6" stroke="white" strokeWidth="1.2" strokeLinecap="round" /></g>}
    {kind === "roller" && <g><rect x="38" y="22" width="12" height="29" rx="6" fill="#1A365D" /><path d="M35 25h18" stroke="#0D9488" strokeWidth="3" strokeLinecap="round" /><path d="M34 29h20M34 33h20M34 37h20" stroke="#73C4BC" strokeWidth="1.5" strokeLinecap="round" /><path d="M44 51v12m0 0-5 4m5-4 5 4" stroke="#1A365D" strokeWidth="3" strokeLinecap="round" /></g>}
    {kind === "conditioner" && <g><path d="M32 26h24v32a5 5 0 0 1-5 5H37a5 5 0 0 1-5-5V26Z" fill="white" stroke="#A7C8CA" /><path d="M36 18h16v8H36z" fill="#1A365D" /><rect x="36" y="36" width="16" height="12" rx="3" fill="#73C4BC" /><path d="M40 40c2-3 5-3 8 0m-8 3c2-2 5-2 8 0" stroke="white" strokeWidth="1.4" strokeLinecap="round" /></g>}
    {kind === "wash" && <g><path d="M25 49c4-11 9-17 19-17s15 6 19 17" stroke="#1A365D" strokeWidth="3" strokeLinecap="round" /><path d="M30 48h28l-2 10H32l-2-10Z" fill="white" stroke="#8CB8BA" /><path d="M37 25c3-5 3-8 0-10-3 2-3 5 0 10Zm14 0c3-5 3-8 0-10-3 2-3 5 0 10Z" fill="#55B7B0" /><path d="M44 28v7" stroke="#0D9488" strokeWidth="2" strokeLinecap="round" /></g>}
    {kind === "topical" && <g><path d="M25 54c2-12 8-23 19-23s17 11 19 23" stroke="#1A365D" strokeWidth="3" strokeLinecap="round" /><path d="M31 54h26" stroke="#0D9488" strokeWidth="3" strokeLinecap="round" /><rect x="38" y="16" width="12" height="20" rx="4" fill="white" stroke="#8CB8BA" /><rect x="40" y="12" width="8" height="5" rx="1.5" fill="#1A365D" /><path d="M44 23v8m-3-4h6" stroke="#0D9488" strokeWidth="1.5" strokeLinecap="round" /></g>}
    {kind === "scalp" && <g><circle cx="44" cy="37" r="17" fill="white" stroke="#A7C8CA" strokeWidth="2" /><path d="M32 35c2-9 20-11 24 0" stroke="#1A365D" strokeWidth="3" strokeLinecap="round" /><path d="M35 43c2 5 6 7 9 7s7-2 9-7" stroke="#0D9488" strokeWidth="2.5" strokeLinecap="round" /><path d="M39 39h.1m10 0h.1" stroke="#1A365D" strokeWidth="3" strokeLinecap="round" /><path d="M63 27c3-4 3-7 0-9-3 2-3 5 0 9Z" fill="#55B7B0" /></g>}
    {kind === "progress" && <g><rect x="26" y="18" width="36" height="43" rx="6" fill="white" stroke="#A7C8CA" /><path d="M36 15v8m16-8v8" stroke="#1A365D" strokeWidth="3" strokeLinecap="round" /><path d="M34 33h20M34 40h11" stroke="#C5DCDD" strokeWidth="2" strokeLinecap="round" /><path d="m40 50 3 3 7-8" stroke="#0D9488" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></g>}
    {(kind === "breakfast" || kind === "lunch" || kind === "dinner") && <g><ellipse cx="44" cy="48" rx="25" ry="14" fill="white" stroke="#A7C8CA" strokeWidth="2" /><ellipse cx="44" cy="46" rx="19" ry="9" fill="#DDEEE9" /><path d="M34 47c3-5 6-5 9 0-3 5-6 5-9 0Zm12-1c3-5 6-5 9 0-3 5-6 5-9 0Z" fill="#77B99E" /><circle cx="44" cy="43" r="3" fill="#F1C76A" /><circle cx="54" cy="51" r="2.5" fill="#E59B81" /><path d="M29 31c4-5 9-5 13 0m4-1c4-5 9-5 13 0" stroke="#0D9488" strokeWidth="2" strokeLinecap="round" /></g>}
    {kind === "snack" && <g><path d="M26 44c0-12 8-20 18-20s18 8 18 20v7H26v-7Z" fill="white" stroke="#A7C8CA" strokeWidth="2" /><path d="M30 45h28v6H30z" fill="#DDEEE9" /><ellipse cx="37" cy="39" rx="4" ry="6" transform="rotate(-25 37 39)" fill="#75A987" /><ellipse cx="49" cy="38" rx="4" ry="6" transform="rotate(25 49 38)" fill="#9AB977" /><circle cx="44" cy="44" r="3" fill="#F1C76A" /></g>}
  </svg>;
}

export function ImageChoice({ selected, title, detail, art, onClick }: { selected: boolean; title: string; detail: string; art: CareArt; onClick: () => void }) {
  return <button type="button" aria-pressed={selected} onClick={onClick} className={`group flex min-w-0 items-center gap-3 rounded-2xl border p-2 text-left transition ${selected ? "border-teal-400 bg-teal-50/60 shadow-sm" : "border-slate-200 bg-white hover:border-teal-200 hover:bg-[#FBFDFD]"}`}>
    <CareArtwork kind={art} className="h-[66px] w-[76px] shrink-0 rounded-xl object-cover" />
    <span className="min-w-0 flex-1"><span className="block break-words text-xs font-semibold leading-5 text-[#1A365D]">{title}</span><span className="mt-0.5 block break-words text-[10px] leading-4 text-slate-500">{detail}</span></span>
    <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border ${selected ? "border-teal-700 bg-teal-700 text-white" : "border-slate-300 bg-white text-transparent"}`}>{selected && <span className="text-[11px] font-bold">✓</span>}</span>
  </button>;
}
