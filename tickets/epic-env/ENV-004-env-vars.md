# ENV-004 · Env vars

**Статус**: ⏳ Ожидает  
**Milestone**: A  
**Приоритет**: Высокий  
**EPIC**: ENV - Среда разработки

## Описание

Настройка переменных окружения для локальной разработки и продакшена.

## Задачи

- [ ] Создать `.env.local` в `apps/web/`
- [ ] Настроить переменные для Supabase
- [ ] Добавить переменные на Vercel
- [ ] Сгенерировать INGEST_SECRET
- [ ] Настроить переменные для разных окружений
- [ ] Проверить безопасность секретов

## Критерии приёмки

- [ ] Нет обращений к undefined env при запуске
- [ ] Все переменные доступны в приложении
- [ ] Секреты не попадают в браузерный бандл
- [ ] Переменные настроены на Vercel
- [ ] INGEST_SECRET сгенерирован и настроен

## Технические детали

### Локальные переменные

Создать файл `apps/web/.env.local`:

```env
# Supabase (локальные)
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-local-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-local-service-role-key

# Ingest
INGEST_SECRET=your-generated-secret

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
