import type { CouponRecord, ProductRecord, ReferralRecord } from "../types";

export const initialProducts: ProductRecord[] = [];

export const initialCoupons: CouponRecord[] = [
  { id: "CPN-022", code: "FIRSTDR", discountType: "fixed", discountValue: 200, appliesTo: "All products", minimumOrder: 999, uses: 0, maxUses: 2500, expiresOn: "2026-12-31", status: "Active" },
  { id: "CPN-021", code: "GROW15", discountType: "percent", discountValue: 15, appliesTo: "All products", minimumOrder: 999, uses: 284, maxUses: 600, expiresOn: "2026-12-31", status: "Active" },
  { id: "CPN-020", code: "SERUM300", discountType: "fixed", discountValue: 300, appliesTo: "Follicle Booster Serum", minimumOrder: 2000, uses: 118, maxUses: 250, expiresOn: "2026-11-30", status: "Active" },
  { id: "CPN-019", code: "WELCOME10", discountType: "percent", discountValue: 10, appliesTo: "First order", minimumOrder: 0, uses: 962, maxUses: 1000, expiresOn: "2026-10-15", status: "Expired" },
];

export const initialReferrals: ReferralRecord[] = [
  { id: "REF-031", name: "Aarav Mehta", email: "aarav.mehta@email.com", code: "AARAV-CARE", reward: 250, referrals: 34, orders: 22, revenue: 62480, status: "Active" },
  { id: "REF-030", name: "Priya Kapoor", email: "priya.k@email.com", code: "PRIYA-HAIR", reward: 250, referrals: 19, orders: 13, revenue: 36987, status: "Active" },
  { id: "REF-029", name: "Kabir Nair", email: "kabir.n@email.com", code: "KABIR-GROW", reward: 200, referrals: 12, orders: 7, revenue: 19843, status: "Paused" },
];

export const commercePeriodMetrics = {
  week: { sales: 124580, orders: 42, average: 2966, margin: 61.8, coupons: 76, change: "+8.4%" },
  month: { sales: 512610, orders: 168, average: 3051, margin: 63.2, coupons: 284, change: "+12.8%" },
  year: { sales: 5864700, orders: 1842, average: 3184, margin: 64.1, coupons: 2268, change: "+18.6%" },
} as const;

export const orderPeriodMetrics = {
  week: { gross: 134580, discounts: 9200, net: 125380, orders: 42, average: 2985, refunds: 2034, change: "+8.4%" },
  month: { gross: 546210, discounts: 33600, net: 512610, orders: 168, average: 3051, refunds: 12480, change: "+12.8%" },
  year: { gross: 6248900, discounts: 384200, net: 5864700, orders: 1842, average: 3184, refunds: 121500, change: "+18.6%" },
} as const;
