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
infra/init.sql           — схема БД
infra/backup.sh          — бэкап БД, медиа и SSL
infra/restore.sh         — восстановление из бэкапа
infra/compose-env.sh     — поиск Docker volumes
infra/deploy-services.map — карта путей → сервисы для CI/CD
infra/detect-changed-services.sh — определение сервисов по diff
infra/deploy-remote.sh      — деплой на сервере (git pull + build)
infra/nginx/             — nginx reverse proxy (production)
infra/init-letsencrypt.sh — первичная выдача SSL
.github/workflows/deploy.yml — GitHub Actions
```

## Продакшен (nginx + HTTPS)

### 1. DNS

Направьте A-записи на IP сервера:

| Запись | Пример |
|--------|--------|
| `DOMAIN` | `portfolio.example.com` → IP сервера |
| `ADMIN_DOMAIN` | `admin.portfolio.example.com` → IP сервера |
| `LOGS_DOMAIN` | `logs.portfolio.example.com` → IP сервера (Dozzle, опционально) |

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
LOGS_DOMAIN=logs.portfolio.example.com
LOGS_USER=logs
LOGS_PASSWORD=надёжный-пароль
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
2. Запрашивает сертификат Let's Encrypt (все домены из `.env`, включая `LOGS_DOMAIN`)
3. Включает HTTPS в nginx
4. Запускает автообновление сертификата

| Сервис | URL |
|--------|-----|
| Лендинг | `https://ваш-домен` |
| Админка | `https://admin.ваш-домен` |
| Логи (Dozzle) | `https://logs.ваш-домен` — если задан `LOGS_DOMAIN` |

Снаружи открыты только порты **80** и **443**. Порты 3000, 3003, 4000, 5432 закрыты.

### Dozzle — логи контейнеров

Веб-интерфейс для просмотра логов Docker в реальном времени. Вход через **логин Dozzle** (`LOGS_USER` / `LOGS_PASSWORD` в `.env`).

**Первый запуск** — создать пользователя Dozzle:

```bash
chmod +x infra/setup-dozzle-auth.sh
./infra/setup-dozzle-auth.sh
```

**Уже работающий сервер** (сертификат без `logs.`):

```bash
# В .env на сервере:
# LOGS_DOMAIN=logs.sdv3dmoda.ru
# LOGS_USER=logs
# LOGS_PASSWORD=надёжный-пароль

chmod +x infra/expand-ssl-domains.sh
./infra/expand-ssl-domains.sh

docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build dozzle nginx
```

Откройте `https://logs.ваш-домен` → форма входа Dozzle (email не нужен, только логин и пароль).

Если снова просит логин без ошибки — пересоздайте пользователя: `./infra/setup-dozzle-auth.sh`

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
         ├──► admin:3000  (ADMIN_DOMAIN)
         └──► dozzle:8080 (LOGS_DOMAIN, basic auth)
```

API (`/api/...`) и медиа (`/uploads/...`) проксируются через Next.js внутри Docker — отдельный домен для API не нужен.

### Яндекс.Метрика

В интерфейсе Метрики для Next.js подойдёт код с **`ssr: true`** (часто в разделе SPA / React).  
В репозиторий вставлять HTML-код **не нужно** — он уже в `apps/web/src/components/YandexMetrika.tsx`.

ID счётчика **не хранится в git**. Задайте только на сервере в `.env`:

```env
YM_COUNTER_ID=12345678
```

Без этой переменной счётчик не подключается — удобно для форков репозитория и локальной разработки.

После изменения `.env` перезапустите `web` (пересборка не обязательна, если меняли только env):

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d web
```

Проверка на сервере, что ID дошёл до контейнера:

```bash
docker compose exec web printenv YM_COUNTER_ID
```

В браузере: DevTools → Network → фильтр `metrika` или `mc.yandex` — должен грузиться `tag.js`.

### Прочее

- Задайте сильные `JWT_SECRET` и `ADMIN_PASSWORD`
- Данные сайта (БД, медиа, SSL) — в Docker volumes, не в git; настройте бэкапы (см. ниже)
- **URL API настраивать не нужно** — браузер ходит на `/api/...` того же хоста

## Резервное копирование и перенос сервера

Все пользовательские данные живут в **Docker volumes**, не в репозитории:

