# UI-007 · User Authentication (Clerk)

**Статус**: ⏳ Ожидает  
**Milestone**: E  
**Приоритет**: Высокий  
**EPIC**: UI - Интерфейс

## Описание

Реализация системы аутентификации пользователей с использованием Clerk - современного решения для аутентификации, авторизации и управления пользователями.

## Задачи

- [ ] Установить и настроить Clerk
- [ ] Создать Clerk Application в dashboard
- [ ] Настроить переменные окружения для Clerk
- [ ] Интегрировать Clerk в Next.js приложение
- [ ] Создать компонент SignIn для входа
- [ ] Создать компонент SignUp для регистрации
- [ ] Добавить компонент UserButton в header
- [ ] Настроить защищенные маршруты с Clerk
- [ ] Создать middleware для Clerk
- [ ] Интегрировать Clerk с Supabase для профилей
- [ ] Настроить webhooks для синхронизации данных

## Критерии приёмки

- [ ] Clerk успешно интегрирован в приложение
- [ ] Пользователи могут войти через Clerk SignIn
- [ ] Пользователи могут зарегистрироваться через Clerk SignUp
- [ ] UserButton отображает информацию о пользователе
- [ ] Защищенные маршруты работают с Clerk middleware
- [ ] Данные пользователей синхронизируются с Supabase
- [ ] Webhooks настроены для автоматической синхронизации
- [ ] Поддержка социальных провайдеров (Google, GitHub)
- [ ] Двухфакторная аутентификация (2FA)
- [ ] Управление сессиями и безопасность

## Технические детали

### Установка Clerk

```bash
# Установка Clerk
pnpm add @clerk/nextjs

# Установка дополнительных зависимостей
pnpm add @clerk/themes
```

### Переменные окружения

Обновить `.env.local`:

```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_bW9kZXJuLWxhYnJhZG9yLTcwLmNsZXJrLmFjY291bnRzLmRldiQ
CLERK_SECRET_KEY=sk_test_5yQmuzKhpOcvvkCTorRrDitMIn91t6JvnbcpyHePPK
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
```

### Интеграция Clerk в Next.js

Обновить `apps/web/src/app/layout.tsx`:

```typescript
import { ClerkProvider } from '@clerk/nextjs'
import { ruRU } from '@clerk/localizations'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider localization={ruRU}>
      <html lang="ru">
        <body>
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}
```

### Страницы аутентификации

Создать файл `apps/web/src/app/sign-in/[[...sign-in]]/page.tsx`:

```typescript
import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50">
      <SignIn 
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "shadow-none"
          }
        }}
      />
    </div>
  )
}
```

Создать файл `apps/web/src/app/sign-up/[[...sign-up]]/page.tsx`:

```typescript
import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50">
      <SignUp 
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "shadow-none"
          }
        }}
      />
    </div>
  )
}
```

### Компонент UserButton

Заменить `UserMenu` на `UserButton` в header:

```typescript
import { UserButton } from '@clerk/nextjs'

export function Header() {
  return (
    <header className="flex h-16 items-center gap-4 border-b bg-background px-4 lg:px-6">
      <SidebarToggle />
      <div className="flex-1" />
      <UserButton 
        appearance={{
          elements: {
            avatarBox: "h-8 w-8"
          }
        }}
      />
    </header>
  )
}
```

### Страница регистрации

Создать файл `apps/web/src/app/auth/register/page.tsx`:

```typescript
import { RegisterForm } from '@/components/auth/register-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Назад
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Регистрация</h1>
          <p className="text-muted-foreground">
            Создайте аккаунт для доступа к PortOps
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Регистрация</CardTitle>
          </CardHeader>
          <CardContent>
            <RegisterForm />
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Уже есть аккаунт?{' '}
            <Link href="/auth/login" className="text-primary hover:underline">
              Войти
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
```

### Компонент UserMenu

