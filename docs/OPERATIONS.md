# Операционные процедуры PortOps MVP

## Обзор

Этот документ описывает операционные процедуры для поддержки и мониторинга системы PortOps MVP.

## Мониторинг системы

### Проверка состояния базы данных

#### Проверка материализованных представлений

```sql
-- Проверка последнего обновления MV
SELECT 
  schemaname, 
  matviewname, 
  last_vacuum,
  last_autovacuum,
  n_tup_ins,
  n_tup_upd,
  n_tup_del
FROM pg_stat_all_tables 
WHERE schemaname = 'public' 
  AND matviewname LIKE 'mv_%'
ORDER BY last_vacuum DESC;

-- Проверка размера MV
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename LIKE 'mv_%';
```

#### Проверка RLS политик

```sql
-- Статус RLS на таблицах
SELECT 
  schemaname, 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('orders', 'order_items');

-- Активные политики
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual 
FROM pg_policies 
WHERE schemaname = 'public';
```

#### Проверка индексов

```sql
-- Статус индексов
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Неиспользуемые индексы (требует pg_stat_statements)
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
ORDER BY idx_scan ASC;
```

### Проверка ingest метрик

```sql
-- Последние метрики инжеста
SELECT 
  source,
  rows_ok,
  rows_err,
  duration_ms,
  ts
FROM ingest_metrics 
ORDER BY ts DESC 
LIMIT 20;

-- Статистика по источникам
SELECT 
  source,
  COUNT(*) as ingest_count,
  SUM(rows_ok) as total_ok,
  SUM(rows_err) as total_err,
  AVG(duration_ms) as avg_duration
FROM ingest_metrics 
WHERE ts >= NOW() - INTERVAL '24 hours'
GROUP BY source;

-- Ошибки инжеста
SELECT 
  source,
  reason,
  created_at,
  payload
FROM ingest_errors 
ORDER BY created_at DESC 
LIMIT 50;
```

## Обновление материализованных представлений

### Ручное обновление

```sql
-- Обновление MV для ближайших рейсов
SELECT refresh_mv_upcoming();

-- Обновление MV для dwell анализа
SELECT refresh_mv_dwell();

-- Проверка результата
SELECT COUNT(*) FROM mv_upcoming_voyages;
SELECT COUNT(*) FROM mv_dwell;
```

### Автоматическое обновление через Cron

#### Vercel Cron

Настройка в `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/refresh",
      "schedule": "*/10 * * * *"
    }
  ]
}
```

#### Проверка выполнения Cron

```bash
# Проверка логов Vercel
vercel logs --follow

# Проверка через API
curl -X POST https://your-domain.com/api/cron/refresh \
  -H "Authorization: Bearer ${CRON_SECRET}"
```

### Мониторинг обновлений

```sql
-- Создание функции для логирования обновлений
CREATE OR REPLACE FUNCTION log_mv_refresh(mv_name text) 
RETURNS void AS $$
BEGIN
  INSERT INTO ingest_metrics (source, rows_ok, duration_ms, ts)
  VALUES (
    'mv_refresh_' || mv_name,
    (SELECT COUNT(*) FROM pg_class WHERE relname = mv_name),
    EXTRACT(EPOCH FROM (clock_timestamp() - statement_timestamp())) * 1000,
    NOW()
  );
END;
$$ LANGUAGE plpgsql;

-- Обновление с логированием
SELECT log_mv_refresh('mv_upcoming_voyages');
SELECT refresh_mv_upcoming();
```

## Управление данными

### Загрузка сид-данных

```sql
-- Судоходные линии
INSERT INTO shipping_lines (scac, name) VALUES
  ('MSCU', 'MSC') ON CONFLICT (scac) DO NOTHING,
  ('MAEU', 'Maersk') ON CONFLICT (scac) DO NOTHING,
  ('CMDU', 'CMA CGM') ON CONFLICT (scac) DO NOTHING,
  ('HLCU', 'Hapag-Lloyd') ON CONFLICT (scac) DO NOTHING;

-- Терминалы
INSERT INTO terminals (code, name, timezone) VALUES
  ('LAX-T1', 'Los Angeles Terminal 1', 'America/Los_Angeles') ON CONFLICT (code) DO NOTHING,
  ('LGB-T2', 'Long Beach Terminal 2', 'America/Los_Angeles') ON CONFLICT (code) DO NOTHING,
  ('OAK-T3', 'Oakland Terminal 3', 'America/Los_Angeles') ON CONFLICT (code) DO NOTHING;

-- Демо организации
INSERT INTO orgs (name) VALUES
  ('Demo Logistics Inc.') ON CONFLICT DO NOTHING,
  ('Test Shipping Co.') ON CONFLICT DO NOTHING;
```

