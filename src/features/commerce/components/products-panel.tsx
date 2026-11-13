"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import {
  AlertTriangle,
  Archive,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  BadgeCheck,
  Boxes,
  Check,
  Eye,
  FileText,
  ImagePlus,
  Layers,
  Loader2,
  Package,
  PackagePlus,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Sparkles,
  Star,
  Trash2,
  TrendingUp,
  UploadCloud,
  Video,
  X,
} from "lucide-react";
import { Modal, StatusPill } from "../../shared/components/ui";
import { FullSizeImageViewer, type ViewerImage } from "../../shared/components/full-size-image-viewer";
import { useSessionState } from "../../shared/lib/use-session-state";
import { formatCurrency } from "../lib/format";
import type {
  ProductBenefit,
  ProductClinicalClaim,
  ProductIngredient,
  ProductMedia,
  ProductRecord,
  ProductStatus,
  ProductSupplyPlan,
  ProductUsageStep,
  StockMovement,
} from "../types";

type ProductFormState = {
  name: string;
  category: string;
  description: string;
  status: ProductStatus;
  price: number;
  mrp: number;
  unitCost: number;
  stock: number;
  sku: string;
  rootCauses: string[];
  supplyPlans: ProductSupplyPlan[];
  benefitsText: string;
  ingredientsText: string;
  usageStepsText: string;
  clinicalClaimsText: string;
  media: ProductMedia[];
};

interface PreviewMedia extends ProductMedia {
  url: string;
}

const rootCauseOptions = ["Hair", "Dandruff", "Gut", "Stress", "Thyroid", "PCOS", "Hormone"];
const categoryOptions = [
  "Hair growth",
  "Scalp care",
  "Hair care",
  "Bundles",
  "Therapeutic Cleanser",
  "Endocrine Support",
  "Anti-Androgen",
];

function generateUniqueSku(prefix = "DRH"): string {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${randomNum}`;
}

const newPlan = (basePrice = 499, baseMrp = 699, skuPrefix = "DRH"): ProductSupplyPlan => ({
  id: `plan-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  title: "1 Month",
  subtitle: "Standard Supply",
  sku: generateUniqueSku(skuPrefix),
  price: basePrice,
  mrp: baseMrp,
  unitCost: Math.round(basePrice * 0.3),
  stock: 100,
  lowStockThreshold: 10,
  badge: "",
});

function getPlans(product: ProductRecord): ProductSupplyPlan[] {
  if (product.supplyPlans?.length) return product.supplyPlans;
  return [
    {
      id: `${product.id}-default`,
      title: "1 Month",
      subtitle: product.name,
      sku: product.sku || generateUniqueSku(),
      price: product.price || 0,
      mrp: product.compareAtPrice || product.price || 0,
      unitCost: product.unitCost || 0,
      stock: product.stock ?? 100,
      lowStockThreshold: 10,
      badge: "",
    },
  ];
}

function featuredPlan(plans: ProductSupplyPlan[]) {
  return plans.find((plan) => plan.badge.toLowerCase().includes("popular")) ?? plans[0];
}

function productStock(product: ProductRecord) {
  return getPlans(product).reduce((total, plan) => {
    const stock = Number(plan.stock);
    return total + (Number.isFinite(stock) ? Math.max(0, stock) : 0);
  }, 0);
}

function asLines<T>(items: T[] | undefined, render: (item: T) => string) {
  return (items ?? []).map(render).join("\n");
}

function parseLines(text: string, parts: number) {
  return text
    .split("\n")
    .map((line) => line.split("|").map((part) => part.trim()))
    .filter((line) => line.some(Boolean))
    .map((line) => Array.from({ length: parts }, (_, index) => line[index] ?? ""));
}

