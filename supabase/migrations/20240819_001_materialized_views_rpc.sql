-- DB-002: Materialized views + RPC
-- Создание материализованных представлений и RPC функций для оптимизации запросов

-- 1. Материализованное представление upcoming_voyages
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

-- 2. Материализованное представление dwell
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

-- 3. RPC функции для обновления
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

-- 4. Дополнительные индексы для производительности
-- Индексы для быстрого обновления MV
create index if not exists idx_voyages_eta_range on voyages (eta);

create index if not exists idx_container_events_type_time on container_events (container_id, event_type, event_time desc);

-- Индекс для dwell расчётов
create index if not exists idx_container_events_dwell on container_events (container_id, event_type, event_time) 
where event_type in ('discharged', 'picked_up');

-- 5. Комментарии
comment on materialized view mv_upcoming_voyages is 'Материализованное представление предстоящих рейсов с количеством контейнеров';
comment on materialized view mv_dwell is 'Материализованное представление времени нахождения контейнеров в терминале';
comment on function refresh_mv_upcoming() is 'RPC функция для обновления mv_upcoming_voyages';
comment on function refresh_mv_dwell() is 'RPC функция для обновления mv_dwell';
comment on function refresh_all_mv() is 'RPC функция для обновления всех материализованных представлений';
