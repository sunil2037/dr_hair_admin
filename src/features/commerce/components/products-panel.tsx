"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import Image from "next/image";
import {
  Archive, ArrowDown, ArrowUp, BadgeCheck, Boxes, ImagePlus, Package,
  PackagePlus, Pencil, Search, Star, Video, X,
} from "lucide-react";
import { Modal, StatusPill } from "../../shared/components/ui";
import { FullSizeImageViewer, type ViewerImage } from "../../shared/components/full-size-image-viewer";
import { useSessionState } from "../../shared/lib/use-session-state";
import { formatCurrency } from "../lib/format";
import type {
  ProductBenefit, ProductClinicalClaim, ProductIngredient, ProductMedia,
  ProductRecord, ProductStatus, ProductSupplyPlan, ProductUsageStep, StockMovement,
} from "../types";

type ProductFormState = {
  name: string;
  category: string;
  description: string;
  status: ProductStatus;
  rootCauses: string[];
  supplyPlans: ProductSupplyPlan[];
  benefitsText: string;
  ingredientsText: string;
  usageStepsText: string;
  clinicalClaimsText: string;
  media: ProductMedia[];
};

interface PreviewMedia extends ProductMedia { url: string; }

const rootCauseOptions = ["Hair", "Dandruff", "Gut", "Stress", "Thyroid", "PCOS", "Hormone"];
const newPlan = (): ProductSupplyPlan => ({
  id: `plan-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  title: "New plan", subtitle: "", sku: "DRH-NEW", price: 0, mrp: 0,
  unitCost: 0, stock: 0, lowStockThreshold: 10, badge: "",
});

function getPlans(product: ProductRecord): ProductSupplyPlan[] {
  if (product.supplyPlans?.length) return product.supplyPlans;
  return [{
    id: `${product.id}-default`, title: "Standard", subtitle: product.name,
    sku: product.sku, price: product.price, mrp: product.compareAtPrice,
    unitCost: product.unitCost, stock: product.stock, lowStockThreshold: 10, badge: "",
  }];
}

function featuredPlan(plans: ProductSupplyPlan[]) {
  return plans.find((plan) => plan.badge.toLowerCase().includes("popular")) ?? plans[0];
}

function productStock(product: ProductRecord) {
  return getPlans(product).reduce((total, plan) => total + plan.stock, 0);
}

function asLines<T>(items: T[] | undefined, render: (item: T) => string) {
  return (items ?? []).map(render).join("\n");
}

function parseLines(text: string, parts: number) {
  return text.split("\n").map((line) => line.split("|").map((part) => part.trim()))
    .filter((line) => line.some(Boolean)).map((line) => Array.from({ length: parts }, (_, index) => line[index] ?? ""));
}

function formFor(product: ProductRecord | null): ProductFormState {
  if (!product) return {
    name: "", category: "Hair growth", description: "", status: "Draft", rootCauses: [],
    supplyPlans: [newPlan()], benefitsText: "", ingredientsText: "", usageStepsText: "", clinicalClaimsText: "", media: [],
  };
  return {
    name: product.name, category: product.category, description: product.description,
    status: product.status, rootCauses: product.rootCauses ?? [], supplyPlans: getPlans(product),
    benefitsText: asLines<ProductBenefit>(product.benefits, (item) => `${item.title} | ${item.description}`),
    ingredientsText: asLines<ProductIngredient>(product.ingredients, (item) => `${item.name} | ${item.concentration} | ${item.purpose}`),
    usageStepsText: asLines<ProductUsageStep>(product.usageSteps, (item) => `${item.title} | ${item.description}`),
    clinicalClaimsText: asLines<ProductClinicalClaim>(product.clinicalClaims, (item) => `${item.percentage} | ${item.claim} | ${item.source}`),
    media: product.media,
  };
}

function stockLabel(product: ProductRecord) {
  const plans = getPlans(product);
  const low = plans.filter((plan) => plan.stock <= plan.lowStockThreshold).length;
  const stock = productStock(product);
  if (stock === 0) return { label: "Out of stock", low: true };
  if (low > 0) return { label: `${low} plan${low > 1 ? "s" : ""} low`, low: true };
  return { label: `${stock} units`, low: false };
}

export function ProductsPanel({ products, onProductsChange, createProductOpen, onCreateHandled, onToast }: {
  products: ProductRecord[];
  onProductsChange: (updater: (current: ProductRecord[]) => ProductRecord[]) => void;
  createProductOpen: boolean;
  onCreateHandled: () => void;
  onToast: (message: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All status");
  const [editorProduct, setEditorProduct] = useState<ProductRecord | null>(null);
  const [detailProduct, setDetailProduct] = useState<ProductRecord | null>(null);
  const [archiveProduct, setArchiveProduct] = useState<ProductRecord | null>(null);
  const [stockProduct, setStockProduct] = useState<ProductRecord | null>(null);
  const [movements, setMovements] = useSessionState<StockMovement[]>("drhair-commerce-stock-movements", []);
  const visibleProducts = products.filter((product) =>
    `${product.name} ${product.sku} ${product.category} ${(product.rootCauses ?? []).join(" ")}`.toLowerCase().includes(query.toLowerCase()) &&
    (statusFilter === "All status" || product.status === statusFilter),
  );
  const allPlans = products.flatMap((product) => getPlans(product).map((plan) => ({ product, plan })));
  const lowStockCount = allPlans.filter(({ plan }) => plan.stock <= plan.lowStockThreshold).length;

  const saveProduct = (form: ProductFormState, existing: ProductRecord | null) => {
    const plans = form.supplyPlans.map((plan) => ({
      ...plan, title: plan.title.trim(), subtitle: plan.subtitle.trim(), sku: plan.sku.trim().toUpperCase(),
      price: Math.round(Number(plan.price)), mrp: Math.round(Number(plan.mrp)),
      unitCost: Math.round(Number(plan.unitCost)), stock: Math.max(0, Math.floor(Number(plan.stock))),
      lowStockThreshold: Math.max(0, Math.floor(Number(plan.lowStockThreshold))), badge: plan.badge.trim(),
    }));
    const primary = featuredPlan(plans);
    if (!form.name.trim() || !form.category || plans.length === 0 || plans.some((plan) => !plan.title || !plan.sku || !Number.isFinite(plan.price) || plan.price <= 0)) {
      onToast("Add a product name and at least one complete supply plan with a valid price.");
      return false;
    }
    if (new Set(plans.map((plan) => plan.sku)).size !== plans.length) {
      onToast("Each supply plan needs a unique SKU.");
      return false;
    }
    const otherProductsUseSku = products.some((candidate) => candidate.id !== existing?.id && getPlans(candidate).some((plan) => plans.some((nextPlan) => nextPlan.sku === plan.sku)));
    if (otherProductsUseSku) {
      onToast("A supply plan SKU is already used by another product.");
      return false;
    }
    const benefits = parseLines(form.benefitsText, 2).map(([title, description]) => ({ title, description }));
    const ingredients = parseLines(form.ingredientsText, 3).map(([name, concentration, purpose]) => ({ name, concentration, purpose }));
    const usageSteps = parseLines(form.usageStepsText, 2).map(([title, description]) => ({ title, description }));
    const clinicalClaims = parseLines(form.clinicalClaimsText, 3).map(([percentage, claim, source]) => ({ percentage, claim, source }));
    const details = {
      name: form.name.trim(), sku: primary.sku, category: form.category,
      description: form.description.trim(), price: primary.price, compareAtPrice: primary.mrp,
      unitCost: primary.unitCost, stock: plans.reduce((sum, plan) => sum + plan.stock, 0),
      status: form.status, media: form.media, rootCauses: form.rootCauses,
      supplyPlans: plans, benefits, ingredients, usageSteps, clinicalClaims,
      updated: "Just now",
    };
    const productId = existing?.id ?? `PRD-${Date.now()}`;
    const previousPlans = existing ? getPlans(existing) : [];
    const stockChanges = plans.flatMap((plan) => {
      const previousStock = previousPlans.find((previous) => previous.id === plan.id)?.stock ?? 0;
      const change = plan.stock - previousStock;
      return change === 0 ? [] : [{
        id: `STK-${Date.now()}-${plan.id}`,
        productId,
        variantId: plan.id,
        variantTitle: plan.title,
        quantityChange: change,
        reason: previousPlans.some((previous) => previous.id === plan.id) ? "Stock updated in product editor" : "Opening stock",
        createdAt: new Date().toISOString(),
      }];
    });
    if (stockChanges.length) setMovements((current) => [...stockChanges, ...current]);
    if (existing) {
      onProductsChange((current) => current.map((product) => product.id === existing.id ? { ...product, ...details } : product));
      onToast("Product details saved in this browser preview.");
    } else {
      onProductsChange((current) => [{ id: productId, ...details, unitsSold: 0, revenue: 0 }, ...current]);
      onToast("Product added to the local catalog.");
    }
    return true;
  };

  const applyStockAdjustment = (product: ProductRecord, planId: string, delta: number, reason: string) => {
    const plan = getPlans(product).find((item) => item.id === planId);
    if (!plan || !Number.isInteger(delta) || delta === 0 || plan.stock + delta < 0 || !reason.trim()) {
      onToast("Choose a valid stock change and reason. Stock cannot go below zero.");
      return false;
    }
    const plans = getPlans(product).map((item) => item.id === planId ? { ...item, stock: item.stock + delta } : item);
    onProductsChange((current) => current.map((item) => item.id === product.id ? {
      ...item, supplyPlans: plans, stock: plans.reduce((sum, variant) => sum + variant.stock, 0), updated: "Just now",
    } : item));
    setMovements((current) => [{
      id: `STK-${Date.now()}`, productId: product.id, variantId: planId,
      variantTitle: plan.title, quantityChange: delta, reason: reason.trim(), createdAt: new Date().toISOString(),
    }, ...current]);
    onToast(`Inventory updated for ${plan.title}.`);
    return true;
  };

  const archive = () => {
    if (!archiveProduct) return;
    onProductsChange((current) => current.map((item) => item.id === archiveProduct.id ? { ...item, status: "Archived", updated: "Just now" } : item));
    onToast(`${archiveProduct.name} archived. Its past order history is preserved.`);
    setArchiveProduct(null);
  };

  const selectedDetail = detailProduct ? products.find((item) => item.id === detailProduct.id) ?? detailProduct : null;
  const selectedStock = stockProduct ? products.find((item) => item.id === stockProduct.id) ?? stockProduct : null;

  return <>
    <div className="commerce-toolbar products-toolbar">
      <div><h2 className="commerce-section-title">Product catalog</h2><p className="card-note">Manage app content, supply plans, inventory, and publishing</p></div>
      <div className="commerce-inline-actions">
        <label className="input-search"><Search size={14} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search product, SKU, or concern" /></label>
        <select className="period-select" aria-label="Filter products by status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option>All status</option><option>Active</option><option>Draft</option><option>Archived</option></select>
      </div>
    </div>
    <div className="commerce-mini-stats product-inventory-summary">
      <span><Package size={14} />{products.length} products</span>
      <span><BadgeCheck size={14} />{products.filter((product) => product.status === "Active").length} live in app</span>
      <span className={lowStockCount ? "stock-low" : ""}><Boxes size={14} />{lowStockCount} low-stock plans</span>
      <span><ImagePlus size={14} />{products.reduce((sum, product) => sum + product.media.length, 0)} media assets</span>
    </div>
    <section className="card commerce-list-card">
      <div className="table-wrap"><table className="commerce-table products-table"><thead><tr><th>Product</th><th>Supply plans</th><th>From</th><th>Unit margin</th><th>Units sold</th><th>Net sales</th><th>Inventory</th><th>Store</th><th /></tr></thead><tbody>
        {visibleProducts.map((product) => {
          const plans = getPlans(product);
          const cheapest = plans.reduce((lowest, plan) => plan.price < lowest.price ? plan : lowest, plans[0]);
          const lead = featuredPlan(plans);
          const margin = lead.price ? ((lead.price - lead.unitCost) / lead.price) * 100 : 0;
          const stock = stockLabel(product);
          return <tr key={product.id}>
            <td><button className="product-title-button" onClick={() => setDetailProduct(product)}><span className="product-table-icon"><Package size={15} /></span><span><strong>{product.name}</strong><small>{product.category} · {(product.rootCauses ?? []).join(", ") || "No app tags"}</small></span></button></td>
            <td><strong>{plans.length} plan{plans.length === 1 ? "" : "s"}</strong><small className="strike-price">{plans.map((plan) => plan.title).join(" · ")}</small></td>
            <td><strong>{formatCurrency(cheapest.price)}</strong>{cheapest.mrp > cheapest.price && <small className="strike-price">MRP {formatCurrency(cheapest.mrp)}</small>}</td>
            <td><span className="margin-pill">{margin.toFixed(0)}%</span><small className="strike-price">Lead plan</small></td>
            <td>{product.unitsSold.toLocaleString("en-IN")}</td><td><strong>{formatCurrency(product.revenue)}</strong></td>
            <td><span className={stock.low ? "stock-low" : ""}>{stock.label}</span></td>
            <td><StatusPill status={product.status} /></td>
            <td><div className="table-actions">
              <button className="row-action" aria-label={`View ${product.name}`} onClick={() => setDetailProduct(product)}><Package size={14} /></button>
              <button className="row-action" aria-label={`Adjust ${product.name} stock`} onClick={() => setStockProduct(product)}><PackagePlus size={14} /></button>
              <button className="row-action" aria-label={`Edit ${product.name}`} onClick={() => setEditorProduct(product)}><Pencil size={14} /></button>
              {product.status !== "Archived" && <button className="row-action" aria-label={`Archive ${product.name}`} onClick={() => setArchiveProduct(product)}><Archive size={14} /></button>}
            </div></td>
          </tr>;
        })}
        {visibleProducts.length === 0 && <tr><td colSpan={9}><div className="empty-state">No products match this search.</div></td></tr>}
      </tbody></table></div>
      <div className="table-footer"><span>Showing {visibleProducts.length} of {products.length} products</span><span>Sales and inventory figures are sample data</span></div>
    </section>
    <div className="notice commerce-media-note"><ImagePlus size={14} /><span>Product edits and stock adjustments stay in this browser preview. Product media uploads, stock reservation, and shop publishing require the future commerce APIs.</span></div>

    {(editorProduct !== null || createProductOpen) && <ProductEditor product={editorProduct} onClose={() => { setEditorProduct(null); onCreateHandled(); }} onSave={saveProduct} />}
    {selectedDetail && <ProductDetails product={selectedDetail} movements={movements.filter((movement) => movement.productId === selectedDetail.id)} onClose={() => setDetailProduct(null)} onEdit={() => { setEditorProduct(selectedDetail); setDetailProduct(null); }} onAdjustStock={() => setStockProduct(selectedDetail)} />}
    {selectedStock && <StockAdjustmentDialog product={selectedStock} onClose={() => setStockProduct(null)} onSave={(planId, delta, reason) => { const ok = applyStockAdjustment(selectedStock, planId, delta, reason); if (ok) setStockProduct(null); return ok; }} />}
    {archiveProduct && <Modal title="Archive this product?" description="The product will leave the shop but remain in historic order records." submitLabel="Archive product" onClose={() => setArchiveProduct(null)} onSubmit={archive}><div className="archive-confirm"><Archive size={17} /><span><strong>{archiveProduct.name}</strong><small>You can still find it by filtering for Archived products.</small></span></div></Modal>}
  </>;
}

function ProductEditor({ product, onClose, onSave }: {
  product: ProductRecord | null;
  onClose: () => void;
  onSave: (form: ProductFormState, existing: ProductRecord | null) => boolean;
}) {
  const [form, setForm] = useState<ProductFormState>(() => formFor(product));
  const [previews, setPreviews] = useState<PreviewMedia[]>([]);
  const [imageToView, setImageToView] = useState<ViewerImage | null>(null);
  const activeUrls = useRef<string[]>([]);
  const setField = <K extends keyof ProductFormState>(key: K, value: ProductFormState[K]) => setForm((current) => ({ ...current, [key]: value }));
  useEffect(() => () => activeUrls.current.forEach((url) => URL.revokeObjectURL(url)), []);

  const pickMedia = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    const picked = files.map((file) => ({ name: file.name, kind: file.type.startsWith("video/") ? "video" as const : "image" as const, url: URL.createObjectURL(file) }));
    activeUrls.current.push(...picked.map((media) => media.url));
    setPreviews((current) => [...current, ...picked]);
    setField("media", [...form.media, ...picked.map(({ name, kind }, index) => ({ name, kind, isPrimary: form.media.length === 0 && index === 0 && kind === "image" }))]);
    event.target.value = "";
  };
  const updatePlan = (index: number, field: keyof ProductSupplyPlan, value: string) => setForm((current) => ({
    ...current, supplyPlans: current.supplyPlans.map((plan, planIndex) => planIndex === index ? {
      ...plan, [field]: ["price", "mrp", "unitCost", "stock", "lowStockThreshold"].includes(field) ? Number(value) : value,
    } : plan),
  }));
  const updateMedia = (index: number, patch: Partial<ProductMedia>) => setField("media", form.media.map((media, mediaIndex) => mediaIndex === index ? { ...media, ...patch } : media));
  const moveMedia = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= form.media.length) return;
    const media = [...form.media]; [media[index], media[nextIndex]] = [media[nextIndex], media[index]];
    setField("media", media);
  };
  const removeMedia = (index: number) => {
    const removed = form.media[index];
    setField("media", form.media.filter((_, mediaIndex) => mediaIndex !== index));
    const preview = previews.find((item) => item.name === removed.name);
    if (preview) {
      URL.revokeObjectURL(preview.url);
      activeUrls.current = activeUrls.current.filter((url) => url !== preview.url);
      setPreviews((current) => current.filter((item) => item.url !== preview.url));
    }
  };

  return <><Modal className="product-editor-modal" title={product ? "Edit product" : "Add product"} description="Prepare the catalog content and every supply plan shown in the app." submitLabel={product ? "Save product" : "Add to catalog"} onClose={onClose} onSubmit={() => { if (onSave(form, product)) onClose(); }}>
    <div className="product-editor-section"><div className="product-editor-section-head"><div><h3>Store listing</h3><p>Name, category, and app filters</p></div><span className="product-section-number">01</span></div>
      <div className="product-form-grid">
        <div className="field"><label htmlFor="product-name">Product name *</label><input id="product-name" value={form.name} onChange={(event) => setField("name", event.target.value)} placeholder="e.g. Daily scalp serum" /></div>
        <div className="field"><label htmlFor="product-category">Shop category</label><select id="product-category" value={form.category} onChange={(event) => setField("category", event.target.value)}>{["Hair growth", "Scalp care", "Hair care", "Bundles"].map((category) => <option key={category}>{category}</option>)}</select></div>
        <div className="field"><label htmlFor="product-status">Store status</label><select id="product-status" value={form.status} onChange={(event) => setField("status", event.target.value as ProductStatus)}><option>Draft</option><option>Active</option><option>Archived</option></select></div>
        <div className="field"><span className="field-label">Concern tags used by app filters</span><div className="tag-choice-list">{rootCauseOptions.map((tag) => <label key={tag} className={`tag-choice ${form.rootCauses.includes(tag) ? "selected" : ""}`}><input type="checkbox" checked={form.rootCauses.includes(tag)} onChange={(event) => setField("rootCauses", event.target.checked ? [...form.rootCauses, tag] : form.rootCauses.filter((item) => item !== tag))} />{tag}</label>)}</div></div>
        <div className="field field-span"><label htmlFor="product-description">Shop description</label><textarea id="product-description" className="product-description-input" value={form.description} onChange={(event) => setField("description", event.target.value)} placeholder="Describe the product and how customers use it." /></div>
      </div>
    </div>

    <div className="product-editor-section"><div className="product-editor-section-head"><div><h3>Supply plans & stock</h3><p>Each plan has its own price, SKU, inventory, and low-stock threshold</p></div><button type="button" className="button button-secondary button-small" onClick={() => setField("supplyPlans", [...form.supplyPlans, newPlan()])}><PackagePlus size={13} />Add plan</button></div>
      <div className="supply-plan-list">{form.supplyPlans.map((plan, index) => <article className="supply-plan-card" key={plan.id}>
        <div className="supply-plan-heading"><span className="plan-index">Plan {String(index + 1).padStart(2, "0")}</span>{form.supplyPlans.length > 1 && <button type="button" className="row-action danger-action" aria-label={`Remove ${plan.title}`} onClick={() => setField("supplyPlans", form.supplyPlans.filter((_, planIndex) => planIndex !== index))}><X size={14} /></button>}</div>
        <div className="product-form-grid">
          <div className="field"><label>Plan name *</label><input value={plan.title} onChange={(event) => updatePlan(index, "title", event.target.value)} placeholder="3 Months" /></div>
          <div className="field"><label>Shop subtitle</label><input value={plan.subtitle} onChange={(event) => updatePlan(index, "subtitle", event.target.value)} placeholder="60ml + Scalp Roller" /></div>
          <div className="field"><label>SKU *</label><input value={plan.sku} onChange={(event) => updatePlan(index, "sku", event.target.value.toUpperCase())} placeholder="DRH-SER-060" /></div>
          <div className="field"><label>Badge</label><input value={plan.badge} onChange={(event) => updatePlan(index, "badge", event.target.value)} placeholder="Most popular" /></div>
          <div className="field"><label>Selling price (₹) *</label><input type="number" min="1" value={plan.price || ""} onChange={(event) => updatePlan(index, "price", event.target.value)} /></div>
          <div className="field"><label>MRP (₹)</label><input type="number" min="0" value={plan.mrp || ""} onChange={(event) => updatePlan(index, "mrp", event.target.value)} /></div>
          <div className="field"><label>Unit cost (₹)</label><input type="number" min="0" value={plan.unitCost || ""} onChange={(event) => updatePlan(index, "unitCost", event.target.value)} /></div>
          <div className="field"><label>Available stock</label><input type="number" min="0" value={plan.stock} onChange={(event) => updatePlan(index, "stock", event.target.value)} /></div>
          <div className="field"><label>Alert below</label><input type="number" min="0" value={plan.lowStockThreshold} onChange={(event) => updatePlan(index, "lowStockThreshold", event.target.value)} /></div>
        </div>
      </article>)}</div>
    </div>

    <div className="product-editor-section"><div className="product-editor-section-head"><div><h3>Product detail content</h3><p>Structured details used by the Flutter product page. One entry per line.</p></div><span className="product-section-number">02</span></div>
      <div className="product-content-grid">
        <div className="field"><label htmlFor="product-benefits">Benefits · title | description</label><textarea id="product-benefits" className="product-description-input" value={form.benefitsText} onChange={(event) => setField("benefitsText", event.target.value)} placeholder={"Supports fuller-looking hair | Designed for a healthy scalp"} /></div>
        <div className="field"><label htmlFor="product-ingredients">Ingredients · name | concentration | purpose</label><textarea id="product-ingredients" className="product-description-input" value={form.ingredientsText} onChange={(event) => setField("ingredientsText", event.target.value)} placeholder={"Procapil | 5% | Scalp support"} /></div>
        <div className="field"><label htmlFor="product-usage">How to use · title | instructions</label><textarea id="product-usage" className="product-description-input" value={form.usageStepsText} onChange={(event) => setField("usageStepsText", event.target.value)} placeholder={"Apply | Use on a clean, dry scalp as directed"} /></div>
        <div className="field"><label htmlFor="product-claims">Clinical claims · % | claim | source</label><textarea id="product-claims" className="product-description-input" value={form.clinicalClaimsText} onChange={(event) => setField("clinicalClaimsText", event.target.value)} placeholder={" | Add approved wording | Publication or evidence reference"} /></div>
      </div>
      <p className="form-help claim-guidance">Only publish reviewed, evidence-backed health claims. Add a source for each claim shown to customers.</p>
    </div>

    <div className="product-editor-section"><div className="product-editor-section-head"><div><h3>Photos & videos</h3><p>Choose the primary image, reorder the gallery, and add accessible descriptions</p></div><span className="product-section-number">03</span></div>
      <label className="media-dropzone"><input type="file" accept="image/*,video/*" multiple onChange={pickMedia} /><span className="media-drop-icon"><ImagePlus size={17} /></span><span><strong>Add images or videos</strong><small>Selected files preview in this browser. Storage is added with the upload API.</small></span><span className="button button-secondary button-small">Browse files</span></label>
      <div className="product-media-manager">{form.media.map((media, index) => {
        const preview = previews.find((item) => item.name === media.name);
        const Icon = media.kind === "video" ? Video : Package;
        return <div className="product-media-row" key={`${media.name}-${index}`}>
          <button type="button" className="product-media-thumb" aria-label={`View ${media.name} full size`} disabled={preview?.kind !== "image"} onClick={() => preview?.kind === "image" && setImageToView({ src: preview.url, alt: media.altText || media.name, fileName: media.name, caption: "Product image preview" })}>{preview?.kind === "image" ? <Image src={preview.url} alt="" width={30} height={30} unoptimized /> : <Icon size={15} />}</button>
          <span className="product-media-name" title={media.name}>{media.name}<small>{media.kind}</small></span>
          <input aria-label={`Alt text for ${media.name}`} value={media.altText ?? ""} onChange={(event) => updateMedia(index, { altText: event.target.value })} placeholder="Alt text or caption" />
          <button type="button" className={`row-action ${media.isPrimary ? "primary-media-selected" : ""}`} aria-label={media.isPrimary ? "Primary image" : `Set ${media.name} as primary image`} onClick={() => setField("media", form.media.map((item, mediaIndex) => ({ ...item, isPrimary: mediaIndex === index && item.kind === "image" })))} disabled={media.kind !== "image"}><Star size={14} /></button>
          <button type="button" className="row-action" aria-label={`Move ${media.name} up`} disabled={index === 0} onClick={() => moveMedia(index, -1)}><ArrowUp size={14} /></button>
          <button type="button" className="row-action" aria-label={`Move ${media.name} down`} disabled={index === form.media.length - 1} onClick={() => moveMedia(index, 1)}><ArrowDown size={14} /></button>
          <button type="button" className="row-action danger-action" aria-label={`Remove ${media.name}`} onClick={() => removeMedia(index)}><X size={14} /></button>
        </div>;
      })}{form.media.length === 0 && <div className="media-empty product-media-empty">No media added yet.</div>}</div>
    </div>
  </Modal><FullSizeImageViewer image={imageToView} onClose={() => setImageToView(null)} /></>;
}

function ProductDetails({ product, movements, onClose, onEdit, onAdjustStock }: {
  product: ProductRecord;
  movements: StockMovement[];
  onClose: () => void;
  onEdit: () => void;
  onAdjustStock: () => void;
}) {
  const plans = getPlans(product);
  return <Modal className="product-details-modal" title={product.name} description={`${product.id} · ${product.category} · ${(product.rootCauses ?? []).join(", ") || "No app concern tags"}`} submitLabel="Edit product" onClose={onClose} onSubmit={onEdit}>
    <div className="product-detail-toolbar"><StatusPill status={product.status} /><div><button className="button button-secondary button-small" onClick={onAdjustStock}><PackagePlus size={13} />Adjust stock</button><button className="button button-secondary button-small" onClick={onEdit}><Pencil size={13} />Edit listing</button></div></div>
    <p className="product-detail-copy">{product.description || "No product description added yet."}</p>
    <section className="product-detail-section"><h3>Supply plans & inventory</h3>{plans.map((plan) => <div className="product-plan-detail" key={plan.id}><span><strong>{plan.title}</strong><small>{plan.subtitle} · {plan.sku}</small></span><span><strong>{formatCurrency(plan.price)}</strong><small>MRP {plan.mrp ? formatCurrency(plan.mrp) : "—"}</small></span><span><strong className={plan.stock <= plan.lowStockThreshold ? "stock-low" : ""}>{plan.stock} units</strong><small>Alert below {plan.lowStockThreshold}</small></span></div>)}</section>
    {(product.benefits?.length || product.ingredients?.length || product.usageSteps?.length || product.clinicalClaims?.length) ? <section className="product-detail-section product-app-detail-grid">
      {product.benefits?.length ? <DetailList title="Benefits" items={product.benefits.map((item) => `${item.title} — ${item.description}`)} /> : null}
      {product.ingredients?.length ? <DetailList title="Ingredients" items={product.ingredients.map((item) => `${item.name} · ${item.concentration} · ${item.purpose}`)} /> : null}
      {product.usageSteps?.length ? <DetailList title="Usage" items={product.usageSteps.map((item) => `${item.title} — ${item.description}`)} /> : null}
      {product.clinicalClaims?.length ? <DetailList title="Claims & sources" items={product.clinicalClaims.map((item) => `${item.percentage ? `${item.percentage} · ` : ""}${item.claim} — ${item.source}`)} /> : null}
    </section> : null}
    <section className="product-detail-section"><h3>Media gallery · {product.media.length}</h3><div className="media-chip-list">{product.media.map((media, index) => <span className="media-chip read-only" key={`${media.name}-${index}`}>{media.isPrimary && <Star size={12} fill="currentColor" />}{media.kind === "video" ? <Video size={14} /> : <Package size={14} />}<span>{media.name}{media.altText ? ` · ${media.altText}` : ""}</span></span>)}</div></section>
    <section className="product-detail-section"><h3>Recent inventory changes</h3>{movements.length ? <div className="stock-movement-list">{movements.slice(0, 5).map((movement) => <div key={movement.id}><span><strong>{movement.variantTitle}</strong><small>{movement.reason} · {new Date(movement.createdAt).toLocaleString()}</small></span><strong className={movement.quantityChange > 0 ? "stock-increase" : "stock-decrease"}>{movement.quantityChange > 0 ? "+" : ""}{movement.quantityChange}</strong></div>)}</div> : <p className="card-note">No manual stock changes recorded in this preview.</p>}</section>
    <section className="product-detail-section product-performance-detail"><h3>Sales performance · sample figures</h3><div className="product-detail-grid"><DetailItem label="Units sold" value={product.unitsSold.toLocaleString("en-IN")} /><DetailItem label="Net sales" value={formatCurrency(product.revenue)} /><DetailItem label="Last updated" value={product.updated} /></div></section>
  </Modal>;
}

function StockAdjustmentDialog({ product, onClose, onSave }: {
  product: ProductRecord;
  onClose: () => void;
  onSave: (planId: string, delta: number, reason: string) => boolean;
}) {
  const plans = getPlans(product);
  const [planId, setPlanId] = useState(plans[0]?.id ?? "");
  const [quantity, setQuantity] = useState("1");
  const [direction, setDirection] = useState<"add" | "remove">("add");
  const [reason, setReason] = useState("Stock received");
  const delta = (direction === "add" ? 1 : -1) * Math.abs(Math.floor(Number(quantity)) || 0);
  return <Modal title="Adjust inventory" description={`${product.name} · Changes are recorded in the local stock history.`} submitLabel="Save adjustment" onClose={onClose} onSubmit={() => onSave(planId, delta, reason)}>
    <div className="form-grid-two">
      <div className="field field-span"><label htmlFor="stock-plan">Supply plan</label><select id="stock-plan" value={planId} onChange={(event) => setPlanId(event.target.value)}>{plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.title} · {plan.sku} · {plan.stock} on hand</option>)}</select></div>
      <div className="field"><label htmlFor="stock-direction">Adjustment</label><select id="stock-direction" value={direction} onChange={(event) => setDirection(event.target.value as "add" | "remove")}><option value="add">Receive stock</option><option value="remove">Remove stock</option></select></div>
      <div className="field"><label htmlFor="stock-quantity">Units</label><input id="stock-quantity" type="number" min="1" step="1" value={quantity} onChange={(event) => setQuantity(event.target.value)} /></div>
      <div className="field field-span"><label htmlFor="stock-reason">Reason</label><select id="stock-reason" value={reason} onChange={(event) => setReason(event.target.value)}>{["Stock received", "Damaged or expired", "Manual count correction", "Return restocked", "Other"].map((item) => <option key={item}>{item}</option>)}</select></div>
    </div>
    <div className="stock-adjustment-preview"><Boxes size={15} /><span>Current stock: <strong>{plans.find((plan) => plan.id === planId)?.stock ?? 0}</strong></span><span>Change: <strong>{delta > 0 ? "+" : ""}{delta}</strong></span></div>
    <p className="form-help">No stock is reserved or changed in the customer app until inventory APIs are connected.</p>
  </Modal>;
}

function DetailList({ title, items }: { title: string; items: string[] }) {
  return <div className="product-app-detail"><h4>{title}</h4>{items.map((item, index) => <p key={`${title}-${index}`}>{item}</p>)}</div>;
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return <div className="detail-item"><span>{label}</span><strong>{value}</strong></div>;
}
