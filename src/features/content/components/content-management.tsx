"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Eye,
  FolderPlus,
  Heart,
  ImageIcon,
  LayoutGrid,
  List,
  Pencil,
  Play,
  Plus,
  Star,
  Trash2,
  UploadCloud,
  Video,
  X,
} from "lucide-react";
import { Avatar, Modal, PageHeader, StatusPill, TableToolbar } from "../../shared/components/ui";
import { useSessionState } from "../../shared/lib/use-session-state";
import {
  initialBanners,
  initialCategories,
  initialReviews,
  initialVideos,
} from "../lib/demo-data";
import type {
  BannerContentItem,
  ContentTab,
  ReviewContentItem,
  VideoContentItem,
} from "../types";
import type { Status } from "../../shared/types";
import type { AdminPermissionId } from "../../shared/types";
import type { CouponRecord } from "../../commerce/types";
import type { ProductRecord } from "../../commerce/types";
import { initialProducts } from "../../commerce/lib/demo-data";
import { destinationFromRoute } from "../lib/app-destinations";

const appBannerRoutes = [
  { path: "/", label: "Home" },
  { path: "/hair-test", label: "Hair assessment" },
  { path: "/products", label: "Shop" },
  { path: "/videos", label: "Videos" },
  { path: "/reviews", label: "Patient stories" },
  { path: "/notifications", label: "Notifications" },
  { path: "/profile", label: "Profile" },
  { path: "/orders", label: "Orders" },
  { path: "/clinic-appointment", label: "Clinic appointment" },
];

