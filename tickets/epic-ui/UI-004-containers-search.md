# UI-004 · Containers search

**Статус**: ✅ Завершён  
**Milestone**: D  
**Приоритет**: Средний  
**EPIC**: UI - Интерфейс

## Описание

Поиск контейнеров по номеру и BOL с детальной информацией и историей событий.

## Задачи

- [x] Создать `containers/page.tsx`
- [x] Реализовать поле поиска с debounce
- [x] Добавить server-side query
- [x] Реализовать отображение результатов
- [x] Добавить детальную информацию о контейнере
- [x] Показать историю событий

## Критерии приёмки

- [x] Поиск по cntr_no/bill_of_lading находит записи
- [x] Debounce работает корректно
- [x] Результаты отображаются быстро
- [x] Детальная информация загружается
- [x] История событий отображается

## Технические детали

### Страница поиска контейнеров

Создать файл `apps/web/src/app/containers/page.tsx`:

```typescript
import { Suspense } from 'react'
import { ContainerSearch } from '@/components/containers/container-search'
import { ContainerResults } from '@/components/containers/container-results'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface SearchParams {
  q?: string
}

export default async function ContainersPage({
  searchParams
}: {
  searchParams: SearchParams
}) {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Поиск контейнеров</h1>
        <p className="text-muted-foreground">
          Поиск по номеру контейнера или BOL
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Поиск</CardTitle>
        </CardHeader>
        <CardContent>
          <ContainerSearch initialQuery={searchParams.q} />
        </CardContent>
      </Card>

      {searchParams.q && (
        <Card>
          <CardHeader>
            <CardTitle>Результаты поиска</CardTitle>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<ContainerResultsSkeleton />}>
              <ContainerResults query={searchParams.q} />
            </Suspense>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function ContainerResultsSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="p-4 border rounded-lg space-y-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      ))}
    </div>
  )
}
```

### Компонент поиска

Создать файл `apps/web/src/components/containers/container-search.tsx`:

```typescript
'use client'

import { useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Search, Package } from 'lucide-react'
import { useDebounce } from '@/hooks/use-debounce'

interface ContainerSearchProps {
  initialQuery?: string
}

export function ContainerSearch({ initialQuery }: ContainerSearchProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(initialQuery || '')
  const debouncedQuery = useDebounce(query, 300)

  // Обновление URL при изменении поиска
  const updateSearch = useCallback((newQuery: string) => {
    const params = new URLSearchParams(searchParams)
    
    if (newQuery.trim()) {
      params.set('q', newQuery.trim())
    } else {
      params.delete('q')
    }
    
    router.push(`/containers?${params.toString()}`)
  }, [router, searchParams])

  // Обработка изменения поиска
  const handleQueryChange = (value: string) => {
    setQuery(value)
  }

  // Обработка отправки формы
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateSearch(query)
  }

  // Автоматическое обновление при debounce
  React.useEffect(() => {
    if (debouncedQuery !== initialQuery) {
      updateSearch(debouncedQuery)
    }
  }, [debouncedQuery, initialQuery, updateSearch])

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="search">Номер контейнера или BOL</Label>
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="search"
            placeholder="MSCU1234567 или MSC123456789..."
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <p className="text-sm text-muted-foreground">
          Введите номер контейнера (например: MSCU1234567) или номер BOL
        </p>
      </div>

      <div className="flex items-center space-x-4">
        <Button type="submit" disabled={!query.trim()}>
          <Search className="h-4 w-4 mr-2" />
          Найти
        </Button>
        
        {query && (
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => {
              setQuery('')
              updateSearch('')
            }}
          >
            Очистить
          </Button>
        )}
      </div>

      {/* Примеры поиска */}
      <div className="pt-4 border-t">
        <h4 className="text-sm font-medium mb-2">Примеры поиска:</h4>
        <div className="flex flex-wrap gap-2">
          {['MSCU1234567', 'MAEU3456789', 'CMA7890123'].map((example) => (
            <Button
              key={example}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setQuery(example)
                updateSearch(example)
              }}
            >
              <Package className="h-3 w-3 mr-1" />
              {example}
            </Button>
          ))}
        </div>
      </div>
    </form>
  )
}
```

### Компонент результатов

Создать файл `apps/web/src/components/containers/container-results.tsx`:

