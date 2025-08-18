# OBS-001 · Log ingestion

**Статус**: ⏳ Ожидает  
**Milestone**: D  
**Приоритет**: Средний  
**EPIC**: OBSERVABILITY - Наблюдаемость

## Описание

Настройка логирования всех операций ingest с метриками и мониторингом производительности.

## Задачи

- [ ] Создать таблицы для метрик и ошибок
- [ ] Настроить логирование в Edge Functions
- [ ] Добавить метрики производительности
- [ ] Создать дашборд для мониторинга
- [ ] Настроить алерты
- [ ] Добавить retention политики

## Критерии приёмки

- [ ] Все операции логируются
- [ ] Метрики собираются корректно
- [ ] Дашборд отображает данные
- [ ] Алерты работают
- [ ] Retention настроен

## Технические детали

### Таблицы для логирования

```sql
-- Таблица для метрик ingest операций
CREATE TABLE IF NOT EXISTS ingest_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source TEXT NOT NULL, -- 'ingest-arrivals', 'normalize-staging', 'upsert-core'
  rows_ok INTEGER DEFAULT 0,
  rows_err INTEGER DEFAULT 0,
  duration_ms INTEGER NOT NULL,
  payload JSONB, -- дополнительные данные
  ts TIMESTAMPTZ DEFAULT NOW()
);

-- Таблица для ошибок
CREATE TABLE IF NOT EXISTS ingest_errors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source TEXT NOT NULL,
  payload JSONB, -- данные, вызвавшие ошибку
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_ingest_metrics_source_ts ON ingest_metrics (source, ts DESC);
CREATE INDEX IF NOT EXISTS idx_ingest_metrics_ts ON ingest_metrics (ts DESC);
CREATE INDEX IF NOT EXISTS idx_ingest_errors_source_created ON ingest_errors (source, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ingest_errors_created ON ingest_errors (created_at DESC);

-- Retention политика (удаление старых записей)
CREATE OR REPLACE FUNCTION cleanup_old_metrics()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Удаление метрик старше 30 дней
  DELETE FROM ingest_metrics 
  WHERE ts < NOW() - INTERVAL '30 days';
  
  -- Удаление ошибок старше 7 дней
  DELETE FROM ingest_errors 
  WHERE created_at < NOW() - INTERVAL '7 days';
END;
$$;

-- Автоматическая очистка (ежедневно)
SELECT cron.schedule(
  'cleanup-old-metrics',
  '0 2 * * *', -- каждый день в 2:00
  'SELECT cleanup_old_metrics();'
);
```

### Утилиты для логирования

Создать файл `supabase/functions/_shared/logger.ts`:

```typescript
// Общий логгер для Edge Functions

export interface LogMetric {
  source: string
  rows_ok?: number
  rows_err?: number
  duration_ms: number
  payload?: any
}

export interface LogError {
  source: string
  payload?: any
  reason: string
}

export class IngestLogger {
  private supabase: any

  constructor(supabase: any) {
    this.supabase = supabase
  }

  async logMetric(metric: LogMetric) {
    try {
      await this.supabase
        .from('ingest_metrics')
        .insert({
          source: metric.source,
          rows_ok: metric.rows_ok || 0,
          rows_err: metric.rows_err || 0,
          duration_ms: metric.duration_ms,
          payload: metric.payload || null
        })
    } catch (error) {
      console.error('Failed to log metric:', error)
    }
  }

  async logError(error: LogError) {
    try {
      await this.supabase
        .from('ingest_errors')
        .insert({
          source: error.source,
          payload: error.payload || null,
          reason: error.reason
        })
    } catch (logError) {
      console.error('Failed to log error:', logError)
    }
  }

  async logSuccess(source: string, rowsOk: number, durationMs: number, payload?: any) {
    await this.logMetric({
      source,
      rows_ok: rowsOk,
      rows_err: 0,
      duration_ms: durationMs,
      payload
    })
  }

  async logFailure(source: string, rowsErr: number, durationMs: number, reason: string, payload?: any) {
    await this.logMetric({
      source,
      rows_ok: 0,
      rows_err: rowsErr,
      duration_ms: durationMs,
      payload
    })

    await this.logError({
      source,
      payload,
      reason
    })
  }
}
```

