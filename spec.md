PortOps MVP — Roadmap & Tickets (Next.js 15 + Supabase)

Язык объяснений — русский. Код/команды — английский.

Этот документ — готовый план внедрения MVP (UI на Next.js 15, бэкенд/данные на Supabase) с подробной разбивкой на roadmap, тикеты, критерии приёмки, и пошаговую установку среды разработки. Его можно «скармливать» Cursor как опорный контекст.

⸻

0) Общее видение MVP

Функционал:
	1.	Ingest → Normalize → Store → Expose → UI для расписаний рейсов и контейнеров.
	2.	Dashboard: ближайшие приходы, KPI, dwell, at-risk.
	3.	Orders: создание заявки, bulk paste контейнеров/BOL, статусы, автосинхронизация от событий контейнеров.

Стек:
	•	Supabase: Postgres + RLS, Edge Functions (Deno), Storage, Cron.
	•	Next.js 15 (App Router, Server Components, Server Actions, Route Handlers).
	•	Tailwind + shadcn/ui, charts: uPlot/Chart.js.
	•	Observability: Supabase logs + простые ingest-метрики в таблице.

⸻

1) Пошаговая установка среды разработки

1.1. Предварительные зависимости (macOS)

# Homebrew (если нет)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Node LTS + pnpm + git + Docker Desktop
brew install node pnpm git
# (или nvm + Node 20/22 LTS)

# Supabase CLI
brew install supabase/tap/supabase

# Vercel CLI (для деплоя UI)
npm i -g vercel

1.2. Репозиторий и монорепо-скелет

mkdir portops && cd portops
git init
pnpm init -y

