# ING-001 · Edge: ingest-arrivals

**Статус**: ⏳ Ожидает  
**Milestone**: C  
**Приоритет**: Высокий  
**EPIC**: INGEST - Инжест и нормализация

## Описание

Создание Edge Function для приёма данных о рейсах и контейнерах в форматах JSON и CSV.

## Задачи

- [ ] Создать функцию `ingest-arrivals`
- [ ] Реализовать проверку INGEST_SECRET
- [ ] Добавить поддержку CSV и JSON форматов
- [ ] Реализовать запись в `raw_arrivals`
- [ ] Добавить логирование и метрики
- [ ] Настроить CORS
- [ ] Добавить валидацию входных данных

## Критерии приёмки

- [ ] `curl -H "Authorization: Bearer ..."` возвращает `{ok:true}`
- [ ] Записи появляются в `raw_arrivals`
- [ ] Поддерживаются оба формата данных
- [ ] Ошибки логируются корректно
- [ ] CORS настроен правильно
- [ ] Валидация работает

## Технические детали

### Создание Edge Function

```bash
# Создание функции
supabase functions new ingest-arrivals

# Локальный запуск
supabase functions serve

# Деплой
supabase functions deploy ingest-arrivals
```

### Основной код функции

Создать файл `supabase/functions/ingest-arrivals/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization,content-type',
      }
    })
  }

  // Проверка аутентификации
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${Deno.env.get('INGEST_SECRET')}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'content-type': 'application/json' }
    })
  }

  try {
    const contentType = req.headers.get('content-type') || ''
    const text = await req.text()

    // Создание клиента Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    let data: any[]
    
    if (contentType.includes('application/json')) {
      data = JSON.parse(text)
    } else if (contentType.includes('text/csv')) {
      data = parseCSV(text)
    } else {
      return new Response(JSON.stringify({ error: 'Unsupported content type' }), {
        status: 400,
        headers: { 'content-type': 'application/json' }
      })
    }

    // Валидация данных
    const validationResult = validateData(data)
    if (!validationResult.valid) {
      return new Response(JSON.stringify({ 
        error: 'Validation failed', 
        details: validationResult.errors 
      }), {
        status: 400,
        headers: { 'content-type': 'application/json' }
      })
    }

    // Запись в raw_arrivals
    const { error: rawError } = await supabase
      .from('raw_arrivals')
      .insert({
        source: 'edge-function',
        payload: { data, received_at: new Date().toISOString() }
      })

    if (rawError) throw rawError

    // Обработка данных
    const result = await processData(supabase, data)

    // Запись метрик
    await supabase
      .from('ingest_metrics')
      .insert({
        source: 'edge-function',
        rows_ok: result.processed,
        rows_err: result.errors,
        duration_ms: Date.now() - startTime
      })

    return new Response(JSON.stringify({
      ok: true,
      processed: result.processed,
      errors: result.errors
    }), {
      headers: { 'content-type': 'application/json' }
    })

  } catch (error) {
    console.error('Edge function error:', error)
    
    // Запись ошибки
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      )
      
      await supabase
        .from('ingest_errors')
        .insert({
          source: 'edge-function',
          payload: { error: error.message, stack: error.stack },
          reason: 'Function execution error'
        })
    } catch (logError) {
      console.error('Failed to log error:', logError)
    }

    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'content-type': 'application/json' }
    })
  }
})

function parseCSV(text: string): any[] {
  const lines = text.split('\n').filter(line => line.trim())
  if (lines.length < 2) return []
  
  const headers = lines[0].split(',').map(h => h.trim())
  
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim())
    const obj: any = {}
    headers.forEach((header, index) => {
      obj[header] = values[index] || null
    })
    return obj
  })
}

function validateData(data: any[]): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (!Array.isArray(data)) {
    errors.push('Data must be an array')
    return { valid: false, errors }
  }
  
  data.forEach((item, index) => {
    if (!item.voyage_no) {
      errors.push(`Row ${index + 1}: voyage_no is required`)
    }
    if (!item.line_scac) {
      errors.push(`Row ${index + 1}: line_scac is required`)
    }
    if (!item.terminal_code) {
      errors.push(`Row ${index + 1}: terminal_code is required`)
    }
  })
  
  return { valid: errors.length === 0, errors }
}

async function processData(supabase: any, data: any[]): Promise<{ processed: number; errors: number }> {
  let processed = 0
  let errors = 0

  for (const item of data) {
    try {
      // Нормализация данных
      const normalized = normalizeVoyageData(item)
      
      // Upsert в staging
      const { error: stgError } = await supabase
        .from('stg_voyages')
        .upsert(normalized, { onConflict: 'voyage_no,line_scac,terminal_code' })

      if (stgError) throw stgError
      processed++

    } catch (error) {
      console.error('Processing error:', error)
      errors++
      
      // Запись ошибки
      await supabase
        .from('ingest_errors')
        .insert({
          source: 'edge-function',
          payload: item,
          reason: error.message
        })
    }
  }

  return { processed, errors }
}

function normalizeVoyageData(item: any) {
  return {
    vessel_name: item.vessel_name || item.vessel,
    voyage_no: item.voyage_no || item.voyage,
    line_scac: item.line_scac || item.carrier,
    terminal_code: item.terminal_code || item.terminal,
    eta: item.eta ? new Date(item.eta).toISOString() : null,
    etd: item.etd ? new Date(item.etd).toISOString() : null,
    ata: item.ata ? new Date(item.ata).toISOString() : null,
    atd: item.atd ? new Date(item.atd).toISOString() : null
  }
}
```

