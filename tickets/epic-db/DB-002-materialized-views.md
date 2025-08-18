# DB-002 · Materialized views + RPC

**Статус**: ⏳ Ожидает  
**Milestone**: B  
**Приоритет**: Высокий  
**EPIC**: DB - База данных

## Описание

Создание материализованных представлений и RPC функций для оптимизации запросов.

## Задачи

- [ ] Создать `mv_upcoming_voyages`
- [ ] Создать `mv_dwell`
- [ ] Создать RPC функции `refresh_mv_upcoming()`, `refresh_mv_dwell()`
- [ ] Добавить уникальные индексы для MV
- [ ] Настроить автоматическое обновление

## Критерии приёмки

- [ ] `SELECT * FROM mv_upcoming_voyages` возвращает строки
- [ ] `SELECT * FROM mv_dwell` возвращает строки
- [ ] `SELECT refresh_mv_upcoming()` выполняется успешно
- [ ] `SELECT refresh_mv_dwell()` выполняется успешно
- [ ] Индексы созданы и работают

## Технические детали

### Материализованное представление upcoming_voyages

```sql
create materialized view if not exists mv_upcoming_voyages as
select 
  v.id,
  v.vessel_name,
  v.voyage_no,
  v.eta,
  v.etd,
  v.status,
  t.name as terminal_name,
  sl.name as line_name,
  count(c.id) as containers_total,
  count(c.id) filter (where c.last_known_status = 'available') as containers_available
from voyages v
left join terminals t on v.terminal_id = t.id
left join shipping_lines sl on v.line_id = sl.id
left join containers c on v.id = c.voyage_id
where v.eta >= now() - interval '7 days'
  and v.eta <= now() + interval '30 days'
group by v.id, v.vessel_name, v.voyage_no, v.eta, v.etd, v.status, t.name, sl.name;

-- Уникальный индекс для обновления
create unique index if not exists idx_mv_upcoming_voyages_id on mv_upcoming_voyages (id);
```

### Материализованное представление dwell

```sql
create materialized view if not exists mv_dwell as
select 
  c.cntr_no,
  max(ce.event_time) filter (where ce.event_type = 'discharged') as discharged_at,
  max(ce.event_time) filter (where ce.event_type = 'picked_up') as picked_at,
  extract(epoch from (
    max(ce.event_time) filter (where ce.event_type = 'picked_up') - 
    max(ce.event_time) filter (where ce.event_type = 'discharged')
  )) / 3600 as dwell_hours
from containers c
left join container_events ce on c.id = ce.container_id
where ce.event_type in ('discharged', 'picked_up')
group by c.cntr_no;

-- Уникальный индекс для обновления
create unique index if not exists idx_mv_dwell_cntr_no on mv_dwell (cntr_no);
```

### RPC функции для обновления

```sql
-- Функция обновления mv_upcoming_voyages
create or replace function refresh_mv_upcoming()
returns void
language plpgsql
security definer
as $$
begin
  refresh materialized view concurrently mv_upcoming_voyages;
end;
$$;

-- Функция обновления mv_dwell
create or replace function refresh_mv_dwell()
returns void
language plpgsql
security definer
as $$
begin
  refresh materialized view concurrently mv_dwell;
end;
$$;

-- Функция обновления всех MV
create or replace function refresh_all_mv()
returns void
language plpgsql
security definer
as $$
begin
  refresh materialized view concurrently mv_upcoming_voyages;
  refresh materialized view concurrently mv_dwell;
end;
$$;
```

### Дополнительные индексы для производительности

```sql
-- Индексы для быстрого обновления MV
create index if not exists idx_voyages_eta_range on voyages (eta) 
where eta >= now() - interval '7 days' and eta <= now() + interval '30 days';

create index if not exists idx_container_events_type_time on container_events (container_id, event_type, event_time desc);

-- Индекс для dwell расчётов
create index if not exists idx_container_events_dwell on container_events (container_id, event_type, event_time) 
where event_type in ('discharged', 'picked_up');
```

## Команды для выполнения

```bash
# Подключение к Supabase
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres

# Создание MV
# Выполнить SQL выше в Supabase Studio SQL Editor

# Тестирование
SELECT * FROM mv_upcoming_voyages LIMIT 5;
SELECT * FROM mv_dwell LIMIT 5;

# Обновление MV
SELECT refresh_mv_upcoming();
SELECT refresh_mv_dwell();
SELECT refresh_all_mv();
```

## Проверка результата

```sql
-- Проверка MV
\dm mv_*

-- Проверка индексов
\di idx_mv_*

-- Проверка функций
\df refresh_*

-- Проверка данных
SELECT count(*) FROM mv_upcoming_voyages;
SELECT count(*) FROM mv_dwell;

-- Проверка производительности
EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM mv_upcoming_voyages WHERE eta >= now();
```

## Зависимости

- **DB-001** - Core schema (должен быть завершён)

## Следующие тикеты

- **DB-003** - RLS policies
- **DB-004** - Seeds
- **CRON-001** - Vercel Cron → refresh (зависит от этого тикета)

## Примечания

- Использовать `refresh materialized view concurrently` для обновления без блокировки
- Создать уникальные индексы для возможности concurrent refresh
- Настроить расписание обновления через Vercel Cron
- Мониторить производительность запросов к MV
