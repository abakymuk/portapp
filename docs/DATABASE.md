# Схема базы данных PortOps MVP

## Обзор

База данных построена на PostgreSQL (Supabase) с использованием Row Level Security (RLS) для многотенантности. Архитектура следует паттерну Ingest → Normalize → Store → Expose.

## Структура таблиц

### 1. Справочники и маппинги

#### shipping_lines
Справочник судоходных линий.

```sql
create table if not exists shipping_lines (
  id uuid primary key default gen_random_uuid(),
  scac text unique,                    -- Standard Carrier Alpha Code
  name text not null,                  -- Название линии
  created_at timestamptz default now()
);
```

#### terminals
Справочник терминалов.

```sql
create table if not exists terminals (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,           -- Код терминала
  name text not null,                  -- Название терминала
  timezone text not null default 'America/Los_Angeles',
  created_at timestamptz default now()
);
```

#### code_mappings
Маппинг кодов из внешних источников во внутренние.

```sql
create table if not exists code_mappings (
  id bigserial primary key,
  source text not null,                -- Источник данных
  kind text not null,                  -- Тип маппинга (scac, terminal, etc.)
  source_code text not null,           -- Код в источнике
  target_id uuid,                      -- ID в целевой таблице
  target_value text,                   -- Значение в целевой таблице
  unique (source, kind, source_code)
);
```

### 2. Raw/Staging таблицы

#### raw_arrivals
Сырые данные от источников.

```sql
create table if not exists raw_arrivals (
  id bigserial primary key,
  source text not null,                -- Источник данных
  payload jsonb not null,              -- Сырые данные
  received_at timestamptz default now()
);
```

#### stg_voyages
Staging таблица для рейсов.

```sql
create table if not exists stg_voyages (
  id bigserial primary key,
  vessel_name text,
  voyage_no text,
  line_scac text,
  terminal_code text,
  eta timestamptz,                     -- Estimated Time of Arrival
  etd timestamptz,                     -- Estimated Time of Departure
  ata timestamptz,                     -- Actual Time of Arrival
  atd timestamptz,                     -- Actual Time of Departure
  unique (voyage_no, line_scac, terminal_code)
);
```

#### stg_containers
Staging таблица для контейнеров.

```sql
create table if not exists stg_containers (
  id bigserial primary key,
  cntr_no text,                        -- Номер контейнера
  iso_type text,                       -- ISO тип контейнера
  voyage_no text,
  line_scac text,
  terminal_code text,
  bill_of_lading text,                 -- BOL номер
  last_known_status text,
  last_status_time timestamptz,
  unique (cntr_no, voyage_no, line_scac, terminal_code)
);
```

### 3. Core таблицы

#### voyages
Основная таблица рейсов.

```sql
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
```

#### containers
Основная таблица контейнеров.

```sql
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
```

#### container_events
События контейнеров для аудита и аналитики.

```sql
create table if not exists container_events (
  id bigserial primary key,
  container_id uuid not null references containers(id) on delete cascade,
  event_type text check (event_type in ('discharged','available','picked_up','hold','release')) not null,
  event_time timestamptz not null,
  payload jsonb,                       -- Дополнительные данные события
  created_at timestamptz default now()
);
```

### 4. Многотенантность и заказы

#### orgs
Организации (тенанты).

```sql
create table if not exists orgs (
  id uuid primary key default gen_random_uuid(),
  name text not null
);
```

#### orders
Заказы на работу с контейнерами.

```sql
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
```

#### order_items
Позиции заказов.

```sql
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
```

## Индексы

```sql
-- Индексы для производительности
create index if not exists idx_voyages_eta on voyages (eta);
create index if not exists idx_voyages_terminal on voyages (terminal_id);
create index if not exists idx_containers_voyage on containers (voyage_id);
create index if not exists idx_containers_status on containers (last_known_status);
create index if not exists idx_containers_status_time on containers (last_status_time);
create index if not exists idx_order_items_cntr on order_items (cntr_no);
create index if not exists idx_container_events_time on container_events (container_id, event_time desc);
```

