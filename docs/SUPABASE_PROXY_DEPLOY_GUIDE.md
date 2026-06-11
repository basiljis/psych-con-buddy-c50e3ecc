# Полная инструкция: деплой и обход блокировок Supabase в РФ

Документ описывает, как в проекте **unvrsm.ru** организован обход сетевых ограничений на Supabase (Cloudflare/`*.supabase.co` нестабильно работает у российских провайдеров) и как корректно задеплоиться на Timeweb Cloud Apps с автоматической заглушкой на время обновления.

---

## 1. Архитектура одной картинкой

```text
                  ┌──────────────────────────────────────────────┐
   Браузер ─────► │ unvrsm.ru        :443 (Timeweb SSL terminate)│
   (РФ)           └───────────────┬──────────────────────────────┘
                                  │ HTTP :8082
                                  ▼
                  ┌──────────────────────────────────────────────┐
                  │ edge (nginx)  — всегда онлайн                │
                  │   • health: /__edge_health                   │
                  │   • при 502/503/504 от app → maintenance.html│
                  └───────────────┬──────────────────────────────┘
                                  │ http://app:8080  (внутр. сеть)
                                  ▼
                  ┌──────────────────────────────────────────────┐
                  │ app (nginx + SPA)                            │
                  │   server unvrsm.ru   → /usr/share/nginx/html │
                  │   server api.unvrsm.ru → reverse-proxy в     │
                  │       https://<ref>.supabase.co              │
                  └───────────────┬──────────────────────────────┘
                                  │ HTTPS (исходящие из РФ не блокируются)
                                  ▼
                       *.supabase.co  (Auth / REST / Storage /
                                       Realtime / Edge Functions)
```

Идея обхода: **браузер ходит только на российский домен** (`unvrsm.ru` и `api.unvrsm.ru`), а к Supabase обращается nginx сервер-в-сервер. Исходящие соединения с серверов РФ к `*.supabase.co` не блокируются.

---

## 2. Файлы проекта, отвечающие за обход блокировок и деплой

| Файл | Назначение |
|------|------------|
| `.env` | `VITE_SUPABASE_URL=https://api.unvrsm.ru` — фронт идёт через свой прокси |
| `src/integrations/supabase/client.ts` | Берёт URL из `import.meta.env` (не хардкод!) |
| `nginx.conf` | Два `server {}`: SPA на `unvrsm.ru` + reverse-proxy на `api.unvrsm.ru` |
| `Dockerfile` | Сборка Vite + nginx; `ARG VITE_*` пробрасываются внутрь билда |
| `edge/nginx.conf` | Edge-прокси с auto-maintenance (`error_page 502 503 504 = @maintenance`) |
| `edge/Dockerfile` | nginx:alpine + healthcheck `/__edge_health` |
| `edge/maintenance.html` | Страница «Сервис временно недоступен» |
| `docker-compose.yml` | Сервисы `edge` (порт 8082→8080) и `app` (только `expose: 8080`) |

---

## 3. Reverse-proxy на Supabase (`api.unvrsm.ru`)

Ключевые места в `nginx.conf`. Если что-то из этого пропустить — посыпятся CORS, 526, разрыв WebSocket или auth-куки.

### 3.1. DNS-резолвер
```nginx
resolver 8.8.8.8 1.1.1.1 ipv6=off valid=300s;
resolver_timeout 10s;
```
Без `resolver` nginx один раз закеширует IP Supabase при старте и сломается при его смене.

### 3.2. Переменная вместо литерала в `proxy_pass`
```nginx
set $supabase_upstream "oxyjmeslnmhewlpgzlmf.supabase.co";
proxy_pass https://$supabase_upstream$request_uri;
```
Только при использовании переменной nginx будет реально ходить в DNS на каждый запрос (а не один раз при `reload`).

### 3.3. SNI + Host
```nginx
proxy_ssl_server_name on;
proxy_ssl_name        $supabase_upstream;
proxy_set_header Host $supabase_upstream;
```
Без SNI Cloudflare перед Supabase вернёт **526 / 404**.