### Обновление Edge Functions

Обновить все Edge Functions для использования логгера:

```typescript
// Пример обновления ingest-arrivals
import { IngestLogger } from '../_shared/logger.ts'

serve(async (req) => {
  const startTime = Date.now()
  const logger = new IngestLogger(supabase)
  
  try {
    // ... существующий код ...
    
    await logger.logSuccess('ingest-arrivals', processedRows, Date.now() - startTime, {
      source: source,
      format: format
    })
    
  } catch (error) {
    await logger.logFailure('ingest-arrivals', 0, Date.now() - startTime, error.message, {
      source: source,
      format: format
    })
    throw error
  }
})
```

### API для метрик

Создать файл `apps/web/src/app/api/metrics/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    
    const source = searchParams.get('source')
    const hours = parseInt(searchParams.get('hours') || '24')
    
    // Получение метрик
    let query = supabase
      .from('ingest_metrics')
      .select('*')
      .gte('ts', new Date(Date.now() - hours * 60 * 60 * 1000).toISOString())
      .order('ts', { ascending: false })
    
    if (source) {
      query = query.eq('source', source)
    }
    
    const { data: metrics, error } = await query
    
    if (error) throw error
    
    // Агрегация метрик
    const aggregated = metrics?.reduce((acc, metric) => {
      acc.total_rows_ok += metric.rows_ok || 0
      acc.total_rows_err += metric.rows_err || 0
      acc.total_duration += metric.duration_ms || 0
      acc.count += 1
      return acc
    }, {
      total_rows_ok: 0,
      total_rows_err: 0,
      total_duration: 0,
      count: 0
    }) || {
      total_rows_ok: 0,
      total_rows_err: 0,
      total_duration: 0,
      count: 0
    }
    
    // Получение последних ошибок
    const { data: recentErrors } = await supabase
      .from('ingest_errors')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)
    
    return NextResponse.json({
      metrics: metrics || [],
      aggregated,
      recent_errors: recentErrors || [],
      time_range_hours: hours
    })
    
  } catch (error) {
    console.error('Metrics API error:', error)
    
    return NextResponse.json(
      { error: 'Failed to fetch metrics', details: error.message },
      { status: 500 }
    )
  }
}
```

### Компонент дашборда метрик

Создать файл `apps/web/src/components/metrics/metrics-dashboard.tsx`:

```typescript
'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { AlertTriangle, CheckCircle, Clock, Activity } from 'lucide-react'

interface MetricsData {
  metrics: Array<{
    source: string
    rows_ok: number
    rows_err: number
    duration_ms: number
    ts: string
  }>
  aggregated: {
    total_rows_ok: number
    total_rows_err: number
    total_duration: number
    count: number
  }
  recent_errors: Array<{
    source: string
    reason: string
    created_at: string
  }>
}

export function MetricsDashboard() {
  const [data, setData] = useState<MetricsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const response = await fetch('/api/metrics?hours=24')
        const metricsData = await response.json()
        setData(metricsData)
      } catch (error) {
        console.error('Failed to fetch metrics:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchMetrics()
    const interval = setInterval(fetchMetrics, 60000) // Обновление каждую минуту
    
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return <div>Загрузка метрик...</div>
  }

  if (!data) {
    return <div>Ошибка загрузки метрик</div>
  }

  const { aggregated, recent_errors } = data

  // Подготовка данных для графика
  const chartData = data.metrics.map(metric => ({
    time: new Date(metric.ts).toLocaleTimeString(),
    rows_ok: metric.rows_ok,
    rows_err: metric.rows_err,
    duration: metric.duration_ms
  }))

  const errorRate = aggregated.total_rows_ok + aggregated.total_rows_err > 0
    ? (aggregated.total_rows_err / (aggregated.total_rows_ok + aggregated.total_rows_err) * 100).toFixed(1)
    : '0'

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Обработано строк</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aggregated.total_rows_ok.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              За последние 24 часа
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ошибки</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aggregated.total_rows_err.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {errorRate}% от общего количества
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Среднее время</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {aggregated.count > 0 ? Math.round(aggregated.total_duration / aggregated.count) : 0}ms
            </div>
            <p className="text-xs text-muted-foreground">
              Среднее время обработки
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Операции</CardTitle>
            <Activity className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aggregated.count}</div>
            <p className="text-xs text-muted-foreground">
              Количество операций
            </p>
          </CardContent>
        </Card>
      </div>

      {/* График производительности */}
      <Card>
        <CardHeader>
          <CardTitle>Производительность за 24 часа</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="rows_ok" stroke="#10b981" name="Успешно" />
              <Line type="monotone" dataKey="rows_err" stroke="#ef4444" name="Ошибки" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Последние ошибки */}
      {recent_errors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Последние ошибки</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recent_errors.map((error, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <Badge variant="destructive">{error.source}</Badge>
                    <p className="text-sm mt-1">{error.reason}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(error.created_at).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
```

