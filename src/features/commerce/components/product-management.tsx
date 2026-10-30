"use client";

import { BarChart3, BadgePercent, Package, Share2, ShoppingBag } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSessionState } from "../../shared/lib/use-session-state";
import { PageHeader } from "../../shared/components/ui";
import { initialCoupons, initialProducts, initialReferrals } from "../lib/demo-data";
import type { CouponRecord, ProductRecord, ReferralRecord } from "../types";
import { CouponsPanel } from "./coupons-panel";
import { CommerceOverview } from "./commerce-overview";
import { ProductsPanel } from "./products-panel";
import { ReferralsPanel } from "./referrals-panel";
import { OrdersPage } from "../../operations/components/orders-page";
import type { AdminPermissionId } from "../../shared/types";
import type { PanelFeatureAccess } from "../../shared/lib/permissions";

type CommerceTab = "overview" | "products" | "orders" | "coupons" | "referrals";
const tabs: { id: CommerceTab; label: string; icon: typeof BarChart3 }[] = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "products", label: "Products", icon: Package },
  { id: "orders", label: "Orders", icon: ShoppingBag },
  { id: "coupons", label: "Coupons", icon: BadgePercent },
  { id: "referrals", label: "Referrals", icon: Share2 },
];

export function ProductManagement({ onToast, permissions, panelAccess, globalSearch, onAudit }: { onToast: (message: string) => void; permissions: AdminPermissionId[]; panelAccess: PanelFeatureAccess; globalSearch: string; onAudit: (action: string, target: string) => void }) {
  const [activeTab, setActiveTab] = useState<CommerceTab>("overview");
  const [createProductOpen, setCreateProductOpen] = useState(false);
  const [products, setProducts] = useSessionState<ProductRecord[]>("drhair-commerce-products", initialProducts);
  const [coupons, setCoupons] = useSessionState<CouponRecord[]>("drhair-commerce-coupons", initialCoupons);
  const [referrals, setReferrals] = useSessionState<ReferralRecord[]>("drhair-commerce-referrals", initialReferrals);
  const [referralEnabled, setReferralEnabled] = useSessionState("drhair-commerce-referral-enabled", true);
  const canManageProducts = permissions.includes("products.manage") && panelAccess.catalog !== false;
  const canManageOrders = permissions.includes("orders.manage") && panelAccess.orders !== false;
  const canManagePromotions = permissions.includes("promotions.manage") && panelAccess.catalog !== false;
  const availableTabs = useMemo(() => tabs.filter((tab) => tab.id === "overview"
    ? canManageProducts || permissions.includes("commerce.export")
    : tab.id === "products" ? canManageProducts
    : tab.id === "orders" ? canManageOrders
    : canManagePromotions), [canManageOrders, canManageProducts, canManagePromotions, permissions]);

  useEffect(() => {
    if (coupons.some((coupon) => coupon.code === "FIRSTDR")) return;
    const demoRule = initialCoupons.find((coupon) => coupon.code === "FIRSTDR");
    if (demoRule) setCoupons((current) => current.some((coupon) => coupon.code === demoRule.code) ? current : [demoRule, ...current]);
  }, [coupons, setCoupons]);

  const resolvedActiveTab = availableTabs.some((tab) => tab.id === activeTab) ? activeTab : availableTabs[0]?.id ?? "overview";
  const tabLabel = tabs.find((tab) => tab.id === resolvedActiveTab)?.label ?? "Overview";
  const selectTab = (tab: CommerceTab) => {
    if (!availableTabs.some((item) => item.id === tab)) {
      onToast("This admin account does not have access to that commerce section.");
      return;
    }
    setActiveTab(tab);
  };

  return <main className="page-wrap mx-auto w-full max-w-[1420px] px-4 py-6 sm:px-6 lg:px-8">
    <PageHeader eyebrow="Commerce · Product growth" title="Commerce" description="Manage your product catalog, sales, offers, and referral program." action={resolvedActiveTab === "products" ? <button className="button button-primary" onClick={() => setCreateProductOpen(true)}><Package size={14} />Add product</button> : undefined} />
    <div className="notice commerce-note"><BarChart3 size={14} /><span>Sales, order and customer numbers are sample analytics. Changes made here stay in this browser preview until commerce APIs are connected.</span></div>
    <div className="commerce-tabs" role="tablist" aria-label="Commerce sections">
      {availableTabs.map(({ id, label, icon: Icon }) => <button key={id} type="button" role="tab" aria-selected={resolvedActiveTab === id} className={`commerce-tab ${resolvedActiveTab === id ? "selected" : ""}`} onClick={() => selectTab(id)}><Icon size={15} />{label}{id === "products" && <span>{products.length}</span>}</button>)}
    </div>
    <div key={activeTab} className="commerce-content" aria-label={`${tabLabel} section`}>
      {resolvedActiveTab === "overview" && <CommerceOverview products={products} coupons={coupons} onNavigate={selectTab} />}
      {resolvedActiveTab === "products" && canManageProducts && <ProductsPanel products={products} onProductsChange={(updater) => { setProducts(updater); onAudit("updated product catalog", "Product records"); }} createProductOpen={createProductOpen} onCreateHandled={() => setCreateProductOpen(false)} onToast={onToast} />}
      {resolvedActiveTab === "orders" && canManageOrders && <OrdersPage globalSearch={globalSearch} onToast={onToast} onAudit={onAudit} canExport={permissions.includes("commerce.export")} />}
      {resolvedActiveTab === "coupons" && canManagePromotions && <CouponsPanel coupons={coupons} products={products} onCouponsChange={(updater) => { setCoupons(updater); onAudit("updated commerce promotions", "Coupon records"); }} onToast={onToast} />}
      {resolvedActiveTab === "referrals" && canManagePromotions && <ReferralsPanel referrals={referrals} enabled={referralEnabled} onEnabledChange={(enabled) => { setReferralEnabled(enabled); onAudit(enabled ? "enabled referral program" : "paused referral program", "Referral settings"); }} onReferralsChange={(updater) => { setReferrals(updater); onAudit("updated commerce referrals", "Referral records"); }} onToast={onToast} canExport={permissions.includes("commerce.export")} />}
    </div>
  </main>;
}
