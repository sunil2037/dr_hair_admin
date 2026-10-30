import type { CouponRecord, ProductRecord, ReferralRecord } from "../types";

export const initialProducts: ProductRecord[] = [
  {
    id: "PRD-101", appProductId: "follicle-booster-serum", name: "Follicle Booster Serum", sku: "DRH-SER-060", category: "Hair growth",
    description: "A lightweight daily serum designed to support a healthy scalp and fuller-looking hair.",
    price: 2799, compareAtPrice: 3899, unitCost: 980, stock: 42, unitsSold: 428, revenue: 1197972,
    status: "Active", media: [{ name: "serum-front.webp", kind: "image" }, { name: "serum-routine.mp4", kind: "video" }], updated: "Today",
    rootCauses: ["Hair", "Hormone"],
    supplyPlans: [
      { id: "serum-1m", title: "1 Month", subtitle: "30ml Serum Bottle", sku: "DRH-SER-030", price: 1299, mrp: 1699, unitCost: 480, stock: 24, lowStockThreshold: 8, badge: "" },
      { id: "serum-3m", title: "3 Months", subtitle: "60ml + Scalp Roller", sku: "DRH-SER-060", price: 2799, mrp: 3899, unitCost: 980, stock: 42, lowStockThreshold: 10, badge: "Most popular" },
      { id: "serum-6m", title: "6 Months", subtitle: "Full Regrowth Protocol", sku: "DRH-SER-180", price: 4999, mrp: 7599, unitCost: 1820, stock: 12, lowStockThreshold: 5, badge: "Best value" },
    ],
    benefits: [{ title: "Supports fuller-looking hair", description: "Designed to support a healthy scalp and fuller-looking hair." }],
    ingredients: [{ name: "Procapil", concentration: "5%", purpose: "Scalp and follicle support" }, { name: "Redensyl", concentration: "3%", purpose: "Hair density support" }],
    usageSteps: [{ title: "Apply to scalp", description: "Apply to a clean, dry scalp as directed." }, { title: "Massage gently", description: "Massage until absorbed and follow the product label." }],
  },
  {
    id: "PRD-102", name: "Scalp Balance Shampoo", sku: "DRH-SHM-200", category: "Scalp care",
    description: "A gentle daily cleanse for a comfortable, balanced scalp.",
    price: 899, compareAtPrice: 999, unitCost: 310, stock: 128, unitsSold: 612, revenue: 550188,
    status: "Active", media: [{ name: "balance-shampoo.webp", kind: "image" }], updated: "Oct 28, 2026",
    rootCauses: ["Dandruff", "Hair"],
    supplyPlans: [{ id: "shampoo-200ml", title: "200ml", subtitle: "Scalp Balance Shampoo", sku: "DRH-SHM-200", price: 899, mrp: 999, unitCost: 310, stock: 128, lowStockThreshold: 18, badge: "" }],
  },
  {
    id: "PRD-103", name: "Complete Hair Care Kit", sku: "DRH-KIT-001", category: "Bundles",
    description: "A complete routine with serum, shampoo, and a scalp roller.",
    price: 4499, compareAtPrice: 5299, unitCost: 1850, stock: 8, unitsSold: 186, revenue: 836814,
    status: "Active", media: [{ name: "complete-kit.webp", kind: "image" }, { name: "kit-unboxing.mp4", kind: "video" }], updated: "Oct 27, 2026",
    rootCauses: ["Hair", "Dandruff", "Stress"],
    supplyPlans: [{ id: "kit-001", title: "Complete kit", subtitle: "Serum, shampoo, and scalp roller", sku: "DRH-KIT-001", price: 4499, mrp: 5299, unitCost: 1850, stock: 8, lowStockThreshold: 10, badge: "" }],
  },
  {
    id: "PRD-104", name: "Nourish & Repair Conditioner", sku: "DRH-CON-180", category: "Hair care",
    description: "A nourishing conditioner for soft, manageable hair.",
    price: 749, compareAtPrice: 0, unitCost: 250, stock: 0, unitsSold: 94, revenue: 70406,
    status: "Draft", media: [{ name: "nourish-conditioner.webp", kind: "image" }], updated: "Oct 25, 2026",
    rootCauses: ["Hair"],
    supplyPlans: [{ id: "conditioner-180ml", title: "180ml", subtitle: "Nourish & Repair Conditioner", sku: "DRH-CON-180", price: 749, mrp: 0, unitCost: 250, stock: 0, lowStockThreshold: 10, badge: "" }],
  },
];

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
