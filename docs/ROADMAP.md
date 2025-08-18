# Roadmap PortOps MVP

## Общее видение

PortOps MVP — система для управления портовыми операциями с функционалом:

1. **Ingest → Normalize → Store → Expose → UI** для расписаний рейсов и контейнеров
2. **Dashboard**: ближайшие приходы, KPI, dwell, at-risk контейнеры
3. **Orders**: создание заявок, bulk paste контейнеров/BOL, статусы, автосинхронизация

## Технический стек

- **Supabase**: Postgres + RLS, Edge Functions (Deno), Storage, Cron
- **Next.js 15**: App Router, Server Components, Server Actions, Route Handlers
- **UI**: Tailwind + shadcn/ui, charts (uPlot/Chart.js)
- **Observability**: Supabase logs + простые ingest-метрики

## Milestones

### Milestone A — Среда и скелеты
**Статус**: 🚧 В работе

- [ ] A1. Dev prerequisites установлены (Node/pnpm/Docker/Supabase CLI/Vercel CLI)
- [ ] A2. Монорепо + Next 15 app + Tailwind + shadcn/ui
- [ ] A3. Supabase локально запущен; проект связан с облаком
- [ ] A4. ENV настроен, ключи прописаны

**Definition of Done**: локально открывается Dashboard с сид-данными, выполняется ingest dry-run

### Milestone B — База и RLS
**Статус**: ⏳ Ожидает

- [ ] B1. Применены таблицы Core, Raw/Stg, события, индексы
- [ ] B2. Материализованные вьюхи + RPC обновления
- [ ] B3. RLS политики на orders/order_items
- [ ] B4. Сид-данные загружены

**Definition of Done**: таблицы созданы, RLS работает, Dashboard отображает данные

### Milestone C — Ingest/Normalize
**Статус**: ⏳ Ожидает

- [ ] C1. Edge Function ingest-arrivals (приём CSV/JSON, dry‑run, логирование)
- [ ] C2. Cron puller puller-sourceX (демо-источник)
- [ ] C3. Нормализация в stg_* + idempotent upsert → core
- [ ] C4. Метрики/ошибки инжеста пишутся

**Definition of Done**: ingest принимает данные, нормализует, обновляет core без дубликатов

### Milestone D — UI Expose
**Статус**: ⏳ Ожидает

- [ ] D1. Dashboard: KPI + mv_upcoming_voyages + Dwell chart
- [ ] D2. Arrivals list + фильтры + детали рейса
- [ ] D3. Containers поиск по номеру/BOL

**Definition of Done**: все страницы работают, данные отображаются, фильтры функционируют

### Milestone E — Orders
**Статус**: ⏳ Ожидает

- [ ] E1. Server Actions: createOrder/addOrderItems (bulk paste)
- [ ] E2. Orders list/detail, таймлайн событий контейнера
- [ ] E3. Триггеры синхронизации статусов работают

**Definition of Done**: создание заказов, bulk операции, автосинхронизация статусов

### Milestone F — Ops & Cron
**Статус**: ⏳ Ожидает

- [ ] F1. Vercel Cron → /api/cron/refresh (обновление MV)
- [ ] F2. Алерты «нет данных N часов» (простая проверка в UI)

**Definition of Done**: MV обновляются автоматически, есть мониторинг свежести данных

### Milestone G — Полировка
**Статус**: ⏳ Ожидает

- [ ] G1. Audit log (минимум) на изменения заказов
- [ ] G2. Server-side pagination больших таблиц
- [ ] G3. Документация, скринкасты, демо-данные

**Definition of Done**: MVP готов к демонстрации, есть документация

## Критерии приёмки MVP

- [ ] Dashboard: KPI/Upcoming/Dwell отражают сид-данные
- [ ] Arrivals/Details: фильтры, сортировки, контейнеры грузятся быстро (<200ms DB, <1s TTFB)
- [ ] Orders: создание, bulk paste, изменение статусов по событиям контейнеров
- [ ] Ingest: CSV и JSON оба работают, ошибки логируются, дубликатов нет
- [ ] RLS: пользователи из разных org не видят чужие заказы
- [ ] Cron: MV рефрешатся автоматически
- [ ] Secrets не утекли в браузерный бандл

## Post-MVP идеи

- Подключение внешних статусов (holds, appointments), вебхуки
- Сохранённые представления/подписки на алерты per‑org
- MapLibre GL для визуализации судов/терминалов
- Партиционирование container_events по месяцам при росте
