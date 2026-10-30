import type { Status } from "../shared/types";
import type { AppDestination } from "./lib/app-destinations";

export type ContentTab = "videos" | "reviews" | "banners";

export interface VideoContentItem {
  id: string;
  title: string;
  category: string;
  duration: string;
  views: number;
  likes: number;
  creatorName: string;
  thumbnail: string;
  videoUrl?: string;
  provider?: "cloudinary" | "youtube";
  publicId?: string;
  placement?: "home" | "reels" | "both";
  apiManaged?: boolean;
  caption: string;
  treatmentTag: string;
  status: Status;
  updated: string;
}

export interface ReviewContentItem {
  id: string;
  patientName: string;
  rating: number; // 1 to 5
  category: string;
  treatment: string;
  duration: string;
  comment: string;
  avatar: string;
  verified: boolean;
  status: Status;
  updated: string;
}

export interface BannerContentItem {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  imageUrl: string;
  ctaText: string;
  targetRoute: string;
  destination?: AppDestination;
  featuredOfferCode?: string;
  startsAt?: string;
  endsAt?: string;
  placement?: "Home hero" | "Home card";
  status: Status;
  updated: string;
}

