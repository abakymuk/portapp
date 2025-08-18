# SEC-001 · Secrets hygiene

**Статус**: ⏳ Ожидает  
**Milestone**: B  
**Приоритет**: Высокий  
**EPIC**: SECURITY - Безопасность

## Описание

Обеспечение безопасности секретов и переменных окружения во всех компонентах системы.

## Задачи

- [ ] Проверить все переменные окружения
- [ ] Настроить Vercel Environment Variables
- [ ] Настроить Supabase Secrets
- [ ] Добавить валидацию секретов
- [ ] Настроить rotation секретов
- [ ] Добавить мониторинг утечек

## Критерии приёмки

- [ ] Все секреты хранятся безопасно
- [ ] Нет секретов в коде
- [ ] Валидация работает корректно
- [ ] Rotation настроен
- [ ] Мониторинг активен

## Технические детали

### Проверка переменных окружения

Создать файл `apps/web/src/lib/env.ts`:

```typescript
import { z } from 'zod'

// Схема валидации переменных окружения
const envSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  
  // Ingest
  INGEST_SECRET: z.string().min(32),
  
  // Cron
  CRON_SECRET: z.string().min(32),
  
  // Vercel
  VERCEL_URL: z.string().url().optional(),
  
  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']),
})

// Валидация переменных окружения
function validateEnv() {
  try {
    return envSchema.parse(process.env)
  } catch (error) {
    console.error('❌ Invalid environment variables:', error.errors)
    throw new Error('Invalid environment variables')
  }
}

// Экспорт валидированных переменных
export const env = validateEnv()

// Типы для TypeScript
export type Env = z.infer<typeof envSchema>
```

### Middleware для проверки секретов

Создать файл `apps/web/src/middleware.ts`:

```typescript
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // Проверка аутентификации для защищенных маршрутов
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Защищенные маршруты
  const protectedRoutes = ['/orders', '/admin']
  const isProtectedRoute = protectedRoutes.some(route => 
    req.nextUrl.pathname.startsWith(route)
  )

  if (isProtectedRoute && !session) {
    return NextResponse.redirect(new URL('/auth/login', req.url))
  }

  // Проверка cron секрета для API маршрутов
  if (req.nextUrl.pathname.startsWith('/api/cron/')) {
    const authHeader = req.headers.get('authorization')
    const expectedSecret = process.env.CRON_SECRET

    if (!expectedSecret) {
      console.error('CRON_SECRET not configured')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    if (authHeader !== `Bearer ${expectedSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}
```

### Валидация секретов в Edge Functions

Обновить все Edge Functions для использования валидации:

```typescript
// Общий файл для валидации в Edge Functions
// supabase/functions/_shared/validate-secrets.ts

export function validateIngestSecret(authHeader: string | null): boolean {
  const expectedSecret = Deno.env.get('INGEST_SECRET')
  
  if (!expectedSecret) {
    console.error('INGEST_SECRET not configured')
    return false
  }
  
  return authHeader === `Bearer ${expectedSecret}`
}

export function validateCronSecret(authHeader: string | null): boolean {
  const expectedSecret = Deno.env.get('CRON_SECRET')
  
  if (!expectedSecret) {
    console.error('CRON_SECRET not configured')
    return false
  }
  
  return authHeader === `Bearer ${expectedSecret}`
}

export function validateSupabaseConfig(): boolean {
  const url = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  
  if (!url || !serviceRoleKey) {
    console.error('Supabase configuration missing')
    return false
  }
  
  return true
}
```

### Скрипт для генерации секретов

Создать файл `scripts/generate-secrets.sh`:

```bash
#!/bin/bash

# Генерация секретов для проекта
echo "🔐 Generating secrets for PortOps..."

# Генерация INGEST_SECRET
INGEST_SECRET=$(openssl rand -base64 32)
echo "INGEST_SECRET=$INGEST_SECRET"

# Генерация CRON_SECRET
CRON_SECRET=$(openssl rand -base64 32)
echo "CRON_SECRET=$CRON_SECRET"

# Генерация JWT_SECRET (если нужен)
JWT_SECRET=$(openssl rand -base64 32)
echo "JWT_SECRET=$JWT_SECRET"

echo ""
echo "📝 Add these to your environment variables:"
echo ""

# Создание .env.example
cat > .env.example << EOF
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Ingest
INGEST_SECRET=$INGEST_SECRET

# Cron
CRON_SECRET=$CRON_SECRET

# Vercel
VERCEL_URL=https://your-project.vercel.app

# Environment
NODE_ENV=development
EOF

echo "✅ .env.example created with generated secrets"
echo "🔒 Remember to add these to your production environment variables"
```

### Проверка безопасности

Создать файл `scripts/security-check.sh`:

```bash
#!/bin/bash

echo "🔍 Security check for PortOps..."

# Проверка наличия секретов в коде
echo "Checking for secrets in code..."

