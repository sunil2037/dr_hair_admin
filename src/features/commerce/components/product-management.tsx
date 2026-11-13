"use client";

import { BadgePercent, Package, ShoppingBag } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader } from "../../shared/components/ui";
import type { CouponRecord, ProductRecord, ProductStatus, ProductBenefit, ProductIngredient, ProductUsageStep, ProductClinicalClaim } from "../types";
import { CouponsPanel } from "./coupons-panel";
import { ProductsPanel } from "./products-panel";
import { OrdersPage } from "../../operations/components/orders-page";
import type { AdminPermissionId } from "../../shared/types";
import type { PanelFeatureAccess } from "../../shared/lib/permissions";

type CommerceTab = "products" | "orders" | "coupons";
const nonNegativeNumber = (value: unknown, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, number) : fallback;
};
const tabs: { id: CommerceTab; label: string; icon: typeof Package }[] = [
  { id: "products", label: "Products", icon: Package },
  { id: "orders", label: "Orders", icon: ShoppingBag },
  { id: "coupons", label: "Coupons", icon: BadgePercent },
];

export function ProductManagement({ onToast, permissions, panelAccess, globalSearch, onAudit }: { onToast: (message: string) => void; permissions: AdminPermissionId[]; panelAccess: PanelFeatureAccess; globalSearch: string; onAudit: (action: string, target: string) => void }) {
  const [activeTab, setActiveTab] = useState<CommerceTab>("products");
  const [createProductOpen, setCreateProductOpen] = useState(false);
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [coupons, setCoupons] = useState<CouponRecord[]>([]);
  const canManageProducts = permissions.includes("products.manage") && panelAccess.catalog !== false;
  const canManageOrders = permissions.includes("orders.manage") && panelAccess.orders !== false;
  const canManagePromotions = permissions.includes("promotions.manage") && panelAccess.catalog !== false;
  const availableTabs = useMemo(() => tabs.filter((tab) => tab.id === "products" ? canManageProducts
    : tab.id === "orders" ? canManageOrders
    : canManagePromotions), [canManageOrders, canManageProducts, canManagePromotions]);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/admin/coupons", { cache: "no-store", signal: controller.signal })
      .then(async (res) => {
        const body = await res.json().catch(() => ({}));
        if (!res.ok) return;
        const items = body?.data?.coupons || body?.data;
        if (Array.isArray(items)) {
          setCoupons(items);
        }
      })
      .catch(() => {});
    return () => controller.abort();
  }, [setCoupons]);

  const refreshProducts = useCallback(() => {
    const controller = new AbortController();
    fetch("/api/admin/products?limit=100&status=all", { cache: "no-store", signal: controller.signal })
      .then(async (res) => {
        const body = await res.json().catch(() => ({}));
        if (!res.ok) return;
        const items = body?.data?.items || body?.data;
        if (Array.isArray(items)) {
          const normalized: ProductRecord[] = items.map((raw: Record<string, unknown>) => {
            const rawStatus = String(raw.status || "active").toLowerCase();
            const status: ProductStatus =
              rawStatus === "archived"
                ? "Archived"
                : rawStatus === "draft"
                ? "Draft"
                : "Active";

            const rawImages = Array.isArray(raw.images) ? (raw.images as string[]) : [];

            return {
              id: String(raw.id),
              name: String(raw.name || "Untitled Product"),
              sku: String(raw.sku || "DRH-001"),
              category: String(raw.category || "Hair"),
              description: String(raw.description || raw.subtitle || ""),
              price: Number(raw.price) || 0,
              compareAtPrice: Number(raw.compareAtPrice || raw.compare_at_price) || 0,
              unitCost: Number(raw.unitCost || raw.unit_cost) || 0,
              stock: nonNegativeNumber(raw.stock ?? 0),
              unitsSold: Number(raw.unitsSold || raw.units_sold) || 0,
              revenue: Number(raw.revenue) || 0,
              status,
              images: rawImages,
              media: Array.isArray(raw.media) && raw.media.length > 0
                ? (raw.media as ProductRecord["media"])
                : rawImages.map((img: string) => ({ name: img, url: img, kind: "image" as const })),
              rootCauses: Array.isArray(raw.rootCauses || raw.root_causes)
                ? ((raw.rootCauses || raw.root_causes) as string[])
                : [String(raw.rootCause || raw.root_cause || "Hair")],
              supplyPlans: Array.isArray(raw.supplyPlans || raw.supply_plans)
                ? ((raw.supplyPlans || raw.supply_plans) as Array<Record<string, unknown>>).map((plan) => ({
                    ...plan,
                    stock: nonNegativeNumber(plan.stock),
                    lowStockThreshold: nonNegativeNumber(plan.lowStockThreshold ?? plan.low_stock_threshold, 10),
                  })) as ProductRecord["supplyPlans"]
                : [],
              benefits: Array.isArray(raw.benefits)
                ? (raw.benefits as Array<ProductBenefit | string>).map((b) =>
                    typeof b === "string" ? { title: b, description: "" } : b
                  )
                : undefined,
              ingredients: Array.isArray(raw.ingredients)
                ? (raw.ingredients as Array<ProductIngredient | string>).map((i) =>
                    typeof i === "string" ? { name: i, concentration: "", purpose: "" } : i
                  )
                : undefined,
              usageSteps: Array.isArray(raw.usageSteps || raw.usage_steps)
                ? ((raw.usageSteps || raw.usage_steps) as Array<ProductUsageStep | string>).map((s) =>
                    typeof s === "string" ? { title: s, description: "" } : s
                  )
                : undefined,
              clinicalClaims: Array.isArray(raw.clinicalClaims || raw.clinical_metrics)
                ? ((raw.clinicalClaims || raw.clinical_metrics) as Array<ProductClinicalClaim | string>).map((c) =>
                    typeof c === "string" ? { percentage: "", claim: c, source: "" } : c
                  )
                : undefined,
              updated: String(raw.updated || "Recently"),
            };
          });

          // Show only uploaded products from the database
          setProducts(normalized);
        }
      })
      .catch(() => {});
    return () => controller.abort();
  }, [setProducts]);

  useEffect(() => {
    return refreshProducts();
  }, [refreshProducts]);

  const resolvedActiveTab = availableTabs.some((tab) => tab.id === activeTab) ? activeTab : availableTabs[0]?.id ?? "products";
  const tabLabel = tabs.find((tab) => tab.id === resolvedActiveTab)?.label ?? "Overview";
  const selectTab = (tab: CommerceTab) => {
    if (!availableTabs.some((item) => item.id === tab)) {
      onToast("This admin account does not have access to that commerce section.");
      return;
    }
    setActiveTab(tab);
  };

  return <div className="page-wrap w-full min-w-0">
    {resolvedActiveTab !== "orders" && <PageHeader eyebrow="Commerce" title={resolvedActiveTab === "coupons" ? "Offers" : "Products"} description={resolvedActiveTab === "coupons" ? "Manage checkout promotions." : "Manage the product catalog."} action={resolvedActiveTab === "products" && canManageProducts ? <button className="button button-primary" onClick={() => setCreateProductOpen(true)}><Package size={14} />Add product</button> : undefined} />}
    <div className="commerce-tabs" role="tablist" aria-label="Commerce sections">
      {availableTabs.map(({ id, label, icon: Icon }) => <button key={id} type="button" role="tab" aria-selected={resolvedActiveTab === id} className={`commerce-tab ${resolvedActiveTab === id ? "selected" : ""}`} onClick={() => selectTab(id)}><Icon size={15} />{label}{id === "products" && <span>{products.length}</span>}</button>)}
    </div>
    <div className="commerce-content" aria-label={`${tabLabel} section`}>
      {availableTabs.length === 0 && <div className="empty-state">No commerce sections are available for this account.</div>}
      {resolvedActiveTab === "products" && canManageProducts && <ProductsPanel products={products} onProductsChange={(updater) => { setProducts(updater); onAudit("updated product catalog", "Product records"); }} createProductOpen={createProductOpen} onCreateHandled={() => setCreateProductOpen(false)} onToast={onToast} onRefresh={refreshProducts} />}
      {resolvedActiveTab === "orders" && canManageOrders && <OrdersPage globalSearch={globalSearch} onToast={onToast} onAudit={onAudit} canExport={permissions.includes("commerce.export")} />}
      {resolvedActiveTab === "coupons" && canManagePromotions && <CouponsPanel coupons={coupons} products={products} onCouponsChange={(updater) => { setCoupons(updater); onAudit("updated commerce promotions", "Coupon records"); }} onToast={onToast} />}
    </div>
  </div>;
}
