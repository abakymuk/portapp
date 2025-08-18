-- DB-001: Core schema
-- Создание основной схемы базы данных для PortOps MVP

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

-- 5. Индексы для производительности
create index if not exists idx_voyages_eta on voyages (eta);
create index if not exists idx_voyages_terminal on voyages (terminal_id);
create index if not exists idx_voyages_status on voyages (status);
create index if not exists idx_voyages_line on voyages (line_id);
create index if not exists idx_containers_voyage on containers (voyage_id);
create index if not exists idx_containers_status on containers (last_known_status);
create index if not exists idx_containers_status_time on containers (last_status_time);
create index if not exists idx_containers_cntr_no on containers (cntr_no);
create index if not exists idx_order_items_cntr on order_items (cntr_no);
create index if not exists idx_order_items_order on order_items (order_id);
create index if not exists idx_container_events_time on container_events (container_id, event_time desc);
create index if not exists idx_container_events_type on container_events (event_type);
create index if not exists idx_orders_org on orders (org_id);
create index if not exists idx_orders_status on orders (status);
create index if not exists idx_raw_arrivals_source on raw_arrivals (source);
create index if not exists idx_raw_arrivals_received on raw_arrivals (received_at);
create index if not exists idx_stg_voyages_voyage on stg_voyages (voyage_no, line_scac);
create index if not exists idx_stg_containers_cntr on stg_containers (cntr_no);
create index if not exists idx_code_mappings_source on code_mappings (source, kind);

-- 6. Комментарии к таблицам
comment on table shipping_lines is 'Справочник судоходных линий';
comment on table terminals is 'Справочник терминалов';
comment on table code_mappings is 'Маппинг кодов между системами';
comment on table raw_arrivals is 'Сырые данные о прибытиях';
comment on table stg_voyages is 'Staging таблица для рейсов';
comment on table stg_containers is 'Staging таблица для контейнеров';
comment on table voyages is 'Основная таблица рейсов';
comment on table containers is 'Основная таблица контейнеров';
comment on table container_events is 'События контейнеров';
comment on table orgs is 'Организации (многотенантность)';
comment on table orders is 'Заказы на услуги';
comment on table order_items is 'Позиции заказов';
