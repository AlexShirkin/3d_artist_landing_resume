import pg from "pg";

const pool = new pg.Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgresql://cloth:cloth_secret@localhost:5432/cloth_portfolio",
});

export const DEFAULT_COMPETENCIES = [
  "3D-конструирование и лекала",
  "Симуляция ткани (draping)",
  "Технические пакеты для производства",
  "Визуализация и рендер коллекций",
  "Работа с брендами и ателье",
];

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
  hero_label: string;
  competencies: string[];
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

export function mapSettings(row: SettingsRow) {
  const competencies = Array.isArray(row.competencies)
    ? row.competencies.filter((item) => typeof item === "string")
    : [];

  return {
    designerName: row.designer_name,
    tagline: row.tagline,
    bio: row.bio,
    email: row.email,
    telegram: row.telegram,
    instagram: row.instagram,
    yearsExperience: row.years_experience,
    heroLabel: row.hero_label,
    competencies:
      competencies.length > 0 ? competencies : [...DEFAULT_COMPETENCIES],
  };
}

export async function ensureSchema() {
  await pool.query(`
    ALTER TABLE site_settings
      ADD COLUMN IF NOT EXISTS hero_label VARCHAR(255) NOT NULL DEFAULT '3D-конструктор одежды';
    ALTER TABLE site_settings
      ADD COLUMN IF NOT EXISTS competencies JSONB NOT NULL DEFAULT '[]'::jsonb;
  `);

  await pool.query(
    `UPDATE site_settings
     SET competencies = $1::jsonb
     WHERE id = 1 AND competencies = '[]'::jsonb`,
    [JSON.stringify(DEFAULT_COMPETENCIES)]
  );
}

export { pool };
