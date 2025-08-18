# ENV-003 · Supabase local+link

**Статус**: ⏳ Ожидает  
**Milestone**: A  
**Приоритет**: Высокий  
**EPIC**: ENV - Среда разработки

## Описание

Настройка локального и облачного Supabase для разработки и деплоя.

## Задачи

- [ ] Установить Supabase CLI
- [ ] Инициализировать локальный проект (`supabase init`)
- [ ] Запустить локальный стек (`supabase start`)
- [ ] Связать с облачным проектом (`supabase link --project-ref`)
- [ ] Настроить переменные окружения
- [ ] Проверить доступность Supabase Studio

## Критерии приёмки

- [ ] Supabase Studio доступна локально на `http://127.0.0.1:54323`
- [ ] CLI команды выполняются без ошибок
- [ ] Локальный проект связан с облачным
- [ ] Переменные окружения настроены корректно
- [ ] Docker контейнеры запущены

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
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-local-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-local-service-role-key

# Ingest
INGEST_SECRET=your-ingest-secret

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
supabase link --project-ref your-project-ref

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