## Материализованные представления

### mv_upcoming_voyages
Представление для Dashboard с ближайшими рейсами.

```sql
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
```

### mv_dwell
Представление для анализа времени нахождения контейнеров.

```sql
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
```

## RPC функции

### Обновление материализованных представлений

```sql
create or replace function refresh_mv_upcoming() returns void language sql as $$
  refresh materialized view concurrently mv_upcoming_voyages;
$$;

create or replace function refresh_mv_dwell() returns void language sql as $$
  refresh materialized view concurrently mv_dwell;
$$;
```

## Триггеры

### Синхронизация статусов заказов

```sql
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
```

### Пересчёт статуса заказа

```sql
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
```

## RLS политики

### Включение RLS

```sql
alter table if exists orders enable row level security;
alter table if exists order_items enable row level security;
```

### Политики для orders

```sql
-- SELECT политика
create policy if not exists orders_select_same_org on orders for select
  using (org_id = (auth.jwt() ->> 'org_id')::uuid);

-- INSERT политика
create policy if not exists orders_insert_same_org on orders for insert
  with check (org_id = (auth.jwt() ->> 'org_id')::uuid);

-- UPDATE политика
create policy if not exists orders_update_same_org on orders for update
  using (org_id = (auth.jwt() ->> 'org_id')::uuid)
  with check (org_id = (auth.jwt() ->> 'org_id')::uuid);
```

### Политики для order_items

```sql
-- SELECT политика
create policy if not exists items_select_parent_org on order_items for select
  using (exists (select 1 from orders o where o.id=order_id and o.org_id=(auth.jwt() ->> 'org_id')::uuid));

-- ALL политика (SELECT, INSERT, UPDATE, DELETE)
create policy if not exists items_modify_parent_org on order_items for all
  using (exists (select 1 from orders o where o.id=order_id and o.org_id=(auth.jwt() ->> 'org_id')::uuid))
  with check (exists (select 1 from orders o where o.id=order_id and o.org_id=(auth.jwt() ->> 'org_id')::uuid));
```

## Метрики и ошибки

### ingest_metrics
Метрики процесса инжеста.

```sql
create table if not exists ingest_metrics (
  id bigserial primary key,
  source text not null,
  rows_ok int default 0,
  rows_err int default 0,
  duration_ms int default 0,
  ts timestamptz default now()
);
```

### ingest_errors
Ошибки процесса инжеста.

```sql
create table if not exists ingest_errors (
  id bigserial primary key,
  source text not null,
  payload jsonb not null,
  reason text,
  created_at timestamptz default now()
);
```

## Сид-данные

### Базовые справочники

```sql
-- Судоходные линии
insert into shipping_lines (scac, name) values
  ('MSCU','MSC') on conflict do nothing,
  ('MAEU','Maersk') on conflict do nothing;

-- Терминалы
insert into terminals (code, name, timezone) values
  ('LAX-T1','Los Angeles T1','America/Los_Angeles') on conflict do nothing,
  ('LGB-T2','Long Beach T2','America/Los_Angeles') on conflict do nothing;
```

## Команды для работы с БД

### Проверка структуры

```sql
-- Список таблиц
\dt

-- Структура таблицы
\d+ voyages

-- Проверка индексов
\di

-- Проверка MV
SELECT * FROM mv_upcoming_voyages LIMIT 5;
```

### Обновление MV

```sql
-- Ручное обновление
SELECT refresh_mv_upcoming();
SELECT refresh_mv_dwell();

-- Проверка последнего обновления
SELECT schemaname, matviewname, last_vacuum 
FROM pg_stat_all_tables 
WHERE schemaname = 'public' AND matviewname LIKE 'mv_%';
```

### Мониторинг RLS

```sql
-- Проверка политик
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public';

-- Проверка RLS статуса
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename IN ('orders', 'order_items');
```
