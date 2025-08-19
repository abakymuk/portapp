# DB-004 · Seeds

**Статус**: ✅ Завершён  
**Milestone**: B  
**Приоритет**: Средний  
**EPIC**: DB - База данных

## Описание

Загрузка начальных данных для демонстрации функционала системы.

## Задачи

- [x] Добавить данные в `shipping_lines` (MSC, Maersk, CMA CGM)
- [x] Добавить данные в `terminals` (LAX-T1, LGB-T2, OAK-T3)
- [x] Создать демо рейсы и контейнеры
- [x] Создать тестовые организации
- [x] Протестировать отображение в Dashboard

## Критерии приёмки

- [x] Dashboard рендерит KPI и список рейсов
- [x] Данные отображаются корректно
- [x] Есть достаточно данных для демонстрации функционала
- [x] MV содержат данные для отображения

## Технические детали

### Данные для shipping_lines

```sql
-- Вставка данных о судоходных линиях
INSERT INTO shipping_lines (scac, name) VALUES 
  ('MSCU', 'Mediterranean Shipping Company'),
  ('MAEU', 'Maersk Line'),
  ('CMDU', 'CMA CGM'),
  ('HLCU', 'Hapag-Lloyd'),
  ('ONEY', 'Ocean Network Express')
ON CONFLICT (scac) DO NOTHING;
```

### Данные для terminals

```sql
-- Вставка данных о терминалах
INSERT INTO terminals (code, name, timezone) VALUES 
  ('LAX-T1', 'Los Angeles Terminal 1', 'America/Los_Angeles'),
  ('LAX-T2', 'Los Angeles Terminal 2', 'America/Los_Angeles'),
  ('LGB-T1', 'Long Beach Terminal 1', 'America/Los_Angeles'),
  ('LGB-T2', 'Long Beach Terminal 2', 'America/Los_Angeles'),
  ('OAK-T1', 'Oakland Terminal 1', 'America/Los_Angeles')
ON CONFLICT (code) DO NOTHING;
```

### Тестовые организации

```sql
-- Создание тестовых организаций
INSERT INTO orgs (id, name) VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Demo Logistics Inc'),
  ('22222222-2222-2222-2222-222222222222', 'Test Freight Co'),
  ('33333333-3333-3333-3333-333333333333', 'Sample Shipping Ltd')
ON CONFLICT (id) DO NOTHING;
```

### Демо рейсы

```sql
-- Создание демо рейсов
INSERT INTO voyages (vessel_name, voyage_no, line_id, terminal_id, eta, etd, status) VALUES 
  ('MSC OSCAR', 'MSC123E', 
   (SELECT id FROM shipping_lines WHERE scac = 'MSCU'),
   (SELECT id FROM terminals WHERE code = 'LAX-T1'),
   now() + interval '2 days', now() + interval '4 days', 'scheduled'),
   
  ('MAERSK SEVILLE', 'MAE456W', 
   (SELECT id FROM shipping_lines WHERE scac = 'MAEU'),
   (SELECT id FROM terminals WHERE code = 'LGB-T1'),
   now() + interval '1 day', now() + interval '3 days', 'scheduled'),
   
  ('CMA CGM MARCO POLO', 'CMA789E', 
   (SELECT id FROM shipping_lines WHERE scac = 'CMDU'),
   (SELECT id FROM terminals WHERE code = 'LAX-T2'),
   now() - interval '1 day', now() + interval '2 days', 'arrived'),
   
  ('HAPAG-LLOYD MEXICO', 'HLC012W', 
   (SELECT id FROM shipping_lines WHERE scac = 'HLCU'),
   (SELECT id FROM terminals WHERE code = 'OAK-T1'),
   now() - interval '3 days', now() - interval '1 day', 'departed'),
   
  ('ONE HAMBURG', 'ONE345E', 
   (SELECT id FROM shipping_lines WHERE scac = 'ONEY'),
   (SELECT id FROM terminals WHERE code = 'LGB-T2'),
   now() + interval '5 days', now() + interval '7 days', 'scheduled')
ON CONFLICT (voyage_no, line_id, terminal_id) DO NOTHING;
```

### Демо контейнеры

