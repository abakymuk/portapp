# DB-001 · Core schema

**Статус**: ⏳ Ожидает  
**Milestone**: B  
**Приоритет**: Высокий  
**EPIC**: DB - База данных

## Описание

Создание основной схемы базы данных с таблицами для рейсов, контейнеров, заказов и справочников.

## Задачи

- [ ] Создать таблицы справочников: `shipping_lines`, `terminals`
- [ ] Создать таблицы raw/staging: `raw_arrivals`, `stg_voyages`, `stg_containers`
- [ ] Создать core таблицы: `voyages`, `containers`, `container_events`
- [ ] Создать таблицы заказов: `orgs`, `orders`, `order_items`
- [ ] Добавить индексы для производительности
- [ ] Создать foreign key связи
- [ ] Добавить check constraints

## Критерии приёмки

- [ ] Все таблицы созданы в Supabase
- [ ] Индексы на месте (проверить через `\d+`)
- [ ] Связи между таблицами работают корректно
- [ ] Check constraints применяются
- [ ] Схема соответствует документации в `docs/DATABASE.md`

## Технические детали

### SQL скрипт для выполнения

```sql
-- 1. Справочники
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

-- 2. Raw/Staging
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

-- 3. Core таблицы
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

-- 4. Многотенантность и заказы
create table if not exists orgs (
  id uuid primary key default gen_random_uuid(),
  name text not null
);

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

-- 5. Индексы
create index if not exists idx_voyages_eta on voyages (eta);
create index if not exists idx_voyages_terminal on voyages (terminal_id);
create index if not exists idx_containers_voyage on containers (voyage_id);
create index if not exists idx_containers_status on containers (last_known_status);
create index if not exists idx_containers_status_time on containers (last_status_time);
create index if not exists idx_order_items_cntr on order_items (cntr_no);
create index if not exists idx_container_events_time on container_events (container_id, event_time desc);
```

## Команды для выполнения

```bash
# Подключение к локальному Supabase
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres

# Или через Supabase CLI
supabase db reset

# Применение SQL
# Скопировать SQL выше и выполнить в Supabase Studio SQL Editor
```

## Проверка результата

```sql
-- Проверка таблиц
\dt

-- Проверка структуры таблицы
\d+ voyages

-- Проверка индексов
\di

-- Проверка связей
SELECT 
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM 
  information_schema.table_constraints AS tc 
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY';
```

## Зависимости

- **ENV-003** - Supabase setup (должен быть завершён)

## Следующие тикеты

- **DB-002** - Materialized views + RPC
- **DB-003** - RLS policies
- **DB-004** - Seeds

## Примечания

- Использовать SQL из раздела 2 спецификации
- Проверить все foreign key связи
- Убедиться, что check constraints работают
- Создать индексы для часто используемых полей