# Поиск потенциальных секретов в коде
SECRETS_FOUND=$(grep -r -i -E "(password|secret|key|token)" apps/web/src --exclude-dir=node_modules --exclude=*.d.ts | grep -v "process.env" | wc -l)

if [ $SECRETS_FOUND -gt 0 ]; then
    echo "❌ Potential secrets found in code:"
    grep -r -i -E "(password|secret|key|token)" apps/web/src --exclude-dir=node_modules --exclude=*.d.ts | grep -v "process.env"
    exit 1
else
    echo "✅ No hardcoded secrets found"
fi

# Проверка переменных окружения
echo "Checking environment variables..."

REQUIRED_VARS=(
    "NEXT_PUBLIC_SUPABASE_URL"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    "SUPABASE_SERVICE_ROLE_KEY"
    "INGEST_SECRET"
    "CRON_SECRET"
)

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Missing required environment variable: $var"
        exit 1
    else
        echo "✅ $var is set"
    fi
done

# Проверка длины секретов
if [ ${#INGEST_SECRET} -lt 32 ]; then
    echo "❌ INGEST_SECRET is too short (minimum 32 characters)"
    exit 1
fi

if [ ${#CRON_SECRET} -lt 32 ]; then
    echo "❌ CRON_SECRET is too short (minimum 32 characters)"
    exit 1
fi

echo "✅ All security checks passed"
```

### Настройка Vercel Environment Variables

```bash
# Установка переменных в Vercel
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add INGEST_SECRET
vercel env add CRON_SECRET
vercel env add VERCEL_URL

# Промоушен переменных в production
vercel env pull .env.production.local
```

### Настройка Supabase Secrets

```bash
# Установка секретов в Supabase
supabase secrets set INGEST_SECRET=your-ingest-secret
supabase secrets set CRON_SECRET=your-cron-secret
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Мониторинг утечек

Создать файл `apps/web/src/app/api/security/audit/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  // Проверка аутентификации (только для админов)
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Проверка роли пользователя (должна быть настроена в Supabase)
  const { data: profile } = await supabase
    .from('orgs')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    // Аудит последних действий
    const { data: recentActions } = await supabase
      .from('ingest_metrics')
      .select('*')
      .order('ts', { ascending: false })
      .limit(100)

    const { data: recentErrors } = await supabase
      .from('ingest_errors')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    // Проверка подозрительной активности
    const suspiciousActivity = recentErrors?.filter(error => 
      error.reason?.includes('unauthorized') || 
      error.reason?.includes('forbidden')
    ) || []

    return NextResponse.json({
      audit_timestamp: new Date().toISOString(),
      recent_actions: recentActions?.length || 0,
      recent_errors: recentErrors?.length || 0,
      suspicious_activity: suspiciousActivity.length,
      security_status: suspiciousActivity.length > 0 ? 'warning' : 'secure'
    })

  } catch (error) {
    console.error('Security audit error:', error)
    
    return NextResponse.json(
      { error: 'Audit failed', details: error.message },
      { status: 500 }
    )
  }
}
```

## Команды для выполнения

```bash
# Установка зависимостей
cd apps/web
pnpm add zod

# Создание файлов
mkdir -p apps/web/src/lib
mkdir -p apps/web/src/app/api/security/audit
mkdir -p scripts

touch apps/web/src/lib/env.ts
touch apps/web/src/middleware.ts
touch scripts/generate-secrets.sh
touch scripts/security-check.sh
touch apps/web/src/app/api/security/audit/route.ts

# Сделать скрипты исполняемыми
chmod +x scripts/generate-secrets.sh
chmod +x scripts/security-check.sh

# Генерация секретов
./scripts/generate-secrets.sh

# Проверка безопасности
./scripts/security-check.sh
```

## Тестирование

### Тест валидации переменных

```typescript
// Тест валидации env
import { env } from '@/lib/env'

console.log('Environment validation:', {
  hasSupabaseUrl: !!env.NEXT_PUBLIC_SUPABASE_URL,
  hasIngestSecret: !!env.INGEST_SECRET,
  hasCronSecret: !!env.CRON_SECRET,
  nodeEnv: env.NODE_ENV
})
```

### Тест middleware

```bash
# Тест защищенных маршрутов
curl -X GET "http://localhost:3000/orders" -v

# Тест cron endpoint без секрета
curl -X GET "http://localhost:3000/api/cron/refresh" -v

# Тест cron endpoint с секретом
curl -X GET "http://localhost:3000/api/cron/refresh" \
  -H "Authorization: Bearer your-cron-secret" -v
```

## Зависимости

- **ENV-004** - Env vars (должен быть завершён)

## Следующие тикеты

- **SEC-002** - Read-only views

## Примечания

- Никогда не коммитить секреты в git
- Использовать .env.local для локальной разработки
- Регулярно ротировать секреты
- Мониторить подозрительную активность
- Настроить алерты при утечках
