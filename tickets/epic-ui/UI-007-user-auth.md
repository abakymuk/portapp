# UI-007 · User Authentication

**Статус**: ⏳ Ожидает  
**Milestone**: E  
**Приоритет**: Высокий  
**EPIC**: UI - Интерфейс

## Описание

Реализация системы аутентификации пользователей с формами входа, регистрации и управления сессиями.

## Задачи

- [ ] Создать страницу входа (`/auth/login`)
- [ ] Создать страницу регистрации (`/auth/register`)
- [ ] Создать страницу восстановления пароля (`/auth/reset`)
- [ ] Добавить компонент UserMenu в header
- [ ] Реализовать защищенные маршруты
- [ ] Добавить middleware для проверки аутентификации
- [ ] Создать хуки для работы с пользователями
- [ ] Добавить уведомления об ошибках аутентификации

## Критерии приёмки

- [ ] Пользователи могут войти в систему
- [ ] Пользователи могут зарегистрироваться
- [ ] Пользователи могут восстановить пароль
- [ ] Защищенные маршруты работают корректно
- [ ] UserMenu отображает информацию о пользователе
- [ ] Обработка ошибок аутентификации работает
- [ ] Сессии сохраняются между перезагрузками

## Технические детали

### Страница входа

Создать файл `apps/web/src/app/auth/login/page.tsx`:

```typescript
import { LoginForm } from '@/components/auth/login-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function LoginPage() {
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
          <h1 className="text-3xl font-bold">Вход в систему</h1>
          <p className="text-muted-foreground">
            Войдите в свой аккаунт для доступа к PortOps
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Вход</CardTitle>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>

        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Нет аккаунта?{' '}
            <Link href="/auth/register" className="text-primary hover:underline">
              Зарегистрироваться
            </Link>
          </p>
          <p className="text-sm text-muted-foreground">
            <Link href="/auth/reset" className="text-primary hover:underline">
              Забыли пароль?
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
```

### Компонент формы входа

Создать файл `apps/web/src/components/auth/login-form.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { createClient } from '@/lib/supabase/browser'
import { Mail, Lock, Loader2 } from 'lucide-react'

export function LoginForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      })

      if (error) {
        setError(error.message)
        return
      }

      if (data.user) {
        router.push('/')
        router.refresh()
      }
    } catch (err) {
      setError('Произошла ошибка при входе')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            placeholder="your@email.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="pl-10"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Пароль</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="pl-10"
            required
          />
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Вход...
          </>
        ) : (
          'Войти'
        )}
      </Button>
    </form>
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

### Хук для работы с пользователями

Создать файл `apps/web/src/hooks/use-user.ts`:

```typescript
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/browser'
import type { User } from '@supabase/supabase-js'

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

export function useUser() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    // Получаем текущую сессию
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      
      if (session?.user) {
        // Загружаем профиль пользователя
        const { data: profileData } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
        
        setProfile(profileData)
      }
      
      setLoading(false)
    }

    getSession()

    // Слушаем изменения аутентификации
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        
        if (session?.user) {
          const { data: profileData } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()
          
          setProfile(profileData)
        } else {
          setProfile(null)
        }
        
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  return { user, profile, loading }
}
```

## Команды для выполнения

```bash
# Создание компонентов
mkdir -p apps/web/src/components/auth
mkdir -p apps/web/src/app/auth
mkdir -p apps/web/src/hooks

# Создание файлов
touch apps/web/src/components/auth/login-form.tsx
touch apps/web/src/components/auth/register-form.tsx
touch apps/web/src/components/auth/reset-form.tsx
touch apps/web/src/components/layout/user-menu.tsx
touch apps/web/src/hooks/use-user.ts
touch apps/web/src/app/auth/login/page.tsx
touch apps/web/src/app/auth/register/page.tsx
touch apps/web/src/app/auth/reset/page.tsx

# Установка зависимостей
pnpm add @radix-ui/react-dropdown-menu @radix-ui/react-avatar
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

## Следующие тикеты

- **UI-008** - User profile management
- **UI-009** - Organization management

## Примечания

- Использовать Supabase Auth для аутентификации
- Добавить валидацию форм на клиенте
- Реализовать обработку ошибок
- Добавить loading состояния
- Обеспечить безопасность маршрутов
