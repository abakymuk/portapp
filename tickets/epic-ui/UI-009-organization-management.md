# UI-009 · Organization Management

**Статус**: ⏳ Ожидает  
**Milestone**: E  
**Приоритет**: Средний  
**EPIC**: UI - Интерфейс

## Описание

Реализация системы управления организациями, включая создание, редактирование, управление участниками и ролями.

## Задачи

- [ ] Создать страницу списка организаций (`/organizations`)
- [ ] Создать страницу создания организации (`/organizations/new`)
- [ ] Создать страницу управления организацией (`/organizations/[id]`)
- [ ] Создать компонент для управления участниками
- [ ] Создать компонент для управления ролями
- [ ] Реализовать Server Actions для операций с организациями
- [ ] Добавить валидацию и обработку ошибок
- [ ] Реализовать поиск и фильтрацию организаций

## Критерии приёмки

- [ ] Пользователи могут просматривать список организаций
- [ ] Пользователи могут создавать новые организации
- [ ] Администраторы могут управлять участниками
- [ ] Администраторы могут назначать роли
- [ ] Система ролей работает корректно
- [ ] RLS политики соблюдаются
- [ ] UI отображает loading состояния
- [ ] Обработка ошибок работает

## Технические детали

### Страница списка организаций

Создать файл `apps/web/src/app/organizations/page.tsx`:

```typescript
import { Suspense } from 'react'
import { OrganizationsList } from '@/components/organizations/organizations-list'
import { OrganizationsHeader } from '@/components/organizations/organizations-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function OrganizationsPage() {
  return (
    <div className="p-8 space-y-8">
      <OrganizationsHeader />
      
      <Card>
        <CardHeader>
          <CardTitle>Мои организации</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<OrganizationsListSkeleton />}>
            <OrganizationsList />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}

function OrganizationsListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <Skeleton className="h-8 w-24" />
        </div>
      ))}
    </div>
  )
}
```

### Компонент заголовка организаций

Создать файл `apps/web/src/components/organizations/organizations-header.tsx`:

```typescript
'use client'

import { Button } from '@/components/ui/button'
import { Plus, Building } from 'lucide-react'
import Link from 'next/link'

export function OrganizationsHeader() {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Организации</h1>
        <p className="text-muted-foreground">
          Управление организациями и участниками
        </p>
      </div>
      
      <Button asChild>
        <Link href="/organizations/new">
          <Plus className="h-4 w-4 mr-2" />
          Создать организацию
        </Link>
      </Button>
    </div>
  )
}
```

### Компонент списка организаций

Создать файл `apps/web/src/components/organizations/organizations-list.tsx`:

```typescript
'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@/hooks/use-user'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Building, Users, Settings, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/browser'
import Link from 'next/link'

interface Organization {
  org_id: string
  org_name: string
  role_name: string
  is_primary: boolean
  member_count?: number
}

export function OrganizationsList() {
  const { user } = useUser()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadOrganizations = async () => {
      if (!user) return
      
      try {
        const supabase = createClient()
        const { data, error } = await supabase.rpc('get_user_orgs', { 
          user_uuid: user.id 
        })
        
        if (error) {
          console.error('Error loading organizations:', error)
          return
        }
        
        setOrganizations(data || [])
      } catch (error) {
        console.error('Error loading organizations:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadOrganizations()
  }, [user])

  if (loading) {
    return <div>Загрузка организаций...</div>
  }

  if (organizations.length === 0) {
    return (
      <div className="text-center py-12">
        <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">Нет организаций</h3>
        <p className="text-muted-foreground mb-4">
          Создайте свою первую организацию или присоединитесь к существующей
        </p>
        <Button asChild>
          <Link href="/organizations/new">
            <Plus className="h-4 w-4 mr-2" />
            Создать организацию
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {organizations.map((org) => (
        <Card key={org.org_id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>
                    <Building className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-lg">{org.org_name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{org.role_name}</p>
                </div>
              </div>
              {org.is_primary && (
                <Badge variant="default">Основная</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Users className="h-4 w-4" />
                  <span>{org.member_count || 0} участников</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/organizations/${org.org_id}`}>
                    <Settings className="h-4 w-4 mr-2" />
                    Управление
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
```

### Страница создания организации

Создать файл `apps/web/src/app/organizations/new/page.tsx`:

```typescript
import { CreateOrganizationForm } from '@/components/organizations/create-organization-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function CreateOrganizationPage() {
  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center space-x-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/organizations">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Создать организацию</h1>
          <p className="text-muted-foreground">
            Создайте новую организацию для совместной работы
          </p>
        </div>
      </div>

      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Информация об организации</CardTitle>
          </CardHeader>
          <CardContent>
            <CreateOrganizationForm />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
