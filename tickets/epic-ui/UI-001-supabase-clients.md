# UI-001 · Supabase clients

**Статус**: ⏳ Ожидает  
**Milestone**: D  
**Приоритет**: Высокий  
**EPIC**: UI - Интерфейс

## Описание

Настройка клиентов Supabase для браузера и сервера с правильной работой SSR и RLS.

## Задачи

- [ ] Создать `lib/supabase/browser.ts` (SSR cookies)
- [ ] Создать `lib/supabase/server.ts`
- [ ] Настроить аутентификацию
- [ ] Протестировать RLS под разными пользователями
- [ ] Добавить типы для TypeScript
- [ ] Настроить middleware для аутентификации

## Критерии приёмки

- [ ] Запросы к mv_* и таблицам работают под RLS
- [ ] SSR работает корректно
- [ ] Аутентификация функционирует
- [ ] TypeScript типы настроены
- [ ] Middleware обрабатывает аутентификацию

## Технические детали

### Browser Client

Создать файл `apps/web/src/lib/supabase/browser.ts`:

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Типы для удобства
export type SupabaseClient = ReturnType<typeof createClient>
```

### Server Client

Создать файл `apps/web/src/lib/supabase/server.ts`:

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

// Типы для удобства
export type SupabaseServerClient = ReturnType<typeof createClient>
```

### Middleware

Создать файл `apps/web/src/middleware.ts`:

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session if expired - required for Server Components
  await supabase.auth.getUser()

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

### Типы для базы данных

Создать файл `apps/web/src/lib/types/database.ts`:

```typescript
export interface Database {
  public: {
    Tables: {
      voyages: {
        Row: {
          id: string
          vessel_name: string | null
          voyage_no: string
          line_id: string | null
          terminal_id: string | null
          eta: string | null
          etd: string | null
          ata: string | null
          atd: string | null
          status: 'scheduled' | 'arrived' | 'departed' | 'canceled'
          created_at: string
        }
        Insert: {
          id?: string
          vessel_name?: string | null
          voyage_no: string
          line_id?: string | null
          terminal_id?: string | null
          eta?: string | null
          etd?: string | null
          ata?: string | null
          atd?: string | null
          status?: 'scheduled' | 'arrived' | 'departed' | 'canceled'
          created_at?: string
        }
        Update: {
          id?: string
          vessel_name?: string | null
          voyage_no?: string
          line_id?: string | null
          terminal_id?: string | null
          eta?: string | null
          etd?: string | null
          ata?: string | null
          atd?: string | null
          status?: 'scheduled' | 'arrived' | 'departed' | 'canceled'
          created_at?: string
        }
      }
      containers: {
        Row: {
          id: string
          cntr_no: string
          iso_type: string | null
          voyage_id: string | null
          bill_of_lading: string | null
          last_known_status: 'in_transit' | 'discharged' | 'available' | 'picked_up' | 'hold'
          last_status_time: string | null
          created_at: string
        }
        Insert: {
          id?: string
          cntr_no: string
          iso_type?: string | null
          voyage_id?: string | null
          bill_of_lading?: string | null
          last_known_status?: 'in_transit' | 'discharged' | 'available' | 'picked_up' | 'hold'
          last_status_time?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          cntr_no?: string
          iso_type?: string | null
          voyage_id?: string | null
          bill_of_lading?: string | null
          last_known_status?: 'in_transit' | 'discharged' | 'available' | 'picked_up' | 'hold'
          last_status_time?: string | null
          created_at?: string
        }
      }
      // Добавить остальные таблицы...
    }
    Views: {
      mv_upcoming_voyages: {
        Row: {
          id: string
          vessel_name: string | null
          voyage_no: string
          eta: string | null
          etd: string | null
          status: string
          terminal_name: string | null
          line_name: string | null
          containers_total: number
          containers_available: number
        }
      }
      mv_dwell: {
        Row: {
          cntr_no: string
          discharged_at: string | null
          picked_at: string | null
          dwell_hours: number | null
        }
      }
    }
  }
}
```

### Утилиты для работы с данными

Создать файл `apps/web/src/lib/supabase/utils.ts`:

```typescript
import { createClient } from './browser'
import { createClient as createServerClient } from './server'

// Утилита для получения клиента в зависимости от окружения
export function getSupabaseClient() {
  if (typeof window === 'undefined') {
    return createServerClient()
  }
  return createClient()
}

// Утилита для проверки аутентификации
export async function getCurrentUser() {
  const supabase = getSupabaseClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error) {
    console.error('Error getting user:', error)
    return null
  }
  
  return user
}

// Утилита для получения org_id из JWT
export function getOrgId(user: any): string | null {
  return user?.user_metadata?.org_id || null
}
```

## Команды для выполнения

```bash
# Установка зависимостей (если не установлены)
cd apps/web
pnpm add @supabase/ssr

# Создание файлов
mkdir -p src/lib/supabase
mkdir -p src/lib/types

# Создание файлов клиентов
touch src/lib/supabase/browser.ts
touch src/lib/supabase/server.ts
touch src/lib/supabase/utils.ts
touch src/lib/types/database.ts
touch src/middleware.ts
```

## Тестирование

### Тест RLS

```typescript
// apps/web/src/app/test-rls/page.tsx
import { createClient } from '@/lib/supabase/server'

export default async function TestRLSPage() {
  const supabase = createClient()
  
  // Тест запроса к таблице с RLS
  const { data: orders, error } = await supabase
    .from('orders')
    .select('*')
    .limit(5)
  
  if (error) {
    return <div>Error: {error.message}</div>
  }
  
  return (
    <div>
      <h1>RLS Test</h1>
      <pre>{JSON.stringify(orders, null, 2)}</pre>
    </div>
  )
}
```

## Зависимости

- **ENV-004** - Env vars (должен быть завершён)
- **DB-001** - Core schema (должен быть завершён)

## Следующие тикеты

- **UI-002** - Dashboard
- **UI-003** - Arrivals list & details

## Примечания

- Использовать `@supabase/ssr` для правильной работы с SSR
- Всегда проверяй RLS политики
- Используй service role key только на сервере
- Настрой middleware для автоматического обновления сессий
