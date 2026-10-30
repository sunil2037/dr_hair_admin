export type CommercePeriod = "week" | "month" | "year";
export type ProductStatus = "Active" | "Draft" | "Archived";
export type CouponStatus = "Active" | "Scheduled" | "Expired";

export interface ProductSupplyPlan {
  id: string;
  title: string;
  subtitle: string;
  sku: string;
  price: number;
  mrp: number;
  unitCost: number;
  stock: number;
  lowStockThreshold: number;
  badge: string;
}

export interface ProductBenefit {
  title: string;
  description: string;
}

export interface ProductIngredient {
  name: string;
  concentration: string;
  purpose: string;
}

export interface ProductUsageStep {
  title: string;
  description: string;
}

export interface ProductClinicalClaim {
  percentage: string;
  claim: string;
  source: string;
}

export interface ProductMedia {
  name: string;
  kind: "image" | "video";
  altText?: string;
  isPrimary?: boolean;
}

export interface ProductRecord {
  id: string;
  appProductId?: string;
  name: string;
  sku: string;
  category: string;
  description: string;
  price: number;
  compareAtPrice: number;
  unitCost: number;
  stock: number;
  unitsSold: number;
  revenue: number;
  status: ProductStatus;
  media: ProductMedia[];
  rootCauses?: string[];
  supplyPlans?: ProductSupplyPlan[];
  benefits?: ProductBenefit[];
  ingredients?: ProductIngredient[];
  usageSteps?: ProductUsageStep[];
  clinicalClaims?: ProductClinicalClaim[];
  updated: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  variantId: string;
  variantTitle: string;
  quantityChange: number;
  reason: string;
  createdAt: string;
}

export interface CouponRecord {
  id: string;
  code: string;
  discountType: "percent" | "fixed";
  discountValue: number;
  appliesTo: string;
  minimumOrder: number;
  uses: number;
  maxUses: number;
  expiresOn: string;
  status: CouponStatus;
}

export interface ReferralRecord {
  id: string;
  name: string;
  email: string;
  code: string;
  reward: number;
  referrals: number;
  orders: number;
  revenue: number;
  status: "Active" | "Paused";
}
