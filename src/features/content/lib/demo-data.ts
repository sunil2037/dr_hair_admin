import type { BannerContentItem, ReviewContentItem, VideoContentItem } from "../types";

export const initialCategories: string[] = [
  "Hair Fall",
  "Regrowth",
  "Dandruff",
  "Scalp Care",
  "Diet & Nutrition",
];

export const initialVideos: VideoContentItem[] = [];

export const initialReviews: ReviewContentItem[] = [
  {
    id: "REV-201",
    patientName: "Yashveer Soni",
    rating: 5,
    category: "Hair Fall",
    treatment: "Stage 3 Receding Hairline Protocol",
    duration: "Used for 5 months",
    comment: "DrHair completely reversed my hairline thinning. Following the customized routine faithfully with the topical booster made a night and day difference.",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=300",
    verified: true,
    status: "Published",
    updated: "Today",
  },
  {
    id: "REV-202",
    patientName: "Rahul Sharma",
    rating: 5,
    category: "Regrowth",
    treatment: "Crown Thinning & Density Loss",
    duration: "Used for 4 months",
    comment: "I was skeptical after trying various store shampoos. But having a doctor analyze my scalp photos and formulate specific serums stopped my daily hair shed by week 4.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=300",
    verified: true,
    status: "Published",
    updated: "Oct 28, 2026",
  },
  {
    id: "REV-203",
    patientName: "Ananya Mehra",
    rating: 4,
    category: "Dandruff",
    treatment: "Dry Flaking & Follicle Weakness",
    duration: "Used for 2 months",
    comment: "Cleared stubborn scalp buildup and dandruff within 3 weeks. Hair roots feel significantly cleaner and thicker now.",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=300",
    verified: true,
    status: "Published",
    updated: "Oct 25, 2026",
  },
  {
    id: "REV-204",
    patientName: "Sneha Kapoor",
    rating: 5,
    category: "Hair Fall",
    treatment: "Post-Stress Hair Shedding",
    duration: "Used for 3 months",
    comment: "Reduced daily hair fall by over 70% within the first 6 weeks. The customized clinical serum is lightweight and non-greasy.",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=300",
    verified: true,
    status: "Published",
    updated: "Oct 22, 2026",
  },
];

export const initialBanners: BannerContentItem[] = [
  {
    id: "BAN-301",
    title: "Personalized Trichology Diagnosis",
    subtitle: "Complete your free 3-minute hair assessment with scalp photo analysis",
    category: "Hair Fall",
    imageUrl: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&auto=format&fit=crop&q=80",
    ctaText: "Start Free Hair Test",
    targetRoute: "/hair-test",
    destination: { type: "screen", screen: "hair_test" },
    status: "Published",
    updated: "Today",
  },
  {
    id: "BAN-302",
    title: "Doctor-Formulated Regrowth Kits",
    subtitle: "FDA-approved active ingredients targeted for your specific hair loss stage",
    category: "Regrowth",
    imageUrl: "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=800&auto=format&fit=crop&q=80",
    ctaText: "Explore Regimen",
    targetRoute: "/products/follicle-booster-serum",
    destination: { type: "product", entityId: "follicle-booster-serum", fallback: "products" },
    status: "Published",
    updated: "Oct 26, 2026",
  },
];

