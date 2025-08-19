# Тикеты PortOps MVP

Эта папка содержит все тикеты проекта, разбитые по EPIC'ам и отдельным файлам для удобства работы.

## Структура

```
tickets/
├── README.md                    # Этот файл
├── epic-env/                    # Среда разработки
│   ├── ENV-001-bootstrap-repo.md
│   ├── ENV-002-next15-app.md
│   ├── ENV-003-supabase-setup.md
│   └── ENV-004-env-vars.md
├── epic-db/                     # База данных
│   ├── DB-001-core-schema.md
│   ├── DB-002-materialized-views.md
│   ├── DB-003-rls-policies.md
│   └── DB-004-seeds.md
├── epic-ingest/                 # Инжест и нормализация
│   ├── ING-001-edge-function.md
│   ├── ING-002-normalize-staging.md
│   ├── ING-003-upsert-core.md
│   └── ING-004-metrics-errors.md
├── epic-ui/                     # Интерфейс
│   ├── UI-001-supabase-clients.md
│   ├── UI-002-dashboard.md
│   ├── UI-003-arrivals.md
│   ├── UI-004-containers-search.md
│   ├── UI-005-orders.md
│   └── UI-006-sidebar.md
├── epic-actions/                # Server Actions
│   ├── ACT-001-create-order.md
│   └── ACT-002-add-order-items.md
├── epic-cron/                   # Планировщики
│   └── CRON-001-vercel-cron.md
├── epic-security/               # Безопасность
│   ├── SEC-001-secrets-hygiene.md
│   └── SEC-002-readonly-views.md
├── epic-observability/          # Наблюдаемость
│   ├── OBS-001-log-ingestion.md
│   └── OBS-002-no-data-alert.md
├── epic-qa/                     # Тестирование
│   ├── QA-001-unit-parsers.md
│   └── QA-002-e2e-tests.md
└── epic-docs/                   # Документация
    ├── DOC-001-readme.md
    ├── DOC-002-operations.md
    └── DOC-003-ingest-docs.md
```

## Созданные тикеты

### ✅ Завершённые (30/30)
- **ENV-001** - Bootstrap repo (🚧 В работе)
- **ENV-002** - Next 15 app
- **ENV-003** - Supabase setup
- **ENV-004** - Env vars
- **DB-001** - Core schema
- **DB-002** - Materialized views + RPC
- **DB-003** - RLS policies
- **DB-004** - Seeds
- **UI-001** - Supabase clients
- **UI-002** - Dashboard
- **UI-003** - Arrivals list & details
- **UI-004** - Containers search
- **UI-005** - Orders list/new/detail
- **UI-006** - Sidebar Navigation
- **ING-001** - Edge function
- **ING-002** - Normalize → stg
- **ING-003** - Upsert core
- **ING-004** - Metrics & errors
- **ACT-001** - createOrder
- **ACT-002** - addOrderItems (bulk)
- **CRON-001** - Vercel Cron → refresh
- **SEC-001** - Secrets hygiene
- **SEC-002** - Read-only views
- **OBS-001** - Log ingestion
- **OBS-002** - No-data alert
- **QA-001** - Unit: parsers
- **QA-002** - E2E tests
- **DOC-001** - README (✅ уже создан)
- **DOC-002** - Operations (✅ уже создан)
- **DOC-003** - Ingest docs (✅ уже создан)

### 🎉 Все тикеты созданы! (30/30)

## Статусы тикетов

- 🚧 **В работе** - тикет активно разрабатывается
- ⏳ **Ожидает** - тикет готов к работе, но не начат
- ✅ **Завершено** - тикет выполнен и протестирован
- 🔄 **В ревью** - тикет на проверке
- ❌ **Блокирован** - тикет заблокирован зависимостями

## Приоритеты

- **Критический** - блокирует работу других тикетов
- **Высокий** - важный функционал для MVP
- **Средний** - желательный функционал
- **Низкий** - nice-to-have

## Работа с тикетами

1. **Выбор тикета**: Следуйте roadmap и зависимостям
2. **Обновление статуса**: Меняйте статус по мере выполнения
3. **Коммиты**: Связывайте коммиты с номерами тикетов
4. **Ревью**: Создавайте PR с ссылками на тикеты

## Зависимости

Следуйте порядку выполнения из roadmap:
- **Milestone A** → **Milestone B** → **Milestone C** → ...
- Внутри milestone следуйте номерам тикетов
- Учитывайте зависимости между EPIC'ами

## Команды для работы

```bash
# Создание нового тикета
touch tickets/epic-xxx/XXX-001-description.md

# Поиск тикетов по статусу
grep -r "Статус.*В работе" tickets/

# Поиск тикетов по приоритету
grep -r "Приоритет.*Критический" tickets/
```
