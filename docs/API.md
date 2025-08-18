# API документация PortOps MVP

## Обзор

API построено на Next.js 15 с использованием Server Actions и Route Handlers. Основные компоненты:

- **Server Actions**: для мутаций данных (создание заказов, обновление статусов)
- **Route Handlers**: для API endpoints (ingest, cron, webhooks)
- **Supabase Client**: для чтения данных с RLS

## Аутентификация

### Supabase Auth
Используется Supabase Auth с JWT токенами. Организация пользователя определяется через `org_id` в JWT claims.

```typescript
// Пример JWT payload
{
  "sub": "user-uuid",
  "org_id": "org-uuid",
  "role": "user"
}
```

### Ingest API
Для ingest endpoints используется Bearer token аутентификация:

```bash
curl -H "Authorization: Bearer ${INGEST_SECRET}" \
     -H "Content-Type: application/json" \
     -d '{"data": "..."}' \
     https://your-domain.com/api/ingest/arrivals
```

## Server Actions

### Создание заказа

**Файл**: `actions/orders.ts`

```typescript
'use server'

export async function createOrder(formData: FormData) {
  const orderNo = formData.get('orderNo') as string
  const requestedPickupAt = formData.get('requestedPickupAt') as string
  const note = formData.get('note') as string

  // Валидация
  if (!orderNo) {
    throw new Error('Order number is required')
  }

  // Создание заказа
  const { data, error } = await supabase
    .from('orders')
    .insert({
      order_no: orderNo,
      requested_pickup_at: requestedPickupAt,
      note
    })
    .select()
    .single()

  if (error) throw error

  revalidatePath('/orders')
  return data
}
```

### Массовое добавление позиций

```typescript
'use server'

export async function addOrderItems(orderId: string, itemsText: string) {
  // Парсинг текста по строкам
  const lines = itemsText.split('\n').filter(line => line.trim())
  
  const items = lines.map(line => {
    const [cntrNo, bol, serviceType] = line.split(',').map(s => s.trim())
    return {
      order_id: orderId,
      cntr_no: cntrNo,
      bill_of_lading: bol,
      service_type: serviceType || 'pickup'
    }
  })

  // Вставка в транзакции
  const { data, error } = await supabase
    .from('order_items')
    .insert(items)
    .select()

  if (error) throw error

  revalidatePath(`/orders/${orderId}`)
  return data
}
```

## Route Handlers

### Ingest API

**Файл**: `app/api/ingest/arrivals/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  // Проверка аутентификации
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.INGEST_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const contentType = request.headers.get('content-type') || ''
    const body = await request.text()

    let data: any[]
    
    if (contentType.includes('application/json')) {
      data = JSON.parse(body)
    } else if (contentType.includes('text/csv')) {
      data = parseCSV(body)
    } else {
      return NextResponse.json({ error: 'Unsupported content type' }, { status: 400 })
    }

    // Запись в raw_arrivals
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { error: rawError } = await supabase
      .from('raw_arrivals')
      .insert({
        source: 'api',
        payload: { data, received_at: new Date().toISOString() }
      })

    if (rawError) throw rawError

    // Нормализация и upsert
    const result = await processArrivalsData(data)

    return NextResponse.json({
      ok: true,
      processed: result.processed,
      errors: result.errors
    })

  } catch (error) {
    console.error('Ingest error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

### Cron API

**Файл**: `app/api/cron/refresh/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  // Проверка Vercel Cron
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Обновление материализованных представлений
    const { error: mv1Error } = await supabase.rpc('refresh_mv_upcoming')
    if (mv1Error) throw mv1Error

    const { error: mv2Error } = await supabase.rpc('refresh_mv_dwell')
    if (mv2Error) throw mv2Error

    return NextResponse.json({
      ok: true,
      refreshed_at: new Date().toISOString()
    })

  } catch (error) {
    console.error('Cron error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

## Supabase Client

### Browser Client

**Файл**: `lib/supabase/browser.ts`

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### Server Client

**Файл**: `lib/supabase/server.ts`

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}
```

## Edge Functions

### Ingest Function

**Файл**: `supabase/functions/ingest-arrivals/index.ts`

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

    return new Response(JSON.stringify({
      ok: true,
      processed: result.processed,
      errors: result.errors
    }), {
      headers: { 'content-type': 'application/json' }
    })

  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'content-type': 'application/json' }
    })
  }
})

function parseCSV(text: string): any[] {
  const lines = text.split('\n').filter(line => line.trim())
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

async function processData(supabase: any, data: any[]) {
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

## Форматы данных

### JSON формат для рейсов

```json
[
  {
    "vessel_name": "MSC OSCAR",
    "voyage_no": "MSC123E",
    "line_scac": "MSCU",
    "terminal_code": "LAX-T1",
    "eta": "2024-01-15T10:00:00Z",
    "etd": "2024-01-16T18:00:00Z",
    "containers": [
      {
        "cntr_no": "MSCU1234567",
        "iso_type": "45G1",
        "bill_of_lading": "MSC123456789"
      }
    ]
  }
]
```

### CSV формат для рейсов

```csv
vessel_name,voyage_no,line_scac,terminal_code,eta,etd
MSC OSCAR,MSC123E,MSCU,LAX-T1,2024-01-15T10:00:00Z,2024-01-16T18:00:00Z
MAERSK SEALAND,MAE456W,MAEU,LGB-T2,2024-01-16T14:00:00Z,2024-01-17T22:00:00Z
```

### JSON формат для контейнеров

```json
[
  {
    "cntr_no": "MSCU1234567",
    "iso_type": "45G1",
    "voyage_no": "MSC123E",
    "line_scac": "MSCU",
    "terminal_code": "LAX-T1",
    "bill_of_lading": "MSC123456789",
    "last_known_status": "discharged",
    "last_status_time": "2024-01-15T12:00:00Z"
  }
]
```

## Обработка ошибок

### Стандартные HTTP коды

- `200` - Успешная операция
- `400` - Неверный запрос (валидация)
- `401` - Не авторизован
- `403` - Доступ запрещён (RLS)
- `404` - Ресурс не найден
- `500` - Внутренняя ошибка сервера

### Формат ошибок

```json
{
  "error": "Описание ошибки",
  "details": "Дополнительные детали",
  "code": "ERROR_CODE"
}
```

## Мониторинг

### Логирование

Все API endpoints логируют:
- Время выполнения
- Количество обработанных записей
- Ошибки с контекстом

### Метрики

Метрики записываются в таблицу `ingest_metrics`:
- `source` - источник данных
- `rows_ok` - успешно обработанные строки
- `rows_err` - строки с ошибками
- `duration_ms` - время выполнения в миллисекундах

### Алерты

Простая проверка свежести данных:
- Badge в UI при отсутствии данных > N часов
- Логирование в случае проблем с ingest

## Безопасность

### RLS (Row Level Security)

Все запросы к таблицам `orders` и `order_items` защищены RLS:
- Пользователи видят только данные своей организации
- Автоматическая фильтрация по `org_id` из JWT

### Валидация входных данных

- Проверка типов данных
- Санитизация строк
- Валидация бизнес-правил

### Rate Limiting

Для production рекомендуется добавить rate limiting:
- По IP адресу
- По пользователю
- По организации