### Переменные окружения

Добавить в `supabase/functions/ingest-arrivals/.env`:

```env
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
INGEST_SECRET=your-ingest-secret
```

## Команды для выполнения

```bash
# Создание функции
supabase functions new ingest-arrivals

# Локальный запуск
supabase functions serve

# Тестирование
curl -X POST http://localhost:54321/functions/v1/ingest-arrivals \
  -H "Authorization: Bearer your-ingest-secret" \
  -H "Content-Type: application/json" \
  -d '[
    {
      "vessel_name": "MSC OSCAR",
      "voyage_no": "MSC123E",
      "line_scac": "MSCU",
      "terminal_code": "LAX-T1",
      "eta": "2024-01-15T10:00:00Z"
    }
  ]'

# Деплой
supabase functions deploy ingest-arrivals
```

## Тестирование

### Тест JSON

```bash
curl -X POST https://your-project.supabase.co/functions/v1/ingest-arrivals \
  -H "Authorization: Bearer ${INGEST_SECRET}" \
  -H "Content-Type: application/json" \
  -d @test-data.json
```

### Тест CSV

```bash
curl -X POST https://your-project.supabase.co/functions/v1/ingest-arrivals \
  -H "Authorization: Bearer ${INGEST_SECRET}" \
  -H "Content-Type: text/csv" \
  --data-binary @test-data.csv
```

### Проверка результатов

```sql
-- Проверка raw данных
SELECT * FROM raw_arrivals ORDER BY received_at DESC LIMIT 5;

-- Проверка staging данных
SELECT * FROM stg_voyages ORDER BY id DESC LIMIT 5;

-- Проверка метрик
SELECT * FROM ingest_metrics ORDER BY ts DESC LIMIT 5;

-- Проверка ошибок
SELECT * FROM ingest_errors ORDER BY created_at DESC LIMIT 5;
```

## Зависимости

- **ENV-003** - Supabase setup
- **DB-001** - Core schema

## Следующие тикеты

- **ING-002** - Normalize → stg
- **ING-003** - Upsert core

## Примечания

- Использовать Deno runtime
- Валидировать Authorization header
- Логировать все ошибки
- Использовать service role key для записи в БД
- Настроить CORS для веб-запросов
