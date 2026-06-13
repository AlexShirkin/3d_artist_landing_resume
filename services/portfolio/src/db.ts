import pg from "pg";

const pool = new pg.Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgresql://cloth:cloth_secret@localhost:5432/cloth_portfolio",
});

export interface PortfolioRow {
  id: string;
  title: string;
  description: string;
  category: string;
  media_type: string;
  media_url: string;
  thumbnail_url: string | null;
  featured: boolean;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
}

export interface SettingsRow {
  designer_name: string;
  tagline: string;
  bio: string;
  email: string;
  telegram: string;
  instagram: string;
  years_experience: number;
}

export function mapItem(row: PortfolioRow) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    mediaType: row.media_type as "video" | "gif" | "image",
    mediaUrl: row.media_url,
    thumbnailUrl: row.thumbnail_url,
    featured: row.featured,
    sortOrder: row.sort_order,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export { pool };
