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
infra/nginx/      — nginx reverse proxy (production)
infra/init-letsencrypt.sh — первичная выдача SSL
```

## Продакшен (nginx + HTTPS)

### 1. DNS

Направьте A-записи на IP сервера:

| Запись | Пример |
|--------|--------|
| `DOMAIN` | `portfolio.example.com` → IP сервера |
| `ADMIN_DOMAIN` | `admin.portfolio.example.com` → IP сервера |

### 2. Настройка `.env`

```bash
cp .env.example .env
```

Заполните:

```env
JWT_SECRET=длинная-случайная-строка
ADMIN_PASSWORD=надёжный-пароль
DOMAIN=portfolio.example.com
ADMIN_DOMAIN=admin.portfolio.example.com
CERTBOT_EMAIL=you@example.com
CERTBOT_STAGING=0
```

Для первого теста можно `CERTBOT_STAGING=1` — Let's Encrypt выдаст тестовый сертификат (без лимитов).

### 3. Запуск с SSL

На сервере откройте порты **80** и **443** в firewall.

```bash
chmod +x infra/init-letsencrypt.sh infra/renew-certs.sh
./infra/init-letsencrypt.sh
```

Скрипт:
1. Поднимает все сервисы
2. Запрашивает сертификат Let's Encrypt (оба домена в одном сертификате)
3. Включает HTTPS в nginx
4. Запускает автообновление сертификата

| Сервис | URL |
|--------|-----|
| Лендинг | `https://ваш-домен` |
| Админка | `https://admin.ваш-домен` |

Снаружи открыты только порты **80** и **443**. Порты 3000, 3003, 4000, 5432 закрыты.

### 4. Обновление сертификата

Certbot-контейнер проверяет продление каждые 12 часов. Для перезагрузки nginx после обновления добавьте в cron:

```bash
0 3 * * * /path/to/project/infra/renew-certs.sh >> /var/log/cloth-cert-renew.log 2>&1
```

### Архитектура

```
Интернет :443
    │
    ▼
  nginx ──► web:3000      (DOMAIN)
         └──► admin:3000  (ADMIN_DOMAIN)
```

API (`/api/...`) и медиа (`/uploads/...`) проксируются через Next.js внутри Docker — отдельный домен для API не нужен.

### Прочее

- Задайте сильные `JWT_SECRET` и `ADMIN_PASSWORD`
- Медиа хранятся в volume `uploads_data` — настройте бэкапы (см. ниже)
- **URL API настраивать не нужно** — браузер ходит на `/api/...` того же хоста

## Резервное копирование (Docker)

Данные сайта живут в Docker volumes, не в git:

| Что | Volume | Содержимое |
|-----|--------|------------|
| PostgreSQL | `postgres_data` | работы, настройки сайта, админ |
| Медиа | `uploads_data` | видео, GIF, фото, превью |

Скрипты работают через `docker compose` — контейнеры должны быть подняты хотя бы один раз.

### Создать бэкап (на текущем сервере перед пересозданием)

```bash
chmod +x infra/backup.sh infra/restore.sh

# продакшен
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# всё: БД + медиа → ./backups/
./infra/backup.sh

# только дамп БД
./infra/backup.sh db
```

Появятся файлы:

```
backups/db-20260623-120000.sql.gz
backups/uploads-20260623-120000.tar.gz
backups/db-latest.sql.gz          → симлинк на последний дамп
backups/uploads-latest.tar.gz
```

Скопируйте `backups/` и `.env` **на свой компьютер** (не в git):

```bash
scp -r deploy@SERVER:/opt/3d_artist_landing_resume/backups ./cloth-backups/
scp deploy@SERVER:/opt/3d_artist_landing_resume/.env ./cloth-backups/.env
```

### Восстановить на новом сервере

```bash
git clone https://github.com/AlexShirkin/3d_artist_landing_resume.git
cd 3d_artist_landing_resume
cp /path/to/saved/.env .env   # или создайте заново

# поднять postgres (создаст пустую схему из init.sql)
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d postgres

# дождаться готовности
docker compose ps

# восстановить БД и медиа
./infra/restore.sh all backups/db-latest.sql.gz backups/uploads-latest.tar.gz

# поднять весь стек
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
./infra/init-letsencrypt.sh   # если нужен SSL заново
```

### Автобэкап по cron (на сервере)

```bash
crontab -e
```

```
0 3 * * * cd /opt/3d_artist_landing_resume && ./infra/backup.sh >> /var/log/cloth-backup.log 2>&1
```

По умолчанию архивы старше 14 дней удаляются (`BACKUP_RETENTION_DAYS=14`).

Переменные:

| Переменная | По умолчанию | Описание |
|------------|--------------|----------|
| `BACKUP_DIR` | `./backups` | куда складывать архивы |
| `BACKUP_RETENTION_DAYS` | `14` | ротация (`0` = не удалять) |
| `USE_PROD_COMPOSE` | `1` | подключать `docker-compose.prod.yml` |