```typescript
import { createClient } from '@/lib/supabase/server'
import { ContainerCard } from '@/components/containers/container-card'
import { Badge } from '@/components/ui/badge'
import { Package, AlertCircle } from 'lucide-react'

interface ContainerResultsProps {
  query: string
}

export async function ContainerResults({ query }: ContainerResultsProps) {
  const supabase = createClient()
  
  // Поиск контейнеров
  const { data: containers, error } = await supabase
    .from('containers')
    .select(`
      *,
      voyages (
        vessel_name,
        voyage_no,
        eta,
        etd,
        status
      ),
      container_events (
        event_type,
        event_time,
        payload
      )
    `)
    .or(`cntr_no.ilike.%${query}%,bill_of_lading.ilike.%${query}%`)
    .order('last_status_time', { ascending: false })
    .limit(20)

  if (error) {
    console.error('Error searching containers:', error)
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
        <p className="text-red-600">Ошибка поиска</p>
      </div>
    )
  }

  if (!containers || containers.length === 0) {
    return (
      <div className="text-center py-8">
        <Package className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-muted-foreground">Контейнеры не найдены</p>
        <p className="text-sm text-muted-foreground mt-1">
          Попробуйте другой номер контейнера или BOL
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Найдено {containers.length} контейнеров
        </p>
        <Badge variant="outline">
          {containers.length} результатов
        </Badge>
      </div>

      <div className="grid gap-4">
        {containers.map((container) => (
          <ContainerCard key={container.id} container={container} />
        ))}
      </div>
    </div>
  )
}
```

### Компонент карточки контейнера

Создать файл `apps/web/src/components/containers/container-card.tsx`:

```typescript
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import Link from 'next/link'
import { Package, Ship, Calendar, MapPin } from 'lucide-react'

interface ContainerCardProps {
  container: any
}

export function ContainerCard({ container }: ContainerCardProps) {
  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      'in_transit': 'default',
      'discharged': 'secondary',
      'available': 'outline',
      'picked_up': 'destructive',
      'hold': 'destructive'
    }
    
    const labels: Record<string, string> = {
      'in_transit': 'В пути',
      'discharged': 'Выгружен',
      'available': 'Доступен',
      'picked_up': 'Забран',
      'hold': 'На удержании'
    }
    
    return (
      <Badge variant={variants[status] || 'default'}>
        {labels[status] || status}
      </Badge>
    )
  }

  const voyage = container.voyages
  const events = container.container_events || []

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Package className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">{container.cntr_no}</CardTitle>
          </div>
          {getStatusBadge(container.last_known_status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Основная информация */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Тип:</span>
              <span>{container.iso_type || 'Не указан'}</span>
            </div>
            
            {container.bill_of_lading && (
              <div className="flex items-center space-x-2 text-sm">
                <Ship className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">BOL:</span>
                <span>{container.bill_of_lading}</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            {voyage && (
              <>
                <div className="flex items-center space-x-2 text-sm">
                  <Ship className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Рейс:</span>
                  <span>{voyage.voyage_no}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <span className="font-medium">Судно:</span>
                  <span>{voyage.vessel_name}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Время последнего статуса */}
        {container.last_status_time && (
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Последнее обновление:</span>
            <span>{format(new Date(container.last_status_time), 'dd.MM.yyyy HH:mm', { locale: ru })}</span>
          </div>
        )}

        {/* Последние события */}
        {events.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Последние события:</h4>
            <div className="space-y-1">
              {events.slice(0, 3).map((event: any, index: number) => (
                <div key={index} className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span className="capitalize">{event.event_type}</span>
                  <span>•</span>
                  <span>{format(new Date(event.event_time), 'dd.MM.yyyy HH:mm', { locale: ru })}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Действия */}
        <div className="flex items-center space-x-2 pt-2 border-t">
          <Button asChild variant="outline" size="sm">
            <Link href={`/containers/${container.cntr_no}`}>
              Подробнее
            </Link>
          </Button>
          
          {voyage && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/arrivals/${voyage.id}`}>
                Рейс
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
```

### Детальная страница контейнера

Создать файл `apps/web/src/app/containers/[cntrNo]/page.tsx`:

```typescript
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ContainerDetails } from '@/components/containers/container-details'
import { ContainerEvents } from '@/components/containers/container-events'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Package, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface ContainerPageProps {
  params: {
    cntrNo: string
  }
}

