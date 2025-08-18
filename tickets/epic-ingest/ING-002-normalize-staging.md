# ING-002 · Normalize → stg

**Статус**: ⏳ Ожидает  
**Milestone**: C  
**Приоритет**: Высокий  
**EPIC**: INGEST - Инжест и нормализация

## Описание

Нормализация данных из raw_arrivals в staging таблицы с маппингом кодов и валидацией.

## Задачи

- [ ] Реализовать парсинг CSV/JSON из raw_arrivals
- [ ] Добавить маппинг кодов (UTC, scac, terminal_code)
- [ ] Реализовать upsert в `stg_voyages`, `stg_containers`
- [ ] Обеспечить идемпотентность операций
- [ ] Добавить валидацию данных
- [ ] Реализовать обработку ошибок

## Критерии приёмки

- [ ] Повторный запуск не создаёт дубликаты
- [ ] Данные нормализуются корректно
- [ ] Уникальные ключи работают правильно
- [ ] Маппинг кодов функционирует
- [ ] Ошибки логируются и обрабатываются

## Технические детали

### Функция нормализации

Создать файл `supabase/functions/normalize-staging/index.ts`:

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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Получение необработанных записей из raw_arrivals
    const { data: rawRecords, error: rawError } = await supabase
      .from('raw_arrivals')
      .select('*')
      .is('processed_at', null)
      .order('received_at', { ascending: true })
      .limit(100)

    if (rawError) throw rawError

    if (!rawRecords || rawRecords.length === 0) {
      return new Response(JSON.stringify({ 
        ok: true, 
        processed: 0, 
        message: 'No new records to process' 
      }), {
        headers: { 'content-type': 'application/json' }
      })
    }

    let processed = 0
    let errors = 0

    for (const rawRecord of rawRecords) {
      try {
        const payload = rawRecord.payload
        
        if (payload.data && Array.isArray(payload.data)) {
          // Обработка массива данных
          for (const item of payload.data) {
            const result = await processVoyageData(supabase, item, rawRecord.source)
            if (result.success) processed++
            else errors++
          }
        } else {
          // Обработка одиночной записи
          const result = await processVoyageData(supabase, payload, rawRecord.source)
          if (result.success) processed++
          else errors++
        }

        // Отметить запись как обработанную
        await supabase
          .from('raw_arrivals')
          .update({ processed_at: new Date().toISOString() })
          .eq('id', rawRecord.id)

      } catch (error) {
        console.error('Error processing raw record:', error)
        errors++
        
        // Записать ошибку
        await supabase
          .from('ingest_errors')
          .insert({
            source: 'normalize-staging',
            payload: rawRecord,
            reason: error.message
          })
      }
    }

    return new Response(JSON.stringify({
      ok: true,
      processed,
      errors,
      total: rawRecords.length
    }), {
      headers: { 'content-type': 'application/json' }
    })

  } catch (error) {
    console.error('Normalize function error:', error)
    
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'content-type': 'application/json' }
    })
  }
})

async function processVoyageData(supabase: any, item: any, source: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Нормализация данных
    const normalized = normalizeVoyageData(item)
    
    // Валидация
    const validation = validateVoyageData(normalized)
    if (!validation.valid) {
      return { success: false, error: validation.errors.join(', ') }
    }

    // Upsert в staging
    const { error: upsertError } = await supabase
      .from('stg_voyages')
      .upsert(normalized, { 
        onConflict: 'voyage_no,line_scac,terminal_code',
        ignoreDuplicates: false
      })

    if (upsertError) throw upsertError

    // Обработка контейнеров, если есть
    if (item.containers && Array.isArray(item.containers)) {
      for (const container of item.containers) {
        await processContainerData(supabase, container, normalized.voyage_no, normalized.line_scac, normalized.terminal_code)
      }
    }

    return { success: true }

  } catch (error) {
    console.error('Error processing voyage data:', error)
    return { success: false, error: error.message }
  }
}

async function processContainerData(supabase: any, container: any, voyageNo: string, lineScac: string, terminalCode: string): Promise<void> {
  try {
    const normalized = normalizeContainerData(container, voyageNo, lineScac, terminalCode)
    
    const { error: upsertError } = await supabase
      .from('stg_containers')
      .upsert(normalized, { 
        onConflict: 'cntr_no,voyage_no,line_scac,terminal_code',
        ignoreDuplicates: false
      })

    if (upsertError) throw upsertError

  } catch (error) {
    console.error('Error processing container data:', error)
    // Логируем ошибку, но не прерываем обработку
  }
}

function normalizeVoyageData(item: any) {
  return {
    vessel_name: item.vessel_name || item.vessel || item.vesselName,
    voyage_no: item.voyage_no || item.voyage || item.voyageNo,
    line_scac: item.line_scac || item.carrier || item.lineScac,
    terminal_code: item.terminal_code || item.terminal || item.terminalCode,
    eta: normalizeDateTime(item.eta),
    etd: normalizeDateTime(item.etd),
    ata: normalizeDateTime(item.ata),
    atd: normalizeDateTime(item.atd)
  }
}

