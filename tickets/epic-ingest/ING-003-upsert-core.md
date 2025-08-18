# ING-003 · Upsert core

**Статус**: ⏳ Ожидает  
**Milestone**: C  
**Приоритет**: Высокий  
**EPIC**: INGEST - Инжест и нормализация

## Описание

Обновление core таблиц из staging с идемпотентными upsert операциями и созданием событий.

## Задачи

- [ ] Реализовать upsert в `voyages` (по ключу voyage_no + line_id + terminal_id)
- [ ] Реализовать upsert в `containers` (по cntr_no)
- [ ] Создать события при необходимости
- [ ] Обеспечить связь контейнеров с рейсами
- [ ] Добавить обработку ошибок
- [ ] Реализовать транзакционность

## Критерии приёмки

- [ ] Контейнеры привязаны к рейсам
- [ ] Индексы задействуются эффективно
- [ ] Нет потери данных при обновлениях
- [ ] События создаются корректно
- [ ] Транзакции работают атомарно

## Технические детали

### Edge Function для upsert

Создать файл `supabase/functions/upsert-core/index.ts`:

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

    const startTime = Date.now()
    let processedVoyages = 0
    let processedContainers = 0
    let errors = 0

    // Получение данных из staging
    const { data: stgVoyages, error: voyagesError } = await supabase
      .from('stg_voyages')
      .select('*')
      .order('id')

    if (voyagesError) throw voyagesError

    const { data: stgContainers, error: containersError } = await supabase
      .from('stg_containers')
      .select('*')
      .order('id')

    if (containersError) throw containersError

    // Обработка рейсов
    if (stgVoyages && stgVoyages.length > 0) {
      for (const stgVoyage of stgVoyages) {
        try {
          await processVoyage(supabase, stgVoyage)
          processedVoyages++
        } catch (error) {
          console.error('Error processing voyage:', error)
          errors++
          
          await supabase
            .from('ingest_errors')
            .insert({
              source: 'upsert-core',
              payload: stgVoyage,
              reason: error.message
            })
        }
      }
    }

    // Обработка контейнеров
    if (stgContainers && stgContainers.length > 0) {
      for (const stgContainer of stgContainers) {
        try {
          await processContainer(supabase, stgContainer)
          processedContainers++
        } catch (error) {
          console.error('Error processing container:', error)
          errors++
          
          await supabase
            .from('ingest_errors')
            .insert({
              source: 'upsert-core',
              payload: stgContainer,
              reason: error.message
            })
        }
      }
    }

    // Запись метрик
    await supabase
      .from('ingest_metrics')
      .insert({
        source: 'upsert-core',
        rows_ok: processedVoyages + processedContainers,
        rows_err: errors,
        duration_ms: Date.now() - startTime
      })

    return new Response(JSON.stringify({
      ok: true,
      processed_voyages: processedVoyages,
      processed_containers: processedContainers,
      errors,
      duration_ms: Date.now() - startTime
    }), {
      headers: { 'content-type': 'application/json' }
    })

  } catch (error) {
    console.error('Upsert core function error:', error)
    
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'content-type': 'application/json' }
    })
  }
})

async function processVoyage(supabase: any, stgVoyage: any) {
  // Получение ID линии и терминала
  const lineId = await getShippingLineId(supabase, stgVoyage.line_scac)
  const terminalId = await getTerminalId(supabase, stgVoyage.terminal_code)

  if (!lineId || !terminalId) {
    throw new Error(`Line or terminal not found: ${stgVoyage.line_scac}/${stgVoyage.terminal_code}`)
  }

  // Upsert в voyages
  const { data: voyage, error } = await supabase
    .from('voyages')
    .upsert({
      vessel_name: stgVoyage.vessel_name,
      voyage_no: stgVoyage.voyage_no,
      line_id: lineId,
      terminal_id: terminalId,
      eta: stgVoyage.eta,
      etd: stgVoyage.etd,
      ata: stgVoyage.ata,
      atd: stgVoyage.atd,
      status: determineVoyageStatus(stgVoyage)
    }, {
      onConflict: 'voyage_no,line_id,terminal_id',
      ignoreDuplicates: false
    })
    .select()
    .single()

  if (error) throw error

  return voyage
}