### Алерты

Создать файл `apps/web/src/app/api/alerts/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Проверка последних ошибок (последние 10 минут)
    const { data: recentErrors } = await supabase
      .from('ingest_errors')
      .select('*')
      .gte('created_at', new Date(Date.now() - 10 * 60 * 1000).toISOString())
    
    // Проверка производительности (среднее время > 5 секунд)
    const { data: slowOperations } = await supabase
      .from('ingest_metrics')
      .select('*')
      .gte('ts', new Date(Date.now() - 60 * 60 * 1000).toISOString())
      .gt('duration_ms', 5000)
    
    // Проверка отсутствия данных (нет метрик за последний час)
    const { data: recentMetrics } = await supabase
      .from('ingest_metrics')
      .select('*')
      .gte('ts', new Date(Date.now() - 60 * 60 * 1000).toISOString())
    
    const alerts = []
    
    if (recentErrors && recentErrors.length > 5) {
      alerts.push({
        type: 'error',
        message: `Высокий уровень ошибок: ${recentErrors.length} за последние 10 минут`,
        severity: 'high'
      })
    }
    
    if (slowOperations && slowOperations.length > 0) {
      alerts.push({
        type: 'performance',
        message: `${slowOperations.length} медленных операций за последний час`,
        severity: 'medium'
      })
    }
    
    if (!recentMetrics || recentMetrics.length === 0) {
      alerts.push({
        type: 'no_data',
        message: 'Нет данных ingest за последний час',
        severity: 'high'
      })
    }
    
    return NextResponse.json({
      alerts,
      status: alerts.length > 0 ? 'warning' : 'healthy',
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Alerts API error:', error)
    
    return NextResponse.json(
      { error: 'Failed to check alerts', details: error.message },
      { status: 500 }
    )
  }
}
```

## Команды для выполнения

```bash
# Создание компонентов
mkdir -p apps/web/src/components/metrics
mkdir -p apps/web/src/app/api/metrics
mkdir -p apps/web/src/app/api/alerts

# Создание файлов
touch apps/web/src/components/metrics/metrics-dashboard.tsx
touch apps/web/src/app/api/metrics/route.ts
touch apps/web/src/app/api/alerts/route.ts
touch supabase/functions/_shared/logger.ts
```

## Тестирование

### Тест логирования

```typescript
// Тест логгера
const logger = new IngestLogger(supabase)

await logger.logSuccess('test-source', 100, 5000, { test: true })
await logger.logFailure('test-source', 5, 2000, 'Test error', { test: true })
```

### Тест метрик API

```bash
# Получение метрик
curl -X GET "http://localhost:3000/api/metrics?hours=24"

# Проверка алертов
curl -X GET "http://localhost:3000/api/alerts"
```

## Зависимости

- **ING-001** - Edge function (должен быть завершён)
- **ING-002** - Normalize → stg (должен быть завершён)
- **ING-003** - Upsert core (должен быть завершён)

## Следующие тикеты

- **OBS-002** - No-data alert

## Примечания

- Настроить retention для оптимизации производительности
- Добавить индексы для быстрого поиска
- Мониторить размер таблиц метрик
- Настроить алерты в production
- Добавить экспорт метрик для анализа