export default async function ContainerPage({ params }: ContainerPageProps) {
  const supabase = createClient()
  
  // Получение данных контейнера
  const { data: container, error } = await supabase
    .from('containers')
    .select(`
      *,
      voyages (
        id,
        vessel_name,
        voyage_no,
        eta,
        etd,
        status
      ),
      container_events (
        event_type,
        event_time,
        payload
      )
    `)
    .eq('cntr_no', params.cntrNo)
    .single()

  if (error || !container) {
    notFound()
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Заголовок */}
      <div className="flex items-center space-x-4">
        <Button asChild variant="outline" size="sm">
          <Link href="/containers">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад к поиску
          </Link>
        </Button>
        <div className="flex items-center space-x-2">
          <Package className="h-6 w-6 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{container.cntr_no}</h1>
            <p className="text-muted-foreground">Детальная информация о контейнере</p>
          </div>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Информация о контейнере */}
        <Card>
          <CardHeader>
            <CardTitle>Информация о контейнере</CardTitle>
          </CardHeader>
          <CardContent>
            <ContainerDetails container={container} />
          </CardContent>
        </Card>

        {/* История событий */}
        <Card>
          <CardHeader>
            <CardTitle>История событий</CardTitle>
          </CardHeader>
          <CardContent>
            <ContainerEvents events={container.container_events || []} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
```

### Хук для debounce

Создать файл `apps/web/src/hooks/use-debounce.ts`:

```typescript
import { useState, useEffect } from 'react'

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}
```

## Команды для выполнения

```bash
# Создание компонентов
mkdir -p apps/web/src/components/containers
mkdir -p apps/web/src/app/containers
mkdir -p apps/web/src/hooks

# Создание файлов
touch apps/web/src/components/containers/container-search.tsx
touch apps/web/src/components/containers/container-results.tsx
touch apps/web/src/components/containers/container-card.tsx
touch apps/web/src/components/containers/container-details.tsx
touch apps/web/src/components/containers/container-events.tsx
touch apps/web/src/app/containers/page.tsx
touch apps/web/src/app/containers/[cntrNo]/page.tsx
touch apps/web/src/hooks/use-debounce.ts
```

## Тестирование

### Проверка поиска

```typescript
// Тест поиска по номеру контейнера
const searchResult = await fetch('/containers?q=MSCU1234567')
console.log('Search result:', await searchResult.json())

// Тест поиска по BOL
const bolResult = await fetch('/containers?q=MSC123456789')
console.log('BOL result:', await bolResult.json())
```

## Зависимости

- **UI-001** - Supabase clients (должен быть завершён)
- **DB-004** - Seeds (должен быть завершён)

## Следующие тикеты

- **UI-005** - Orders list/new/detail

## Результаты выполнения

### Реализованные функции

✅ **Страница поиска контейнеров** (`/containers`)
- Поле поиска с debounce (300ms)
- Поиск по номеру контейнера и BOL
- Примеры поиска для быстрого доступа
- Кнопки "Найти" и "Очистить"

✅ **Результаты поиска**
- Server-side поиск с использованием Supabase
- Отображение до 20 результатов
- Сортировка по времени последнего статуса
- Карточки контейнеров с основной информацией

✅ **Детальная страница контейнера** (`/containers/[cntrNo]`)
- Подробная информация о контейнере
- Информация о связанном рейсе
- История событий с детализацией
- Навигация назад к поиску

✅ **Компоненты UI**
- `ContainerSearch` - клиентский компонент поиска
- `ContainerResults` - серверный компонент результатов
- `ContainerCard` - карточка контейнера в списке
- `ContainerDetails` - детальная информация
- `ContainerEvents` - история событий

### Технические особенности

- **Debounce хук** - оптимизация запросов
- **Server Components** для загрузки данных
- **Client Components** для интерактивности
- **Supabase** для поиска и JOIN запросов
- **shadcn/ui** компоненты для интерфейса
- **TypeScript** для типизации
- **date-fns** для форматирования дат

### Производительность

- Debounce для оптимизации запросов
- Server-side поиск и фильтрация
- Suspense для загрузочных состояний
- Ограничение результатов (20 записей)

### UI/UX

- Интуитивный поиск с примерами
- Адаптивный дизайн карточек
- Статусные бейджи для событий
- Детализация событий с JSON payload
- Навигация между страницами

### Данные

- Поиск по `cntr_no` и `bill_of_lading`
- JOIN с таблицами `voyages` и `container_events`
- Сортировка по `last_status_time`
- Отображение последних 3 событий в карточке

## Примечания

- Использовать debounce для оптимизации запросов
- Добавить индексы для быстрого поиска по cntr_no и bill_of_lading
- Кэшировать результаты поиска
- Оптимизировать запросы с JOIN
- Добавить автодополнение для популярных номеров
