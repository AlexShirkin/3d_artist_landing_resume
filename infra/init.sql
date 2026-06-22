CREATE TABLE IF NOT EXISTS portfolio_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category VARCHAR(100) NOT NULL DEFAULT 'general',
  media_type VARCHAR(20) NOT NULL CHECK (media_type IN ('video', 'gif', 'image')),
  media_url VARCHAR(500) NOT NULL,
  thumbnail_url VARCHAR(500),
  featured BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS site_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  designer_name VARCHAR(255) NOT NULL DEFAULT 'Имя дизайнера',
  tagline TEXT NOT NULL DEFAULT '3D-конструктор одежды',
  bio TEXT NOT NULL DEFAULT '',
  email VARCHAR(255) NOT NULL DEFAULT '',
  telegram VARCHAR(255) NOT NULL DEFAULT '',
  instagram VARCHAR(255) NOT NULL DEFAULT '',
  years_experience INTEGER NOT NULL DEFAULT 5,
  hero_label VARCHAR(255) NOT NULL DEFAULT '3D-конструктор одежды',
  competencies JSONB NOT NULL DEFAULT '[
    "3D-конструирование и лекала",
    "Симуляция ткани (draping)",
    "Технические пакеты для производства",
    "Визуализация и рендер коллекций",
    "Работа с брендами и ателье"
  ]'::jsonb
);

INSERT INTO site_settings (id) VALUES (1) ON CONFLICT DO NOTHING;

-- Демо-записи можно добавить через админку после первого запуска