### 3.4. CORS — снимаем дубли, ставим свои
```nginx
proxy_hide_header Access-Control-Allow-Origin;
proxy_hide_header Access-Control-Allow-Credentials;
proxy_hide_header Access-Control-Allow-Methods;
proxy_hide_header Access-Control-Allow-Headers;
proxy_hide_header Access-Control-Expose-Headers;
proxy_hide_header Access-Control-Max-Age;
```
Supabase сам отдаёт CORS-заголовки. Если их не скрыть, браузер увидит **два** `Access-Control-Allow-Origin` и заблокирует auth-запросы.

Свои CORS должны разрешать ваши домены:
```nginx
if ($http_origin ~* ^https?://(localhost(:[0-9]+)?|(www\.)?unvrsm\.ru|.*\.lovable\.(app|dev))$) {
    set $cors_origin $http_origin;
}
add_header Access-Control-Allow-Origin      "$cors_origin" always;
add_header Access-Control-Allow-Credentials "true"         always;
add_header Access-Control-Allow-Headers     "authorization, apikey, content-type, x-client-info, x-supabase-api-version, range, prefer, accept-profile, content-profile, x-requested-with" always;
```
`x-client-info` и `x-supabase-api-version` обязательны — без них supabase-js ловит CORS.

OPTIONS preflight отвечаем сразу:
```nginx
if ($request_method = OPTIONS) { return 204; }
```

### 3.5. WebSocket для Realtime
```nginx
map $http_upgrade $connection_upgrade { default upgrade; '' close; }

proxy_http_version 1.1;
proxy_set_header Upgrade    $http_upgrade;
proxy_set_header Connection $connection_upgrade;
```

### 3.6. Стриминг и большие загрузки
```nginx
client_max_body_size 50m;
proxy_buffering off;
proxy_request_buffering off;
proxy_read_timeout 300s;
proxy_send_timeout 300s;
```

### 3.7. Никакого кеша на API
```nginx
add_header Cache-Control "no-store" always;
```

---

## 4. Конфигурация фронта

### 4.1. `.env`
```env
VITE_SUPABASE_URL="https://api.unvrsm.ru"
VITE_SUPABASE_PUBLISHABLE_KEY="<анон-ключ Supabase>"
VITE_SUPABASE_PROJECT_ID="<ref>"
```
`PUBLISHABLE_KEY` — это **анон**-ключ, его можно класть в код. `service_role` — никогда во фронт.

### 4.2. Клиент
В `src/integrations/supabase/client.ts` URL читается из `import.meta.env.VITE_SUPABASE_URL`. Это и есть рычаг переключения между прямым `*.supabase.co` (dev) и `api.unvrsm.ru` (prod).

### 4.3. Build args в `docker-compose.yml`
Vite запекает значения на этапе сборки, поэтому переменные должны попасть в Dockerfile:
```yaml
app:
  build:
    args:
      VITE_SUPABASE_URL: ${VITE_SUPABASE_URL}
      VITE_SUPABASE_PUBLISHABLE_KEY: ${VITE_SUPABASE_PUBLISHABLE_KEY}
      VITE_SUPABASE_PROJECT_ID: ${VITE_SUPABASE_PROJECT_ID}
```

### 4.4. Настройки Supabase Auth (Dashboard)
Иначе сломаются редиректы:
- **Authentication → URL Configuration → Site URL**: `https://unvrsm.ru`
- **Redirect URLs**: `https://unvrsm.ru/*`, `https://www.unvrsm.ru/*`, `http://localhost:5173/*`
- **JWT issuer** менять **не нужно**: токены продолжают подписываться `*.supabase.co`.

---

## 5. Auto-maintenance во время деплоя

Контейнер `edge` остаётся живым, пока пересобирается `app`. При любой ошибке апстрима (`502/503/504/timeout/connect_refused`) nginx отдаёт `/maintenance.html` со статусом 503 и заголовком `Retry-After: 900`.

Ключевые директивы в `edge/nginx.conf`:
```nginx
resolver 127.0.0.11 ipv6=off valid=10s;       # Docker DNS — переживёт пересоздание app
upstream app_upstream { server app:8080 max_fails=2 fail_timeout=5s; keepalive 32; }

proxy_connect_timeout 3s;                     # быстро признаём, что app мёртв
proxy_next_upstream error timeout http_502 http_503 http_504;
proxy_intercept_errors on;
error_page 502 503 504 = @maintenance;
```

