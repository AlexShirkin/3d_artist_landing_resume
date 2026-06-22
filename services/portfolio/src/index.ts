import Fastify from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import fastifyStatic from "@fastify/static";
import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { pool, mapItem, type PortfolioRow, type SettingsRow } from "./db.js";
import { ensureBrowserCompatibleVideo, isVideoFile } from "./video.js";

const PORT = Number(process.env.PORT) || 3001;
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");

await mkdir(UPLOAD_DIR, { recursive: true });

const app = Fastify({ logger: true });

await app.register(cors, { origin: true });
await app.register(multipart, { limits: { fileSize: 100 * 1024 * 1024 } });
await app.register(fastifyStatic, {
  root: UPLOAD_DIR,
  prefix: "/uploads/",
  decorateReply: false,
});

app.get("/health", async () => ({ status: "ok", service: "portfolio" }));

app.get("/items", async (req) => {
  const { featured, category } = req.query as { featured?: string; category?: string };
  let sql = "SELECT * FROM portfolio_items WHERE 1=1";
  const params: unknown[] = [];
  if (featured === "true") {
    params.push(true);
    sql += ` AND featured = $${params.length}`;
  }
  if (category) {
    params.push(category);
    sql += ` AND category = $${params.length}`;
  }
  sql += " ORDER BY sort_order ASC, created_at DESC";
  const { rows } = await pool.query<PortfolioRow>(sql, params);
  return rows.map(mapItem);
});

app.get("/items/:id", async (req, reply) => {
  const { id } = req.params as { id: string };
  const { rows } = await pool.query<PortfolioRow>(
    "SELECT * FROM portfolio_items WHERE id = $1",
    [id]
  );
  if (!rows[0]) return reply.status(404).send({ error: "Not found" });
  return mapItem(rows[0]);
});

app.post("/items", async (req, reply) => {
  const body = req.body as {
    title: string;
    description?: string;
    category?: string;
    mediaType: string;
    mediaUrl: string;
    thumbnailUrl?: string;
    featured?: boolean;
    sortOrder?: number;
  };
  const { rows } = await pool.query<PortfolioRow>(
    `INSERT INTO portfolio_items (title, description, category, media_type, media_url, thumbnail_url, featured, sort_order)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [
      body.title,
      body.description ?? "",
      body.category ?? "general",
      body.mediaType,
      body.mediaUrl,
      body.thumbnailUrl ?? null,
      body.featured ?? false,
      body.sortOrder ?? 0,
    ]
  );
  return reply.status(201).send(mapItem(rows[0]));
});

app.put("/items/:id", async (req, reply) => {
  const { id } = req.params as { id: string };
  const body = req.body as Partial<{
    title: string;
    description: string;
    category: string;
    mediaType: string;
    mediaUrl: string;
    thumbnailUrl: string | null;
    featured: boolean;
    sortOrder: number;
  }>;
  const { rows } = await pool.query<PortfolioRow>(
    `UPDATE portfolio_items SET
      title = COALESCE($2, title),
      description = COALESCE($3, description),
      category = COALESCE($4, category),
      media_type = COALESCE($5, media_type),
      media_url = COALESCE($6, media_url),
      thumbnail_url = COALESCE($7, thumbnail_url),
      featured = COALESCE($8, featured),
      sort_order = COALESCE($9, sort_order),
      updated_at = NOW()
     WHERE id = $1 RETURNING *`,
    [
      id,
      body.title,
      body.description,
      body.category,
      body.mediaType,
      body.mediaUrl,
      body.thumbnailUrl,
      body.featured,
      body.sortOrder,
    ]
  );
  if (!rows[0]) return reply.status(404).send({ error: "Not found" });
  return mapItem(rows[0]);
});

app.delete("/items/:id", async (req, reply) => {
  const { id } = req.params as { id: string };
  const result = await pool.query("DELETE FROM portfolio_items WHERE id = $1", [id]);
  if (result.rowCount === 0) return reply.status(404).send({ error: "Not found" });
  return { ok: true };
});

app.post("/upload", async (req, reply) => {
  const data = await req.file();
  if (!data) return reply.status(400).send({ error: "No file" });
  const ext = path.extname(data.filename) || ".bin";
  let filename = `${randomUUID()}${ext}`;
  let filepath = path.join(UPLOAD_DIR, filename);
  const buffer = await data.toBuffer();
  await writeFile(filepath, buffer);

  if (isVideoFile(filename)) {
    try {
      filepath = await ensureBrowserCompatibleVideo(filepath);
      filename = path.basename(filepath);
    } catch (err) {
      req.log.error(err, "Video transcode failed");
      return reply.status(422).send({
        error: "Unsupported video format. Use MP4 (H.264) or WebM.",
      });
    }
  }

  return { url: `/uploads/${filename}`, filename };
});

app.get("/settings", async () => {
  const { rows } = await pool.query<SettingsRow>("SELECT * FROM site_settings WHERE id = 1");
  const s = rows[0];
  return {
    designerName: s.designer_name,
    tagline: s.tagline,
    bio: s.bio,
    email: s.email,
    telegram: s.telegram,
    instagram: s.instagram,
    yearsExperience: s.years_experience,
  };
});

app.put("/settings", async (req, reply) => {
  const body = (req.body ?? {}) as Partial<{
    designerName: string;
    tagline: string;
    bio: string;
    email: string;
    telegram: string;
    instagram: string;
    yearsExperience: number;
  }>;

  const years =
    typeof body.yearsExperience === "number" && Number.isFinite(body.yearsExperience)
      ? Math.round(body.yearsExperience)
      : null;

  try {
    const { rows } = await pool.query<SettingsRow>(
      `UPDATE site_settings SET
        designer_name = COALESCE($1, designer_name),
        tagline = COALESCE($2, tagline),
        bio = COALESCE($3, bio),
        email = COALESCE($4, email),
        telegram = COALESCE($5, telegram),
        instagram = COALESCE($6, instagram),
        years_experience = COALESCE($7, years_experience)
       WHERE id = 1 RETURNING *`,
      [
        body.designerName ?? null,
        body.tagline ?? null,
        body.bio ?? null,
        body.email ?? null,
        body.telegram ?? null,
        body.instagram ?? null,
        years,
      ]
    );
    const s = rows[0];
    if (!s) {
      return reply.status(404).send({ error: "Settings row not found" });
    }
    return {
      designerName: s.designer_name,
      tagline: s.tagline,
      bio: s.bio,
      email: s.email,
      telegram: s.telegram,
      instagram: s.instagram,
      yearsExperience: s.years_experience,
    };
  } catch (err) {
    req.log.error(err, "Failed to update settings");
    return reply.status(500).send({ error: "Failed to update settings" });
  }
});

app.get("/categories", async () => {
  const { rows } = await pool.query<{ category: string }>(
    "SELECT DISTINCT category FROM portfolio_items ORDER BY category"
  );
  return rows.map((r) => r.category);
});

await app.listen({ port: PORT, host: "0.0.0.0" });
