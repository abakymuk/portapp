# CRON-001 · Vercel Cron → refresh

**Статус**: ⏳ Ожидает  
**Milestone**: C  
**Приоритет**: Средний  
**EPIC**: CRON - Автоматизация

## Описание

Настройка Vercel Cron для автоматического обновления материализованных представлений и запуска ingest pipeline.

## Задачи

- [ ] Создать `app/api/cron/refresh/route.ts`
- [ ] Настроить `vercel.json` для cron jobs
- [ ] Реализовать обновление MV
- [ ] Добавить мониторинг выполнения
- [ ] Настроить обработку ошибок
- [ ] Добавить логирование

## Критерии приёмки

- [ ] MV обновляются по расписанию
- [ ] Cron jobs выполняются успешно
- [ ] Ошибки логируются и обрабатываются
- [ ] Мониторинг работает корректно
- [ ] Производительность не страдает

## Технические детали

### Vercel Cron Route

Создать файл `apps/web/src/app/api/cron/refresh/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Валидация cron secret
function validateCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  const expectedSecret = process.env.CRON_SECRET
  
  if (!expectedSecret) {
    console.error('CRON_SECRET not configured')
    return false
  }
  
  return authHeader === `Bearer ${expectedSecret}`
}

export async function GET(request: NextRequest) {
  // Проверка аутентификации
  if (!validateCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startTime = Date.now()
  const results: Record<string, any> = {}

  try {
    const supabase = createClient()

    // Обновление материализованных представлений
    console.log('Starting MV refresh...')
    
    const { data: mvUpcomingResult, error: mvUpcomingError } = await supabase
      .rpc('refresh_mv_upcoming')
    
    if (mvUpcomingError) {
      console.error('Error refreshing mv_upcoming_voyages:', mvUpcomingError)
      results.mv_upcoming = { error: mvUpcomingError.message }
    } else {
      results.mv_upcoming = { success: true }
    }

    const { data: mvDwellResult, error: mvDwellError } = await supabase
      .rpc('refresh_mv_dwell')
    
    if (mvDwellError) {
      console.error('Error refreshing mv_dwell:', mvDwellError)
      results.mv_dwell = { error: mvDwellError.message }
    } else {
      results.mv_dwell = { success: true }
    }

    // Запуск ingest pipeline
    console.log('Starting ingest pipeline...')
    
    // 1. Нормализация staging
    const normalizeResponse = await fetch(`${process.env.VERCEL_URL}/api/cron/normalize`, {
      headers: {
        'Authorization': `Bearer ${process.env.CRON_SECRET}`
      }
    })
    
    if (normalizeResponse.ok) {
      const normalizeResult = await normalizeResponse.json()
      results.normalize = normalizeResult
    } else {
      results.normalize = { error: 'Normalize failed' }
    }

    // 2. Upsert core
    const upsertResponse = await fetch(`${process.env.VERCEL_URL}/api/cron/upsert`, {
      headers: {
        'Authorization': `Bearer ${process.env.CRON_SECRET}`
      }
    })
    
    if (upsertResponse.ok) {
      const upsertResult = await upsertResponse.json()
      results.upsert = upsertResult
    } else {
      results.upsert = { error: 'Upsert failed' }
    }

    // Запись метрик
    const duration = Date.now() - startTime
    await supabase
      .from('ingest_metrics')
      .insert({
        source: 'vercel-cron-refresh',
        rows_ok: 0,
        rows_err: 0,
        duration_ms: duration,
        payload: results
      })

    console.log('Cron refresh completed successfully')
    
    return NextResponse.json({
      success: true,
      duration_ms: duration,
      results
    })

  } catch (error) {
    console.error('Cron refresh error:', error)
    
    // Запись ошибки
    try {
      const supabase = createClient()
      await supabase
        .from('ingest_errors')
        .insert({
          source: 'vercel-cron-refresh',
          payload: { error: error.message },
          reason: 'Cron execution failed'
        })
    } catch (logError) {
      console.error('Failed to log error:', logError)
    }
    
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
```

### Cron для нормализации

Создать файл `apps/web/src/app/api/cron/normalize/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'

function validateCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  const expectedSecret = process.env.CRON_SECRET
  
  if (!expectedSecret) {
    console.error('CRON_SECRET not configured')
    return false
  }
  
  return authHeader === `Bearer ${expectedSecret}`
}

export async function GET(request: NextRequest) {
  if (!validateCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const startTime = Date.now()
    
    // Вызов Edge Function для нормализации
    const response = await fetch(`${process.env.SUPABASE_URL}/functions/v1/normalize-staging`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.INGEST_SECRET}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Normalize function failed: ${response.status}`)
    }

    const result = await response.json()
    const duration = Date.now() - startTime

    return NextResponse.json({
      success: true,
      duration_ms: duration,
      result
    })

  } catch (error) {
    console.error('Cron normalize error:', error)
    
    return NextResponse.json(
      { error: 'Normalize failed', details: error.message },
      { status: 500 }
    )
  }
}
```

### Cron для upsert

Создать файл `apps/web/src/app/api/cron/upsert/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'

function validateCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  const expectedSecret = process.env.CRON_SECRET
  
  if (!expectedSecret) {
    console.error('CRON_SECRET not configured')
    return false
  }
  
  return authHeader === `Bearer ${expectedSecret}`
}

export async function GET(request: NextRequest) {
  if (!validateCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const startTime = Date.now()
    
    // Вызов Edge Function для upsert
    const response = await fetch(`${process.env.SUPABASE_URL}/functions/v1/upsert-core`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.INGEST_SECRET}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Upsert function failed: ${response.status}`)
    }

    const result = await response.json()
    const duration = Date.now() - startTime

    return NextResponse.json({
      success: true,
      duration_ms: duration,
      result
    })

  } catch (error) {
    console.error('Cron upsert error:', error)
    
    return NextResponse.json(
      { error: 'Upsert failed', details: error.message },
      { status: 500 }
    )
  }
}
```

### Конфигурация Vercel

Создать файл `apps/web/vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/refresh",
      "schedule": "0 */6 * * *"
    },
    {
      "path": "/api/cron/normalize",
      "schedule": "*/15 * * * *"
    },
    {
      "path": "/api/cron/upsert",
      "schedule": "*/30 * * * *"
    }
  ],
  "functions": {
    "app/api/cron/**/*.ts": {
      "maxDuration": 300
    }
  }
}
```

### Переменные окружения

Добавить в `.env.local`:

```bash
# Cron секрет для аутентификации
CRON_SECRET=your-cron-secret-here

# URL для внутренних вызовов
VERCEL_URL=https://your-project.vercel.app
```

### Мониторинг и алерты

Создать файл `apps/web/src/app/api/cron/health/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Проверка последних метрик
    const { data: recentMetrics } = await supabase
      .from('ingest_metrics')
      .select('*')
      .eq('source', 'vercel-cron-refresh')
      .order('ts', { ascending: false })
      .limit(1)
      .single()

    // Проверка последних ошибок
    const { data: recentErrors } = await supabase
      .from('ingest_errors')
      .select('*')
      .eq('source', 'vercel-cron-refresh')
      .order('created_at', { ascending: false })
      .limit(5)

    // Проверка свежести данных
    const { data: latestVoyage } = await supabase
      .from('voyages')
      .select('updated_at')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single()

    const dataFreshness = latestVoyage 
      ? Date.now() - new Date(latestVoyage.updated_at).getTime()
      : null

    const isDataFresh = dataFreshness && dataFreshness < 24 * 60 * 60 * 1000 // 24 часа

    return NextResponse.json({
      status: 'healthy',
      last_cron: recentMetrics?.ts,
      recent_errors: recentErrors?.length || 0,
      data_freshness_hours: dataFreshness ? Math.round(dataFreshness / (60 * 60 * 1000)) : null,
      is_data_fresh: isDataFresh
    })

  } catch (error) {
    console.error('Health check error:', error)
    
    return NextResponse.json(
      { status: 'unhealthy', error: error.message },
      { status: 500 }
    )
  }
}
```

## Команды для выполнения

```bash
# Создание API routes
mkdir -p apps/web/src/app/api/cron/refresh
mkdir -p apps/web/src/app/api/cron/normalize
mkdir -p apps/web/src/app/api/cron/upsert
mkdir -p apps/web/src/app/api/cron/health

# Создание файлов
touch apps/web/src/app/api/cron/refresh/route.ts
touch apps/web/src/app/api/cron/normalize/route.ts
touch apps/web/src/app/api/cron/upsert/route.ts
touch apps/web/src/app/api/cron/health/route.ts
touch apps/web/vercel.json

# Генерация cron secret
openssl rand -base64 32
```

## Тестирование

### Тест cron endpoints

```bash
# Тест refresh
curl -X GET "https://your-project.vercel.app/api/cron/refresh" \
  -H "Authorization: Bearer your-cron-secret"

# Тест normalize
curl -X GET "https://your-project.vercel.app/api/cron/normalize" \
  -H "Authorization: Bearer your-cron-secret"

# Тест upsert
curl -X GET "https://your-project.vercel.app/api/cron/upsert" \
  -H "Authorization: Bearer your-cron-secret"

# Тест health
curl -X GET "https://your-project.vercel.app/api/cron/health"
```

### Проверка расписания

```bash
# Проверка cron расписания
# 0 */6 * * * - каждые 6 часов (refresh)
# */15 * * * * - каждые 15 минут (normalize)
# */30 * * * * - каждые 30 минут (upsert)
```

## Зависимости

- **ING-002** - Normalize → stg (должен быть завершён)
- **ING-003** - Upsert core (должен быть завершён)
- **DB-002** - Materialized views + RPC (должен быть завершён)

## Следующие тикеты

- **OBS-001** - Log ingestion
- **OBS-002** - No-data alert

## Примечания

- Использовать разные расписания для разных задач
- Добавить retry логику для критических операций
- Мониторить время выполнения cron jobs
- Настроить алерты при сбоях
- Оптимизировать расписание для минимизации нагрузки
