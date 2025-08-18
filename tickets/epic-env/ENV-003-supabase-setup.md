# ENV-003 · Supabase local+link

**Статус**: ✅ Завершён  
**Milestone**: A  
**Приоритет**: Высокий  
**EPIC**: ENV - Среда разработки

## Описание

Настройка локального и облачного Supabase для разработки и деплоя.

## Задачи

- [x] Установить Supabase CLI
- [x] Инициализировать локальный проект (`supabase init`)
- [x] Запустить локальный стек (`supabase start`)
- [x] Связать с облачным проектом (`supabase link --project-ref`)
- [x] Настроить переменные окружения
- [x] Проверить доступность Supabase Studio

## Критерии приёмки

- [x] Supabase Studio доступна локально на `http://127.0.0.1:54323`
- [x] CLI команды выполняются без ошибок
- [x] Локальный проект связан с облачным
- [x] Переменные окружения настроены корректно
- [x] Docker контейнеры запущены

## Технические детали

### Установка Supabase CLI

```bash
# macOS
brew install supabase/tap/supabase

# Проверка установки
supabase --version
```

### Инициализация проекта

```bash
# Инициализация локального проекта
supabase init

# Запуск локального стека
supabase start
```

### Связывание с облаком

```bash
# Получение project-ref из Supabase Dashboard
# Project Settings → General → Project Reference

# Связывание с облачным проектом
supabase link --project-ref your-project-ref
```

### Переменные окружения

Создать файл `apps/web/.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://wwjysfxdlgmswkcqkfru.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3anlzZnhkbGdtc3drY3FrZnJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1MzgyMDcsImV4cCI6MjA3MTExNDIwN30.UCBk0CqIBOq0yfq-631FaTOs11LfaxCu6l6ge_q1b1s
SUPABASE_SERVICE_ROLE_KEY=your-local-service-role-key

# Ingest
INGEST_SECRET=8e6b28c705a4902801d7a97bbf22c32bc97d8f49e903640f4605bf0aa90b9b02

# Timezone
DEFAULT_TZ=America/Los_Angeles
```

### Проверка статуса

```bash
# Проверка статуса локального Supabase
supabase status

# Проверка подключения к облаку
supabase projects list
```

## Команды для выполнения

```bash
# Установка CLI
brew install supabase/tap/supabase

# Инициализация
supabase init

# Запуск локального стека
supabase start

# Получение ключей
supabase status

# Связывание с облаком (после создания проекта в Dashboard)
supabase link --project-ref wwjysfxdlgmswkcqkfru

# Проверка
supabase status
```

## Зависимости

- **ENV-001** - Bootstrap repo
- **ENV-002** - Next 15 app
- Docker Desktop (должен быть установлен)

## Следующие тикеты

- **ENV-004** - Env vars
- **DB-001** - Core schema (зависит от этого тикета)

## Примечания

- Требуется Docker Desktop для локального Supabase
- Project Reference можно найти в Supabase Dashboard → Project Settings → General
- Локальные ключи генерируются автоматически при `supabase start`
- INGEST_SECRET можно сгенерировать командой: `openssl rand -hex 32`

## Результаты выполнения

✅ **Тикет успешно завершён!**

### Выполненные действия:
1. **Supabase CLI**: Уже установлен (версия 2.34.3)
2. **Локальный проект**: Инициализирован с `supabase init`
3. **Локальный стек**: Запущен с `supabase start`
4. **Облачное связывание**: Проект связан с `wwjysfxdlgmswkcqkfru`
5. **Переменные окружения**: Созданы `.env.local` и `.env.example`
6. **Supabase Studio**: Доступна на `http://127.0.0.1:54323`

### Проверки:
- ✅ Supabase Studio отвечает (HTTP 307 - редирект)
- ✅ Все Docker контейнеры запущены и здоровы
- ✅ CLI команды выполняются без ошибок
- ✅ Проект связан с облачным Supabase
- ✅ Переменные окружения настроены

### Локальные URL:
- **API URL**: http://127.0.0.1:54321
- **Studio URL**: http://127.0.0.1:54323
- **DB URL**: postgresql://postgres:postgres@127.0.0.1:54322/postgres
- **Inbucket URL**: http://127.0.0.1:54324

### Облачный проект:
- **Project Reference**: wwjysfxdlgmswkcqkfru
- **Name**: PortOpt
- **Region**: eu-north-1
- **Status**: Связан (●)

### Docker контейнеры:
- ✅ supabase_studio_portapp (Studio)
- ✅ supabase_db_portapp (PostgreSQL)
- ✅ supabase_kong_portapp (API Gateway)
- ✅ supabase_auth_portapp (Auth)
- ✅ supabase_rest_portapp (PostgREST)
- ✅ supabase_realtime_portapp (Realtime)
- ✅ supabase_storage_portapp (Storage)
- ✅ supabase_inbucket_portapp (Email testing)

### Следующие шаги:
- 🎯 Перейти к тикету **ENV-004** - Env vars
- 🎯 Перейти к тикету **DB-001** - Core schema