Ручное включение/выключение (без перезапуска nginx):
```bash
# включить
docker exec <edge_container> touch /etc/nginx/flags/maintenance.enabled
# выключить
docker exec <edge_container> rm    /etc/nginx/flags/maintenance.enabled
# админский обход
https://unvrsm.ru/?bypass_maintenance=1
```

---

## 6. Деплой в Timeweb Cloud Apps — пошагово

1. **Репозиторий**: запушить ветку с файлами из раздела 2.
2. **Создать приложение** типа **Docker Compose**, указать репозиторий и ветку.
3. **Внешний порт** приложения → **8082** (это `edge`). Контейнер `app` наружу **не публикуется**.
4. **Переменные окружения** (Timeweb → Settings → Variables):
   - `VITE_SUPABASE_URL=https://api.unvrsm.ru`
   - `VITE_SUPABASE_PUBLISHABLE_KEY=...`
   - `VITE_SUPABASE_PROJECT_ID=...`
5. **Healthcheck**: `GET /__edge_health` → `200 ok`.
6. **DNS** у регистратора:
   - `A    unvrsm.ru        → <IP Timeweb>`
   - `A    www.unvrsm.ru    → <IP Timeweb>`
   - `A    api.unvrsm.ru    → <IP Timeweb>`  ← без него обхода нет
7. **SSL**: включить Let's Encrypt в Timeweb на **оба** домена (`unvrsm.ru` и `api.unvrsm.ru`).
8. **Volume** `maintenance_flags` создаётся автоматически из `docker-compose.yml` — нужен только для ручного режима.
9. **Деплой**: `Deploy`. Первый билд ~6–10 мин (Vite + npm).

---

## 7. Проверка после деплоя

```bash
# 1. Edge живой
curl -s https://unvrsm.ru/__edge_health
# → ok

# 2. SPA отдаётся
curl -sI https://unvrsm.ru/ | head -1
# → HTTP/2 200

# 3. Заглушка доступна руками
curl -sI https://unvrsm.ru/maintenance.html | grep -i cache-control
# → cache-control: no-store, no-cache, must-revalidate

# 4. Прокси на Supabase работает (401 — это норма: нет токена)
curl -sI https://api.unvrsm.ru/auth/v1/health
# → HTTP/2 200

curl -s -H "apikey: <anon>" https://api.unvrsm.ru/rest/v1/ | head
# → JSON с описанием схемы

# 5. CORS: проверяем preflight
curl -sI -X OPTIONS https://api.unvrsm.ru/auth/v1/token \
  -H "Origin: https://unvrsm.ru" \
  -H "Access-Control-Request-Method: POST"
# → 204, один Access-Control-Allow-Origin: https://unvrsm.ru

# 6. Realtime (WebSocket upgrade)
curl -sI -H "Connection: Upgrade" -H "Upgrade: websocket" \
  https://api.unvrsm.ru/realtime/v1/websocket
# → 101 Switching Protocols (или 401 без apikey — это норма)
```

---

## 8. Чек-лист перед первым деплоем

### Код
- [ ] `.env` содержит `VITE_SUPABASE_URL=https://api.unvrsm.ru` (не `*.supabase.co`)
- [ ] `src/integrations/supabase/client.ts` читает URL из `import.meta.env`
- [ ] В коде **нет** прямых ссылок на `*.supabase.co` (`rg "supabase\.co" src/`)
- [ ] Все edge-функции вызываются через `supabase.functions.invoke(...)`, а не прямым fetch на supabase.co

### Docker / nginx
- [ ] `docker-compose.yml` имеет `edge` (`ports: 8082:8080`) и `app` (`expose: 8080`, **без** `ports`)
- [ ] В `app.build.args` пробрасываются все `VITE_*`
- [ ] `nginx.conf` (app): два `server` — `unvrsm.ru` и `api.unvrsm.ru`
- [ ] В `api.`-сервере: `resolver`, `proxy_ssl_server_name on`, `proxy_set_header Host`, `proxy_hide_header` для CORS
- [ ] WebSocket: `map $http_upgrade $connection_upgrade` + `proxy_set_header Upgrade/Connection`
- [ ] `client_max_body_size 50m;` для storage
- [ ] `edge/nginx.conf`: `proxy_intercept_errors on; error_page 502 503 504 = @maintenance;`
- [ ] `edge/Dockerfile`: HEALTHCHECK на `/__edge_health`

