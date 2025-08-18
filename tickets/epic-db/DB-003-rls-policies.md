# DB-003 · RLS policies

**Статус**: ⏳ Ожидает  
**Milestone**: B  
**Приоритет**: Высокий  
**EPIC**: DB - База данных

## Описание

Настройка Row Level Security для многотенантности и изоляции данных между организациями.

## Задачи

- [ ] Включить RLS на таблицах `orders`, `order_items`
- [ ] Создать политики для SELECT, INSERT, UPDATE операций
- [ ] Протестировать изоляцию данных между организациями
- [ ] Настроить политики для MV и read-only таблиц
- [ ] Добавить политики для аудита

## Критерии приёмки

- [ ] Пользователь с иным org_id не видит чужие заказы
- [ ] Политики работают для всех CRUD операций
- [ ] Нет утечек данных между организациями
- [ ] MV доступны для чтения всем аутентифицированным пользователям
- [ ] Аудит работает корректно

## Технические детали

### Включение RLS

```sql
-- Включение RLS на таблицах заказов
alter table orders enable row level security;
alter table order_items enable row level security;

-- Включение RLS на таблицах организаций
alter table orgs enable row level security;
```

### Политики для таблицы orders

```sql
-- Политика SELECT: пользователь видит только заказы своей организации
create policy "Users can view orders from their organization"
on orders for select
using (
  org_id = (
    select (current_setting('request.jwt.claims', true)::json->>'org_id')::uuid
  )
);

-- Политика INSERT: пользователь может создавать заказы только для своей организации
create policy "Users can create orders for their organization"
on orders for insert
with check (
  org_id = (
    select (current_setting('request.jwt.claims', true)::json->>'org_id')::uuid
  )
);

-- Политика UPDATE: пользователь может обновлять только заказы своей организации
create policy "Users can update orders from their organization"
on orders for update
using (
  org_id = (
    select (current_setting('request.jwt.claims', true)::json->>'org_id')::uuid
  )
)
with check (
  org_id = (
    select (current_setting('request.jwt.claims', true)::json->>'org_id')::uuid
  )
);

-- Политика DELETE: пользователь может удалять только заказы своей организации
create policy "Users can delete orders from their organization"
on orders for delete
using (
  org_id = (
    select (current_setting('request.jwt.claims', true)::json->>'org_id')::uuid
  )
);
```

### Политики для таблицы order_items

```sql
-- Политика SELECT: пользователь видит только позиции заказов своей организации
create policy "Users can view order items from their organization"
on order_items for select
using (
  order_id in (
    select id from orders where org_id = (
      select (current_setting('request.jwt.claims', true)::json->>'org_id')::uuid
    )
  )
);

-- Политика INSERT: пользователь может создавать позиции только для заказов своей организации
create policy "Users can create order items for their organization"
on order_items for insert
with check (
  order_id in (
    select id from orders where org_id = (
      select (current_setting('request.jwt.claims', true)::json->>'org_id')::uuid
    )
  )
);

-- Политика UPDATE: пользователь может обновлять только позиции заказов своей организации
create policy "Users can update order items from their organization"
on order_items for update
using (
  order_id in (
    select id from orders where org_id = (
      select (current_setting('request.jwt.claims', true)::json->>'org_id')::uuid
    )
  )
)
with check (
  order_id in (
    select id from orders where org_id = (
      select (current_setting('request.jwt.claims', true)::json->>'org_id')::uuid
    )
  )
);

-- Политика DELETE: пользователь может удалять только позиции заказов своей организации
create policy "Users can delete order items from their organization"
on order_items for delete
using (
  order_id in (
    select id from orders where org_id = (
      select (current_setting('request.jwt.claims', true)::json->>'org_id')::uuid
    )
  )
);
```

### Политики для таблицы orgs

```sql
-- Политика SELECT: пользователь видит только свою организацию
create policy "Users can view their organization"
on orgs for select
using (
  id = (
    select (current_setting('request.jwt.claims', true)::json->>'org_id')::uuid
  )
);

-- Политика UPDATE: пользователь может обновлять только свою организацию
create policy "Users can update their organization"
on orgs for update
using (
  id = (
    select (current_setting('request.jwt.claims', true)::json->>'org_id')::uuid
  )
)
with check (
  id = (
    select (current_setting('request.jwt.claims', true)::json->>'org_id')::uuid
  )
);
```

### Политики для read-only таблиц

```sql
-- Политика для MV: все аутентифицированные пользователи могут читать
create policy "Authenticated users can view upcoming voyages"
on mv_upcoming_voyages for select
using (auth.role() = 'authenticated');

create policy "Authenticated users can view dwell data"
on mv_dwell for select
using (auth.role() = 'authenticated');

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
```

### Утилитарная функция для получения org_id

```sql
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
```

## Команды для выполнения

```bash
# Подключение к Supabase
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres

# Применение RLS политик
# Выполнить SQL выше в Supabase Studio SQL Editor

# Проверка политик
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;
```

## Тестирование

### Тест изоляции данных

```sql
-- Создание тестовых организаций
INSERT INTO orgs (id, name) VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Org A'),
  ('22222222-2222-2222-2222-222222222222', 'Org B');

-- Создание тестовых заказов
INSERT INTO orders (id, org_id, order_no, status) VALUES 
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'ORDER-A-001', 'draft'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'ORDER-B-001', 'draft');

-- Симуляция JWT с org_id для Org A
SET request.jwt.claims = '{"org_id": "11111111-1111-1111-1111-111111111111"}';

-- Проверка: пользователь Org A видит только свои заказы
SELECT * FROM orders; -- Должен показать только ORDER-A-001

-- Симуляция JWT с org_id для Org B
SET request.jwt.claims = '{"org_id": "22222222-2222-2222-2222-222222222222"}';

-- Проверка: пользователь Org B видит только свои заказы
SELECT * FROM orders; -- Должен показать только ORDER-B-001
```

## Проверка результата

```sql
-- Проверка включения RLS
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('orders', 'order_items', 'orgs');

-- Проверка политик
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;

-- Проверка функций
\df get_org_id
\df belongs_to_org
```

## Зависимости

- **DB-001** - Core schema (должен быть завершён)
- **DB-002** - Materialized views + RPC (должен быть завершён)

## Следующие тикеты

- **DB-004** - Seeds
- **UI-001** - Supabase clients (зависит от этого тикета)

## Примечания

- Предполагается org_id в JWT (user metadata → JWT enrichment)
- Использовать `security definer` для функций
- Тестировать изоляцию данных между организациями
- Проверить, что read-only таблицы доступны всем аутентифицированным пользователям