# Workspace
cat > pnpm-workspace.yaml << 'YAML'
packages:
  - apps/*
  - packages/*
YAML

mkdir -p apps/web packages/shared

1.3. Инициализация Next.js 15 (App Router)

# Next 15
pnpm create next-app@latest apps/web --ts --eslint --src-dir --app --tailwind --use-pnpm

1.4. Tailwind + shadcn/ui

cd apps/web
npx shadcn@latest init
npx shadcn@latest add button input textarea card table badge dropdown-menu
pnpm add @supabase/supabase-js @supabase/ssr
cd -

1.5. Supabase (локально + облако)

# Войти в Supabase CLI
supabase login

# Инициализация локального проекта
supabase init
# Запуск локального стека (Postgres, Studio, и т.д.)
supabase start

	•	Где взять project-ref для облака: в Supabase Dashboard → Project → Settings → General → Project Reference.

# Привязать локальный каталог к облачному проекту
supabase link --project-ref <your-project-ref>

1.6. ENV переменные

Создай файл apps/web/.env.local:

NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...      # server-only
INGEST_SECRET=...
DEFAULT_TZ=America/Los_Angeles

	•	URL и ANON_KEY — в Supabase → Project Settings → API.
	•	SERVICE_ROLE_KEY — там же (не использовать на клиенте!).
	•	INGEST_SECRET — сгенерируй (openssl rand -hex 32) и поставь в Edge/Route проверку.

1.7. База данных: схема, RLS, сиды

Применяем SQL (раздел 2) через Supabase SQL Editor или CLI:

# пример через файл миграции
supabase db push  # если используешь миграции
# или вставить SQL в Studio → SQL Editor и выполнить

1.8. Edge Functions (Supabase)

# Пример создания функций
supabase functions new ingest-arrivals
supabase functions new puller-sourceX

# Локальный запуск
supabase functions serve

# Деплой
supabase functions deploy ingest-arrivals
supabase functions deploy puller-sourceX

Внутри функций — валидация Authorization: Bearer ${INGEST_SECRET}.

1.9. Vercel (UI деплой + Cron)

cd apps/web
vercel link  # подключить проект к Vercel
vercel env pull .env.local  # подтянуть/настроить переменные
vercel  # первый деплой

	•	Настрой Vercel Cron на POST /api/cron/refresh каждые 5–10 минут.

1.10. Запуск локально

cd apps/web
pnpm dev
# Next.js на http://localhost:3000
# Supabase Studio на http://127.0.0.1:54323

Definition of Ready (DoR): установлены зависимости, связаны ключи, применены SQL, доступна авторизация.

Definition of Done (DoD) для среды: локально открывается Dashboard с сид-данными, выполняется ingest dry-run, кроны рефрешат MV.

⸻

2) SQL: схема БД, индексы, RLS, сиды, RPC

Вставь блоками в Supabase SQL Editor; при необходимости разбей на миграции.

2.1. Справочники и маппинги

create table if not exists shipping_lines (
  id uuid primary key default gen_random_uuid(),
  scac text unique,
  name text not null,
  created_at timestamptz default now()
);

create table if not exists terminals (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  timezone text not null default 'America/Los_Angeles',
  created_at timestamptz default now()
);

create table if not exists code_mappings (
  id bigserial primary key,
  source text not null,
  kind text not null,
  source_code text not null,
  target_id uuid,
  target_value text,
  unique (source, kind, source_code)
);

2.2. Raw/Staging

create table if not exists raw_arrivals (
  id bigserial primary key,
  source text not null,
  payload jsonb not null,
  received_at timestamptz default now()
);

create table if not exists stg_voyages (
  id bigserial primary key,
  vessel_name text,
  voyage_no text,
  line_scac text,
  terminal_code text,
  eta timestamptz,
  etd timestamptz,
  ata timestamptz,
  atd timestamptz,
  unique (voyage_no, line_scac, terminal_code)
);

create table if not exists stg_containers (
  id bigserial primary key,
  cntr_no text,
  iso_type text,
  voyage_no text,
  line_scac text,
  terminal_code text,
  bill_of_lading text,
  last_known_status text,
  last_status_time timestamptz,
  unique (cntr_no, voyage_no, line_scac, terminal_code)
);

2.3. Core + события

create table if not exists voyages (
  id uuid primary key default gen_random_uuid(),
  vessel_name text,
  voyage_no text not null,
  line_id uuid references shipping_lines(id),
  terminal_id uuid references terminals(id),
  eta timestamptz,
  etd timestamptz,
  ata timestamptz,
  atd timestamptz,
  status text check (status in ('scheduled','arrived','departed','canceled')) default 'scheduled',
  created_at timestamptz default now(),
  unique (voyage_no, line_id, terminal_id)
);

create table if not exists containers (
  id uuid primary key default gen_random_uuid(),
  cntr_no text unique not null,
  iso_type text,
  voyage_id uuid references voyages(id) on delete set null,
  bill_of_lading text,
  last_known_status text check (last_known_status in ('in_transit','discharged','available','picked_up','hold')) default 'in_transit',
  last_status_time timestamptz,
  created_at timestamptz default now()
);

create table if not exists container_events (
  id bigserial primary key,
  container_id uuid not null references containers(id) on delete cascade,
  event_type text check (event_type in ('discharged','available','picked_up','hold','release')) not null,
  event_time timestamptz not null,
  payload jsonb,
  created_at timestamptz default now()
);

2.4. Многотенантность и заказы

create table if not exists orgs (
  id uuid primary key default gen_random_uuid(),
  name text not null
);

-- предполагается, что auth.users уже есть (Supabase)
-- org_id и role можно хранить в user_metadata (через Auth admin API)

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references orgs(id),
  created_by uuid references auth.users(id),
  order_no text unique not null,
  status text check (status in ('draft','submitted','in_process','completed','canceled')) default 'draft',
  requested_pickup_at timestamptz,
  note text,
  created_at timestamptz default now()
);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  cntr_no text not null,
  container_id uuid references containers(id),
  bill_of_lading text,
  service_type text check (service_type in ('pickup','drayage','yard_move','storage')) default 'pickup',
  status text check (status in ('planned','ready','done','failed')) default 'planned',
  created_at timestamptz default now()
);

2.5. Индексы

create index if not exists idx_voyages_eta on voyages (eta);
create index if not exists idx_voyages_terminal on voyages (terminal_id);
create index if not exists idx_containers_voyage on containers (voyage_id);
create index if not exists idx_containers_status on containers (last_known_status);
create index if not exists idx_containers_status_time on containers (last_status_time);
create index if not exists idx_order_items_cntr on order_items (cntr_no);
create index if not exists idx_container_events_time on container_events (container_id, event_time desc);

2.6. Материализованные представления и RPC

create materialized view if not exists mv_upcoming_voyages as
select v.id, v.vessel_name, v.voyage_no, v.eta, v.etd, v.status,
       t.name as terminal_name, l.name as line_name,
       (select count(*) from containers c where c.voyage_id = v.id) as containers_total,
       (select count(*) from containers c where c.voyage_id = v.id and c.last_known_status='available') as containers_available
from voyages v
left join terminals t on t.id=v.terminal_id
left join shipping_lines l on l.id=v.line_id
where v.eta >= now() - interval '24 hours';

create unique index if not exists mv_upcoming_voyages_id on mv_upcoming_voyages (id);

-- dwell по событиям
create materialized view if not exists mv_dwell as
with first_discharged as (
  select container_id, min(event_time) as discharged_at
  from container_events where event_type='discharged' group by 1
),
first_picked as (
  select container_id, min(event_time) as picked_at
  from container_events where event_type='picked_up' group by 1
)
select c.cntr_no,
       fd.discharged_at,
       fp.picked_at,
       extract(epoch from (coalesce(fp.picked_at, now()) - fd.discharged_at))/3600 as dwell_hours
from containers c
join first_discharged fd on fd.container_id=c.id
left join first_picked fp on fp.container_id=c.id;

-- RPC для рефреша (чтобы дёргать из Next cron)
create or replace function refresh_mv_upcoming() returns void language sql as $$
  refresh materialized view concurrently mv_upcoming_voyages;
$$;

create or replace function refresh_mv_dwell() returns void language sql as $$
  refresh materialized view concurrently mv_dwell;
$$;

2.7. Триггеры синхронизации статусов

create or replace function sync_order_item_status() returns trigger as $$
begin
  if NEW.last_known_status = 'available' then
    update order_items set status='ready', container_id = coalesce(container_id, NEW.id)
      where cntr_no = NEW.cntr_no and status in ('planned');
  elsif NEW.last_known_status = 'picked_up' then
    update order_items set status='done', container_id = coalesce(container_id, NEW.id)
      where cntr_no = NEW.cntr_no and status in ('ready','planned');
  end if;
  return NEW;
end;
$$ language plpgsql;

create or replace trigger trg_container_status
after update of last_known_status on containers
for each row execute procedure sync_order_item_status();

create or replace function recompute_order_status(order_id uuid) returns void as $$
declare
  total int;
  done_cnt int;
begin
  select count(*), count(*) filter (where status='done') into total, done_cnt
  from order_items where order_id = recompute_order_status.order_id;

  update orders set status = case
    when total = 0 then status
    when done_cnt = total then 'completed'
    when exists (select 1 from order_items where order_id = orders.id and status in ('ready','planned')) then 'in_process'
    else status
  end
  where id = order_id;
end;
$$ language plpgsql;

create or replace function on_order_item_change() returns trigger as $$
begin
  perform recompute_order_status(NEW.order_id);
  return NEW;
end;
$$ language plpgsql;

create or replace trigger trg_order_items_change
after insert or update of status on order_items
for each row execute procedure on_order_item_change();

2.8. RLS политики

alter table if exists orders enable row level security;
alter table if exists order_items enable row level security;

-- Предполагается org_id в JWT (user metadata → JWT enrichment)
create policy if not exists orders_select_same_org on orders for select
  using (org_id = (auth.jwt() ->> 'org_id')::uuid);

create policy if not exists orders_insert_same_org on orders for insert
  with check (org_id = (auth.jwt() ->> 'org_id')::uuid);

create policy if not exists orders_update_same_org on orders for update
  using (org_id = (auth.jwt() ->> 'org_id')::uuid)
  with check (org_id = (auth.jwt() ->> 'org_id')::uuid);

create policy if not exists items_select_parent_org on order_items for select
  using (exists (select 1 from orders o where o.id=order_id and o.org_id=(auth.jwt() ->> 'org_id')::uuid));

create policy if not exists items_modify_parent_org on order_items for all
  using (exists (select 1 from orders o where o.id=order_id and o.org_id=(auth.jwt() ->> 'org_id')::uuid))
  with check (exists (select 1 from orders o where o.id=order_id and o.org_id=(auth.jwt() ->> 'org_id')::uuid));

2.9. Метрики и ошибки инжеста (опционально)

create table if not exists ingest_metrics (
  id bigserial primary key,
  source text not null,
  rows_ok int default 0,
  rows_err int default 0,
  duration_ms int default 0,
  ts timestamptz default now()
);

create table if not exists ingest_errors (
  id bigserial primary key,
  source text not null,
  payload jsonb not null,
  reason text,
  created_at timestamptz default now()
);

2.10. Сид-данные (упрощённо)

insert into shipping_lines (scac, name) values
  ('MSCU','MSC') on conflict do nothing,
  ('MAEU','Maersk') on conflict do nothing;

insert into terminals (code, name, timezone) values
  ('LAX-T1','Los Angeles T1','America/Los_Angeles') on conflict do nothing,
  ('LGB-T2','Long Beach T2','America/Los_Angeles') on conflict do nothing;

-- пары рейсов/контейнеров — добавь по вкусу для демо


⸻

3) Структура UI (Next 15) и каркас файлов

apps/web/
  app/
    layout.tsx
    page.tsx                      # Dashboard
    arrivals/page.tsx
    arrivals/[voyageId]/page.tsx
    containers/page.tsx
    orders/page.tsx
    orders/new/page.tsx
    orders/[orderId]/page.tsx
    api/cron/refresh/route.ts     # Vercel Cron → RPC refresh
    api/ingest/arrivals/route.ts  # proxy (optional)
  lib/
    supabase/browser.ts
    supabase/server.ts
    data/dashboard.ts
    data/arrivals.ts
    data/orders.ts
  actions/orders.ts
  components/
    layout/header.tsx
    layout/sidebar.tsx
    kpi-card.tsx
    upcoming-table.tsx
    charts/area.tsx

Шаблоны кода — см. предыдущие сообщения (клиенты Supabase, Server Actions, страницы Dashboard/Arrivals/Orders).

⸻

4) Edge Functions: каркас

supabase/functions/ingest-arrivals/index.ts

// deno
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

serve(async (req) => {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${Deno.env.get('INGEST_SECRET')}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const contentType = req.headers.get('content-type') || '';
  const text = await req.text();

  // parse CSV/JSON → write to raw_arrivals, stg_* then upsert core
  // TODO: implement parse + normalize + upsert

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'content-type': 'application/json' }
  });
});


⸻

5) Roadmap по этапам (без дат, по порядку выполнения)

Milestone A — Среда и скелеты
	•	A1. Dev prerequisites установлены (Node/pnpm/Docker/Supabase CLI/Vercel CLI).
	•	A2. Монорепо + Next 15 app + Tailwind + shadcn/ui.
	•	A3. Supabase локально запущен; проект связан с облаком.
	•	A4. ENV настроен, ключи прописаны.

Milestone B — База и RLS
	•	B1. Применены таблицы Core, Raw/Stg, события, индексы.
	•	B2. Материализованные вьюхи + RPC обновления.
	•	B3. RLS политики на orders/order_items.
	•	B4. Сид-данные загружены.

Milestone C — Ingest/Normalize
	•	C1. Edge Function ingest-arrivals (приём CSV/JSON, dry‑run, логирование).
	•	C2. Cron puller puller-sourceX (демо-источник).
	•	C3. Нормализация в stg_* + idempotent upsert → core.
	•	C4. Метрики/ошибки инжеста пишутся.

Milestone D — UI Expose
	•	D1. Dashboard: KPI + mv_upcoming_voyages + Dwell chart.
	•	D2. Arrivals list + фильтры + детали рейса.
	•	D3. Containers поиск по номеру/BOL.

Milestone E — Orders
	•	E1. Server Actions: createOrder/addOrderItems (bulk paste).
	•	E2. Orders list/detail, таймлайн событий контейнера.
	•	E3. Триггеры синхронизации статусов работают.

Milestone F — Ops & Cron
	•	F1. Vercel Cron → /api/cron/refresh (обновление MV).
	•	F2. Алерты «нет данных N часов» (простая проверка в UI или edge → email/webhook позже).

Milestone G — Полировка
	•	G1. Audit log (минимум) на изменения заказов.
	•	G2. Server-side pagination больших таблиц.
	•	G3. Документация, скринкасты, демо-данные.

⸻

6) Тикеты (с критериями приёмки)

Формат: ID · Название · Описание · Tasks · Acceptance Criteria · Notes

EPIC-ENV — Среда разработки
	•	ENV-001 · Bootstrap repo
	•	Tasks: init git, pnpm workspace, структуры apps/web, packages/shared.
	•	AC: репозиторий собирается, pnpm i без ошибок.
	•	ENV-002 · Next 15 app
	•	Tasks: create-next-app, Tailwind, shadcn/ui добавлены.
	•	AC: стартует pnpm dev, открывается пустой /.
	•	ENV-003 · Supabase local+link
	•	Tasks: supabase init/start, supabase link --project-ref.
	•	AC: Studio доступна, CLI команды работают.
	•	ENV-004 · Env vars
	•	Tasks: .env.local, переменные на Vercel.
	•	AC: нет обращения к undefined env при запуске.

EPIC-DB — База данных
	•	DB-001 · Core schema
	•	Tasks: shipping_lines, terminals, voyages, containers, container_events, orgs, orders, order_items.
	•	AC: таблицы созданы, индексы на месте (\d+ показывает).
	•	DB-002 · Materialized views + RPC
	•	Tasks: mv_upcoming_voyages, mv_dwell, функции refresh_mv_*.
	•	AC: select * from mv_* возвращают строки; select refresh_mv_*() работает.
	•	DB-003 · RLS policies
	•	Tasks: включить RLS на orders/order_items; политики из раздела 2.8.
	•	AC: пользователь с иным org_id не видит чужие заказы.
	•	DB-004 · Seeds
	•	Tasks: вставить 2 линии, 2 терминала, пару рейсов/контейнеров.
	•	AC: Dashboard рендерит KPI и список.

EPIC-INGEST — Инжест и нормализация
	•	ING-001 · Edge: ingest-arrivals
	•	Tasks: функция, проверка INGEST_SECRET, приём CSV/JSON, запись в raw_arrivals.
	•	AC: curl -H "Authorization: Bearer ..." → {ok:true}; запись появляется.
	•	ING-002 · Normalize → stg
	•	Tasks: парсинг/маппинг (UTC, scac, terminal_code) → stg_voyages, stg_containers (upsert по unique ключам).
	•	AC: повторный запуск не создаёт дубликаты.
	•	ING-003 · Upsert core
	•	Tasks: voyages (по ключу voyage_no + line_id + terminal_id), containers (по cntr_no), события при необходимости.
	•	AC: контейнеры привязаны к рейсам; индексы задействуются.
	•	ING-004 · Metrics & errors
	•	Tasks: писать ingest_metrics/ingest_errors.
	•	AC: при ошибочных строках растут counters, error-записи содержат payload.

EPIC-UI — Интерфейс (Next 15)
	•	UI-001 · Supabase clients
	•	Tasks: lib/supabase/{browser,server}.ts (SSR cookies), при необходимости sbService.
	•	AC: запросы к mv_* и таблицам работают под RLS.
	•	UI-002 · Dashboard
	•	Tasks: app/page.tsx, KPI, UpcomingTable, DwellChart.
	•	AC: отображаются KPI + таблица ближайших рейсов + график dwell.
	•	UI-003 · Arrivals list & details
	•	Tasks: arrivals/page.tsx, [voyageId]/page.tsx, фильтры.
	•	AC: фильтры применяются, детальная страница отображает контейнеры.
	•	UI-004 · Containers search
	•	Tasks: containers/page.tsx, поле поиска (debounce), server-side query.
	•	AC: поиск по cntr_no/bill_of_lading находит записи.
	•	UI-005 · Orders list/new/detail
	•	Tasks: страницы orders/*, Server Actions createOrder/addOrderItems.
	•	AC: создаётся заказ, bulk paste добавляет позиции, статусы обновляются.

EPIC-ACTIONS — Server Actions & Mutations
	•	ACT-001 · createOrder
	•	AC: при валидном order_no запись в orders; RLS пропускает с org_id.
	•	ACT-002 · addOrderItems (bulk)
	•	AC: парсинг по строкам, вставка order_items, валидация формата.

EPIC-CRON — Планировщики
	•	CRON-001 · Vercel Cron → refresh
	•	Tasks: api/cron/refresh/route.ts вызывает RPC; настроить расписание в Vercel.
	•	AC: MV обновляются по расписанию (видно по pg_stat_all_tables.last_vacuum или по данным).

EPIC-SEC — Безопасность
	•	SEC-001 · Secrets hygiene
	•	AC: SERVICE_ROLE_KEY/INGEST_SECRET недоступны на клиенте; проверка Edge/Route.
	•	SEC-002 · Read-only views (optional)
	•	AC: публичные списки без PII доступны, если требуется (через view).

EPIC-OBS — Наблюдаемость
	•	OBS-001 · Log ingestion
	•	AC: логируется количество строк/ошибок; есть простая страница admin для метрик (позже).
	•	OBS-002 · No-data alert (stub)
	•	AC: UI badge «Data stale > N hours» при отсутствии свежих записей в raw_arrivals.

EPIC-QA — Тестирование
	•	QA-001 · Unit: parsers
	•	AC: Vitest покрывает CSV/JSON парсер и нормализатор.
	•	QA-002 · E2E (optional)
	•	AC: Playwright сценарий: создать заказ → bulk → статус контейнеров → обновление заказа.

EPIC-DOCS — Документация
	•	DOC-001 · README: быстрый старт, команды, env, ссылки.
	•	DOC-002 · OPS.md: как рефрешить MV, где смотреть логи, как катить сиды.
	•	DOC-003 · INGEST.md: формат CSV/JSON, dry-run, примеры curl.

⸻

7) Подсказки для Cursor (prompts)

Root prompt (положить в .cursorrules/CONTRIBUTING.md)

You are an elite full‑stack engineer. Follow the architecture in "PortOps MVP — Roadmap & Tickets".
- Framework: Next.js 15 (App Router, Server Components, Server Actions)
- UI: Tailwind + shadcn/ui
- Data: Supabase with RLS; prefer server-side data fetching.
- Code style: TypeScript strict, no client-side secrets.
- Never hardcode service keys. Read from env.
- For tables >100 rows use server-side pagination.
- Keep components small and pure.

Task prompt (пример для UI-002 Dashboard)

Implement Dashboard page at apps/web/app/page.tsx:
- Fetch KPI via sb.rpc('kpi_summary') (stub: return zeros if missing)
- Read top 20 rows from mv_upcoming_voyages
- Read top 20 rows from mv_dwell
- Render: <KPIs>, <UpcomingTable>, <DwellChart>
Create minimal components in apps/web/components/.

Task prompt (ING-001)

In supabase/functions/ingest-arrivals/index.ts implement:
- Auth check via INGEST_SECRET
- Detect CSV vs JSON by Content-Type
- Parse into normalized records (UTC, codes)
- Insert raw payload
- Upsert into stg_voyages/stg_containers (unique keys)
- Return {ok:true, inserted:<n>, updated:<m>, errors:<k>}


⸻

8) Команды и скрипты

package.json (root) — скетч

{
  "scripts": {
    "dev": "pnpm -C apps/web dev",
    "build": "pnpm -C apps/web build",
    "start": "pnpm -C apps/web start",
    "db:studio": "open http://127.0.0.1:54323",
    "sb:start": "supabase start",
    "sb:stop": "supabase stop"
  }
}


⸻

9) Приёмка MVP (high-level checklist)
	•	Dashboard: KPI/Upcoming/Dwell отражают сид-данные.
	•	Arrivals/Details: фильтры, сортировки, контейнеры грузятся быстро (<200ms DB, <1s TTFB).
	•	Orders: создание, bulk paste, изменение статусов по событиям контейнеров.
	•	Ingest: CSV и JSON оба работают, ошибки логируются, дубликатов нет.
	•	RLS: пользователи из разных org не видят чужие заказы.
	•	Cron: MV рефрешатся автоматически.
	•	Secrets не утекли в браузерный бандл.

⸻

10) Дальше (post-MVP идеи)
	•	Подключение внешних статусов (holds, appointments), вебхуки.
	•	Сохранённые представления/подписки на алерты per‑org.
	•	MapLibre GL для визуализации судов/терминалов.
	•	Партиционирование container_events по месяцам при росте.

⸻

Готово. Следуй Milestones A→G и закрывай тикеты по порядку.