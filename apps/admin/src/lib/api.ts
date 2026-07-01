// Same-origin: Next.js proxies /api and /uploads to gateway (see next.config.ts)
const API_URL = "";

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

function authHeaders(json = false): HeadersInit {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (json) headers["Content-Type"] = "application/json";
  return headers;
}

function handleUnauthorized() {
  clearToken();
  if (typeof window !== "undefined") {
    window.location.href = "/login?expired=1";
  }
}

async function ensureOk(res: Response, fallbackMessage: string) {
  if (res.status === 401) {
    handleUnauthorized();
    throw new Error("Сессия истекла — войдите снова");
  }
  if (!res.ok) throw new Error(fallbackMessage);
}

export async function verifySession(): Promise<boolean> {
  const token = getToken();
  if (!token) return false;
  const res = await fetch(`${API_URL}/api/auth/verify`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  return res.ok;
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
  heroLabel: string;
  competencies: string[];
}

export async function fetchItems(): Promise<PortfolioItem[]> {
  const res = await fetch(`${API_URL}/api/portfolio/items`);
  if (!res.ok) return [];
  return res.json();
}

export async function createItem(data: Partial<PortfolioItem> & { title: string; mediaType: string; mediaUrl: string }) {
  const res = await fetch(`${API_URL}/api/admin/items`, {
    method: "POST",
    headers: authHeaders(true),
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
  await ensureOk(res, "Ошибка создания");
  return res.json();
}

export async function updateItem(id: string, data: Partial<PortfolioItem>) {
  const res = await fetch(`${API_URL}/api/admin/items/${id}`, {
    method: "PUT",
    headers: authHeaders(true),
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
  await ensureOk(res, "Ошибка обновления");
  return res.json();
}

export async function deleteItem(id: string) {
  const res = await fetch(`${API_URL}/api/admin/items/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  await ensureOk(res, "Ошибка удаления");
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
  await ensureOk(res, "Ошибка загрузки файла");
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
    headers: authHeaders(true),
    body: JSON.stringify(data),
  });
  await ensureOk(res, "Ошибка сохранения настроек");
  return res.json();
}

export function mediaSrc(url: string) {
  if (url.startsWith("http")) return url;
  return url.startsWith("/") ? url : `/${url}`;
}