async function processContainer(supabase: any, stgContainer: any) {
  // Получение ID рейса
  const voyageId = await getVoyageId(supabase, stgContainer.voyage_no, stgContainer.line_scac, stgContainer.terminal_code)

  // Upsert в containers
  const { data: container, error } = await supabase
    .from('containers')
    .upsert({
      cntr_no: stgContainer.cntr_no,
      iso_type: stgContainer.iso_type,
      voyage_id: voyageId,
      bill_of_lading: stgContainer.bill_of_lading,
      last_known_status: stgContainer.last_known_status,
      last_status_time: stgContainer.last_status_time
    }, {
      onConflict: 'cntr_no',
      ignoreDuplicates: false
    })
    .select()
    .single()

  if (error) throw error

  // Создание события, если статус изменился
  await createContainerEventIfNeeded(supabase, container, stgContainer)

  return container
}

async function getShippingLineId(supabase: any, scac: string): Promise<string | null> {
  const { data } = await supabase
    .from('shipping_lines')
    .select('id')
    .eq('scac', scac)
    .single()

  return data?.id || null
}

async function getTerminalId(supabase: any, code: string): Promise<string | null> {
  const { data } = await supabase
    .from('terminals')
    .select('id')
    .eq('code', code)
    .single()

  return data?.id || null
}

async function getVoyageId(supabase: any, voyageNo: string, lineScac: string, terminalCode: string): Promise<string | null> {
  const lineId = await getShippingLineId(supabase, lineScac)
  const terminalId = await getTerminalId(supabase, terminalCode)

  if (!lineId || !terminalId) return null

  const { data } = await supabase
    .from('voyages')
    .select('id')
    .eq('voyage_no', voyageNo)
    .eq('line_id', lineId)
    .eq('terminal_id', terminalId)
    .single()

  return data?.id || null
}

function determineVoyageStatus(stgVoyage: any): string {
  if (stgVoyage.atd) return 'departed'
  if (stgVoyage.ata) return 'arrived'
  if (stgVoyage.eta) return 'scheduled'
  return 'scheduled'
}

async function createContainerEventIfNeeded(supabase: any, container: any, stgContainer: any) {
  // Проверяем, есть ли уже событие с таким статусом и временем
  const { data: existingEvent } = await supabase
    .from('container_events')
    .select('id')
    .eq('container_id', container.id)
    .eq('event_type', stgContainer.last_known_status)
    .eq('event_time', stgContainer.last_status_time)
    .single()

  if (!existingEvent && stgContainer.last_status_time) {
    // Создаем новое событие
    await supabase
      .from('container_events')
      .insert({
        container_id: container.id,
        event_type: stgContainer.last_known_status,
        event_time: stgContainer.last_status_time,
        payload: {
          source: 'staging-upsert',
          original_data: stgContainer
        }
      })
  }
}
```

### SQL функции для upsert

```sql
-- Функция для upsert рейсов
CREATE OR REPLACE FUNCTION upsert_voyage_from_staging()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  stg_record RECORD;
  line_id UUID;
  terminal_id UUID;
BEGIN
  -- Обработка всех записей из staging
  FOR stg_record IN 
    SELECT * FROM stg_voyages 
    ORDER BY id
  LOOP
    -- Получение ID линии
    SELECT id INTO line_id 
    FROM shipping_lines 
    WHERE scac = stg_record.line_scac;
    
    -- Получение ID терминала
    SELECT id INTO terminal_id 
    FROM terminals 
    WHERE code = stg_record.terminal_code;
    
    -- Upsert в voyages
    INSERT INTO voyages (
      vessel_name, voyage_no, line_id, terminal_id,
      eta, etd, ata, atd, status
    ) VALUES (
      stg_record.vessel_name, stg_record.voyage_no, line_id, terminal_id,
      stg_record.eta, stg_record.etd, stg_record.ata, stg_record.atd,
      CASE 
        WHEN stg_record.atd IS NOT NULL THEN 'departed'
        WHEN stg_record.ata IS NOT NULL THEN 'arrived'
        ELSE 'scheduled'
      END
    )
    ON CONFLICT (voyage_no, line_id, terminal_id) 
    DO UPDATE SET
      vessel_name = EXCLUDED.vessel_name,
      eta = EXCLUDED.eta,
      etd = EXCLUDED.etd,
      ata = EXCLUDED.ata,
      atd = EXCLUDED.atd,
      status = EXCLUDED.status;
  END LOOP;
END;
$$;

-- Функция для upsert контейнеров
CREATE OR REPLACE FUNCTION upsert_container_from_staging()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  stg_record RECORD;
  voyage_id UUID;
  container_id UUID;
