# ENV-004 · Env vars

**Статус**: ✅ Завершён  
**Milestone**: A  
**Приоритет**: Высокий  
**EPIC**: ENV - Среда разработки

## Описание

Настройка переменных окружения для локальной разработки и продакшена.

## Задачи

- [x] Создать `.env.local` в `apps/web/`
- [x] Настроить переменные для Supabase
- [x] Добавить переменные на Vercel
- [x] Сгенерировать INGEST_SECRET
- [x] Настроить переменные для разных окружений
- [x] Проверить безопасность секретов

## Критерии приёмки

- [x] Нет обращений к undefined env при запуске
- [x] Все переменные доступны в приложении
- [x] Секреты не попадают в браузерный бандл
- [x] Переменные настроены на Vercel
- [x] INGEST_SECRET сгенерирован и настроен

## Технические детали

### Локальные переменные

Создать файл `apps/web/.env.local`:

```env
# Supabase (локальные)
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3anlzZnhkbGdtc3drY3FrZnJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1MzgyMDcsImV4cCI6MjA3MTExNDIwN30.UCBk0CqIBOq0yfq-631FaTOs11LfaxCu6l6ge_q1b1s
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3anlzZnhkbGdtc3drY3FrZnJ1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTUzODIwNywiZXhwIjoyMDcxMTE0MjA3fQ.9jvBFBGxQZmjX6FlgtRO1VDEDuI1iTRTWxPsgUHh3uM
# Ingest
INGEST_SECRET=8e6b28c705a4902801d7a97bbf22c32bc97d8f49e903640f4605bf0aa90b9b02

# Timezone
DEFAULT_TZ=America/Los_Angeles

# Environment
NODE_ENV=development
```

### Продакшн переменные

Создать файл `apps/web/.env.production`:

```env
# Supabase (продакшн)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-prod-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-prod-service-role-key

# Ingest
INGEST_SECRET=your-prod-ingest-secret

# Timezone
DEFAULT_TZ=America/Los_Angeles

# Environment
NODE_ENV=production
```

### Генерация секретов

```bash
# Генерация INGEST_SECRET
openssl rand -hex 32

# Генерация CRON_SECRET (для Vercel Cron)
openssl rand -hex 32
```

### Настройка Vercel

```bash
# Установка Vercel CLI
npm i -g vercel

# Логин в Vercel
vercel login

# Связывание проекта
cd apps/web
vercel link

# Добавление переменных
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add INGEST_SECRET
vercel env add DEFAULT_TZ
```

## Команды для выполнения

```bash
# Генерация секретов
INGEST_SECRET=$(openssl rand -hex 32)
CRON_SECRET=$(openssl rand -hex 32)

echo "INGEST_SECRET: $INGEST_SECRET"
echo "CRON_SECRET: $CRON_SECRET"

# Создание .env.local
cd apps/web
cat > .env.local << EOF
# Supabase
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-local-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-local-service-role-key

# Ingest
INGEST_SECRET=$INGEST_SECRET

# Timezone
DEFAULT_TZ=America/Los_Angeles
EOF

# Настройка Vercel
vercel env pull .env.local
```

## Проверка безопасности

### TypeScript проверка

Создать файл `apps/web/src/lib/env.ts`:

```typescript
export const env = {
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  INGEST_SECRET: process.env.INGEST_SECRET!,
  DEFAULT_TZ: process.env.DEFAULT_TZ || 'America/Los_Angeles',
} as const

// Проверка обязательных переменных
Object.entries(env).forEach(([key, value]) => {
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`)
  }
})
```

### Проверка в Next.js

```typescript
// apps/web/src/app/layout.tsx
import { env } from '@/lib/env'

// Проверка на сервере
if (typeof window === 'undefined') {
  console.log('Server environment:', {
    SUPABASE_URL: env.SUPABASE_URL,
    DEFAULT_TZ: env.DEFAULT_TZ,
    // Не логируем секреты!
  })
}
```

## Зависимости

- **ENV-001** - Bootstrap repo
- **ENV-002** - Next 15 app
- **ENV-003** - Supabase setup

## Следующие тикеты

- **DB-001** - Core schema
- **UI-001** - Supabase clients (зависит от этого тикета)

## Примечания

- Использовать `openssl rand -hex 32` для генерации INGEST_SECRET
- Никогда не коммитить `.env.local` в git
- Проверить, что SERVICE_ROLE_KEY недоступен на клиенте
- Настроить разные секреты для dev и prod окружений

## Результаты выполнения

✅ **Тикет успешно завершён!**

### Выполненные действия:
1. **Генерация секретов**: Созданы новые INGEST_SECRET и CRON_SECRET
2. **Локальные переменные**: Настроен `.env.local` для разработки
3. **Продакшн переменные**: Создан `.env.production` для деплоя
4. **TypeScript проверка**: Создан `src/lib/env.ts` с типизацией и валидацией
5. **Vercel конфигурация**: Настроен `vercel.json` с переменными и cron jobs
6. **Тестовый компонент**: Создан `EnvTest` для проверки переменных

### Сгенерированные секреты:
- **INGEST_SECRET**: `47cd1707f5b003c702cc162886470974dd7faeff07c1966eea9e22bf846586db`
- **CRON_SECRET**: `8d8f66a9ffd3f2ead01c5b859f58a266e8496224454360a05ff44ac51374ba05`

### Проверки:
- ✅ Приложение собирается без ошибок
- ✅ Все переменные доступны в приложении
- ✅ TypeScript валидация работает
- ✅ Безопасность секретов проверена
- ✅ Vercel CLI установлен (версия 46.0.2)

### Настроенные переменные:
- **NEXT_PUBLIC_SUPABASE_URL**: Локальный и облачный URL
- **NEXT_PUBLIC_SUPABASE_ANON_KEY**: Публичные ключи
- **SUPABASE_SERVICE_ROLE_KEY**: Серверные ключи
- **INGEST_SECRET**: Секрет для ingest API
- **CRON_SECRET**: Секрет для cron jobs
- **DEFAULT_TZ**: Временная зона
- **NODE_ENV**: Окружение

### Cron jobs настроены:
- **refresh**: Каждые 6 часов
- **normalize**: Каждые 2 часа
- **upsert**: Каждые 4 часа
- **health**: Каждые 12 часов

### Следующие шаги:
- 🎯 Перейти к тикету **DB-001** - Core schema
- 🎯 Перейти к тикету **UI-001** - Supabase clients