### Supabase Dashboard
- [ ] **Auth → URL Configuration → Site URL** = `https://unvrsm.ru`
- [ ] **Auth → Redirect URLs** включают `https://unvrsm.ru/*` и `https://www.unvrsm.ru/*`
- [ ] **Secrets** настроены: `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `YUKASSA_*`, `TELEGRAM_API_KEY`
- [ ] Edge Functions задеплоены и доступны через `https://api.unvrsm.ru/functions/v1/<name>`

### DNS / Timeweb
- [ ] `A unvrsm.ru`, `A www.unvrsm.ru`, `A api.unvrsm.ru` → IP Timeweb
- [ ] SSL выпущен и на корневой, и на `api.` поддомен
- [ ] Внешний порт приложения Timeweb = **8082**
- [ ] Healthcheck Timeweb = `GET /__edge_health`

### После деплоя
- [ ] `https://unvrsm.ru/__edge_health` → `ok`
- [ ] `https://unvrsm.ru/` открывается без ошибок CORS в консоли
- [ ] Логин (auth) проходит — токен сохраняется в localStorage
- [ ] Realtime-подписки получают события (вкладка Network → WS = `101 Switching Protocols`)
- [ ] Загрузка файла в Storage > 1MB работает
- [ ] Edge Function отвечает (например, `/functions/v1/telegram-notify`)

---

## 9. Типичные проблемы и решения

| Симптом | Диагноз | Что чинить |
|---------|---------|------------|
| Браузер: `CORS: response includes multiple values for Access-Control-Allow-Origin` | Не скрыты CORS-заголовки от Supabase | Добавить `proxy_hide_header Access-Control-Allow-*` в `api.`-сервере |
| `526 Invalid SSL certificate` от Cloudflare | Не задан SNI | `proxy_ssl_server_name on;` + `proxy_ssl_name $supabase_upstream;` |
| Сайт не открывается после смены IP Supabase | Nginx закешировал старый IP | Использовать переменную в `proxy_pass` + `resolver 8.8.8.8 valid=300s` |
| Realtime не подключается, в Network висит `(failed)` | Не проброшен Upgrade | `map $http_upgrade $connection_upgrade` + хедеры Upgrade/Connection |
| Логин «прокручивается» бесконечно | Site URL в Supabase указывает на `*.lovable.app` | Поменять Site URL на `https://unvrsm.ru` |
| 502 во время деплоя без заглушки | Внешний порт открыт на `app`, а не `edge` | Переключить порт Timeweb на **8082** |
| `Application error` при первом запросе | edge стартанул раньше app, нет страницы заглушки | Уже учтено: `error_page 500 502 503 504 /maintenance.html` |
| Vite-сборка падает по OOM | Маленький билд-раннер | `ENV NODE_OPTIONS=--max-old-space-size=4096` в Dockerfile |
| Storage upload падает на 413 | `client_max_body_size` мал | Увеличить до `50m` в обоих server-блоках |
| Auth: `Failed to fetch` после обновления anon-key | Старый ключ в кеше браузера | Очистить localStorage; проверить, что `.env` и build args обновлены |

---

## 10. Полезные команды

```bash
# Логи
docker logs <edge_container> --tail 100 -f
docker logs <app_container>  --tail 100 -f

# Проверить конфиг nginx внутри контейнера
docker exec <app_container> nginx -t
docker exec <edge_container> nginx -t

# Найти прямые ссылки на supabase.co в коде
rg -n "supabase\.co" src/

# Перезапустить только app, не трогая edge (имитация деплоя)
docker compose restart app
# В это время unvrsm.ru должен показывать maintenance.html
```

---

*Документ актуален для текущей инфраструктуры unvrsm.ru. При смене Supabase-проекта обновить `$supabase_upstream` в `nginx.conf` и `VITE_SUPABASE_*` в `.env`.*