```

### Форма создания организации

Создать файл `apps/web/src/components/organizations/create-organization-form.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Building } from 'lucide-react'
import { createOrganization } from '@/actions/organizations'

export function CreateOrganizationForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const result = await createOrganization(formData)
      
      if (result.error) {
        setError(result.error)
      } else if (result.organizationId) {
        router.push(`/organizations/${result.organizationId}`)
      }
    } catch (err) {
      setError('Произошла ошибка при создании организации')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Название организации *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Введите название организации"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Описание</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Краткое описание организации"
          rows={4}
        />
      </div>

      <div className="flex items-center space-x-4">
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Создание...
            </>
          ) : (
            <>
              <Building className="h-4 w-4 mr-2" />
              Создать организацию
            </>
          )}
        </Button>
        
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Отмена
        </Button>
      </div>
    </form>
  )
}
```

### Server Action для создания организации

Создать файл `apps/web/src/actions/organizations.ts`:

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface OrganizationData {
  name: string
  description?: string
}

export async function createOrganization(data: OrganizationData) {
  try {
    const supabase = await createClient()
    
    // Получаем текущего пользователя
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return { error: 'Пользователь не найден' }
    }

    // Создаем организацию
    const { data: org, error: orgError } = await supabase
      .from('orgs')
      .insert({
        name: data.name
      })
      .select()
      .single()

    if (orgError) {
      console.error('Error creating organization:', orgError)
      return { error: 'Ошибка при создании организации' }
    }

    // Получаем роль администратора
    const { data: adminRole, error: roleError } = await supabase
      .from('user_roles')
      .select('id')
      .eq('name', 'admin')
      .single()

    if (roleError) {
      console.error('Error getting admin role:', roleError)
      return { error: 'Ошибка при назначении роли' }
    }

    // Добавляем пользователя как администратора организации
    const { error: membershipError } = await supabase
      .from('user_org_memberships')
      .insert({
        user_id: user.id,
        org_id: org.id,
        role_id: adminRole.id,
        is_primary: true
      })

    if (membershipError) {
      console.error('Error creating membership:', membershipError)
      return { error: 'Ошибка при создании членства' }
    }

    revalidatePath('/organizations')
    return { organizationId: org.id }
  } catch (error) {
    console.error('Error in createOrganization:', error)
    return { error: 'Произошла ошибка при создании организации' }
  }
}

export async function inviteUserToOrganization(
  organizationId: string, 
  email: string, 
  roleName: string = 'viewer'
) {
  try {
    const supabase = await createClient()
    
    // Получаем текущего пользователя
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return { error: 'Пользователь не найден' }
    }

    // Проверяем права администратора
    const { data: membership, error: membershipError } = await supabase
      .from('user_org_memberships')
      .select(`
        role_id,
        user_roles!inner(name)
      `)
      .eq('user_id', user.id)
      .eq('org_id', organizationId)
      .single()

    if (membershipError || membership.user_roles.name !== 'admin') {
      return { error: 'Недостаточно прав для приглашения пользователей' }
    }

    // Получаем роль для приглашения
    const { data: role, error: roleError } = await supabase
      .from('user_roles')
      .select('id')
      .eq('name', roleName)
      .single()

    if (roleError) {
      return { error: 'Роль не найдена' }
    }

    // TODO: Реализовать приглашение пользователя
    // Это может включать отправку email и создание временного членства

    return { success: true }
  } catch (error) {
    console.error('Error in inviteUserToOrganization:', error)
    return { error: 'Произошла ошибка при приглашении пользователя' }
  }
}
```

## Команды для выполнения

```bash
# Создание компонентов
mkdir -p apps/web/src/components/organizations
mkdir -p apps/web/src/app/organizations
mkdir -p apps/web/src/actions

# Создание файлов
touch apps/web/src/components/organizations/organizations-list.tsx
touch apps/web/src/components/organizations/organizations-header.tsx
touch apps/web/src/components/organizations/create-organization-form.tsx
touch apps/web/src/actions/organizations.ts
touch apps/web/src/app/organizations/page.tsx
touch apps/web/src/app/organizations/new/page.tsx
```

## Тестирование

### Проверка создания организации

```typescript
// Тест создания организации
const testCreateOrganization = async () => {
  const result = await createOrganization({
    name: 'Test Organization',
    description: 'Test organization for development'
  })
  console.log('Create result:', result)
}
```

## Зависимости

- **DB-005** - Users schema (должен быть завершён)
- **UI-007** - User authentication (должен быть завершён)

## Следующие тикеты

- **UI-010** - User settings
- **UI-011** - Advanced permissions

## Примечания

- Использовать RLS политики для безопасности
- Добавить валидацию на клиенте и сервере
- Реализовать систему приглашений
- Добавить уведомления о действиях
- Обеспечить доступность интерфейса
