# Документация по инжесту данных PortOps MVP

## Обзор

Система инжеста данных PortOps MVP поддерживает приём данных о рейсах и контейнерах в форматах JSON и CSV. Данные проходят через pipeline: Raw → Staging → Core с нормализацией и валидацией.

## Endpoints

### Edge Function (рекомендуется)

**URL**: `https://your-project.supabase.co/functions/v1/ingest-arrivals`

**Метод**: `POST`

**Аутентификация**: Bearer token

```bash
curl -X POST https://your-project.supabase.co/functions/v1/ingest-arrivals \
  -H "Authorization: Bearer ${INGEST_SECRET}" \
  -H "Content-Type: application/json" \
  -d @data.json
```

### API Route (альтернатива)

**URL**: `https://your-domain.com/api/ingest/arrivals`

**Метод**: `POST`

**Аутентификация**: Bearer token

```bash
curl -X POST https://your-domain.com/api/ingest/arrivals \
  -H "Authorization: Bearer ${INGEST_SECRET}" \
  -H "Content-Type: application/json" \
  -d @data.json
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
    "ata": "2024-01-15T10:30:00Z",
    "atd": null,
    "status": "arrived",
    "containers": [
      {
        "cntr_no": "MSCU1234567",
        "iso_type": "45G1",
        "bill_of_lading": "MSC123456789",
        "last_known_status": "discharged",
        "last_status_time": "2024-01-15T12:00:00Z"
      }
    ]
  }
]
```

### CSV формат для рейсов

```csv
vessel_name,voyage_no,line_scac,terminal_code,eta,etd,ata,atd,status
MSC OSCAR,MSC123E,MSCU,LAX-T1,2024-01-15T10:00:00Z,2024-01-16T18:00:00Z,2024-01-15T10:30:00Z,,arrived
MAERSK SEALAND,MAE456W,MAEU,LGB-T2,2024-01-16T14:00:00Z,2024-01-17T22:00:00Z,,,scheduled
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

### CSV формат для контейнеров

```csv
cntr_no,iso_type,voyage_no,line_scac,terminal_code,bill_of_lading,last_known_status,last_status_time
MSCU1234567,45G1,MSC123E,MSCU,LAX-T1,MSC123456789,discharged,2024-01-15T12:00:00Z
MAEU7890123,40HC,MAE456W,MAEU,LGB-T2,MAE789012345,in_transit,2024-01-16T14:00:00Z
```

## Поля и их описание

### Поля рейса

| Поле | Тип | Обязательное | Описание |
|------|-----|--------------|----------|
| `vessel_name` | string | Нет | Название судна |
| `voyage_no` | string | **Да** | Номер рейса |
| `line_scac` | string | **Да** | SCAC код судоходной линии |
| `terminal_code` | string | **Да** | Код терминала |
| `eta` | ISO 8601 | Нет | Estimated Time of Arrival |
| `etd` | ISO 8601 | Нет | Estimated Time of Departure |
| `ata` | ISO 8601 | Нет | Actual Time of Arrival |
| `atd` | ISO 8601 | Нет | Actual Time of Departure |
| `status` | enum | Нет | `scheduled`, `arrived`, `departed`, `canceled` |

### Поля контейнера

| Поле | Тип | Обязательное | Описание |
|------|-----|--------------|----------|
| `cntr_no` | string | **Да** | Номер контейнера |
| `iso_type` | string | Нет | ISO тип контейнера |
| `voyage_no` | string | **Да** | Номер рейса |
| `line_scac` | string | **Да** | SCAC код судоходной линии |
| `terminal_code` | string | **Да** | Код терминала |
| `bill_of_lading` | string | Нет | Номер BOL |
| `last_known_status` | enum | Нет | `in_transit`, `discharged`, `available`, `picked_up`, `hold` |
| `last_status_time` | ISO 8601 | Нет | Время последнего статуса |

## Валидация данных

### Обязательные поля

- `voyage_no` - должен быть непустой строкой
- `line_scac` - должен соответствовать записи в `shipping_lines`
- `terminal_code` - должен соответствовать записи в `terminals`
- `cntr_no` - должен быть непустой строкой (для контейнеров)

### Валидация дат

- Все даты должны быть в формате ISO 8601
- `eta` и `etd` должны быть в будущем или настоящем
- `ata` и `atd` должны быть в прошлом или настоящем
- `last_status_time` должна быть в прошлом или настоящем

### Валидация статусов

- `status` рейса: `scheduled`, `arrived`, `departed`, `canceled`
- `last_known_status` контейнера: `in_transit`, `discharged`, `available`, `picked_up`, `hold`

## Обработка ошибок

### HTTP коды ответов

- `200` - Успешная обработка
- `400` - Неверный формат данных или валидация
- `401` - Неверный токен аутентификации
- `500` - Внутренняя ошибка сервера

### Формат ответа

```json
{
  "ok": true,
  "processed": 10,
  "errors": 2,
  "details": {
    "voyages": {
      "inserted": 5,
      "updated": 3
    },
    "containers": {
      "inserted": 8,
      "updated": 2
    }
  }
}
```

### Обработка ошибок

```json
{
  "ok": false,
  "error": "Validation failed",
  "details": [
    {
      "row": 3,
      "field": "voyage_no",
      "message": "Voyage number is required"
    },
    {
      "row": 5,
      "field": "line_scac",
      "message": "Unknown shipping line: INVALID"
    }
  ]
}
```

## Dry-run режим

Для тестирования данных без записи в базу используйте параметр `dry_run=true`:

```bash
curl -X POST https://your-project.supabase.co/functions/v1/ingest-arrivals \
  -H "Authorization: Bearer ${INGEST_SECRET}" \
  -H "Content-Type: application/json" \
  -d '{"dry_run": true, "data": [...]}'