function normalizeContainerData(container: any, voyageNo: string, lineScac: string, terminalCode: string) {
  return {
    cntr_no: container.cntr_no || container.container_no || container.cntrNo,
    iso_type: container.iso_type || container.isoType || '45G1',
    voyage_no: voyageNo,
    line_scac: lineScac,
    terminal_code: terminalCode,
    bill_of_lading: container.bill_of_lading || container.bol || container.billOfLading,
    last_known_status: normalizeStatus(container.last_known_status || container.status),
    last_status_time: normalizeDateTime(container.last_status_time || container.statusTime)
  }
}

function normalizeDateTime(dateTime: any): string | null {
  if (!dateTime) return null
  
  try {
    const date = new Date(dateTime)
    if (isNaN(date.getTime())) return null
    return date.toISOString()
  } catch {
    return null
  }
}

function normalizeStatus(status: any): string {
  if (!status) return 'in_transit'
  
  const statusMap: Record<string, string> = {
    'in_transit': 'in_transit',
    'discharged': 'discharged',
    'available': 'available',
    'picked_up': 'picked_up',
    'hold': 'hold',
    'intransit': 'in_transit',
    'available_for_pickup': 'available',
    'pickedup': 'picked_up'
  }
  
  return statusMap[status.toLowerCase()] || 'in_transit'
}

function validateVoyageData(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (!data.voyage_no) {
    errors.push('voyage_no is required')
  }
  
  if (!data.line_scac) {
    errors.push('line_scac is required')
  }
  
  if (!data.terminal_code) {
    errors.push('terminal_code is required')
  }
  
  if (data.voyage_no && data.voyage_no.length > 50) {
    errors.push('voyage_no too long')
  }
  
  if (data.line_scac && data.line_scac.length > 10) {
    errors.push('line_scac too long')
  }
  
  return { valid: errors.length === 0, errors }
}
```

### SQL для создания таблицы processed_at

```sql
-- Добавить колонку processed_at в raw_arrivals
ALTER TABLE raw_arrivals 
ADD COLUMN IF NOT EXISTS processed_at timestamptz;

-- Создать индекс для быстрого поиска необработанных записей
CREATE INDEX IF NOT EXISTS idx_raw_arrivals_processed 
ON raw_arrivals (processed_at) 
WHERE processed_at IS NULL;
```

### Функция для ручного запуска нормализации

```sql
-- Функция для ручного запуска нормализации
CREATE OR REPLACE FUNCTION trigger_normalize_staging()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Здесь можно добавить логику для вызова Edge Function
  -- Пока просто логируем
  INSERT INTO ingest_metrics (source, rows_ok, rows_err, duration_ms)
  VALUES ('manual-normalize', 0, 0, 0);
END;
$$;
```

## Команды для выполнения

```bash
# Создание функции
supabase functions new normalize-staging

# Локальный запуск
supabase functions serve

# Тестирование
curl -X POST http://localhost:54321/functions/v1/normalize-staging \
  -H "Authorization: Bearer your-ingest-secret"

# Деплой
supabase functions deploy normalize-staging
```

## Тестирование

### Тест с данными

```bash
# Сначала добавить данные через ingest-arrivals
curl -X POST https://your-project.supabase.co/functions/v1/ingest-arrivals \
  -H "Authorization: Bearer ${INGEST_SECRET}" \
  -H "Content-Type: application/json" \
  -d '[
    {
      "vessel_name": "TEST VESSEL",
      "voyage_no": "TEST123E",
      "line_scac": "TEST",
      "terminal_code": "LAX-T1",
      "eta": "2024-01-15T10:00:00Z"
    }
  ]'

# Затем запустить нормализацию
curl -X POST https://your-project.supabase.co/functions/v1/normalize-staging \
  -H "Authorization: Bearer ${INGEST_SECRET}"
```

### Проверка результатов

```sql
-- Проверка raw данных
SELECT * FROM raw_arrivals ORDER BY received_at DESC LIMIT 5;

-- Проверка staging данных
SELECT * FROM stg_voyages ORDER BY id DESC LIMIT 5;
SELECT * FROM stg_containers ORDER BY id DESC LIMIT 5;

-- Проверка метрик
SELECT * FROM ingest_metrics WHERE source = 'normalize-staging' ORDER BY ts DESC LIMIT 5;

-- Проверка ошибок
SELECT * FROM ingest_errors WHERE source = 'normalize-staging' ORDER BY created_at DESC LIMIT 5;
```

## Зависимости

- **ING-001** - Edge function (должен быть завершён)
- **DB-001** - Core schema (должен быть завершён)

## Следующие тикеты

- **ING-003** - Upsert core
- **ING-004** - Metrics & errors

## Примечания

- Использовать `ON CONFLICT` для upsert операций
- Обрабатывать различные форматы данных
- Логировать все ошибки для отладки
- Обеспечить идемпотентность операций
- Добавить валидацию на уровне данных