### Очистка старых данных

```sql
-- Очистка старых raw данных (старше 30 дней)
DELETE FROM raw_arrivals 
WHERE received_at < NOW() - INTERVAL '30 days';

-- Очистка старых ошибок (старше 7 дней)
DELETE FROM ingest_errors 
WHERE created_at < NOW() - INTERVAL '7 days';

-- Очистка старых метрик (старше 90 дней)
DELETE FROM ingest_metrics 
WHERE ts < NOW() - INTERVAL '90 days';
```

### Резервное копирование

```bash
# Экспорт схемы
pg_dump -h your-supabase-host -U postgres -d postgres --schema-only > schema_backup.sql

# Экспорт данных (без raw таблиц)
pg_dump -h your-supabase-host -U postgres -d postgres \
  --exclude-table=raw_arrivals \
  --exclude-table=ingest_metrics \
  --exclude-table=ingest_errors \
  > data_backup.sql

# Восстановление
psql -h your-supabase-host -U postgres -d postgres < schema_backup.sql
psql -h your-supabase-host -U postgres -d postgres < data_backup.sql
```

## Мониторинг производительности

### Медленные запросы

```sql
-- Создание расширения для мониторинга (если доступно)
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Топ медленных запросов
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  rows
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
```

### Мониторинг соединений

```sql
-- Активные соединения
SELECT 
  pid,
  usename,
  application_name,
  client_addr,
  state,
  query_start,
  query
FROM pg_stat_activity 
WHERE state = 'active'
  AND pid <> pg_backend_pid();
```

### Мониторинг блокировок

```sql
-- Текущие блокировки
SELECT 
  blocked_locks.pid AS blocked_pid,
  blocked_activity.usename AS blocked_user,
  blocking_locks.pid AS blocking_pid,
  blocking_activity.usename AS blocking_user,
  blocked_activity.query AS blocked_statement,
  blocking_activity.query AS current_statement_in_blocking_process
FROM pg_catalog.pg_locks blocked_locks
JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
JOIN pg_catalog.pg_locks blocking_locks 
  ON (blocking_locks.locktype = blocked_locks.locktype
      AND blocking_locks.database IS NOT DISTINCT FROM blocked_locks.database
      AND blocking_locks.relation IS NOT DISTINCT FROM blocked_locks.relation
      AND blocking_locks.page IS NOT DISTINCT FROM blocked_locks.page
      AND blocking_locks.tuple IS NOT DISTINCT FROM blocked_locks.tuple
      AND blocking_locks.virtualxid IS NOT DISTINCT FROM blocked_locks.virtualxid
      AND blocking_locks.transactionid IS NOT DISTINCT FROM blocked_locks.transactionid
      AND blocking_locks.classid IS NOT DISTINCT FROM blocked_locks.classid
      AND blocking_locks.objid IS NOT DISTINCT FROM blocked_locks.objid
      AND blocking_locks.objsubid IS NOT DISTINCT FROM blocked_locks.objsubid
      AND blocking_locks.pid != blocked_locks.pid)
JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
WHERE NOT blocked_locks.granted;
```

## Troubleshooting

### Проблемы с RLS

```sql
-- Проверка JWT claims пользователя
SELECT 
  auth.jwt() ->> 'org_id' as org_id,
  auth.jwt() ->> 'sub' as user_id;

-- Тестирование RLS политик
SET LOCAL "request.jwt.claim.org_id" = 'your-org-id';
SELECT * FROM orders LIMIT 5;
RESET "request.jwt.claim.org_id";
```

### Проблемы с ingest