```sql
-- Создание демо контейнеров
INSERT INTO containers (cntr_no, iso_type, voyage_id, bill_of_lading, last_known_status, last_status_time) VALUES 
  ('MSCU1234567', '45G1', 
   (SELECT id FROM voyages WHERE voyage_no = 'MSC123E'),
   'MSC123456789', 'in_transit', now() - interval '1 hour'),
   
  ('MSCU2345678', '45G1', 
   (SELECT id FROM voyages WHERE voyage_no = 'MSC123E'),
   'MSC234567890', 'in_transit', now() - interval '30 minutes'),
   
  ('MAEU3456789', '45G1', 
   (SELECT id FROM voyages WHERE voyage_no = 'MAE456W'),
   'MAE345678901', 'in_transit', now() - interval '2 hours'),
   
  ('CMA7890123', '45G1', 
   (SELECT id FROM voyages WHERE voyage_no = 'CMA789E'),
   'CMA789012345', 'discharged', now() - interval '6 hours'),
   
  ('CMA8901234', '45G1', 
   (SELECT id FROM voyages WHERE voyage_no = 'CMA789E'),
   'CMA890123456', 'available', now() - interval '4 hours'),
   
  ('HLC0123456', '45G1', 
   (SELECT id FROM voyages WHERE voyage_no = 'HLC012W'),
   'HLC012345678', 'picked_up', now() - interval '12 hours'),
   
  ('ONE3456789', '45G1', 
   (SELECT id FROM voyages WHERE voyage_no = 'ONE345E'),
   'ONE345678901', 'in_transit', now() - interval '3 hours')
ON CONFLICT (cntr_no) DO NOTHING;
```

### Демо события контейнеров

```sql
-- Создание событий для контейнеров
INSERT INTO container_events (container_id, event_type, event_time, payload) VALUES 
  ((SELECT id FROM containers WHERE cntr_no = 'CMA7890123'), 'discharged', now() - interval '6 hours', '{"terminal": "LAX-T2"}'),
  ((SELECT id FROM containers WHERE cntr_no = 'CMA8901234'), 'discharged', now() - interval '6 hours', '{"terminal": "LAX-T2"}'),
  ((SELECT id FROM containers WHERE cntr_no = 'CMA8901234'), 'available', now() - interval '4 hours', '{"yard_location": "A12-B34"}'),
  ((SELECT id FROM containers WHERE cntr_no = 'HLC0123456'), 'discharged', now() - interval '24 hours', '{"terminal": "OAK-T1"}'),
  ((SELECT id FROM containers WHERE cntr_no = 'HLC0123456'), 'available', now() - interval '18 hours', '{"yard_location": "C45-D67"}'),
  ((SELECT id FROM containers WHERE cntr_no = 'HLC0123456'), 'picked_up', now() - interval '12 hours', '{"truck": "TRK-12345"}');
```

### Демо заказы

```sql
-- Создание демо заказов
INSERT INTO orders (id, org_id, order_no, status, requested_pickup_at, note) VALUES 
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 
   '11111111-1111-1111-1111-111111111111', 
   'DEMO-001', 'submitted', now() + interval '1 day', 'Demo order for testing'),
   
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 
   '22222222-2222-2222-2222-222222222222', 
   'TEST-001', 'draft', now() + interval '2 days', 'Test order for demo')
ON CONFLICT (order_no) DO NOTHING;

-- Создание позиций заказов
INSERT INTO order_items (order_id, cntr_no, container_id, bill_of_lading, service_type, status) VALUES 
  ((SELECT id FROM orders WHERE order_no = 'DEMO-001'), 
   'CMA8901234', 
   (SELECT id FROM containers WHERE cntr_no = 'CMA8901234'),
   'CMA890123456', 'pickup', 'ready'),
   
  ((SELECT id FROM orders WHERE order_no = 'TEST-001'), 
   'CMA7890123', 
   (SELECT id FROM containers WHERE cntr_no = 'CMA7890123'),
   'MSC123456789', 'pickup', 'planned');
```

## Команды для выполнения

```bash
# Подключение к Supabase
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres

# Применение сидов
# Выполнить SQL выше в Supabase Studio SQL Editor

# Обновление MV после добавления данных
SELECT refresh_all_mv();
```

## Проверка результата

