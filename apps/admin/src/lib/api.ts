const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
export const MEDIA_URL = process.env.NEXT_PUBLIC_MEDIA_URL || API_URL;

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("cloth_token");
}

export function setToken(token: string) {
  localStorage.setItem("cloth_token", token);
}

export function clearToken() {
  localStorage.removeItem("cloth_token");
}

function authHeaders(): HeadersInit {
  const token = getToken();
  return token
    ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
    : { "Content-Type": "application/json" };
}

export async function login(email: string, password: string) {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error("Неверный email или пароль");
  return res.json() as Promise<{ token: string; user: { id: string; email: string } }>;
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
}

export async function fetchItems(): Promise<PortfolioItem[]> {
  const res = await fetch(`${API_URL}/api/portfolio/items`);
  if (!res.ok) return [];
  return res.json();
}

export async function createItem(data: Partial<PortfolioItem> & { title: string; mediaType: string; mediaUrl: string }) {
  const res = await fetch(`${API_URL}/api/admin/items`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      title: data.title,
      description: data.description ?? "",
      category: data.category ?? "general",
      mediaType: data.mediaType,
      mediaUrl: data.mediaUrl,
      thumbnailUrl: data.thumbnailUrl,
      featured: data.featured ?? false,
      sortOrder: data.sortOrder ?? 0,
    }),
  });
  if (!res.ok) throw new Error("Ошибка создания");
  return res.json();
}

export async function updateItem(id: string, data: Partial<PortfolioItem>) {
  const res = await fetch(`${API_URL}/api/admin/items/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify({
      title: data.title,
      description: data.description,
      category: data.category,
      mediaType: data.mediaType,
      mediaUrl: data.mediaUrl,
      thumbnailUrl: data.thumbnailUrl,
      featured: data.featured,
      sortOrder: data.sortOrder,
    }),
  });
  if (!res.ok) throw new Error("Ошибка обновления");
  return res.json();
}

export async function deleteItem(id: string) {
  const res = await fetch(`${API_URL}/api/admin/items/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Ошибка удаления");
}

export async function uploadFile(file: File): Promise<{ url: string }> {
  const token = getToken();
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_URL}/api/admin/upload`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  if (!res.ok) throw new Error("Ошибка загрузки файла");
  return res.json();
}

export async function fetchSettings(): Promise<SiteSettings> {
  const res = await fetch(`${API_URL}/api/portfolio/settings`);
  if (!res.ok) throw new Error("Settings error");
  return res.json();
}

export async function updateSettings(data: Partial<SiteSettings>) {
  const res = await fetch(`${API_URL}/api/admin/settings`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Ошибка сохранения настроек");
  return res.json();
}

export function mediaSrc(url: string) {
  if (url.startsWith("http")) return url;
  return `${MEDIA_URL}${url}`;
}
