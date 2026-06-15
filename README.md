# Портфолио 3D-конструктора одежды

Лендинг-портфолио с эффектной подачой видео/GIF работ, админкой для управления контентом и микросервисной архитектурой.

## Дизайн

- **Эстетика:** тёмная «fashion» палитра (уголь, крем, золотой акцент), зернистая текстура, кинематографичная сетка работ
- **Типографика:** Cormorant Garamond (заголовки) + DM Sans (текст), кириллица
- **Портфолио:** карточки 3:4, видео воспроизводится при наведении, GIF/изображения с плавным zoom
- **Секции:** Hero → избранные работы → все проекты → обо мне → контакты

## Стек

| Слой | Технология |
|------|------------|
| Публичный сайт | **Next.js 15** + Tailwind 4 + Framer Motion |
| Админка | **Next.js 15** |
| API Gateway | **Fastify** + JWT |
| Portfolio service | **Fastify** + PostgreSQL + загрузка файлов |
| Auth service | **Fastify** + bcrypt + JWT |
| БД | **PostgreSQL 16** |

## Микросервисы

```
┌─────────────┐     ┌─────────────┐
│  apps/web   │     │ apps/admin  │
│  :3000      │     │  :3003      │
└──────┬──────┘     └──────┬──────┘
       │                   │
       └─────────┬─────────┘
                 ▼
         ┌───────────────┐
         │    gateway    │  :4000
         │  /api/portfolio (публично)
         │  /api/auth
         │  /api/admin (JWT для POST/PUT/DELETE)
         └───────┬───────┘
       ┌─────────┴─────────┐
       ▼                   ▼
┌──────────────┐   ┌──────────────┐
│  portfolio   │   │     auth     │
│  :3001       │   │  :3002       │
└──────┬───────┘   └──────┬───────┘
       │                  │
       └────────┬─────────┘
                ▼
         ┌──────────────┐
         │  PostgreSQL  │
         └──────────────┘
```

## Быстрый старт (Docker)

```bash
cp .env.example .env
# Отредактируйте ADMIN_PASSWORD и JWT_SECRET

docker compose up --build
```

| Сервис | URL |
|--------|-----|
| Лендинг | http://localhost:3000 |
| Админка | http://localhost:3003 |
| API | http://localhost:4000 |

**Вход в админку** (по умолчанию из `.env.example`):
- Email: `admin@portfolio.local`
- Пароль: `admin123` (смените в `.env`)

## Локальная разработка без Docker

1. PostgreSQL на `localhost:5432`, выполнить `infra/init.sql`
2. В каждом `services/*` и `apps/*`: `npm install`
3. Запустить сервисы:

```bash
# Терминал 1
cd services/portfolio && npm run dev

# Терминал 2
cd services/auth && npm run dev

# Терминал 3
cd services/gateway && npm run dev

# Терминал 4
cd apps/web && npm run dev

# Терминал 5
cd apps/admin && npm run dev
```

Переменные: `API_URL=http://localhost:4000` (в каждом `apps/web` и `apps/admin` через `.env.local`)

## Админка

- **Работы:** загрузка видео/GIF/фото, название, категория, порядок, флаг «в избранном»
- **Сайт:** имя, подзаголовок, био, контакты, годы опыта

## Структура репозитория

```
apps/web          — публичный лендинг
apps/admin        — панель управления
services/gateway  — API Gateway
services/portfolio— CRUD + uploads
services/auth     — авторизация админа
packages/shared   — общие типы
infra/init.sql    — схема БД
```

## Продакшен

- Задайте сильные `JWT_SECRET` и `ADMIN_PASSWORD`
- Подключите домен и HTTPS (nginx / Cloudflare)
- Медиа хранятся в volume `uploads_data` — настройте бэкапы
- **URL API настраивать не нужно** — браузер ходит на `/api/...` того же хоста, Next.js проксирует на `gateway` внутри Docker-сети