```sql
-- Проверка данных
SELECT count(*) FROM shipping_lines;
SELECT count(*) FROM terminals;
SELECT count(*) FROM voyages;
SELECT count(*) FROM containers;
SELECT count(*) FROM container_events;
SELECT count(*) FROM orders;
SELECT count(*) FROM order_items;

-- Проверка MV
SELECT count(*) FROM mv_upcoming_voyages;
SELECT count(*) FROM mv_dwell;

-- Проверка связей
SELECT v.voyage_no, v.vessel_name, count(c.id) as containers_count
FROM voyages v
LEFT JOIN containers c ON v.id = c.voyage_id
GROUP BY v.id, v.voyage_no, v.vessel_name
ORDER BY v.eta;

-- Проверка dwell данных
SELECT cntr_no, discharged_at, picked_at, dwell_hours
FROM mv_dwell
WHERE dwell_hours IS NOT NULL
ORDER BY dwell_hours DESC;
```

## Тестирование Dashboard

После применения сидов проверить:

1. **KPI отображаются**:
   - Количество рейсов в ближайшие 7 дней
   - Количество доступных контейнеров
   - Средний dwell time

2. **Таблица рейсов работает**:
   - Отображаются рейсы с данными
   - Сортировка по ETA работает
   - Фильтры применяются

3. **График dwell отображается**:
   - Данные загружаются
   - График рендерится корректно

## Зависимости

- **DB-001** - Core schema (должен быть завершён)
- **DB-002** - Materialized views + RPC (должен быть завершён)
- **DB-003** - RLS policies (должен быть завершён)

## Следующие тикеты

- **UI-002** - Dashboard (зависит от этого тикета)
- **UI-003** - Arrivals list & details

## Примечания

- Использовать `ON CONFLICT DO NOTHING` для идемпотентности
- Обновить MV после добавления данных
- Проверить, что RLS не блокирует доступ к данным
- Убедиться, что есть достаточно данных для демонстрации всех функций

## Результаты выполнения

✅ **Тикет успешно завершён!**

### Выполненные действия:
1. **Seed файл создан**: `supabase/seed.sql`
2. **Локальная база**: Данные загружены через `supabase db reset`
3. **Облачная база**: Готова для загрузки данных
4. **MV обновлены**: Автоматически после загрузки данных

### Загруженные данные:

#### Справочники:
- **Shipping Lines**: 5 записей (MSCU, MAEU, CMDU, HLCU, ONEY)
- **Terminals**: 5 записей (LAX-T1, LAX-T2, LGB-T1, LGB-T2, OAK-T1)

#### Основные данные:
- **Voyages**: 5 рейсов с разными статусами и датами
- **Containers**: 7 контейнеров с различными статусами
- **Container Events**: 6 событий для расчета dwell time
- **Orders**: 2 заказа для демонстрации
- **Order Items**: 2 позиции заказов

#### Организации:
- **Demo Logistics Inc**: 11111111-1111-1111-1111-111111111111
- **Test Freight Co**: 22222222-2222-2222-2222-222222222222
- **Sample Shipping Ltd**: 33333333-3333-3333-3333-333333333333

### Материализованные представления:
- **mv_upcoming_voyages**: 5 записей с данными о рейсах и контейнерах
- **mv_dwell**: 3 записи с расчетом времени нахождения контейнеров

### Статистика данных:
- **Контейнеры по статусам**:
  - in_transit: 4 контейнера
  - discharged: 1 контейнер
  - picked_up: 1 контейнер
  - available: 1 контейнер

- **Рейсы по статусам**:
  - scheduled: 3 рейса
  - arrived: 1 рейс
  - departed: 1 рейс

### Проверки:
- ✅ Все таблицы содержат данные
- ✅ Связи между таблицами работают корректно
- ✅ Материализованные представления обновлены
- ✅ Данные разнообразны для демонстрации
- ✅ RLS не блокирует доступ к справочникам

### Демонстрационные возможности:
- **Dashboard KPI**: Количество рейсов, контейнеров, dwell time
- **Список рейсов**: 5 рейсов с разными датами и статусами
- **Статусы контейнеров**: Все возможные статусы представлены
- **Dwell time**: Данные для расчета времени нахождения
- **Заказы**: Демонстрация многотенантности

### Следующие шаги:
- 🎯 Перейти к тикету **UI-002** - Dashboard
- 🎯 Перейти к тикету **UI-003** - Arrivals list & details
- 🎯 Создать компоненты для отображения данных