| Что | Volume (пример имени) | Файл бэкапа |
|-----|------------------------|-------------|
| PostgreSQL | `*_postgres_data` | `backups/db-*.sql.gz` |
| Медиа | `*_uploads_data` | `backups/uploads-*.tar.gz` |
| SSL (Let's Encrypt) | `*_certbot_certs` | `backups/certs-*.tar.gz` |

Отдельно сохраните **`.env`** с сервера (секреты, домены) — он в `.gitignore` и в git не попадает.

Каталог `backups/` тоже не коммитится. Храните архивы на Mac или в облаке.

### Скрипты

```bash
chmod +x infra/backup.sh infra/restore.sh
```

| Команда | Что делает |
|---------|------------|
| `./infra/backup.sh` | БД + медиа + SSL (режим `all`) |
| `./infra/backup.sh db` | только дамп PostgreSQL |
| `./infra/backup.sh uploads` | только медиа |
| `./infra/backup.sh certs` | только сертификаты |
| `./infra/restore.sh db <файл>` | восстановить БД |
| `./infra/restore.sh uploads <файл>` | восстановить медиа |
| `./infra/restore.sh certs <файл>` | восстановить SSL |
| `./infra/restore.sh all <db> [uploads] [certs]` | всё по очереди |

После каждого бэкапа создаются симлинки `db-latest.sql.gz`, `uploads-latest.tar.gz`, `certs-latest.tar.gz`.

По умолчанию архивы старше **14 дней** удаляются при запуске `backup.sh` (`BACKUP_RETENTION_DAYS=14`, `0` = не удалять).

### Переменные

| Переменная | По умолчанию | Описание |
|------------|--------------|----------|
| `BACKUP_DIR` | `./backups` | каталог для архивов |
| `BACKUP_RETENTION_DAYS` | `14` | ротация старых архивов |
| `USE_PROD_COMPOSE` | `1` | подключать `docker-compose.prod.yml` |
| `UPLOADS_VOLUME` | — | имя volume медиа вручную |
| `CERTBOT_CERTS_VOLUME` | — | имя volume SSL вручную |

Если автоопределение volume не сработало:

```bash
UPLOADS_VOLUME=3d_artist_landing_resume_uploads_data ./infra/backup.sh uploads
CERTBOT_CERTS_VOLUME=3d_artist_landing_resume_certbot_certs ./infra/backup.sh certs
```

---

### A. Бэкап на текущем сервере (перед пересозданием)

```bash
cd /opt/3d_artist_landing_resume   # или ваш путь к проекту

docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

./infra/backup.sh
```

Проверка:

```bash
ls -lh backups/
# db-latest.sql.gz  uploads-latest.tar.gz  certs-latest.tar.gz
```

Если SSL ещё не настраивали, режим `all` пропустит `certs` с предупреждением — это нормально.

**Скачать на Mac** (подставьте свой ключ и хост):

```bash
mkdir -p ~/cloth-backups

rsync -avz --progress -e "ssh -i ~/.ssh/deploy" \
  deploy@SERVER:/opt/3d_artist_landing_resume/backups/ \
  ~/cloth-backups/backups/

rsync -avz --progress -e "ssh -i ~/.ssh/deploy" \
  deploy@SERVER:/opt/3d_artist_landing_resume/.env \
  ~/cloth-backups/.env
```

Можно заходить как `root` с личным ключом — тогда `root@SERVER` и свой ключ; главное, чтобы файлы в итоге принадлежали пользователю, от которого крутится Docker.

---

### B. Восстановление на новом сервере

Пошаговый сценарий, проверенный при переносе.

#### 1. Подготовка сервера

```bash
# Docker
curl -fsSL https://get.docker.com | sh

# пользователь для деплоя и Docker
adduser deploy
usermod -aG docker deploy
# публичный ключ CI/CD → /home/deploy/.ssh/authorized_keys

# каталог проекта
mkdir -p /opt/3d_artist_landing_resume
chown deploy:deploy /opt/3d_artist_landing_resume
```

#### 2. Клонировать репозиторий

```bash
sudo -u deploy git clone https://github.com/AlexShirkin/3d_artist_landing_resume.git /opt/3d_artist_landing_resume
```

#### 3. Загрузить `.env` и бэкапы с Mac

```bash
rsync -avz --progress -e "ssh -i ~/.ssh/deploy" \
  ~/cloth-backups/.env \
  deploy@SERVER:/opt/3d_artist_landing_resume/.env

rsync -avz --progress -e "ssh -i ~/.ssh/deploy" \
  ~/cloth-backups/backups/ \
  deploy@SERVER:/opt/3d_artist_landing_resume/backups/
```

#### 4. DNS

A-записи `DOMAIN` и `ADMIN_DOMAIN` должны указывать на **новый IP** до проверки сайта снаружи.

#### 5. Создать volumes и восстановить данные

> **Важно:** для `restore.sh all` недостаточно поднять только `postgres`.  
> Volumes `uploads_data` и `certbot_certs` создаются при старте `portfolio-service` и `certbot`.

```bash
cd /opt/3d_artist_landing_resume
chmod +x infra/backup.sh infra/restore.sh

docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d \
  postgres portfolio-service certbot

docker compose ps   # дождаться healthy у postgres
```

Восстановление (одно подтверждение на все шаги):

```bash
./infra/restore.sh all \
  backups/db-latest.sql.gz \
  backups/uploads-latest.tar.gz \
  backups/certs-latest.tar.gz
```

#### 6. Поднять весь стек

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

#### 7. SSL

| Ситуация | Действие |
|----------|----------|
| Восстановили `certs` из бэкапа | **`init-letsencrypt.sh` не нужен** — nginx сам найдёт сертификат |
| Бэкапа certs не было | `./infra/init-letsencrypt.sh` — первый выпуск SSL |
| Домены те же, certs восстановлены | Let's Encrypt заново не запрашивать (лимиты) |

Проверка:

```bash
docker compose ps
curl -I https://ваш-домен
```

---

### C. Автобэкап по cron

```bash
crontab -e -u deploy
```

```
0 3 * * * cd /opt/3d_artist_landing_resume && ./infra/backup.sh >> /var/log/cloth-backup.log 2>&1
```

Периодически скачивайте `backups/` на Mac или синхронизируйте в облако — бэкап только на сервере не спасёт, если сервер пропадёт.

---

### D. Чеклист переноса

| # | Действие |
|---|----------|
| 1 | `./infra/backup.sh` на старом сервере |
| 2 | `rsync` → Mac: `backups/` + `.env` |
| 3 | Новый сервер: Docker, пользователь `deploy` |
| 4 | `git clone` в `/opt/3d_artist_landing_resume` |
| 5 | `rsync` с Mac на сервер |
| 6 | DNS на новый IP |
| 7 | `up -d postgres portfolio-service certbot` |
| 8 | `./infra/restore.sh all ...` |
| 9 | `up -d --build` весь стек |
| 10 | Проверить HTTPS (без `init-letsencrypt.sh`, если certs восстановлены) |

---

## CI/CD (GitHub Actions)

При push в `main` пересобираются **только затронутые** docker compose сервисы.

### Секреты

**Settings → Secrets and variables → Actions → Repository secrets**

| Secret | Пример значения |
|--------|-----------------|
| `SSH_HOST` | `portfolio.example.com` или IP (**без** `https://`) |
| `SSH_USER` | `deploy` |
| `SSH_KEY` | весь приватный ключ `deploy` (`pbcopy < ~/.ssh/deploy`) |
| `DEPLOY_PATH` | `/opt/3d_artist_landing_resume` |

### Как работает

1. `infra/detect-changed-services.sh` смотрит diff коммита
2. Сверяет с картой `infra/deploy-services.map`
3. По SSH запускает `infra/deploy-remote.sh` на сервере: `git pull` + `docker compose up -d --build <сервисы>`

Примеры:

| Изменили | Пересоберётся |
|----------|---------------|
| `apps/web/` | `web` |
| `services/portfolio/` | `portfolio-service` |
| `infra/nginx/` | `nginx` |
| `docker-compose.prod.yml` | все сервисы из карты + `certbot` |
| `packages/shared/` | `gateway`, `portfolio-service`, `auth-service` |
| только `README.md` | ничего |

`postgres` **не** пересобирается автоматически (данные в volume).

### Добавить новый сервис

1. Добавьте сервис в `docker-compose.yml` (и при необходимости `docker-compose.prod.yml`)
2. Одна строка в `infra/deploy-services.map`:

```
log-service:services/logging
```

3. Push в `main` — CI подхватит сам.

### Ручной деплой всех сервисов

GitHub → **Actions** → **Deploy** → **Run workflow** → включить **Deploy all services**.

### Проверка без Actions

```bash
# локально: какие сервисы бы затронулись
git diff --name-only HEAD~1 HEAD
bash infra/detect-changed-services.sh

# на сервере вручную
ssh -i ~/.ssh/deploy deploy@SERVER \
  'cd /opt/3d_artist_landing_resume && USE_PROD_COMPOSE=1 ./infra/deploy-remote.sh web'
```