export function ContentManagement({
  mode,
  onToast,
  permissions,
  onAudit,
  scope = "all",
  embedded = false,
  availableOffers = [],
}: {
  mode: "content" | "catalog";
  onToast: (message: string) => void;
  permissions: AdminPermissionId[];
  onAudit: (action: string, target: string) => void;
  scope?: "all" | "content" | "home";
  embedded?: boolean;
  availableOffers?: CouponRecord[];
}) {
  const canPublish = permissions.includes("content.publish");
  const canEdit = permissions.includes("content.edit");
  const canUploadMedia = permissions.includes("media.upload");
  const [activeTab, setActiveTab] = useState<ContentTab>(scope === "home" ? "banners" : "videos");
  const [categories, setCategories] = useSessionState<string[]>(
    "drhair-demo-content-categories",
    initialCategories
  );
  const [videos, setVideos] = useSessionState<VideoContentItem[]>(
    "drhair-demo-content-videos",
    initialVideos
  );
  const [reviews, setReviews] = useSessionState<ReviewContentItem[]>(
    "drhair-demo-content-reviews",
    initialReviews
  );
  const [banners, setBanners] = useSessionState<BannerContentItem[]>(
    "drhair-demo-content-banners",
    initialBanners
  );
  const [catalogProducts] = useSessionState<ProductRecord[]>("drhair-commerce-products", initialProducts);
  const bannerRoutes = useMemo(() => [
    ...appBannerRoutes,
    ...catalogProducts.filter((product) => product.status === "Active" && product.stock > 0 && product.appProductId).map((product) => ({ path: `/products/${encodeURIComponent(product.appProductId!)}`, label: `Product · ${product.name}` })),
  ], [catalogProducts]);

  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All status");
  const [query, setQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Dialog States
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [originalItemStatus, setOriginalItemStatus] = useState<Status | null>(null);

  // Form State for Create / Edit
  const [formTitle, setFormTitle] = useState("");
  const [formCategory, setFormCategory] = useState(categories[0] || "Hair Fall");
  const [formMediaUrl, setFormMediaUrl] = useState("");
  const [formSecondaryText, setFormSecondaryText] = useState(""); // caption / comment / subtitle
  const [formDetailTag, setFormDetailTag] = useState(""); // treatment / duration / cta
  const [formRating, setFormRating] = useState<number>(5);
  const [formStatus, setFormStatus] = useState<Status>("Draft");
  const [formTargetRoute, setFormTargetRoute] = useState("/hair-test");
  const [formOfferCode, setFormOfferCode] = useState("");
  const [formStartsAt, setFormStartsAt] = useState("");
  const [formEndsAt, setFormEndsAt] = useState("");
  const [formPlacement, setFormPlacement] = useState<"Home hero" | "Home card">("Home hero");
  const [reviewConsentConfirmed, setReviewConsentConfirmed] = useState(false);

  // Filtering Logic
  const filteredVideos = useMemo(() => {
    return videos.filter((v) => {
      const matchesSearch = `${v.title} ${v.caption} ${v.creatorName} ${v.category}`
        .toLowerCase()
        .includes(query.toLowerCase());
      const matchesCat = selectedCategory === "All" || v.category === selectedCategory;
      const matchesStatus = statusFilter === "All status" || v.status === statusFilter;
      return matchesSearch && matchesCat && matchesStatus;
    });
  }, [videos, query, selectedCategory, statusFilter]);

  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      const matchesSearch = `${r.patientName} ${r.comment} ${r.treatment} ${r.category}`
        .toLowerCase()
        .includes(query.toLowerCase());
      const matchesCat = selectedCategory === "All" || r.category === selectedCategory;
      const matchesStatus = statusFilter === "All status" || r.status === statusFilter;
      return matchesSearch && matchesCat && matchesStatus;
    });
  }, [reviews, query, selectedCategory, statusFilter]);

  const filteredBanners = useMemo(() => {
    return banners.filter((b) => {
      const matchesSearch = `${b.title} ${b.subtitle} ${b.category}`
        .toLowerCase()
        .includes(query.toLowerCase());
      const matchesCat = selectedCategory === "All" || b.category === selectedCategory;
      const matchesStatus = statusFilter === "All status" || b.status === statusFilter;
      return matchesSearch && matchesCat && matchesStatus;
    });
  }, [banners, query, selectedCategory, statusFilter]);

  // Handle Image Upload with FileReader preview
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canUploadMedia) return;
    const file = e.target.files?.[0];
    if (file) {
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        onToast("Use a JPG, PNG, or WEBP image.");
        e.target.value = "";
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        onToast("Image file must be under 5MB.");
        e.target.value = "";
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setFormMediaUrl(event.target.result as string);
          onToast("Media uploaded and ready for preview!");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Add New Category
  const handleAddCategory = () => {
    if (!canEdit) return;
    const trimmed = newCategoryName.trim();
    if (!trimmed) {
      onToast("Please enter a category name.");
      return;
    }
    if (categories.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      onToast("Category already exists.");
      return;
    }
    setCategories([...categories, trimmed]);
    setSelectedCategory(trimmed);
    setFormCategory(trimmed);
    setNewCategoryName("");
    setIsCategoryModalOpen(false);
    onAudit("added app content category", trimmed);
    onToast(`Category "${trimmed}" added successfully!`);
  };

  // Open Create Modal
  const openCreateModal = () => {
    setEditingItemId(null);
    setOriginalItemStatus(null);
    setFormTitle("");
    setFormCategory(categories[0] || "Hair Fall");
    setFormMediaUrl("");
    setFormSecondaryText("");
    setFormDetailTag("");
    setFormRating(5);
    setFormStatus("Draft");
    setFormTargetRoute("/hair-test");
    setFormOfferCode("");
    setFormStartsAt("");
    setFormEndsAt("");
    setFormPlacement("Home hero");
    setReviewConsentConfirmed(false);
    setIsCreateModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (item: VideoContentItem | ReviewContentItem | BannerContentItem) => {
    if (!canEdit || (!canPublish && item.status === "Published")) {
      onToast("Published app content is locked for this editor. Ask Dr. Jai Bansal to make a publishable revision.");
      return;
    }
    setEditingItemId(item.id);
    setOriginalItemStatus(item.status);
    setFormCategory(item.category);
    setFormStatus(item.status);

    if (activeTab === "videos") {
      const v = item as VideoContentItem;
      setFormTitle(v.title);
      setFormMediaUrl(v.thumbnail);
      setFormSecondaryText(v.caption);
      setFormDetailTag(v.duration);
    } else if (activeTab === "reviews") {
      const r = item as ReviewContentItem;
      setFormTitle(r.patientName);
      setFormMediaUrl(r.avatar);
      setFormSecondaryText(r.comment);
      setFormDetailTag(r.treatment);
      setFormRating(r.rating);
      setReviewConsentConfirmed(false);
    } else {
      const b = item as BannerContentItem;
      setFormTitle(b.title);
      setFormMediaUrl(b.imageUrl);
      setFormSecondaryText(b.subtitle);
      setFormDetailTag(b.ctaText);
      setFormTargetRoute(b.targetRoute);
      setFormOfferCode(b.featuredOfferCode ?? "");
      setFormStartsAt(b.startsAt ?? "");
      setFormEndsAt(b.endsAt ?? "");
      setFormPlacement(b.placement ?? "Home hero");
    }

    setIsCreateModalOpen(true);
  };

  // Save (Create or Update)
  const handleSaveContent = () => {
    if (!canEdit && !(canUploadMedia && !editingItemId)) {
      onToast("This account can’t edit app content.");
      return;
    }
    if (!canPublish && originalItemStatus === "Published") {
      onToast("Only Dr. Jai Bansal can change content that is already published.");
      return;
    }
    if (!formTitle.trim()) {
      onToast("Please enter a title / name.");
      return;
    }
    if (activeTab === "banners") {
      if (!formMediaUrl.trim()) {
        onToast("Add a banner image before saving this home placement.");
        return;
      }
      if (!formDetailTag.trim()) {
        onToast("Add a button label for the banner.");
        return;
      }
      if (!bannerRoutes.some((route) => route.path === formTargetRoute) || !destinationFromRoute(formTargetRoute)) {
        onToast("Choose a destination that exists in the Dr. Hair app.");
        return;
      }
      if (formStartsAt && formEndsAt && formEndsAt < formStartsAt) {
        onToast("The banner end date must be after its start date.");
        return;
      }
      if (formOfferCode && !availableOffers.some((offer) => offer.code === formOfferCode && offer.status === "Active")) {
        onToast("Choose an active offer from Commerce → Coupons.");
        return;
      }
    }
    if (activeTab === "reviews" && formStatus === "Published" && !reviewConsentConfirmed) {
      onToast("Confirm the patient’s publishing consent before publishing this review.");
      return;
    }

    const defaultImage =
      formMediaUrl.trim() ||
      (activeTab === "reviews"
        ? "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300"
        : "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=600");
    const savedStatus = !canPublish && formStatus === "Published" ? "Draft" : formStatus;

    if (activeTab === "videos") {
      if (editingItemId) {
        setVideos((prev) =>
          prev.map((v) =>
            v.id === editingItemId
              ? {
                ...v,
                title: formTitle.trim(),
                category: formCategory,
                thumbnail: defaultImage,
                caption: formSecondaryText.trim(),
                duration: formDetailTag.trim() || "1:45",
                status: savedStatus,
                updated: "Just now",
              }
              : v
          )
        );
        onToast("Video reel updated successfully.");
      } else {
        const newVideo: VideoContentItem = {
          id: `VID-${Date.now().toString().slice(-4)}`,
          title: formTitle.trim(),
          category: formCategory,
          duration: formDetailTag.trim() || "1:45",
          views: 120,
          likes: 18,
          creatorName: "Dr. Hair Clinic",
          thumbnail: defaultImage,
          caption: formSecondaryText.trim() || "Educational video for hair care.",
          treatmentTag: "Hair Care",
          status: savedStatus,
          updated: "Just now",
        };
        setVideos([newVideo, ...videos]);
        onToast("Video reel added successfully.");
      }
    } else if (activeTab === "reviews") {
      if (editingItemId) {
        setReviews((prev) =>
          prev.map((r) =>
            r.id === editingItemId
              ? {
                ...r,
                patientName: formTitle.trim(),
                category: formCategory,
                avatar: defaultImage,
                comment: formSecondaryText.trim(),
                treatment: formDetailTag.trim() || "Hair Recovery Regimen",
                rating: formRating,
                status: savedStatus,
                updated: "Just now",
              }
              : r
          )
        );
        onToast("Review updated successfully.");
      } else {
        const newReview: ReviewContentItem = {
          id: `REV-${Date.now().toString().slice(-4)}`,
          patientName: formTitle.trim(),
          rating: formRating,
          category: formCategory,
          treatment: formDetailTag.trim() || "Hair Regrowth Protocol",
          duration: "Used for 3 months",
          comment: formSecondaryText.trim() || "Visible hair thickness improvements.",
          avatar: defaultImage,
          verified: true,
          status: savedStatus,
          updated: "Just now",
        };
        setReviews([newReview, ...reviews]);
        onToast("Patient review added successfully.");
      }
    } else {
      if (editingItemId) {
        setBanners((prev) =>
          prev.map((b) =>
            b.id === editingItemId
              ? {
                ...b,
                title: formTitle.trim(),
                subtitle: formSecondaryText.trim(),
                category: formCategory,
                imageUrl: defaultImage,
                ctaText: formDetailTag.trim() || "Learn More",
                  targetRoute: formTargetRoute.trim(),
                  destination: destinationFromRoute(formTargetRoute) ?? undefined,
                  featuredOfferCode: formOfferCode || undefined,
                  startsAt: formStartsAt || undefined,
                  endsAt: formEndsAt || undefined,
                  placement: formPlacement,
                status: savedStatus,
                updated: "Just now",
              }
              : b
          )
        );
        onToast("Banner updated successfully.");
      } else {
        const newBanner: BannerContentItem = {
          id: `BAN-${Date.now().toString().slice(-4)}`,
          title: formTitle.trim(),
          subtitle: formSecondaryText.trim(),
          category: formCategory,
          imageUrl: defaultImage,
          ctaText: formDetailTag.trim() || "Explore Now",
          targetRoute: formTargetRoute.trim(),
          destination: destinationFromRoute(formTargetRoute) ?? undefined,
          featuredOfferCode: formOfferCode || undefined,
          startsAt: formStartsAt || undefined,
          endsAt: formEndsAt || undefined,
          placement: formPlacement,
          status: savedStatus,
          updated: "Just now",
        };
        setBanners([newBanner, ...banners]);
        onToast("Banner added successfully.");
      }
    }

    setIsCreateModalOpen(false);
    onAudit(savedStatus === "Published" ? "published app content" : "saved app content draft", formTitle.trim());
    if (!canPublish && formStatus === "Published") onToast("Saved as a draft. Dr. Jai Bansal must publish it to the app.");
  };

  // Delete Item
  const handleDeleteItem = (id: string) => {
    if (!canEdit) return;
    if (activeTab === "videos") {
      setVideos((prev) => prev.filter((v) => v.id !== id));
      onToast("Video removed from library.");
    } else if (activeTab === "reviews") {
      setReviews((prev) => prev.filter((r) => r.id !== id));
      onToast("Review removed from library.");
    } else {
      setBanners((prev) => prev.filter((b) => b.id !== id));
      onToast("Banner removed from library.");
    }
    onAudit("removed app content item", id);
  };

  return (
    <div className={embedded ? "app-management-embedded" : "page-wrap mx-auto w-full max-w-[1420px] px-4 py-6 sm:px-6 lg:px-8"}>
      {!embedded && <PageHeader
        eyebrow={mode === "content" ? "App Experience & Media" : "Catalog Media"}
        title={mode === "content" ? "App Content & Media Manager" : "Product Media Manager"}
        description="Manage the videos, approved stories, and images that are intended for the Dr. Hair app."
        action={canEdit || canUploadMedia ? (
          <div className="flex items-center gap-2">
            <button
              className="button button-secondary text-xs flex items-center gap-1.5"
              onClick={() => canEdit && setIsCategoryModalOpen(true)}
            >
              <FolderPlus size={14} />
              <span>+ Add Category</span>
            </button>
            <button
              className="button button-primary text-xs flex items-center gap-1.5"
              onClick={openCreateModal}
            >
              <Plus size={14} />
              <span>
                {activeTab === "videos"
                  ? "Upload Video Reel"
                  : activeTab === "reviews"
                    ? "Add Patient Review"
                    : "Create Banner"}
              </span>
            </button>
          </div>
        ) : undefined}
      />}

      <div className="notice" style={{ marginBottom: 15 }}>
        <Eye size={14} />
        <span>This workspace is for public Dr. Hair app media and approved stories. Keep private patient files in Patients → Documents or Hair tests & reports, and confirm a patient release before publishing a testimonial.</span>
      </div>

      {embedded && <div className="mb-4 flex flex-wrap justify-end gap-2">
        {canEdit && <button className="button button-secondary button-small" onClick={() => setIsCategoryModalOpen(true)}><FolderPlus size={13} />Add category</button>}
        {(canEdit || canUploadMedia) && <button className="button button-primary button-small" onClick={openCreateModal}><Plus size={13} />{activeTab === "videos" ? "Upload video" : activeTab === "reviews" ? "Add patient story" : "Create banner"}</button>}
      </div>}

      {/* Top Content Type Switcher */}
      <div className={`flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3 mb-4 ${scope !== "all" ? "hidden" : ""}`}>
        <div className="inline-flex p-1 bg-slate-100 rounded-xl gap-1 text-xs font-semibold">
          {scope !== "home" && <button
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${activeTab === "videos"
              ? "bg-white text-teal-800 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
              }`}
            onClick={() => {
              setActiveTab("videos");
              setSelectedCategory("All");
            }}
          >
            <Video size={14} className={activeTab === "videos" ? "text-teal-600" : ""} />
            <span>Educational Videos ({videos.length})</span>
          </button>}

          {scope !== "home" && <button
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${activeTab === "reviews"
              ? "bg-white text-teal-800 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
              }`}
            onClick={() => {
              setActiveTab("reviews");
              setSelectedCategory("All");
            }}
          >
            <Star size={14} className={activeTab === "reviews" ? "text-amber-500 fill-amber-500" : ""} />
            <span>Patient Reviews ({reviews.length})</span>
          </button>}

          {scope !== "content" && <button
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${activeTab === "banners"
              ? "bg-white text-teal-800 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
              }`}
            onClick={() => {
              setActiveTab("banners");
              setSelectedCategory("All");
            }}
          >
            <ImageIcon size={14} className={activeTab === "banners" ? "text-[#0D9488]" : ""} />
            <span>Home Banners & Media ({banners.length})</span>
          </button>}
        </div>

        {/* View Toggle */}
        <div className="inline-flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            className={`p-1.5 rounded ${viewMode === "grid" ? "bg-white text-teal-700 shadow-sm" : "text-slate-400"}`}
            onClick={() => setViewMode("grid")}
            title="Grid view"
          >
            <LayoutGrid size={14} />
          </button>
          <button
            className={`p-1.5 rounded ${viewMode === "table" ? "bg-white text-teal-700 shadow-sm" : "text-slate-400"}`}
            onClick={() => setViewMode("table")}
            title="Table view"
          >
            <List size={14} />
          </button>
        </div>
      </div>

      {/* Category Pills & Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        {/* Category Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin text-xs">
          <span className="text-slate-400 font-medium text-[11px] mr-1">Category:</span>
          <button
            className={`px-2.5 py-1 rounded-full font-medium transition-colors whitespace-nowrap ${selectedCategory === "All"
              ? "bg-teal-600 text-white font-semibold shadow-sm"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            onClick={() => setSelectedCategory("All")}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              className={`px-2.5 py-1 rounded-full font-medium transition-colors whitespace-nowrap ${selectedCategory === cat
                ? "bg-teal-600 text-white font-semibold shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
          <button
            className="px-2 py-1 text-teal-700 hover:text-teal-900 text-xs font-semibold flex items-center gap-1 whitespace-nowrap"
            onClick={() => setIsCategoryModalOpen(true)}
          >
            <Plus size={12} />
            <span>New</span>
          </button>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <select
            className="period-select text-xs"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option>All status</option>
            <option>Published</option>
            <option>Draft</option>
            <option>Review</option>
          </select>
        </div>
      </div>

      <TableToolbar
        value={query}
        onChange={setQuery}
        placeholder={`Search ${activeTab === "videos" ? "videos by title, caption, creator..." : activeTab === "reviews" ? "reviews by patient, treatment, keyword..." : "banners by title, route..."}`}
        right={
          <button
            className="filter-button"
            onClick={() => {
              setQuery("");
              setSelectedCategory("All");
              setStatusFilter("All status");
            }}
          >
            <X size={13} />
            Reset
          </button>
        }
      />

      {/* ============================================================== */}
      {/* 1. VIDEOS TAB VIEW */}
      {/* ============================================================== */}
      {activeTab === "videos" && (
        viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-4">
            {filteredVideos.map((video) => (
              <article
                key={video.id}
                className="card p-0 overflow-hidden border border-slate-200 rounded-xl bg-white shadow-sm flex flex-col group hover:shadow-md transition-shadow"
              >
                {/* Video Thumbnail with Play Overlay */}
                <div className="relative aspect-video w-full bg-slate-900 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <span className="w-10 h-10 rounded-full bg-white/90 text-teal-800 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Play size={16} className="fill-teal-800 ml-0.5" />
                    </span>
                  </div>
                  <span className="absolute bottom-2 right-2 bg-black/75 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                    {video.duration}
                  </span>
                  <span className="absolute top-2 left-2">
                    <StatusPill status={video.status} />
                  </span>
                </div>

                {/* Content Details */}
                <div className="p-3.5 flex flex-col flex-1 justify-between gap-2">
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                      <span className="px-2 py-0.5 bg-teal-50 text-teal-700 rounded-full font-semibold border border-teal-100">
                        {video.category}
                      </span>
                      <span>{video.creatorName}</span>
                    </div>
                    <h4 className="font-bold text-slate-800 text-xs line-clamp-2 m-0 group-hover:text-teal-700 transition-colors">
                      {video.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 mb-0">{video.caption}</p>
                  </div>

                  {/* Actions & Metrics */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-400">
                    <div className="flex items-center gap-3 text-[11px]">
                      <span className="flex items-center gap-1">
                        <Eye size={12} />
                        {video.views.toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart size={12} />
                        {video.likes.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(video)}
                        className="p-1.5 text-slate-500 hover:text-teal-700 rounded hover:bg-slate-100"
                        title="Edit video reel"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => handleDeleteItem(video.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50"
                        title="Delete video"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
            {filteredVideos.length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-400 text-xs">
                No videos match the search or category filters.
              </div>
            )}
          </div>
        ) : (
          <div className="table-wrap mt-4">
            <table>
              <thead>
                <tr>
                  <th>Video</th>
                  <th>Category</th>
                  <th>Duration</th>
                  <th>Views & Engagement</th>
                  <th>Status</th>
                  <th>Updated</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filteredVideos.map((v) => (
                  <tr key={v.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-8 rounded bg-slate-900 overflow-hidden flex-shrink-0 relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={v.thumbnail} alt={v.title} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <strong className="text-xs text-slate-800 block truncate max-w-xs">{v.title}</strong>
                          <span className="text-[10px] text-slate-400">{v.creatorName}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs">{v.category}</span>
                    </td>
                    <td>{v.duration}</td>
                    <td>{v.views.toLocaleString()} views · {v.likes} likes</td>
                    <td><StatusPill status={v.status} /></td>
                    <td>{v.updated}</td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEditModal(v)} className="row-action" title="Edit"><Pencil size={14} /></button>
                        <button onClick={() => handleDeleteItem(v.id)} className="row-action hover:text-rose-600" title="Delete"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* ============================================================== */}
      {/* 2. REVIEWS TAB VIEW */}
      {/* ============================================================== */}
      {activeTab === "reviews" && (
        viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {filteredReviews.map((rev) => (
              <article
                key={rev.id}
                className="card p-3.5 border border-slate-200 rounded-xl bg-white shadow-sm flex flex-col justify-between group hover:shadow-md transition-shadow"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <Avatar initials={rev.patientName.split(" ").map((n) => n[0]).join("")} />
                      <div>
                        <div className="font-bold text-xs text-slate-800 flex items-center gap-1">
                          {rev.patientName}
                          {rev.verified && <CheckCircle2 size={12} className="text-teal-600 fill-teal-100" />}
                        </div>
                        <span className="text-[10px] text-slate-400">{rev.duration}</span>
                      </div>
                    </div>
                    <StatusPill status={rev.status} />
                  </div>

                  {/* Rating Stars */}
                  <div className="flex items-center gap-0.5 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={12}
                        className={star <= rev.rating ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-200"}
                      />
                    ))}
                    <span className="text-[11px] font-bold text-slate-700 ml-1.5">{rev.rating}.0</span>
                  </div>

                  {/* Treatment Category Badge */}
                  <div className="mb-2">
                    <span className="px-2 py-0.5 bg-[#F0F7FF] text-[#1A365D] border border-[#D6E0FC] rounded text-[10px] font-semibold">
                      {rev.category} · {rev.treatment}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 italic line-clamp-3 mb-0">“{rev.comment}”</p>
                </div>

                <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 text-xs text-slate-400">
                  <span className="text-[10px]">Updated {rev.updated}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(rev)}
                      className="p-1.5 text-slate-500 hover:text-teal-700 rounded hover:bg-slate-100"
                      title="Edit review"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => handleDeleteItem(rev.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50"
                      title="Delete review"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </article>
            ))}
            {filteredReviews.length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-400 text-xs">
                No patient reviews match the search or category filters.
              </div>
            )}
          </div>
        ) : (
          <div className="table-wrap mt-4">
            <table>
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Rating</th>
                  <th>Category & Protocol</th>
                  <th>Review Comment</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filteredReviews.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <Avatar initials={r.patientName.split(" ").map((n) => n[0]).join("")} />
                        <div>
                          <strong className="text-xs text-slate-800 block">{r.patientName}</strong>
                          <span className="text-[10px] text-slate-400">{r.duration}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                        <Star size={12} className="fill-amber-400" />
                        <span>{r.rating}.0</span>
                      </div>
                    </td>
                    <td>
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs">{r.category}</span>
                      <small className="block text-[10px] text-slate-400 mt-0.5">{r.treatment}</small>
                    </td>
                    <td>
                      <p className="text-xs text-slate-600 max-w-sm truncate m-0">“{r.comment}”</p>
                    </td>
                    <td><StatusPill status={r.status} /></td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEditModal(r)} className="row-action" title="Edit"><Pencil size={14} /></button>
                        <button onClick={() => handleDeleteItem(r.id)} className="row-action hover:text-rose-600" title="Delete"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* ============================================================== */}
      {/* 3. BANNERS TAB VIEW */}
      {/* ============================================================== */}
      {activeTab === "banners" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {filteredBanners.map((banner) => (
            <article
              key={banner.id}
              className="card p-0 overflow-hidden border border-slate-200 rounded-xl bg-white shadow-sm flex flex-col group hover:shadow-md transition-shadow"
            >
              <div className="relative aspect-[21/9] w-full bg-slate-900 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={banner.imageUrl}
                  alt={banner.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-4 text-white">
                  <span className="self-start px-2 py-0.5 bg-teal-600 text-white text-[10px] font-bold rounded mb-1">
                    {banner.category}
                  </span>
                  <h3 className="font-bold text-sm text-white m-0 drop-shadow">{banner.title}</h3>
                  <p className="text-xs text-slate-200 line-clamp-1 mt-1 mb-0 drop-shadow">{banner.subtitle}</p>
                </div>
                <span className="absolute top-2 right-2">
                  <StatusPill status={banner.status} />
                </span>
              </div>

              <div className="p-3 bg-white flex items-center justify-between text-xs text-slate-500">
                <span className="min-w-0 flex-1 font-medium text-slate-700">CTA: “{banner.ctaText}” ({banner.targetRoute}) · {banner.placement ?? "Home hero"}{banner.featuredOfferCode ? ` · ${banner.featuredOfferCode}` : ""}{banner.startsAt || banner.endsAt ? ` · ${banner.startsAt || "Now"}–${banner.endsAt || "No end date"}` : ""}</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(banner)}
                    className="p-1.5 text-slate-500 hover:text-teal-700 rounded hover:bg-slate-100"
                    title="Edit banner"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => handleDeleteItem(banner.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50"
                    title="Delete banner"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </article>
          ))}
          {filteredBanners.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-400 text-xs">
              No banners match the selected filters.
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: ADD NEW CATEGORY */}
      {/* ============================================================== */}
      {isCategoryModalOpen && (
        <Modal
          title="Create New App Category"
          description="Add a new content or treatment category that will be available across videos, reviews, and products."
          submitLabel="Add Category"
          onClose={() => setIsCategoryModalOpen(false)}
          onSubmit={handleAddCategory}
        >
          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-600 font-medium mb-1">Category Name</label>
              <input
                type="text"
                className="w-full border border-slate-300 rounded-lg p-2 text-xs"
                placeholder="e.g. PRP Therapy, Nutrition, Scalp Massage"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                autoFocus
              />
            </div>
            <div>
              <label className="block text-slate-500 text-[11px] mb-1">Existing Categories:</label>
              <div className="flex flex-wrap gap-1">
                {categories.map((c) => (
                  <span key={c} className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-[11px] text-slate-600">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* ============================================================== */}
      {/* MODAL: CREATE / EDIT CONTENT WITH MEDIA UPLOAD */}
      {/* ============================================================== */}
      {isCreateModalOpen && (
        <Modal
          title={
            editingItemId
              ? `Edit ${activeTab === "videos" ? "Video Reel" : activeTab === "reviews" ? "Patient Review" : "Banner"}`
              : `Upload New ${activeTab === "videos" ? "Video Reel" : activeTab === "reviews" ? "Patient Review" : "Banner"}`
          }
          description="Upload media, configure category, and publish directly to the mobile app library."
          submitLabel={canPublish && formStatus === "Published" ? "Publish to App" : "Save Draft"}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleSaveContent}
        >
          <div className="space-y-3.5 text-xs">
            {/* Title / Name */}
            <div>
              <label className="block text-slate-600 font-medium mb-1">
                {activeTab === "videos" ? "Video Title" : activeTab === "reviews" ? "Patient Full Name" : "Banner Heading"}
              </label>
              <input
                type="text"
                className="w-full border border-slate-300 rounded-lg p-2 text-xs"
                placeholder={
                  activeTab === "videos"
                    ? "e.g. How to Regrow Hair Along the Temples"
                    : activeTab === "reviews"
                      ? "e.g. Yashveer Soni"
                      : "e.g. Personalized Doctor-Led Regrowth"
                }
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
              />
            </div>

            {/* Category and Status */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 font-medium mb-1 flex items-center justify-between">
                  <span>Category</span>
                  <button
                    type="button"
                    onClick={() => setIsCategoryModalOpen(true)}
                    className="text-[10px] text-teal-700 hover:underline font-semibold"
                  >
                    + New
                  </button>
                </label>
                <select
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white"
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Publishing Status</label>
                <select
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white"
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as Status)}
                >
                  <option value="Published" disabled={!canPublish}>Published{!canPublish ? " · Doctor only" : ""}</option>
                  <option value="Draft">Draft</option>
                  <option value="Review">In Review</option>
                </select>
              </div>
            </div>

            {/* Media Upload & URL with Live Preview */}
            <div className="space-y-2">
              <label className="block text-slate-600 font-medium">
                {activeTab === "videos" ? "Video Thumbnail / Image" : activeTab === "reviews" ? "Patient Avatar / Result Photo" : "Banner Visual Media"}
              </label>

              {/* Upload Dropzone */}
              <div className="border-2 border-dashed border-slate-300 hover:border-teal-500 rounded-xl p-3 bg-slate-50 text-center transition-colors">
                <input
                  type="file"
                  id="media-upload-input"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={!canUploadMedia}
                />
                <label htmlFor="media-upload-input" className="cursor-pointer flex flex-col items-center gap-1.5">
                  <UploadCloud size={20} className="text-teal-600" />
                  <span className="text-xs font-semibold text-slate-700">{canUploadMedia ? "Click to upload app image" : "App media upload permission required"}</span>
                  <span className="text-[10px] text-slate-400">PNG, JPG, or WEBP up to 5MB</span>
                </label>
              </div>

              {/* Or paste URL */}
              <div>
                <span className="text-[10px] text-slate-400 block mb-1">Or paste image / media URL:</span>
                <input
                  type="url"
                  className="w-full border border-slate-300 rounded-lg p-1.5 text-xs"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={formMediaUrl}
                  onChange={(e) => setFormMediaUrl(e.target.value)}
                />
              </div>

              {/* Real-time Preview Box */}
              {formMediaUrl && (
                <div className="mt-2 p-2 bg-slate-100 rounded-lg border border-slate-200 flex items-center gap-3">
                  <div className="w-16 h-12 rounded bg-slate-800 overflow-hidden flex-shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={formMediaUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[11px] font-semibold text-slate-700 block truncate">Live Media Preview</span>
                    <span className="text-[10px] text-slate-400">Image loaded and ready</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormMediaUrl("")}
                    className="text-slate-400 hover:text-rose-600 p-1"
                    title="Remove image"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>

            {/* Tab Specific Extra Fields */}
            {activeTab === "videos" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Video Duration (MM:SS)</label>
                  <input
                    type="text"
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs"
                    placeholder="e.g. 1:45"
                    value={formDetailTag}
                    onChange={(e) => setFormDetailTag(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Treatment / Protocol Tag</label>
                  <input
                    type="text"
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs"
                    placeholder="e.g. Topical Solution"
                    value={formSecondaryText}
                    onChange={(e) => setFormSecondaryText(e.target.value)}
                  />
                </div>
              </div>
            )}

            {activeTab === "reviews" && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Rating Score</label>
                    <select
                      className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white"
                      value={formRating}
                      onChange={(e) => setFormRating(Number(e.target.value))}
                    >
                      <option value={5}>★★★★★ (5 Stars)</option>
                      <option value={4}>★★★★☆ (4 Stars)</option>
                      <option value={3}>★★★☆☆ (3 Stars)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Treatment Diagnosed</label>
                    <input
                      type="text"
                      className="w-full border border-slate-300 rounded-lg p-2 text-xs"
                      placeholder="e.g. Stage 2 Receding Hairline"
                      value={formDetailTag}
                      onChange={(e) => setFormDetailTag(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">Review Comment / Story</label>
                  <textarea
                    rows={3}
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs"
                    placeholder="Patient testimonial text..."
                    value={formSecondaryText}
                    onChange={(e) => setFormSecondaryText(e.target.value)}
                  />
                </div>
                {formStatus === "Published" && <label className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-[11px] leading-5 text-amber-900"><input type="checkbox" checked={reviewConsentConfirmed} onChange={(event) => setReviewConsentConfirmed(event.target.checked)} className="mt-1" /><span>I confirm the patient has approved publishing this testimonial and its identifying details.</span></label>}
              </div>
            )}

            {activeTab === "banners" && (
              <div className="space-y-2">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Subtitle / Supporting Copy</label>
                  <input
                    type="text"
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs"
                    placeholder="e.g. Complete your free 3-minute hair test with scalp analysis"
                    value={formSecondaryText}
                    onChange={(e) => setFormSecondaryText(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">CTA Button Text</label>
                    <input
                      type="text"
                      className="w-full border border-slate-300 rounded-lg p-2 text-xs"
                      placeholder="e.g. Start Hair Test"
                      value={formDetailTag}
                      onChange={(e) => setFormDetailTag(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Target App Route</label>
                    <select className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white" value={formTargetRoute} onChange={(e) => setFormTargetRoute(e.target.value)}>
                      {formTargetRoute === "/shop" && <option value="/shop">Old destination /shop · choose a new route</option>}
                      {bannerRoutes.map((route) => <option key={route.path} value={route.path}>{route.label} · {route.path}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <label className="block text-slate-600 font-medium">Placement<select className="mt-1 w-full border border-slate-300 rounded-lg p-2 text-xs bg-white" value={formPlacement} onChange={(e) => setFormPlacement(e.target.value as "Home hero" | "Home card")}><option>Home hero</option><option>Home card</option></select></label>
                  <label className="block text-slate-600 font-medium">Show from<input type="date" className="mt-1 w-full border border-slate-300 rounded-lg p-2 text-xs" value={formStartsAt} onChange={(e) => setFormStartsAt(e.target.value)} /></label>
                  <label className="block text-slate-600 font-medium">Hide after<input type="date" className="mt-1 w-full border border-slate-300 rounded-lg p-2 text-xs" value={formEndsAt} onChange={(e) => setFormEndsAt(e.target.value)} /></label>
                </div>
                <label className="block text-slate-600 font-medium">Feature an existing coupon <span className="font-normal text-slate-400">(create and edit coupons in Commerce)</span>
                  <select className="mt-1 w-full border border-slate-300 rounded-lg p-2 text-xs bg-white" value={formOfferCode} onChange={(e) => setFormOfferCode(e.target.value)}><option value="">No offer attached</option>{availableOffers.filter((offer) => offer.status === "Active").map((offer) => <option key={offer.id} value={offer.code}>{offer.code} · {offer.discountType === "percent" ? `${offer.discountValue}% off` : `₹${offer.discountValue} off`}</option>)}</select>
                </label>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