```sql
-- Проверка последних ошибок
SELECT 
  source,
  reason,
  created_at,
  LEFT(payload::text, 200) as payload_preview
FROM ingest_errors 
ORDER BY created_at DESC 
LIMIT 10;

-- Проверка метрик по источнику
SELECT 
  source,
  COUNT(*) as total_runs,
  AVG(rows_ok) as avg_ok,
  AVG(rows_err) as avg_err,
  MAX(ts) as last_run
FROM ingest_metrics 
WHERE source = 'your-source'
GROUP BY source;
```

### Проблемы с триггерами

```sql
-- Проверка статуса триггеров
SELECT 
  trigger_name,
  event_manipulation,
  action_statement,
  action_timing
FROM information_schema.triggers 
WHERE trigger_schema = 'public';

-- Проверка функций триггеров
SELECT 
  routine_name,
  routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name LIKE '%trigger%';
```

## Алерты и уведомления

### Проверка свежести данных

```sql
-- Создание функции для проверки свежести
CREATE OR REPLACE FUNCTION check_data_freshness() 
RETURNS TABLE(source text, last_update timestamptz, hours_ago numeric) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'raw_arrivals'::text as source,
    MAX(received_at) as last_update,
    EXTRACT(EPOCH FROM (NOW() - MAX(received_at)))/3600 as hours_ago
  FROM raw_arrivals
  UNION ALL
  SELECT 
    'mv_upcoming_voyages'::text,
    MAX(last_vacuum),
    EXTRACT(EPOCH FROM (NOW() - MAX(last_vacuum)))/3600
  FROM pg_stat_all_tables 
  WHERE matviewname = 'mv_upcoming_voyages';
END;
$$ LANGUAGE plpgsql;

-- Использование
SELECT * FROM check_data_freshness() WHERE hours_ago > 2;
```

### Мониторинг ошибок

```sql
-- Создание представления для мониторинга
CREATE OR REPLACE VIEW error_summary AS
SELECT 
  source,
  COUNT(*) as error_count,
  MAX(created_at) as last_error,
  STRING_AGG(DISTINCT reason, ', ') as error_types
FROM ingest_errors 
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY source;

-- Использование
SELECT * FROM error_summary WHERE error_count > 0;
```

## Команды для быстрого доступа

### Скрипты для мониторинга

```bash
#!/bin/bash
# check_system_health.sh

echo "=== PortOps MVP System Health Check ==="
echo "Date: $(date)"
echo

# Проверка MV
echo "Materialized Views:"
psql $DATABASE_URL -c "SELECT matviewname, last_vacuum FROM pg_stat_all_tables WHERE schemaname = 'public' AND matviewname LIKE 'mv_%';"

echo

# Проверка ошибок
echo "Recent Errors:"
psql $DATABASE_URL -c "SELECT source, reason, created_at FROM ingest_errors ORDER BY created_at DESC LIMIT 5;"

echo

# Проверка метрик
echo "Ingest Metrics (last 24h):"
psql $DATABASE_URL -c "SELECT source, SUM(rows_ok) as ok, SUM(rows_err) as err FROM ingest_metrics WHERE ts >= NOW() - INTERVAL '24 hours' GROUP BY source;"
```

### Автоматизация через cron

```bash
# Добавить в crontab
# Проверка здоровья системы каждые 30 минут
*/30 * * * * /path/to/check_system_health.sh >> /var/log/portops_health.log 2>&1

# Ежедневная очистка старых данных в 2:00 AM
0 2 * * * psql $DATABASE_URL -c "DELETE FROM raw_arrivals WHERE received_at < NOW() - INTERVAL '30 days';"
```

## Контакты и эскалация

### Уровни поддержки

1. **L1 - Мониторинг**: Автоматические проверки и базовые алерты
2. **L2 - Операции**: Ручное вмешательство, перезапуск сервисов
3. **L3 - Разработка**: Исправление багов, оптимизация производительности

### Контакты

- **DevOps**: devops@company.com
- **Backend Team**: backend@company.com
- **Database Admin**: dba@company.com

### Процедуры эскалации

1. **Критическая ошибка** (система недоступна): Немедленное уведомление L2/L3
2. **Высокая ошибка** (функционал частично недоступен): Уведомление в течение 1 часа
3. **Средняя ошибка** (деградация производительности): Уведомление в течение 4 часов
4. **Низкая ошибка** (cosmetic issues): Уведомление в течение 24 часов
