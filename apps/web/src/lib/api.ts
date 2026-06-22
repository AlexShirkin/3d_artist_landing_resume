// Server-side fetch goes directly to gateway inside Docker network
const API_URL = process.env.API_URL || "http://gateway:4000";

async function apiFetch<T>(url: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(url, { next: { revalidate: 30 } });
    if (!res.ok) return fallback;
    return (await res.json()) as T;
  } catch {
    return fallback;
  }
}

export interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  category: string;
  mediaType: "video" | "gif" | "image";
  mediaUrl: string;
  thumbnailUrl: string | null;
  featured: boolean;
  sortOrder: number;
}

export interface SiteSettings {
  designerName: string;
  tagline: string;
  bio: string;
  email: string;
  telegram: string;
  instagram: string;
  yearsExperience: number;
  heroLabel: string;
  competencies: string[];
}

export function mediaSrc(url: string): string {
  if (url.startsWith("http")) return url;
  // Same-origin via /uploads route handler (supports range requests for video)
  return url.startsWith("/") ? url : `/${url}`;
}

export async function fetchItems(params?: {
  featured?: boolean;
  category?: string;
}): Promise<PortfolioItem[]> {
  const q = new URLSearchParams();
  if (params?.featured) q.set("featured", "true");
  if (params?.category) q.set("category", params.category);
  return apiFetch(`${API_URL}/api/portfolio/items?${q}`, []);
}

export async function fetchSettings(): Promise<SiteSettings | null> {
  return apiFetch<SiteSettings | null>(
    `${API_URL}/api/portfolio/settings`,
    null
  );
}

export async function fetchCategories(): Promise<string[]> {
  return apiFetch(`${API_URL}/api/portfolio/categories`, []);
}
