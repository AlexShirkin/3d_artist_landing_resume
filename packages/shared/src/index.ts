export type MediaType = "video" | "gif" | "image";

export interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  category: string;
  mediaType: MediaType;
  mediaUrl: string;
  thumbnailUrl: string | null;
  featured: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface PortfolioItemInput {
  title: string;
  description: string;
  category: string;
  mediaType: MediaType;
  featured?: boolean;
  sortOrder?: number;
}

export interface AuthUser {
  id: string;
  email: string;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export interface SiteSettings {
  designerName: string;
  tagline: string;
  bio: string;
  email: string;
  telegram: string;
  instagram: string;
  yearsExperience: number;
}
