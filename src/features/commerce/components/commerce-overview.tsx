"use client";

import { ArrowRight, BadgePercent, Box, CircleDollarSign, Package, ShoppingBag, Sparkles, TrendingUp } from "lucide-react";
import { useState } from "react";
import { commercePeriodMetrics } from "../lib/demo-data";
import { formatCompactCurrency, formatCurrency } from "../lib/format";
import type { CommercePeriod, CouponRecord, ProductRecord } from "../types";

const salesBars = {
  week: [38, 62, 49, 74, 57, 88, 67],
  month: [37, 47, 42, 66, 55, 72, 62, 84, 68, 92, 77, 100],
  year: [34, 39, 51, 45, 60, 66, 58, 77, 69, 83, 92, 100],
} as const;
const periodLabels: Record<CommercePeriod, string[]> = {
  week: ["M", "T", "W", "T", "F", "S", "S"],
  month: ["1", "3", "5", "7", "9", "11", "13", "15", "17", "19", "21", "23"],
  year: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
};

export function CommerceOverview({ products, coupons, onNavigate }: {
  products: ProductRecord[];
  coupons: CouponRecord[];
  onNavigate: (tab: "overview" | "products" | "coupons" | "referrals") => void;
}) {
  const [period, setPeriod] = useState<CommercePeriod>("month");
  const metrics = commercePeriodMetrics[period];
  const topProducts = [...products].sort((first, second) => second.revenue - first.revenue).slice(0, 4);
  const maxBar = Math.max(...salesBars[period]);

  return <>
    <div className="commerce-toolbar"><div><h2 className="commerce-section-title">Store performance</h2><p className="card-note">Sales and product performance across your shop</p></div><div className="segmented-control" aria-label="Choose reporting period">{(["week", "month", "year"] as CommercePeriod[]).map((value) => <button key={value} className={period === value ? "active" : ""} onClick={() => setPeriod(value)}>{value === "week" ? "This week" : value === "month" ? "This month" : "This year"}</button>)}</div></div>
    <div className="kpi-grid commerce-metrics grid grid-cols-2 gap-3 lg:grid-cols-4">
      <CommerceMetric icon={<CircleDollarSign size={16} />} label="Net sales" value={formatCompactCurrency(metrics.sales)} foot={`${metrics.change} vs. prior period`} tone="teal" />
      <CommerceMetric icon={<ShoppingBag size={16} />} label="Orders" value={metrics.orders.toLocaleString("en-IN")} foot="Across all products" tone="blue" />
      <CommerceMetric icon={<TrendingUp size={16} />} label="Average order value" value={formatCurrency(metrics.average)} foot="Net sales per order" tone="violet" />
      <CommerceMetric icon={<BadgePercent size={16} />} label="Coupon redemptions" value={metrics.coupons.toLocaleString("en-IN")} foot={`${coupons.filter((coupon) => coupon.status === "Active").length} active codes`} tone="amber" />
    </div>
    <div className="commerce-overview-grid">
      <section className="card commerce-chart-card">
        <div className="section-row"><div><h2 className="card-title">Sales trend</h2><p className="card-note">Net product sales · {period === "week" ? "this week" : period === "month" ? "this month" : "this year"}</p></div><span className="trend-badge"><TrendingUp size={12} />{metrics.change}</span></div>
        <div className="sales-chart" role="img" aria-label={`Sample sales chart for ${period}`}>
          <div className="sales-axis"><span>{formatCompactCurrency(metrics.sales)}</span><span>{formatCompactCurrency(metrics.sales * .66)}</span><span>{formatCompactCurrency(metrics.sales * .33)}</span><span>₹0</span></div>
          <div className="sales-plot">{salesBars[period].map((bar, index) => <div className="sales-bar-wrap" key={`${period}-${index}`}><div className={`sales-bar ${index === salesBars[period].length - 1 ? "highlight" : ""}`} style={{ height: `${Math.max(10, (bar / maxBar) * 100)}%` }} title={`${periodLabels[period][index]} sales`} /><span>{periodLabels[period][index]}</span></div>)}</div>
        </div>
        <div className="chart-foot"><span><i className="legend-dot" /> Net sales</span><span>Sample data</span></div>
      </section>
      <section className="card top-products-card">
        <div className="section-row"><div><h2 className="card-title">Top products</h2><p className="card-note">By lifetime net sales</p></div><button className="text-action" onClick={() => onNavigate("products")}>View products <ArrowRight size={13} /></button></div>
        <div className="top-product-list">{topProducts.map((product, index) => <div className="top-product-row" key={product.id}><span className="top-product-rank">0{index + 1}</span><span className="activity-icon"><Package size={14} /></span><div className="top-product-copy"><strong>{product.name}</strong><span>{product.unitsSold.toLocaleString("en-IN")} units · {product.category}</span></div><strong className="top-product-sales">{formatCompactCurrency(product.revenue)}</strong></div>)}</div>
      </section>
    </div>
    <section className="card product-performance-card">
      <div className="section-row"><div><h2 className="card-title">Product revenue & margin</h2><p className="card-note">See which products drive sales and how much each contributes</p></div><button className="text-action" onClick={() => onNavigate("products")}>Manage catalog <ArrowRight size={13} /></button></div>
      <div className="table-wrap"><table className="commerce-table"><thead><tr><th>Product</th><th>Units sold</th><th>Net sales</th><th>Gross profit</th><th>Margin</th><th>Inventory</th></tr></thead><tbody>{topProducts.map((product) => { const profit = (product.price - product.unitCost) * product.unitsSold; const margin = product.price > 0 ? ((product.price - product.unitCost) / product.price) * 100 : 0; return <tr key={product.id}><td><div className="person"><span className="activity-icon"><Box size={14} /></span><div><div className="person-name">{product.name}</div><div className="person-sub">{product.sku}</div></div></div></td><td>{product.unitsSold.toLocaleString("en-IN")}</td><td><strong>{formatCurrency(product.revenue)}</strong></td><td>{formatCurrency(profit)}</td><td><span className="margin-pill">{margin.toFixed(0)}%</span></td><td>{product.stock === 0 ? <span className="stock-low">Out of stock</span> : product.stock <= 10 ? <span className="stock-low">{product.stock} left</span> : `${product.stock} units`}</td></tr>; })}</tbody></table></div>
    </section>
    <section className="commerce-quick-links"><div className="commerce-quick-copy"><span className="commerce-quick-icon"><Sparkles size={17} /></span><div><strong>Grow your store</strong><span>Create a product offer or invite customers to earn referral rewards.</span></div></div><div className="commerce-quick-actions"><button className="button button-secondary" onClick={() => onNavigate("coupons")}><BadgePercent size={14} />Create a coupon</button><button className="button button-secondary" onClick={() => onNavigate("referrals")}><ArrowRight size={14} />Manage referrals</button></div></section>
    {coupons.length === 0 && <div className="empty-state">Create your first coupon to start tracking offer performance.</div>}
    <span className="sr-only">{metrics.margin}% average product margin</span>
  </>;
}

function CommerceMetric({ icon, label, value, foot, tone }: { icon: React.ReactNode; label: string; value: string; foot: string; tone: string }) {
  return <article className="card kpi-card commerce-metric"><div className="kpi-top"><span className="kpi-label">{label}</span><span className={`kpi-icon ${tone}`}>{icon}</span></div><div className="kpi-value">{value}</div><div className="kpi-foot"><span>{foot}</span></div></article>;
}