```

Ответ в dry-run режиме:

```json
{
  "ok": true,
  "dry_run": true,
  "processed": 10,
  "errors": 0,
  "validation_passed": true
}
```

## Примеры использования

### Python

```python
import requests
import json

# Данные для отправки
data = [
    {
        "vessel_name": "MSC OSCAR",
        "voyage_no": "MSC123E",
        "line_scac": "MSCU",
        "terminal_code": "LAX-T1",
        "eta": "2024-01-15T10:00:00Z",
        "etd": "2024-01-16T18:00:00Z"
    }
]

# Отправка данных
response = requests.post(
    "https://your-project.supabase.co/functions/v1/ingest-arrivals",
    headers={
        "Authorization": f"Bearer {INGEST_SECRET}",
        "Content-Type": "application/json"
    },
    json=data
)

if response.status_code == 200:
    result = response.json()
    print(f"Обработано: {result['processed']}, ошибок: {result['errors']}")
else:
    print(f"Ошибка: {response.status_code} - {response.text}")
```

### Node.js

```javascript
const fetch = require('node-fetch');

const data = [
    {
        vessel_name: "MSC OSCAR",
        voyage_no: "MSC123E",
        line_scac: "MSCU",
        terminal_code: "LAX-T1",
        eta: "2024-01-15T10:00:00Z",
        etd: "2024-01-16T18:00:00Z"
    }
];

async function ingestData() {
    try {
        const response = await fetch(
            'https://your-project.supabase.co/functions/v1/ingest-arrivals',
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.INGEST_SECRET}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            }
        );

        const result = await response.json();
        
        if (response.ok) {
            console.log(`Обработано: ${result.processed}, ошибок: ${result.errors}`);
        } else {
            console.error(`Ошибка: ${response.status} - ${result.error}`);
        }
    } catch (error) {
        console.error('Ошибка сети:', error);
    }
}

ingestData();
```

### Bash с CSV

```bash
#!/bin/bash

# Создание CSV файла
cat > voyages.csv << EOF
vessel_name,voyage_no,line_scac,terminal_code,eta,etd
MSC OSCAR,MSC123E,MSCU,LAX-T1,2024-01-15T10:00:00Z,2024-01-16T18:00:00Z
MAERSK SEALAND,MAE456W,MAEU,LGB-T2,2024-01-16T14:00:00Z,2024-01-17T22:00:00Z
EOF

# Отправка CSV
curl -X POST https://your-project.supabase.co/functions/v1/ingest-arrivals \
  -H "Authorization: Bearer ${INGEST_SECRET}" \
  -H "Content-Type: text/csv" \
  --data-binary @voyages.csv
```

## Мониторинг и метрики

### Проверка метрик

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
LIMIT 10;

-- Статистика по источникам за последние 24 часа
SELECT 
  source,
  COUNT(*) as ingest_count,
  SUM(rows_ok) as total_ok,
  SUM(rows_err) as total_err,
  AVG(duration_ms) as avg_duration
FROM ingest_metrics 
WHERE ts >= NOW() - INTERVAL '24 hours'
GROUP BY source;
```

### Проверка ошибок

```sql
-- Последние ошибки
SELECT 
  source,
  reason,
  created_at,
  LEFT(payload::text, 200) as payload_preview
FROM ingest_errors 
ORDER BY created_at DESC 
LIMIT 10;
```

## Лучшие практики

### Производительность

1. **Размер батча**: Отправляйте данные батчами по 100-1000 записей
2. **Сжатие**: Используйте gzip для больших файлов
3. **Параллелизм**: Не отправляйте более 5 запросов одновременно

### Надёжность

1. **Идемпотентность**: Повторная отправка тех же данных не создаёт дубликаты
2. **Валидация**: Всегда проверяйте данные перед отправкой
3. **Логирование**: Сохраняйте логи отправки для отладки

### Безопасность

1. **Токены**: Храните INGEST_SECRET в безопасном месте
2. **HTTPS**: Всегда используйте HTTPS для передачи данных
3. **Валидация**: Проверяйте данные на стороне клиента

## Troubleshooting

### Частые ошибки

#### 401 Unauthorized
```
Ошибка: Неверный токен аутентификации
Решение: Проверьте правильность INGEST_SECRET
```

#### 400 Bad Request
```
Ошибка: Неверный формат данных
Решение: Проверьте структуру JSON/CSV и обязательные поля
```

#### 500 Internal Server Error
```
Ошибка: Внутренняя ошибка сервера
Решение: Проверьте логи сервера и обратитесь к администратору
```

### Отладка

1. **Dry-run**: Используйте dry-run режим для тестирования
2. **Логи**: Проверьте логи в Supabase Dashboard
3. **Метрики**: Анализируйте метрики инжеста
4. **Валидация**: Проверьте данные на соответствие схеме

### Контакты

При возникновении проблем обращайтесь:
- **Техническая поддержка**: support@company.com
- **Документация**: https://docs.portops.com
- **GitHub Issues**: https://github.com/company/portops/issues
