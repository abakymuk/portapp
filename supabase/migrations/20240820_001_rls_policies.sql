-- DB-003: RLS policies
-- Настройка Row Level Security для многотенантности и изоляции данных

-- 1. Утилитарные функции для работы с JWT
-- Функция для получения org_id из JWT
create or replace function get_org_id()
returns uuid
language sql
security definer
stable
as $$
  select (current_setting('request.jwt.claims', true)::json->>'org_id')::uuid;
$$;

-- Функция для проверки принадлежности к организации
create or replace function belongs_to_org(org_uuid uuid)
returns boolean
language sql
security definer
stable
as $$
  select get_org_id() = org_uuid;
$$;

-- 2. Включение RLS на таблицах
alter table orders enable row level security;
alter table order_items enable row level security;
alter table orgs enable row level security;

-- 3. Политики для таблицы orders
-- Политика SELECT: пользователь видит только заказы своей организации
create policy "Users can view orders from their organization"
on orders for select
using (
  org_id = get_org_id()
);

-- Политика INSERT: пользователь может создавать заказы только для своей организации
create policy "Users can create orders for their organization"
on orders for insert
with check (
  org_id = get_org_id()
);

-- Политика UPDATE: пользователь может обновлять только заказы своей организации
create policy "Users can update orders from their organization"
on orders for update
using (
  org_id = get_org_id()
)
with check (
  org_id = get_org_id()
);

-- Политика DELETE: пользователь может удалять только заказы своей организации
create policy "Users can delete orders from their organization"
on orders for delete
using (
  org_id = get_org_id()
);

-- 4. Политики для таблицы order_items
-- Политика SELECT: пользователь видит только позиции заказов своей организации
create policy "Users can view order items from their organization"
on order_items for select
using (
  order_id in (
    select id from orders where org_id = get_org_id()
  )
);

-- Политика INSERT: пользователь может создавать позиции только для заказов своей организации
create policy "Users can create order items for their organization"
on order_items for insert
with check (
  order_id in (
    select id from orders where org_id = get_org_id()
  )
);

-- Политика UPDATE: пользователь может обновлять только позиции заказов своей организации
create policy "Users can update order items from their organization"
on order_items for update
using (
  order_id in (
    select id from orders where org_id = get_org_id()
  )
)
with check (
  order_id in (
    select id from orders where org_id = get_org_id()
  )
);

-- Политика DELETE: пользователь может удалять только позиции заказов своей организации
create policy "Users can delete order items from their organization"
on order_items for delete
using (
  order_id in (
    select id from orders where org_id = get_org_id()
  )
);

-- 5. Политики для таблицы orgs
-- Политика SELECT: пользователь видит только свою организацию
create policy "Users can view their organization"
on orgs for select
using (
  id = get_org_id()
);

-- Политика UPDATE: пользователь может обновлять только свою организацию
create policy "Users can update their organization"
on orgs for update
using (
  id = get_org_id()
)
with check (
  id = get_org_id()
);

-- 6. Политики для read-only таблиц
-- Примечание: Материализованные представления не поддерживают RLS политики
-- Они доступны всем аутентифицированным пользователям по умолчанию

-- Политика для справочников: все аутентифицированные пользователи могут читать
create policy "Authenticated users can view shipping lines"
on shipping_lines for select
using (auth.role() = 'authenticated');

create policy "Authenticated users can view terminals"
on terminals for select
using (auth.role() = 'authenticated');

-- Политика для voyages и containers: все аутентифицированные пользователи могут читать
create policy "Authenticated users can view voyages"
on voyages for select
using (auth.role() = 'authenticated');

create policy "Authenticated users can view containers"
on containers for select
using (auth.role() = 'authenticated');

-- Политика для container_events: все аутентифицированные пользователи могут читать
create policy "Authenticated users can view container events"
on container_events for select
using (auth.role() = 'authenticated');

-- Политика для staging таблиц: все аутентифицированные пользователи могут читать
create policy "Authenticated users can view staging voyages"
on stg_voyages for select
using (auth.role() = 'authenticated');

create policy "Authenticated users can view staging containers"
on stg_containers for select
using (auth.role() = 'authenticated');

-- Политика для raw таблиц: все аутентифицированные пользователи могут читать
create policy "Authenticated users can view raw arrivals"
on raw_arrivals for select
using (auth.role() = 'authenticated');

-- Политика для code_mappings: все аутентифицированные пользователи могут читать
create policy "Authenticated users can view code mappings"
on code_mappings for select
using (auth.role() = 'authenticated');

-- 7. Комментарии
comment on function get_org_id() is 'Функция для получения org_id из JWT claims';
comment on function belongs_to_org(uuid) is 'Функция для проверки принадлежности к организации';