BEGIN
  -- Обработка всех записей из staging
  FOR stg_record IN 
    SELECT * FROM stg_containers 
    ORDER BY id
  LOOP
    -- Получение ID рейса
    SELECT v.id INTO voyage_id
    FROM voyages v
    JOIN shipping_lines sl ON v.line_id = sl.id
    JOIN terminals t ON v.terminal_id = t.id
    WHERE v.voyage_no = stg_record.voyage_no
      AND sl.scac = stg_record.line_scac
      AND t.code = stg_record.terminal_code;
    
    -- Upsert в containers
    INSERT INTO containers (
      cntr_no, iso_type, voyage_id, bill_of_lading,
      last_known_status, last_status_time
    ) VALUES (
      stg_record.cntr_no, stg_record.iso_type, voyage_id, stg_record.bill_of_lading,
      stg_record.last_known_status, stg_record.last_status_time
    )
    ON CONFLICT (cntr_no) 
    DO UPDATE SET
      iso_type = EXCLUDED.iso_type,
      voyage_id = EXCLUDED.voyage_id,
      bill_of_lading = EXCLUDED.bill_of_lading,
      last_known_status = EXCLUDED.last_known_status,
      last_status_time = EXCLUDED.last_status_time
    RETURNING id INTO container_id;
    
    -- Создание события, если статус изменился
    IF stg_record.last_status_time IS NOT NULL THEN
      INSERT INTO container_events (
        container_id, event_type, event_time, payload
      ) VALUES (
        container_id, stg_record.last_known_status, stg_record.last_status_time,
        jsonb_build_object('source', 'staging-upsert', 'original_data', to_jsonb(stg_record))
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END;
$$;

-- Функция для полного upsert
CREATE OR REPLACE FUNCTION upsert_all_from_staging()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Начинаем транзакцию
  BEGIN
    -- Upsert рейсов
    PERFORM upsert_voyage_from_staging();
    
    -- Upsert контейнеров
    PERFORM upsert_container_from_staging();
    
    -- Обновляем материализованные представления
    PERFORM refresh_all_mv();
    
    -- Логируем успешное выполнение
    INSERT INTO ingest_metrics (source, rows_ok, rows_err, duration_ms)
    VALUES ('sql-upsert', 0, 0, 0);
    
  EXCEPTION WHEN OTHERS THEN
    -- Логируем ошибку
    INSERT INTO ingest_errors (source, payload, reason)
    VALUES ('sql-upsert', jsonb_build_object('error', SQLERRM), SQLERRM);
    
    RAISE;
  END;
END;
$$;
```

### Триггеры для автоматического обновления

```sql
-- Триггер для автоматического создания событий при изменении статуса контейнера
CREATE OR REPLACE FUNCTION trigger_container_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Если статус изменился и есть время последнего статуса
  IF OLD.last_known_status IS DISTINCT FROM NEW.last_known_status 
     AND NEW.last_status_time IS NOT NULL THEN
    
    INSERT INTO container_events (
      container_id, event_type, event_time, payload
    ) VALUES (
      NEW.id, NEW.last_known_status, NEW.last_status_time,
      jsonb_build_object(
        'source', 'status-change',
        'old_status', OLD.last_known_status,
        'new_status', NEW.last_known_status
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER container_status_change_trigger
  AFTER UPDATE ON containers
  FOR EACH ROW
  EXECUTE FUNCTION trigger_container_status_change();
```

## Команды для выполнения

```bash
# Создание функции
supabase functions new upsert-core

# Локальный запуск
supabase functions serve

# Тестирование
curl -X POST http://localhost:54321/functions/v1/upsert-core \
  -H "Authorization: Bearer your-ingest-secret"

# Деплой
supabase functions deploy upsert-core
```

## Тестирование

### Тест upsert операций

```sql
-- Проверка данных в staging
SELECT count(*) FROM stg_voyages;
SELECT count(*) FROM stg_containers;

-- Запуск upsert
SELECT upsert_all_from_staging();

-- Проверка результатов
SELECT count(*) FROM voyages;
SELECT count(*) FROM containers;
SELECT count(*) FROM container_events;

-- Проверка связей
SELECT v.voyage_no, count(c.id) as containers_count
FROM voyages v
LEFT JOIN containers c ON v.id = c.voyage_id
GROUP BY v.id, v.voyage_no
ORDER BY containers_count DESC;
```

## Зависимости

- **ING-002** - Normalize → stg (должен быть завершён)
- **DB-001** - Core schema (должен быть завершён)

## Следующие тикеты

- **ING-004** - Metrics & errors
- **CRON-001** - Vercel Cron → refresh (зависит от этого тикета)

## Примечания

- Использовать foreign keys для связей
- Обеспечить атомарность операций через транзакции
- Логировать все изменения для аудита
- Оптимизировать запросы с индексами
- Добавить обработку конфликтов данных