Создать файл `apps/web/src/components/layout/user-menu.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { User, Settings, LogOut, Building } from 'lucide-react'
import { createClient } from '@/lib/supabase/browser'
import { useUser } from '@/hooks/use-user'

export function UserMenu() {
  const router = useRouter()
  const { user, profile } = useUser()
  const [loading, setLoading] = useState(false)

  const handleSignOut = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push('/auth/login')
    } catch (error) {
      console.error('Error signing out:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <Button asChild variant="outline">
        <Link href="/auth/login">Войти</Link>
      </Button>
    )
  }

  const initials = profile?.first_name && profile?.last_name
    ? `${profile.first_name[0]}${profile.last_name[0]}`
    : user.email?.[0]?.toUpperCase() || 'U'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={profile?.avatar_url} alt={user.email || ''} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {profile?.first_name && profile?.last_name
                ? `${profile.first_name} ${profile.last_name}`
                : user.email}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile">
            <User className="mr-2 h-4 w-4" />
            <span>Профиль</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/organizations">
            <Building className="mr-2 h-4 w-4" />
            <span>Организации</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings className="mr-2 h-4 w-4" />
            <span>Настройки</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} disabled={loading}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Выйти</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

### Middleware для Clerk

Создать файл `apps/web/src/middleware.ts`:

```typescript
import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  // Публичные маршруты
  publicRoutes: [
    "/",
    "/sign-in",
    "/sign-up",
    "/api/webhooks/clerk",
    "/api/webhooks/supabase"
  ],
  
  // Игнорируемые маршруты
  ignoredRoutes: [
    "/api/webhooks/clerk",
    "/api/webhooks/supabase"
  ]
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
```

### Интеграция с Supabase

Создать webhook для синхронизации данных:

```typescript
// apps/web/src/app/api/webhooks/clerk/route.ts
import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    throw new Error('Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env')
  }

  // Получаем заголовки
  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', {
      status: 400
    })
  }

  // Получаем тело запроса
  const payload = await req.json()
  const body = JSON.stringify(payload);

  // Создаем webhook
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error occured', {
      status: 400
    })
  }

  const supabase = await createClient()

  // Обрабатываем события
  switch (evt.type) {
    case 'user.created':
      // Создаем профиль пользователя в Supabase
      await supabase
        .from('user_profiles')
        .insert({
          id: evt.data.id,
          first_name: evt.data.first_name,
          last_name: evt.data.last_name,
          avatar_url: evt.data.image_url,
        })
      break;
      
    case 'user.updated':
      // Обновляем профиль пользователя
      await supabase
        .from('user_profiles')
        .update({
          first_name: evt.data.first_name,
          last_name: evt.data.last_name,
          avatar_url: evt.data.image_url,
        })
        .eq('id', evt.data.id)
      break;
      
    case 'user.deleted':
      // Удаляем профиль пользователя
      await supabase
        .from('user_profiles')
        .delete()
        .eq('id', evt.data.id)
      break;
  }

  return new Response('', { status: 200 })
}
```

### Хук для работы с Clerk

Создать файл `apps/web/src/hooks/use-clerk-user.ts`:

```typescript
'use client'

import { useUser } from '@clerk/nextjs'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/browser'

interface UserProfile {
  id: string
  first_name: string | null
  last_name: string | null
  phone: string | null
  position: string | null
  avatar_url: string | null
  timezone: string
  language: string
  is_active: boolean
  last_login_at: string | null
}

export function useClerkUser() {
  const { user, isLoaded } = useUser()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (!isLoaded) return

    if (user) {
      // Загружаем профиль из Supabase
      const loadProfile = async () => {
        const { data: profileData } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        setProfile(profileData)
        setLoading(false)
      }

      loadProfile()
    } else {
      setProfile(null)
      setLoading(false)
    }
  }, [user, isLoaded, supabase])

  return { user, profile, loading, isLoaded }
}
```

## Команды для выполнения

```bash
# Установка Clerk
cd apps/web
pnpm add @clerk/nextjs @clerk/themes svix

# Создание директорий
mkdir -p src/app/sign-in/\[\[...sign-in\]\]
mkdir -p src/app/sign-up/\[\[...sign-up\]\]
mkdir -p src/app/api/webhooks/clerk
mkdir -p src/hooks

# Создание файлов
touch src/app/sign-in/\[\[...sign-in\]\]/page.tsx
touch src/app/sign-up/\[\[...sign-up\]\]/page.tsx
touch src/app/api/webhooks/clerk/route.ts
touch src/hooks/use-clerk-user.ts
touch src/middleware.ts

# Настройка Clerk Dashboard
# 1. Создать приложение на https://dashboard.clerk.com
# 2. Получить ключи и добавить в .env.local
# 3. Настроить webhooks для синхронизации с Supabase
```

## Тестирование

### Проверка аутентификации

```typescript
// Тест входа пользователя
const testLogin = async () => {
  const supabase = createClient()
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'test@example.com',
    password: 'password123'
  })
  console.log('Login result:', { data, error })
}
```

## Зависимости

- **DB-005** - Users schema (должен быть завершён)
- **UI-006** - Sidebar (должен быть завершён)
- **Clerk Dashboard** - Создание приложения и настройка

## Следующие тикеты

- **UI-008** - User profile management
- **UI-009** - Organization management

## Примечания

- Использовать Clerk для аутентификации и управления пользователями
- Настроить webhooks для синхронизации данных с Supabase
- Добавить поддержку социальных провайдеров (Google, GitHub)
- Настроить двухфакторную аутентификацию
- Использовать Clerk Dashboard для управления пользователями
- Обеспечить безопасность через Clerk middleware

## Результаты выполнения

### ⏳ В процессе реализации
- Миграция с Supabase Auth на Clerk
- Настройка Clerk Dashboard
- Интеграция Clerk с Next.js
- Создание webhooks для синхронизации

### 🔄 Планируемые изменения
- Замена кастомных форм на Clerk компоненты
- Обновление middleware для работы с Clerk
- Интеграция UserButton вместо UserMenu
- Настройка автоматической синхронизации данных