function formFor(product: ProductRecord | null): ProductFormState {
  if (!product) {
    const initialSku = generateUniqueSku("DRH");
    return {
      name: "",
      category: "Hair growth",
      description: "",
      status: "Active",
      price: 499,
      mrp: 699,
      unitCost: 150,
      stock: 100,
      sku: initialSku,
      rootCauses: ["Hair"],
      supplyPlans: [
        {
          id: `plan-${Date.now()}-1`,
          title: "1 Month",
          subtitle: "Standard Supply",
          sku: initialSku,
          price: 499,
          mrp: 699,
          unitCost: 150,
          stock: 100,
          lowStockThreshold: 10,
          badge: "",
        },
      ],
      benefitsText: "",
      ingredientsText: "",
      usageStepsText: "",
      clinicalClaimsText: "",
      media: [],
    };
  }

  const plans = getPlans(product);
  const primary = featuredPlan(plans);
  const mediaItems: ProductMedia[] = product.media?.length
    ? product.media
    : (product.images || []).map((img, idx) => ({
        name: img,
        url: img,
        kind: "image" as const,
        isPrimary: idx === 0,
      }));

  return {
    name: product.name,
    category: product.category,
    description: product.description,
    status: product.status,
    price: primary.price || product.price || 0,
    mrp: primary.mrp || product.compareAtPrice || 0,
    unitCost: primary.unitCost || product.unitCost || 0,
    stock: productStock(product),
    sku: primary.sku || product.sku || generateUniqueSku(),
    rootCauses: product.rootCauses ?? ["Hair"],
    supplyPlans: plans,
    benefitsText: asLines<ProductBenefit>(product.benefits, (item) => `${item.title} | ${item.description}`),
    ingredientsText: asLines<ProductIngredient>(product.ingredients, (item) => `${item.name} | ${item.concentration} | ${item.purpose}`),
    usageStepsText: asLines<ProductUsageStep>(product.usageSteps, (item) => `${item.title} | ${item.description}`),
    clinicalClaimsText: asLines<ProductClinicalClaim>(product.clinicalClaims, (item) => `${item.percentage} | ${item.claim} | ${item.source}`),
    media: mediaItems,
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

export function ProductsPanel({
  products,
  onProductsChange,
  createProductOpen,
  onCreateHandled,
  onToast,
  onRefresh,
}: {
  products: ProductRecord[];
  onProductsChange: (updater: (current: ProductRecord[]) => ProductRecord[]) => void;
  createProductOpen: boolean;
  onCreateHandled: () => void;
  onToast: (message: string) => void;
  onRefresh?: () => void;
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All status");
  const [editorProduct, setEditorProduct] = useState<ProductRecord | null>(null);
  const [detailProduct, setDetailProduct] = useState<ProductRecord | null>(null);
  const [archiveProduct, setArchiveProduct] = useState<ProductRecord | null>(null);
  const [stockProduct, setStockProduct] = useState<ProductRecord | null>(null);
  const [deleteProduct, setDeleteProduct] = useState<ProductRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [movements, setMovements] = useSessionState<StockMovement[]>("drhair-commerce-stock-movements", []);

  const visibleProducts = products.filter(
    (product) =>
      `${product.name} ${product.sku} ${product.category} ${(product.rootCauses ?? []).join(" ")}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (statusFilter === "All status" || product.status?.toLowerCase() === statusFilter.toLowerCase())
  );
  const allPlans = products.flatMap((product) => getPlans(product).map((plan) => ({ product, plan })));
  const lowStockCount = allPlans.filter(({ plan }) => plan.stock <= plan.lowStockThreshold).length;

  const saveProduct = async (form: ProductFormState, existing: ProductRecord | null): Promise<boolean> => {
    // Sync lead plan with primary pricing
    const plans = form.supplyPlans.map((plan, idx) => {
      const isLead = idx === 0;
      return {
        ...plan,
        title: plan.title.trim() || (isLead ? "1 Month" : `Plan ${idx + 1}`),
        subtitle: plan.subtitle.trim(),
        sku: (plan.sku.trim() || form.sku.trim() || generateUniqueSku()).toUpperCase(),
        price: isLead ? Math.round(Number(form.price)) : Math.round(Number(plan.price)),
        mrp: isLead ? Math.round(Number(form.mrp)) : Math.round(Number(plan.mrp)),
        unitCost: isLead ? Math.round(Number(form.unitCost)) : Math.round(Number(plan.unitCost)),
        stock: isLead ? Math.max(0, Math.floor(Number(form.stock))) : Math.max(0, Math.floor(Number(plan.stock))),
        lowStockThreshold: Math.max(0, Math.floor(Number(plan.lowStockThreshold))),
        badge: plan.badge.trim(),
      };
    });

    const primary = featuredPlan(plans);

    if (!form.name.trim()) {
      throw new Error("Product name is required.");
    }
    if (!form.category) {
      throw new Error("Product category is required.");
    }
    if (!Number.isFinite(form.price) || form.price <= 0) {
      throw new Error("Product selling price must be greater than 0.");
    }

    const benefits = parseLines(form.benefitsText, 2).map(([title, description]) => ({ title, description }));
    const ingredients = parseLines(form.ingredientsText, 3).map(([name, concentration, purpose]) => ({
      name,
      concentration,
      purpose,
    }));
    const usageSteps = parseLines(form.usageStepsText, 2).map(([title, description]) => ({ title, description }));
    const clinicalClaims = parseLines(form.clinicalClaimsText, 3).map(([percentage, claim, source]) => ({
      percentage,
      claim,
      source,
    }));

    const imageUrls = form.media
      .filter((m) => m.kind === "image")
      .map((m) =>
        m.url && m.url.startsWith("http")
          ? m.url
          : m.name && m.name.startsWith("http")
          ? m.name
          : null
      )
      .filter(Boolean) as string[];

    const details = {
      name: form.name.trim(),
      sku: form.sku.trim().toUpperCase() || primary.sku,
      category: form.category,
      description: form.description.trim(),
      price: Math.round(Number(form.price)),
      compareAtPrice: Math.round(Number(form.mrp)),
      unitCost: Math.round(Number(form.unitCost)),
      stock: plans.reduce((sum, plan) => sum + plan.stock, 0),
      status: form.status,
      media: form.media,
      images: imageUrls,
      rootCauses: form.rootCauses.length > 0 ? form.rootCauses : ["Hair"],
      supplyPlans: plans,
      benefits,
      ingredients,
      usageSteps,
      clinicalClaims,
      updated: "Just now",
    };

    const productId = existing?.id ?? `prd-${Date.now()}`;
    const previousPlans = existing ? getPlans(existing) : [];
    const stockChanges = plans.flatMap((plan) => {
      const previousStock = previousPlans.find((previous) => previous.id === plan.id)?.stock ?? 0;
      const change = plan.stock - previousStock;
      return change === 0
        ? []
        : [
            {
              id: `STK-${Date.now()}-${plan.id}`,
              productId,
              variantId: plan.id,
              variantTitle: plan.title,
              quantityChange: change,
              reason: previousPlans.some((previous) => previous.id === plan.id)
                ? "Stock updated in product editor"
                : "Opening stock",
              createdAt: new Date().toISOString(),
            },
          ];
    });

    if (stockChanges.length) {
      setMovements((current) => [...stockChanges, ...current]);
    }

    if (existing) {
      const res = await fetch(`/api/admin/products/${encodeURIComponent(existing.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(details),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.message || "Failed to update product details in database.");
      }

      onProductsChange((current) =>
        current.map((product) => (product.id === existing.id ? { ...product, ...details } : product))
      );
      onToast("Product details saved to catalog.");
      onRefresh?.();
      return true;
    } else {
      const payload = { id: productId, ...details, unitsSold: 0, revenue: 0 };
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.message || "Failed to add product to database.");
      }

      const created = (body?.data?.product || body?.data || payload) as ProductRecord;
      onProductsChange((current) => [{ ...payload, ...created }, ...current]);
      onToast("Product added to catalog successfully.");
      onRefresh?.();
      return true;
    }
  };

  const applyStockAdjustment = (product: ProductRecord, planId: string, delta: number, reason: string) => {
    const plan = getPlans(product).find((item) => item.id === planId);
    if (!plan || !Number.isInteger(delta) || delta === 0 || plan.stock + delta < 0 || !reason.trim()) {
      onToast("Choose a valid stock change and reason. Stock cannot go below zero.");
      return false;
    }
    const plans = getPlans(product).map((item) =>
      item.id === planId ? { ...item, stock: item.stock + delta } : item
    );
    const updatedStock = plans.reduce((sum, variant) => sum + variant.stock, 0);
    onProductsChange((current) =>
      current.map((item) =>
        item.id === product.id
          ? { ...item, supplyPlans: plans, stock: updatedStock, updated: "Just now" }
          : item
      )
    );
    fetch(`/api/admin/products/${encodeURIComponent(product.id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ supply_plans: plans, stock: updatedStock }),
    }).catch(() => {});
    setMovements((current) => [
      {
        id: `STK-${Date.now()}`,
        productId: product.id,
        variantId: planId,
        variantTitle: plan.title,
        quantityChange: delta,
        reason: reason.trim(),
        createdAt: new Date().toISOString(),
      },
      ...current,
    ]);
    onToast(`Inventory updated for ${plan.title}.`);
    return true;
  };

  const archive = () => {
    if (!archiveProduct) return;
    onProductsChange((current) =>
      current.map((item) =>
        item.id === archiveProduct.id ? { ...item, status: "Archived", updated: "Just now" } : item
      )
    );
    fetch(`/api/admin/products/${encodeURIComponent(archiveProduct.id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "archived" }),
    }).catch(() => {});
    onToast(`${archiveProduct.name} archived. Its past order history is preserved.`);
    setArchiveProduct(null);
  };

  const confirmDelete = async () => {
    if (!deleteProduct) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/products/${encodeURIComponent(deleteProduct.id)}`, {
        method: "DELETE",
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.message || "Failed to delete product from database.");
      }
      onProductsChange((current) => current.filter((p) => p.id !== deleteProduct.id));
      onToast(`"${deleteProduct.name}" permanently deleted from database.`);
      setDeleteProduct(null);
      if (detailProduct?.id === deleteProduct.id) {
        setDetailProduct(null);
      }
      onRefresh?.();
    } catch (err) {
      onToast(err instanceof Error ? err.message : "Error deleting product from database.");
    } finally {
      setIsDeleting(false);
    }
  };

  const selectedDetail = detailProduct
    ? products.find((item) => item.id === detailProduct.id) ?? detailProduct
    : null;
  const selectedStock = stockProduct
    ? products.find((item) => item.id === stockProduct.id) ?? stockProduct
    : null;

  return (
    <>
      <div className="commerce-toolbar products-toolbar">
        <div>
          <h2 className="commerce-section-title">Product catalog</h2>
          <p className="card-note">Manage app content, pricing, inventory, and publishing across mobile apps</p>
        </div>
        <div className="commerce-inline-actions">
          <label className="input-search">
            <Search size={14} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search product, SKU, or category"
            />
          </label>
          <select
            className="period-select"
            aria-label="Filter products by status"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option>All status</option>
            <option>Active</option>
            <option>Draft</option>
            <option>Archived</option>
          </select>
        </div>
      </div>

      <div className="commerce-mini-stats product-inventory-summary">
        <span>
          <Package size={14} />
          {products.length} products
        </span>
        <span>
          <BadgeCheck size={14} />
          {products.filter((product) => product.status?.toLowerCase() === "active").length} live in app
        </span>
        <span className={lowStockCount ? "stock-low" : ""}>
          <Boxes size={14} />
          {lowStockCount} low-stock plans
        </span>
        <span>
          <ImagePlus size={14} />
          {products.reduce((sum, product) => sum + (product.media?.length || 0), 0)} media assets
        </span>
      </div>

      <section className="card commerce-list-card">
        <div className="table-wrap">
          <table className="commerce-table products-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Price / MRP</th>
                <th>Margin</th>
                <th>Units sold</th>
                <th>Net sales</th>
                <th>Inventory</th>
                <th>Store</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleProducts.map((product) => {
                const plans = getPlans(product);
                const lead = featuredPlan(plans);
                const displayPrice = lead.price || product.price || 0;
                const displayMrp = lead.mrp || product.compareAtPrice || 0;
                const displayCost = lead.unitCost || product.unitCost || 0;
                const margin = displayPrice ? ((displayPrice - displayCost) / displayPrice) * 100 : 0;
                const stock = stockLabel(product);
                const leadImage =
                  (product.images && product.images.length > 0 ? product.images[0] : null) ||
                  product.media?.find((m) => m.isPrimary && (m.url || m.name))?.url ||
                  product.media?.find((m) => m.isPrimary && (m.url || m.name))?.name ||
                  product.media?.[0]?.url ||
                  (product.media?.[0]?.name?.startsWith("http") ? product.media[0].name : null);

                return (
                  <tr key={product.id}>
                    <td>
                      <button className="product-title-button" onClick={() => setDetailProduct(product)}>
                        <span className="product-table-icon">
                          {leadImage && (leadImage.startsWith("http://") || leadImage.startsWith("https://")) ? (
                            <img
                              src={leadImage}
                              alt={product.name}
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          ) : (
                            <Package size={15} />
                          )}
                        </span>
                        <span>
                          <strong>{product.name}</strong>
                          <small>
                            {product.category} · {(product.rootCauses ?? []).join(", ") || "General"}
                          </small>
                        </span>
                      </button>
                    </td>
                    <td>
                      <span className="font-mono text-xs font-medium text-slate-700">{product.sku || lead.sku}</span>
                    </td>
                    <td>
                      <strong>{formatCurrency(displayPrice)}</strong>
                      {displayMrp > displayPrice && (
                        <small className="strike-price block text-[11px] text-slate-400">
                          MRP {formatCurrency(displayMrp)}
                        </small>
                      )}
                    </td>
                    <td>
                      <span className="margin-pill">{margin.toFixed(0)}%</span>
                    </td>
                    <td>{product.unitsSold.toLocaleString("en-IN")}</td>
                    <td>
                      <strong>{formatCurrency(product.revenue)}</strong>
                    </td>
                    <td>
                      <span className={stock.low ? "stock-low" : ""}>{stock.label}</span>
                    </td>
                    <td>
                      <StatusPill status={product.status} />
                    </td>
                    <td className="text-right">
                      <div className="table-actions justify-end">
                        <button
                          className="row-action"
                          aria-label={`View ${product.name}`}
                          title="View details"
                          onClick={() => setDetailProduct(product)}
                        >
                          <Package size={14} />
                        </button>
                        <button
                          className="row-action"
                          aria-label={`Adjust ${product.name} stock`}
                          title="Adjust inventory"
                          onClick={() => setStockProduct(product)}
                        >
                          <PackagePlus size={14} />
                        </button>
                        <button
                          className="row-action"
                          aria-label={`Edit ${product.name}`}
                          title="Edit product"
                          onClick={() => setEditorProduct(product)}
                        >
                          <Pencil size={14} />
                        </button>
                        {product.status !== "Archived" && (
                          <button
                            className="row-action"
                            aria-label={`Archive ${product.name}`}
                            title="Archive product"
                            onClick={() => setArchiveProduct(product)}
                          >
                            <Archive size={14} />
                          </button>
                        )}
                        <button
                          className="row-action danger-action"
                          aria-label={`Delete ${product.name} permanently`}
                          title="Delete product permanently from database"
                          onClick={() => setDeleteProduct(product)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {visibleProducts.length === 0 && (
                <tr>
                  <td colSpan={9}>
                    <div className="empty-state">No products match this search.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="table-footer">
          <span>
            Showing {visibleProducts.length} of {products.length} products
          </span>
          <span>Synchronized live with Dr. Hair production backend</span>
        </div>
      </section>

      <div className="notice commerce-media-note">
        <ImagePlus size={14} />
        <span>
          Product catalog is connected to live Cloudinary storage and database APIs. Uploaded images sync directly to
          patient mobile apps.
        </span>
      </div>

      {(editorProduct !== null || createProductOpen) && (
        <ProductEditor
          product={editorProduct}
          onClose={() => {
            setEditorProduct(null);
            onCreateHandled();
          }}
          onSave={saveProduct}
          onToast={onToast}
        />
      )}

      {selectedDetail && (
        <ProductDetails
          product={selectedDetail}
          movements={movements.filter((movement) => movement.productId === selectedDetail.id)}
          onClose={() => setDetailProduct(null)}
          onEdit={() => {
            setEditorProduct(selectedDetail);
            setDetailProduct(null);
          }}
          onAdjustStock={() => setStockProduct(selectedDetail)}
          onDelete={() => {
            setDeleteProduct(selectedDetail);
            setDetailProduct(null);
          }}
        />
      )}

      {selectedStock && (
        <StockAdjustmentDialog
          product={selectedStock}
          onClose={() => setStockProduct(null)}
          onSave={(planId, delta, reason) => {
            const ok = applyStockAdjustment(selectedStock, planId, delta, reason);
            if (ok) setStockProduct(null);
            return ok;
          }}
        />
      )}

      {archiveProduct && (
        <Modal
          title="Archive this product?"
          description="The product will leave the shop but remain in historic order records."
          submitLabel="Archive product"
          onClose={() => setArchiveProduct(null)}
          onSubmit={archive}
        >
          <div className="archive-confirm">
            <Archive size={17} />
            <span>
              <strong>{archiveProduct.name}</strong>
              <small>You can still find it by filtering for Archived products.</small>
            </span>
          </div>
        </Modal>
      )}

      {deleteProduct && (
        <Modal
          title="Delete product permanently?"
          description="This will permanently delete this medicine from the MongoDB database and remove it from mobile apps."
          submitLabel={isDeleting ? "Deleting..." : "Delete from database"}
          submitDisabled={isDeleting}
          submitVariant="danger"
          onClose={() => {
            if (!isDeleting) setDeleteProduct(null);
          }}
          onSubmit={confirmDelete}
        >
          <div className="flex items-start gap-3 p-3.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-900 text-xs">
            <Trash2 size={20} className="text-rose-600 shrink-0 mt-0.5" />
            <div className="grid gap-1">
              <strong className="text-sm font-semibold">{deleteProduct.name}</strong>
              <p className="text-rose-700">
                SKU: <span className="font-mono font-medium">{deleteProduct.sku}</span> · ID:{" "}
                <span className="font-mono">{deleteProduct.id}</span>
              </p>
              <p className="text-[11px] text-rose-600 mt-1">
                Warning: This action permanently deletes the medicine from the database. It cannot be undone.
              </p>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

function ProductEditor({
  product,
  onClose,
  onSave,
  onToast,
}: {
  product: ProductRecord | null;
  onClose: () => void;
  onSave: (form: ProductFormState, existing: ProductRecord | null) => Promise<boolean>;
  onToast: (message: string) => void;
}) {
  type EditorTab = "general" | "pricing" | "media" | "clinical" | "all";
  type UploadStatus = "uploading" | "ready" | "error";
  interface MediaItemMeta {
    status: UploadStatus;
    error?: string;
    file?: File;
  }

  const [activeTab, setActiveTab] = useState<EditorTab>("general");
  const [form, setForm] = useState<ProductFormState>(() => formFor(product));
  const [previews, setPreviews] = useState<PreviewMedia[]>([]);
  const [imageToView, setImageToView] = useState<ViewerImage | null>(null);
  const [uploadMeta, setUploadMeta] = useState<Record<string, MediaItemMeta>>({});
  const [urlInput, setUrlInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [showAdvancedPlans, setShowAdvancedPlans] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isGeneratingSku, setIsGeneratingSku] = useState(false);

  const activeUrls = useRef<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const setField = <K extends keyof ProductFormState>(key: K, value: ProductFormState[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  useEffect(() => () => activeUrls.current.forEach((url) => URL.revokeObjectURL(url)), []);

  const uploadingCount = Object.values(uploadMeta).filter((m) => m.status === "uploading").length;
  const isUploading = uploadingCount > 0;

  const updatePrimaryPricing = (field: "price" | "mrp" | "unitCost" | "stock" | "sku", val: number | string) => {
    setForm((prev) => {
      const numVal = typeof val === "number" ? val : Number(val) || 0;
      const updatedPlans = prev.supplyPlans.map((plan, idx) => {
        if (idx === 0) {
          return {
            ...plan,
            [field]: typeof val === "string" ? val.toUpperCase() : numVal,
          };
        }
        return plan;
      });
      return {
        ...prev,
        [field]: typeof val === "string" ? val.toUpperCase() : numVal,
        supplyPlans: updatedPlans,
      };
    });
  };

  const generateSkuWithAnimation = () => {
    setIsGeneratingSku(true);
    const newSku = generateUniqueSku("DRH");
    updatePrimaryPricing("sku", newSku);
    setTimeout(() => setIsGeneratingSku(false), 380);
  };

  // Upload single file with progress tracking
  const uploadSingleMediaFile = async (file: File, tempId: string, kind: "image" | "video") => {
    setUploadMeta((prev) => ({
      ...prev,
      [tempId]: { status: "uploading", file },
    }));

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/media/upload", {
        method: "POST",
        body: formData,
        headers: { "X-Media-Purpose": "product" },
      });

      const body = await res.json().catch(() => ({}));
      const cloudUrl = (body?.data?.url || body?.data?.secure_url || body?.data?.items?.[0]?.url) as
        | string
        | undefined;

      if (!res.ok || !cloudUrl) {
        throw new Error(body?.message || `Failed to upload ${file.name}.`);
      }

      // Update form media with permanent Cloudinary URL
      setForm((prev) => ({
        ...prev,
        media: prev.media.map((m) =>
          m.name === tempId ? { ...m, name: cloudUrl, url: cloudUrl } : m
        ),
      }));

      // Update previews
      setPreviews((current) => [
        ...current.filter((p) => p.name !== tempId),
        { name: cloudUrl, url: cloudUrl, kind },
      ]);

      // Update meta status
      setUploadMeta((prev) => {
        const next = { ...prev };
        delete next[tempId];
        next[cloudUrl] = { status: "ready" };
        return next;
      });

      onToast(`Uploaded ${file.name} to Cloudinary.`);
      return cloudUrl;
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : `Failed to upload ${file.name}`;
      setUploadMeta((prev) => ({
        ...prev,
        [tempId]: { status: "error", error: errMsg, file },
      }));
      onToast(errMsg);
      return null;
    }
  };

  // Process selected / dropped files concurrently
  const processFiles = async (files: File[]) => {
    if (files.length === 0) return;

    const validFiles: { file: File; kind: "image" | "video"; tempId: string; localUrl: string }[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // File size validation (10 MB max)
      if (file.size > 10 * 1024 * 1024) {
        onToast(`"${file.name}" exceeds the 10 MB limit. Please select a compressed image.`);
        continue;
      }

      const isVideo = file.type.startsWith("video/");
      const isImage = file.type.startsWith("image/") || /\.(jpe?g|png|webp|gif|avif|heic)$/i.test(file.name);

      if (!isImage && !isVideo) {
        onToast(`"${file.name}" is not a supported image or video format.`);
        continue;
      }

      const kind = isVideo ? ("video" as const) : ("image" as const);
      const tempId = `temp-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`;
      const localUrl = URL.createObjectURL(file);
      activeUrls.current.push(localUrl);

      validFiles.push({ file, kind, tempId, localUrl });
    }

    if (validFiles.length === 0) return;

    // Immediately add optimistic previews to state
    setPreviews((current) => [
      ...current,
      ...validFiles.map((v) => ({ name: v.tempId, url: v.localUrl, kind: v.kind })),
    ]);

    setForm((prev) => {
      let isFirstImage = !prev.media.some((m) => m.kind === "image");
      const newMediaItems: ProductMedia[] = validFiles.map((v) => {
        const primary = isFirstImage;
        if (isFirstImage && v.kind === "image") isFirstImage = false;
        return {
          name: v.tempId,
          url: v.localUrl,
          kind: v.kind,
          isPrimary: primary,
          altText: v.file.name.replace(/\.[^/.]+$/, ""),
        };
      });

      return {
        ...prev,
        media: [...prev.media, ...newMediaItems],
      };
    });

    // Run parallel uploads
    await Promise.allSettled(
      validFiles.map((v) => uploadSingleMediaFile(v.file, v.tempId, v.kind))
    );
  };

  const pickMedia = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    await processFiles(files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDraggingOver) setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    const files = Array.from(e.dataTransfer.files ?? []);
    await processFiles(files);
  };

  const retryUpload = async (tempId: string) => {
    const meta = uploadMeta[tempId];
    if (!meta || !meta.file) {
      onToast("Original file is no longer in memory. Please select it again.");
      return;
    }
    const mediaItem = form.media.find((m) => m.name === tempId);
    const kind = mediaItem?.kind || "image";
    await uploadSingleMediaFile(meta.file, tempId, kind);
  };

  const addDirectUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
      onToast("Enter a valid image URL starting with https://");
      return;
    }
    setForm((prev) => {
      const isFirstImage = !prev.media.some((m) => m.kind === "image");
      return {
        ...prev,
        media: [
          ...prev.media,
          {
            name: trimmed,
            url: trimmed,
            kind: "image",
            isPrimary: isFirstImage,
            altText: "Product photo",
          },
        ],
      };
    });
    setPreviews((current) => [...current, { name: trimmed, url: trimmed, kind: "image" }]);
    setUploadMeta((prev) => ({ ...prev, [trimmed]: { status: "ready" } }));
    setUrlInput("");
    onToast("Image URL added to gallery.");
  };

  const updatePlan = (index: number, field: keyof ProductSupplyPlan, value: string) =>
    setForm((current) => ({
      ...current,
      supplyPlans: current.supplyPlans.map((plan, planIndex) =>
        planIndex === index
          ? {
              ...plan,
              [field]: ["price", "mrp", "unitCost", "stock", "lowStockThreshold"].includes(field)
                ? Number(value) || 0
                : value,
            }
          : plan
      ),
    }));

  const updateMedia = (index: number, patch: Partial<ProductMedia>) =>
    setField(
      "media",
      form.media.map((media, mediaIndex) => (mediaIndex === index ? { ...media, ...patch } : media))
    );

  const moveMedia = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= form.media.length) return;
    const media = [...form.media];
    [media[index], media[nextIndex]] = [media[nextIndex], media[index]];
    setField("media", media);
  };

  const removeMedia = (index: number) => {
    const removed = form.media[index];
    setField(
      "media",
      form.media.filter((_, mediaIndex) => mediaIndex !== index)
    );
    const preview = previews.find((item) => item.name === removed.name || item.url === removed.url);
    if (preview) {
      URL.revokeObjectURL(preview.url);
      activeUrls.current = activeUrls.current.filter((url) => url !== preview.url);
      setPreviews((current) => current.filter((item) => item.url !== preview.url));
    }
    setUploadMeta((prev) => {
      const next = { ...prev };
      delete next[removed.name];
      if (removed.url) delete next[removed.url];
      return next;
    });
  };

  const handleSubmit = async () => {
    setFormError("");
    if (!form.name.trim()) {
      setActiveTab("general");
      setFormError("Product / medicine name is required.");
      return;
    }
    if (!form.category) {
      setActiveTab("general");
      setFormError("Product category is required.");
      return;
    }
    if (!form.price || form.price <= 0) {
      setActiveTab("pricing");
      setFormError("Selling price must be greater than 0.");
      return;
    }

    if (isUploading) {
      setActiveTab("media");
      setFormError(`Please wait for ${uploadingCount} photo upload${uploadingCount > 1 ? "s" : ""} to complete.`);
      return;
    }

    setIsSaving(true);
    try {
      const success = await onSave(form, product);
      if (success) {
        onClose();
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save product to database.");
    } finally {
      setIsSaving(false);
    }
  };

  // Calculations for Margin / Profit summary
  const profitPerUnit = form.price - form.unitCost;
  const marginPercent = form.price > 0 && form.unitCost > 0
    ? Math.max(0, Math.round((profitPerUnit / form.price) * 100))
    : null;
  const discountPercent = form.mrp > form.price
    ? Math.round(((form.mrp - form.price) / form.mrp) * 100)
    : null;

  return (
    <>
      <Modal
        className="product-editor-modal"
        title={
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-base font-bold text-slate-800 m-0 tracking-tight">
              {product ? `Edit · ${product.name || "Medicine"}` : "Add medicine / product"}
            </h2>
            <span className="inline-flex items-center text-[10px] font-semibold text-teal-700 bg-teal-50 border border-teal-200/80 rounded-full px-2 py-0.5">
              {form.category || "Catalog"}
            </span>
            {form.price > 0 && (
              <span className="inline-flex items-center text-[10px] font-bold text-slate-700 bg-slate-100 rounded-full px-2 py-0.5">
                ₹{form.price}
              </span>
            )}
            {form.media.length > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 bg-slate-50 border border-slate-200 rounded-full px-2 py-0.5">
                <ImagePlus size={11} className="text-teal-600" />
                {form.media.length} photo{form.media.length > 1 ? "s" : ""}
              </span>
            )}
          </div>
        }
        description="Configure product clinical details, real-time inventory, pricing, and high-resolution Cloudinary media."
        submitLabel={
          isUploading ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 size={14} className="animate-spin text-white" />
              <span>Uploading media ({uploadingCount})...</span>
            </span>
          ) : isSaving ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 size={14} className="animate-spin text-white" />
              <span>Saving product...</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5">
              <Check size={14} />
              <span>{product ? "Save product" : "Add to catalog"}</span>
            </span>
          )
        }
        submitDisabled={isUploading || isSaving}
        onClose={onClose}
        onSubmit={() => void handleSubmit()}
      >
        {/* Navigation Tabs */}
        <div className="product-editor-nav" role="tablist" aria-label="Product editor tabs">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "general"}
            className={`product-editor-tab ${activeTab === "general" ? "active" : ""}`}
            onClick={() => setActiveTab("general")}
          >
            <Package size={13} />
            <span>01 · Listing & Tags</span>
            {form.name.trim() && <span className="tab-badge">✓</span>}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "pricing"}
            className={`product-editor-tab ${activeTab === "pricing" ? "active" : ""}`}
            onClick={() => setActiveTab("pricing")}
          >
            <Boxes size={13} />
            <span>02 · Pricing & Stock</span>
            {form.price > 0 && <span className="tab-badge">₹{form.price}</span>}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "media"}
            className={`product-editor-tab ${activeTab === "media" ? "active" : ""}`}
            onClick={() => setActiveTab("media")}
          >
            <ImagePlus size={13} />
            <span>03 · Media Gallery</span>
            <span className="tab-badge">
              {isUploading ? <Loader2 size={10} className="animate-spin" /> : form.media.length}
            </span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "clinical"}
            className={`product-editor-tab ${activeTab === "clinical" ? "active" : ""}`}
            onClick={() => setActiveTab("clinical")}
          >
            <BadgeCheck size={13} />
            <span>04 · Clinical & Usage</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "all"}
            className={`product-editor-tab ${activeTab === "all" ? "active" : ""}`}
            onClick={() => setActiveTab("all")}
            title="View all sections together"
          >
            <Layers size={13} />
            <span>All Sections</span>
          </button>
        </div>

        {formError && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 flex items-center justify-between gap-2 animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="flex items-center gap-2">
              <AlertTriangle size={15} className="text-rose-600 shrink-0" />
              <span className="font-medium">{formError}</span>
            </div>
            <button
              type="button"
              className="text-rose-600 hover:text-rose-800 p-0.5 rounded"
              onClick={() => setFormError("")}
              aria-label="Dismiss error"
            >
              <X size={13} />
            </button>
          </div>
        )}

        {/* SECTION 1: STORE LISTING */}
        {(activeTab === "general" || activeTab === "all") && (
          <div className="product-editor-section animate-in fade-in duration-200">
            <div className="product-editor-section-head">
              <div>
                <h3>Store listing & details</h3>
                <p>Define product name, category, live visibility in patient app, and clinical concern tags.</p>
              </div>
              <span className="product-section-number">01</span>
            </div>
            <div className="product-form-grid">
              <div className="field">
                <label htmlFor="product-name">Product / medicine name *</label>
                <input
                  id="product-name"
                  value={form.name}
                  onChange={(event) => setField("name", event.target.value)}
                  placeholder="e.g. Daily Scalp Serum 60ml"
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="product-category">Shop category *</label>
                <select
                  id="product-category"
                  value={form.category}
                  onChange={(event) => setField("category", event.target.value)}
                >
                  {categoryOptions.map((cat) => (
                    <option key={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="product-status">Store status</label>
                <select
                  id="product-status"
                  value={form.status}
                  onChange={(event) => setField("status", event.target.value as ProductStatus)}
                >
                  <option value="Active">Active (Live in app)</option>
                  <option value="Draft">Draft (Hidden)</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>
              <div className="field">
                <span className="field-label">Concern tags (used for patient filtering)</span>
                <div className="tag-choice-list">
                  {rootCauseOptions.map((tag) => (
                    <label key={tag} className={`tag-choice ${form.rootCauses.includes(tag) ? "selected" : ""}`}>
                      <input
                        type="checkbox"
                        checked={form.rootCauses.includes(tag)}
                        onChange={(event) =>
                          setField(
                            "rootCauses",
                            event.target.checked
                              ? [...form.rootCauses, tag]
                              : form.rootCauses.filter((item) => item !== tag)
                          )
                        }
                      />
                      {tag}
                    </label>
                  ))}
                </div>
              </div>
              <div className="field field-span">
                <label htmlFor="product-description">Shop description</label>
                <textarea
                  id="product-description"
                  className="product-description-input"
                  value={form.description}
                  onChange={(event) => setField("description", event.target.value)}
                  placeholder="Describe the medicine or product, benefits, and how patients should use it."
                />
              </div>
            </div>

            {activeTab === "general" && (
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  className="button button-secondary button-small"
                  onClick={() => setActiveTab("pricing")}
                >
                  <span>Continue to Pricing & Stock</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* SECTION 2: PRICING & INVENTORY */}
        {(activeTab === "pricing" || activeTab === "all") && (
          <div className="product-editor-section animate-in fade-in duration-200">
            <div className="product-editor-section-head">
              <div>
                <h3>Pricing & stock</h3>
                <p>Set selling price, retail MRP, opening inventory, and product SKU.</p>
              </div>
              <span className="product-section-number">02</span>
            </div>

            {/* Live Pricing & Margin Insight Pill */}
            {form.price > 0 && (
              <div className="flex flex-wrap items-center gap-2.5 text-xs bg-slate-50 border border-slate-200/80 rounded-xl p-3">
                <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                  <TrendingUp size={14} className="text-teal-600 shrink-0" />
                  <span>Selling Price: ₹{form.price}</span>
                </div>
                {discountPercent !== null && discountPercent > 0 && (
                  <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
                    {discountPercent}% OFF MRP
                  </span>
                )}
                {marginPercent !== null && (
                  <span className="inline-flex items-center text-[10px] font-semibold text-teal-800 bg-teal-50 border border-teal-200 rounded-full px-2 py-0.5">
                    Margin: {marginPercent}% (₹{profitPerUnit} profit/unit)
                  </span>
                )}
                <span className="text-[10px] text-slate-400 ml-auto">
                  Stock: {form.stock} units
                </span>
              </div>
            )}

            <div className="product-form-grid">
              <div className="field">
                <label htmlFor="product-price">Selling price (₹) *</label>
                <input
                  id="product-price"
                  type="number"
                  min="1"
                  value={form.price || ""}
                  onChange={(e) => updatePrimaryPricing("price", e.target.value)}
                  placeholder="499"
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="product-mrp">Original MRP (₹)</label>
                <input
                  id="product-mrp"
                  type="number"
                  min="0"
                  value={form.mrp || ""}
                  onChange={(e) => updatePrimaryPricing("mrp", e.target.value)}
                  placeholder="699"
                />
              </div>
              <div className="field">
                <label htmlFor="product-stock">Available stock (units) *</label>
                <input
                  id="product-stock"
                  type="number"
                  min="0"
                  value={form.stock}
                  onChange={(e) => updatePrimaryPricing("stock", e.target.value)}
                  placeholder="100"
                />
              </div>
              <div className="field">
                <label htmlFor="product-sku">Product SKU *</label>
                <div className="relative flex items-center">
                  <input
                    id="product-sku"
                    value={form.sku}
                    onChange={(e) => updatePrimaryPricing("sku", e.target.value.toUpperCase())}
                    placeholder="DRH-SERUM-01"
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-2 text-xs text-slate-500 hover:text-slate-800 p-1 flex items-center gap-1 transition-colors"
                    onClick={generateSkuWithAnimation}
                    title="Generate unique SKU"
                  >
                    <RefreshCw size={12} className={isGeneratingSku ? "animate-spin text-teal-600" : ""} />
                    <span>Auto</span>
                  </button>
                </div>
              </div>
              <div className="field">
                <label htmlFor="product-unit-cost">Unit cost (₹) (internal margin)</label>
                <input
                  id="product-unit-cost"
                  type="number"
                  min="0"
                  value={form.unitCost || ""}
                  onChange={(e) => updatePrimaryPricing("unitCost", e.target.value)}
                  placeholder="150"
                />
              </div>
            </div>

            {/* Optional multi-month supply plans toggle */}
            <div className="mt-4 border-t border-slate-100 pt-3">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:text-teal-800 transition-colors"
                onClick={() => setShowAdvancedPlans(!showAdvancedPlans)}
              >
                <PackagePlus size={14} />
                {showAdvancedPlans ? "Hide multi-month bundle plans" : "Add multi-month supply plans (3 Months / 6 Months)"}
              </button>

              {showAdvancedPlans && (
                <div className="mt-3 space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-500">
                      Provide bundle options (e.g. 3-month supply with a discount badge).
                    </p>
                    <button
                      type="button"
                      className="button button-secondary button-small"
                      onClick={() =>
                        setField("supplyPlans", [
                          ...form.supplyPlans,
                          newPlan(form.price * 3 * 0.9, form.mrp * 3, "DRH-BUNDLE"),
                        ])
                      }
                    >
                      <Plus size={13} />
                      Add bundle plan
                    </button>
                  </div>

                  <div className="supply-plan-list">
                    {form.supplyPlans.map((plan, index) => (
                      <article className="supply-plan-card" key={plan.id}>
                        <div className="supply-plan-heading">
                          <span className="plan-index">Plan {String(index + 1).padStart(2, "0")}</span>
                          {form.supplyPlans.length > 1 && (
                            <button
                              type="button"
                              className="row-action danger-action"
                              aria-label={`Remove ${plan.title}`}
                              onClick={() =>
                                setField(
                                  "supplyPlans",
                                  form.supplyPlans.filter((_, planIndex) => planIndex !== index)
                                )
                              }
                            >
                              <X size={14} />
                            </button>
                          )}
                        </div>
                        <div className="product-form-grid">
                          <div className="field">
                            <label>Plan name *</label>
                            <input
                              value={plan.title}
                              onChange={(e) => updatePlan(index, "title", e.target.value)}
                              placeholder="3 Months"
                            />
                          </div>
                          <div className="field">
                            <label>Shop subtitle</label>
                            <input
                              value={plan.subtitle}
                              onChange={(e) => updatePlan(index, "subtitle", e.target.value)}
                              placeholder="Full Course + Scalp Roller"
                            />
                          </div>
                          <div className="field">
                            <label>SKU *</label>
                            <input
                              value={plan.sku}
                              onChange={(e) => updatePlan(index, "sku", e.target.value.toUpperCase())}
                              placeholder="DRH-SER-3M"
                            />
                          </div>
                          <div className="field">
                            <label>Badge</label>
                            <input
                              value={plan.badge}
                              onChange={(e) => updatePlan(index, "badge", e.target.value)}
                              placeholder="Most popular"
                            />
                          </div>
                          <div className="field">
                            <label>Selling price (₹) *</label>
                            <input
                              type="number"
                              min="1"
                              value={plan.price || ""}
                              onChange={(e) => updatePlan(index, "price", e.target.value)}
                            />
                          </div>
                          <div className="field">
                            <label>MRP (₹)</label>
                            <input
                              type="number"
                              min="0"
                              value={plan.mrp || ""}
                              onChange={(e) => updatePlan(index, "mrp", e.target.value)}
                            />
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {activeTab === "pricing" && (
              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  className="button button-secondary button-small"
                  onClick={() => setActiveTab("general")}
                >
                  <span>← Back to Details</span>
                </button>
                <button
                  type="button"
                  className="button button-secondary button-small"
                  onClick={() => setActiveTab("media")}
                >
                  <span>Continue to Media Gallery</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* SECTION 3: MEDIA (CLOUDINARY) */}
        {(activeTab === "media" || activeTab === "all") && (
          <div className="product-editor-section animate-in fade-in duration-200">
            <div className="product-editor-section-head">
              <div>
                <h3>Product photos & media (Cloudinary)</h3>
                <p>Drag & drop product images, browse from device, or paste direct URLs. Star marks the primary cover.</p>
              </div>
              <span className="product-section-number">03</span>
            </div>

            {isUploading && (
              <div className="flex items-center gap-2.5 rounded-xl border border-teal-200 bg-teal-50/90 px-3.5 py-2.5 text-xs text-teal-800 shadow-sm animate-pulse">
                <Loader2 size={16} className="animate-spin text-teal-600 shrink-0" />
                <span className="font-semibold">
                  Uploading {uploadingCount} image{uploadingCount > 1 ? "s" : ""} to Cloudinary storage...
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
              {/* Interactive Drag & Drop Area */}
              <div
                className={`media-dropzone ${isDraggingOver ? "is-dragging" : ""}`}
                onDragOver={handleDragOver}
                onDragEnter={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={pickMedia}
                  className="hidden"
                />
                <span className="media-drop-icon">
                  <UploadCloud size={20} />
                </span>
                <div>
                  <strong>{isDraggingOver ? "Drop medicine photos here" : "Upload from device"}</strong>
                  <small>Drag & drop or browse photos (JPEG, PNG, WebP up to 10 MB). Uploads immediately to Cloudinary.</small>
                </div>
                <button
                  type="button"
                  className="button button-secondary button-small shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                >
                  Browse files
                </button>
              </div>

              {/* Direct URL input */}
              <div className="flex flex-col justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/70">
                <div className="mb-2">
                  <strong className="text-xs font-semibold text-slate-800 block">Add via Image / Cloudinary URL</strong>
                  <small className="text-[11px] text-slate-500">Paste any public image link or Cloudinary secure URL</small>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://res.cloudinary.com/.../medicine.jpg"
                    className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addDirectUrl();
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="button button-secondary button-small shrink-0"
                    onClick={addDirectUrl}
                    disabled={!urlInput.trim()}
                  >
                    Add URL
                  </button>
                </div>
              </div>
            </div>

            {/* Media Manager Gallery List */}
            <div className="product-media-manager">
              {form.media.map((media, index) => {
                const meta = uploadMeta[media.name] || (media.url ? uploadMeta[media.url] : undefined);
                const isTemp = media.name.startsWith("temp-") || (media.url && media.url.startsWith("blob:"));
                const status: UploadStatus = meta?.status || (isTemp ? "uploading" : "ready");
                const displayUrl =
                  (media.url && (media.url.startsWith("http") || media.url.startsWith("blob:"))
                    ? media.url
                    : media.name && (media.name.startsWith("http") || media.name.startsWith("blob:"))
                    ? media.name
                    : null) ||
                  previews.find((item) => item.name === media.name || item.url === media.url)?.url;
                const Icon = media.kind === "video" ? Video : Package;
                const isCloudinary = displayUrl?.includes("cloudinary.com");

                return (
                  <div
                    className={`product-media-row ${status === "uploading" ? "is-uploading" : status === "error" ? "is-error" : ""}`}
                    key={`${media.name}-${index}`}
                  >
                    {/* Thumbnail with full-size viewer */}
                    <button
                      type="button"
                      className="product-media-thumb"
                      aria-label={`View ${media.name} full size`}
                      disabled={media.kind !== "image" || !displayUrl}
                      onClick={() =>
                        displayUrl &&
                        setImageToView({
                          src: displayUrl,
                          alt: media.altText || media.name,
                          fileName: media.name,
                          caption: "Product image preview",
                        })
                      }
                      title="Click to view full size"
                    >
                      {displayUrl && media.kind === "image" ? (
                        <img src={displayUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Icon size={15} />
                      )}
                    </button>

                    {/* Meta info & badges */}
                    <span className="product-media-name" title={media.url || media.name}>
                      <span className="flex items-center gap-1.5 font-medium truncate">
                        {media.isPrimary && (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5 shadow-2xs">
                            <Star size={10} className="fill-amber-500 text-amber-500" /> Primary Cover
                          </span>
                        )}
                        {status === "uploading" ? (
                          <span className="inline-flex items-center gap-1 text-[8px] font-semibold text-teal-800 bg-teal-100/80 rounded px-1.5 py-0.5">
                            <Loader2 size={9} className="animate-spin text-teal-600" /> Uploading...
                          </span>
                        ) : status === "error" ? (
                          <span className="inline-flex items-center gap-1 text-[8px] font-bold text-rose-700 bg-rose-100 rounded px-1.5 py-0.5">
                            <AlertTriangle size={9} className="text-rose-600" /> Upload failed
                          </span>
                        ) : isCloudinary ? (
                          <span className="inline-flex items-center text-[8px] font-bold text-emerald-800 bg-emerald-100 rounded px-1.5 py-0.5">
                            Cloudinary
                          </span>
                        ) : null}
                        <span className="truncate">{media.name}</span>
                      </span>
                      <small>
                        {media.kind} ·{" "}
                        {status === "uploading"
                          ? "Uploading to Cloudinary..."
                          : status === "error"
                          ? meta?.error || "Error uploading"
                          : displayUrl
                          ? "Ready"
                          : "Local"}
                      </small>
                    </span>

                    {/* Alt Text Input */}
                    <input
                      aria-label={`Alt text for ${media.name}`}
                      value={media.altText ?? ""}
                      onChange={(event) => updateMedia(index, { altText: event.target.value })}
                      placeholder="Alt text or caption"
                    />

                    {/* Primary Star Action */}
                    <button
                      type="button"
                      className={`row-action ${media.isPrimary ? "primary-media-selected" : ""}`}
                      aria-label={media.isPrimary ? "Primary cover image" : `Set ${media.name} as primary cover`}
                      onClick={() =>
                        setField(
                          "media",
                          form.media.map((item, mediaIndex) => ({
                            ...item,
                            isPrimary: mediaIndex === index && item.kind === "image",
                          }))
                        )
                      }
                      disabled={media.kind !== "image"}
                      title={media.isPrimary ? "Primary cover image" : "Set as primary cover"}
                    >
                      <Star size={14} className={media.isPrimary ? "fill-amber-500 text-amber-500" : ""} />
                    </button>

                    {/* Move Up */}
                    <button
                      type="button"
                      className="row-action"
                      aria-label={`Move ${media.name} up`}
                      disabled={index === 0}
                      onClick={() => moveMedia(index, -1)}
                      title="Move up"
                    >
                      <ArrowUp size={14} />
                    </button>

                    {/* Move Down */}
                    <button
                      type="button"
                      className="row-action"
                      aria-label={`Move ${media.name} down`}
                      disabled={index === form.media.length - 1}
                      onClick={() => moveMedia(index, 1)}
                      title="Move down"
                    >
                      <ArrowDown size={14} />
                    </button>

                    {/* Retry (if error) or Remove */}
                    {status === "error" ? (
                      <button
                        type="button"
                        className="row-action"
                        aria-label={`Retry uploading ${media.name}`}
                        onClick={() => retryUpload(media.name)}
                        title="Retry upload"
                      >
                        <RotateCcw size={14} className="text-teal-600" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="row-action danger-action"
                        aria-label={`Remove ${media.name}`}
                        onClick={() => removeMedia(index)}
                        title="Remove"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                );
              })}

              {form.media.length === 0 && (
                <div className="product-media-empty">
                  <ImagePlus size={24} className="mx-auto mb-2 text-slate-300" />
                  <p className="text-xs font-medium text-slate-600 m-0">No medicine images added yet.</p>
                  <p className="text-[11px] text-slate-400 mt-1 mb-0">Drag and drop photos above or browse from your device.</p>
                </div>
              )}
            </div>

            {activeTab === "media" && (
              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  className="button button-secondary button-small"
                  onClick={() => setActiveTab("pricing")}
                >
                  <span>← Back to Pricing</span>
                </button>
                <button
                  type="button"
                  className="button button-secondary button-small"
                  onClick={() => setActiveTab("clinical")}
                >
                  <span>Continue to Clinical & Usage</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* SECTION 4: CLINICAL DETAILS */}
        {(activeTab === "clinical" || activeTab === "all") && (
          <div className="product-editor-section animate-in fade-in duration-200">
            <div className="product-editor-section-head">
              <div>
                <h3>Product clinical details & usage</h3>
                <p>Benefits, key ingredients, usage instructions, and clinical claims shown to patients in the app.</p>
              </div>
              <span className="product-section-number">04</span>
            </div>
            <div className="product-content-grid">
              <div className="field">
                <label htmlFor="product-benefits">Benefits · title | description</label>
                <textarea
                  id="product-benefits"
                  className="product-description-input"
                  value={form.benefitsText}
                  onChange={(event) => setField("benefitsText", event.target.value)}
                  placeholder={"Supports hair density | Formulated to nourish hair follicles and reduce shedding"}
                />
              </div>
              <div className="field">
                <label htmlFor="product-ingredients">Ingredients · name | concentration | purpose</label>
                <textarea
                  id="product-ingredients"
                  className="product-description-input"
                  value={form.ingredientsText}
                  onChange={(event) => setField("ingredientsText", event.target.value)}
                  placeholder={"Procapil | 3% | Follicle activation\nBiotin | 1% | Keratin support"}
                />
              </div>
              <div className="field">
                <label htmlFor="product-usage">How to use · title | instructions</label>
                <textarea
                  id="product-usage"
                  className="product-description-input"
                  value={form.usageStepsText}
                  onChange={(event) => setField("usageStepsText", event.target.value)}
                  placeholder={"Step 1 | Apply 1ml to dry scalp using the dropper\nStep 2 | Gently massage for 2 minutes"}
                />
              </div>
              <div className="field">
                <label htmlFor="product-claims">Clinical claims · % | claim | source</label>
                <textarea
                  id="product-claims"
                  className="product-description-input"
                  value={form.clinicalClaimsText}
                  onChange={(event) => setField("clinicalClaimsText", event.target.value)}
                  placeholder={"89% | Reported reduced hair fall after 60 days | Clinical trial reference"}
                />
              </div>
            </div>

            {activeTab === "clinical" && (
              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  className="button button-secondary button-small"
                  onClick={() => setActiveTab("media")}
                >
                  <span>← Back to Media</span>
                </button>
                <button
                  type="button"
                  className="button button-primary button-small"
                  onClick={() => void handleSubmit()}
                  disabled={isUploading || isSaving}
                >
                  <Check size={13} />
                  <span>{product ? "Save product changes" : "Add product to catalog"}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      <FullSizeImageViewer image={imageToView} onClose={() => setImageToView(null)} />
    </>
  );
}

function ProductDetails({
  product,
  movements,
  onClose,
  onEdit,
  onAdjustStock,
  onDelete,
}: {
  product: ProductRecord;
  movements: StockMovement[];
  onClose: () => void;
  onEdit: () => void;
  onAdjustStock: () => void;
  onDelete: () => void;
}) {
  const plans = getPlans(product);
  return (
    <Modal
      className="product-details-modal"
      title={product.name}
      description={`${product.id} · ${product.category} · ${(product.rootCauses ?? []).join(", ") || "General"}`}
      submitLabel="Edit product"
      onClose={onClose}
      onSubmit={onEdit}
    >
      <div className="product-detail-toolbar">
        <StatusPill status={product.status} />
        <div className="flex items-center gap-2">
          <button className="button button-secondary button-small" onClick={onAdjustStock}>
            <PackagePlus size={13} />
            Adjust stock
          </button>
          <button className="button button-secondary button-small" onClick={onEdit}>
            <Pencil size={13} />
            Edit listing
          </button>
          <button className="button button-danger button-small" onClick={onDelete}>
            <Trash2 size={13} />
            Delete
          </button>
        </div>
      </div>
      <p className="product-detail-copy">{product.description || "No product description added yet."}</p>
      <section className="product-detail-section">
        <h3>Supply plans & inventory</h3>
        {plans.map((plan) => (
          <div className="product-plan-detail" key={plan.id}>
            <span>
              <strong>{plan.title}</strong>
              <small>
                {plan.subtitle} · {plan.sku}
              </small>
            </span>
            <span>
              <strong>{formatCurrency(plan.price)}</strong>
              <small>MRP {plan.mrp ? formatCurrency(plan.mrp) : "—"}</small>
            </span>
            <span>
              <strong className={plan.stock <= plan.lowStockThreshold ? "stock-low" : ""}>{plan.stock} units</strong>
              <small>Alert below {plan.lowStockThreshold}</small>
            </span>
          </div>
        ))}
      </section>
      {product.benefits?.length ||
      product.ingredients?.length ||
      product.usageSteps?.length ||
      product.clinicalClaims?.length ? (
        <section className="product-detail-section product-app-detail-grid">
          {product.benefits?.length ? (
            <DetailList
              title="Benefits"
              items={product.benefits.map((item) => `${item.title} — ${item.description}`)}
            />
          ) : null}
          {product.ingredients?.length ? (
            <DetailList
              title="Ingredients"
              items={product.ingredients.map((item) => `${item.name} · ${item.concentration} · ${item.purpose}`)}
            />
          ) : null}
          {product.usageSteps?.length ? (
            <DetailList
              title="Usage"
              items={product.usageSteps.map((item) => `${item.title} — ${item.description}`)}
            />
          ) : null}
          {product.clinicalClaims?.length ? (
            <DetailList
              title="Claims & sources"
              items={product.clinicalClaims.map(
                (item) => `${item.percentage ? `${item.percentage} · ` : ""}${item.claim} — ${item.source}`
              )}
            />
          ) : null}
        </section>
      ) : null}
      <section className="product-detail-section">
        <h3>Media gallery · {product.media?.length ?? 0}</h3>
        <div className="flex flex-wrap gap-2.5">
          {(product.media || []).map((media, index) => {
            const displayUrl =
              media.url && media.url.startsWith("http")
                ? media.url
                : media.name && media.name.startsWith("http")
                ? media.name
                : null;
            return (
              <div
                key={`${media.name}-${index}`}
                className="flex items-center gap-2 border border-slate-200 rounded-lg p-1.5 bg-slate-50 text-xs"
              >
                {displayUrl && media.kind === "image" ? (
                  <img src={displayUrl} alt="" className="w-8 h-8 rounded object-cover" />
                ) : media.kind === "video" ? (
                  <Video size={16} className="text-slate-500 ml-1" />
                ) : (
                  <Package size={16} className="text-slate-500 ml-1" />
                )}
                <span className="max-w-[120px] truncate text-[11px] font-medium">{media.altText || media.name}</span>
                {media.isPrimary && (
                  <span className="text-[9px] bg-amber-100 text-amber-800 font-semibold px-1 rounded">Primary Cover</span>
                )}
              </div>
            );
          })}
        </div>
      </section>
      <section className="product-detail-section">
        <h3>Recent inventory changes</h3>
        {movements.length ? (
          <div className="stock-movement-list">
            {movements.slice(0, 5).map((movement) => (
              <div key={movement.id}>
                <span>
                  <strong>{movement.variantTitle}</strong>
                  <small>
                    {movement.reason} · {new Date(movement.createdAt).toLocaleString()}
                  </small>
                </span>
                <strong className={movement.quantityChange > 0 ? "stock-increase" : "stock-decrease"}>
                  {movement.quantityChange > 0 ? "+" : ""}
                  {movement.quantityChange}
                </strong>
              </div>
            ))}
          </div>
        ) : (
          <p className="card-note">No manual stock changes recorded in this preview.</p>
        )}
      </section>
      <section className="product-detail-section product-performance-detail">
        <h3>Sales performance</h3>
        <div className="product-detail-grid">
          <DetailItem label="Units sold" value={product.unitsSold.toLocaleString("en-IN")} />
          <DetailItem label="Net sales" value={formatCurrency(product.revenue)} />
          <DetailItem label="Last updated" value={product.updated} />
        </div>
      </section>
    </Modal>
  );
}

function StockAdjustmentDialog({
  product,
  onClose,
  onSave,
}: {
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

  return (
    <Modal
      title="Adjust inventory"
      description={`${product.name} · Changes are recorded in stock history and synced to the database.`}
      submitLabel="Save adjustment"
      onClose={onClose}
      onSubmit={() => onSave(planId, delta, reason)}
    >
      <div className="form-grid-two">
        <div className="field field-span">
          <label htmlFor="stock-plan">Supply plan</label>
          <select id="stock-plan" value={planId} onChange={(event) => setPlanId(event.target.value)}>
            {plans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.title} · {plan.sku} · {plan.stock} on hand
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="stock-direction">Adjustment</label>
          <select
            id="stock-direction"
            value={direction}
            onChange={(event) => setDirection(event.target.value as "add" | "remove")}
          >
            <option value="add">Receive stock</option>
            <option value="remove">Remove stock</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="stock-quantity">Units</label>
          <input
            id="stock-quantity"
            type="number"
            min="1"
            step="1"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
          />
        </div>
        <div className="field field-span">
          <label htmlFor="stock-reason">Reason</label>
          <select id="stock-reason" value={reason} onChange={(event) => setReason(event.target.value)}>
            {["Stock received", "Damaged or expired", "Manual count correction", "Return restocked", "Other"].map(
              (item) => (
                <option key={item}>{item}</option>
              )
            )}
          </select>
        </div>
      </div>
      <div className="stock-adjustment-preview">
        <Boxes size={15} />
        <span>
          Current stock: <strong>{plans.find((plan) => plan.id === planId)?.stock ?? 0}</strong>
        </span>
        <span>
          Change:{" "}
          <strong>
            {delta > 0 ? "+" : ""}
            {delta}
          </strong>
        </span>
      </div>
    </Modal>
  );
}

function DetailList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="product-app-detail">
      <h4>{title}</h4>
      {items.map((item, index) => (
        <p key={`${title}-${index}`}>{item}</p>
      ))}
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="detail-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
