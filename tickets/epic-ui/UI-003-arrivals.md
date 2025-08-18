# UI-003 · Arrivals list & details

**Статус**: ⏳ Ожидает  
**Milestone**: D  
**Приоритет**: Высокий  
**EPIC**: UI - Интерфейс

## Описание

Страницы списка рейсов с фильтрами и детальной информации о рейсе с контейнерами.

## Задачи

- [ ] Создать `arrivals/page.tsx` с фильтрами
- [ ] Создать `arrivals/[voyageId]/page.tsx`
- [ ] Реализовать фильтры по дате, терминалу, линии
- [ ] Добавить отображение контейнеров рейса
- [ ] Реализовать пагинацию
- [ ] Добавить поиск по номеру рейса

## Критерии приёмки

- [ ] Фильтры применяются корректно
- [ ] Детальная страница отображает контейнеры
- [ ] Навигация работает плавно
- [ ] Пагинация функционирует
- [ ] Поиск работает быстро

## Технические детали

### Страница списка рейсов

Создать файл `apps/web/src/app/arrivals/page.tsx`:

```typescript
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { ArrivalsList } from '@/components/arrivals/arrivals-list'
import { ArrivalsFilters } from '@/components/arrivals/arrivals-filters'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface SearchParams {
  date_from?: string
  date_to?: string
  terminal?: string
  line?: string
  search?: string
  page?: string
}

export default async function ArrivalsPage({
  searchParams
}: {
  searchParams: SearchParams
}) {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Рейсы</h1>
        <p className="text-muted-foreground">
          Список всех рейсов с фильтрацией и поиском
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Фильтры</CardTitle>
        </CardHeader>
        <CardContent>
          <ArrivalsFilters searchParams={searchParams} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Список рейсов</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<ArrivalsListSkeleton />}>
            <ArrivalsList searchParams={searchParams} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}

function ArrivalsListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  )
}
```

### Компонент фильтров

Создать файл `apps/web/src/components/arrivals/arrivals-filters.tsx`:

```typescript
'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/browser'
import { Search, Filter, X } from 'lucide-react'

interface ArrivalsFiltersProps {
  searchParams: Record<string, string | undefined>
}

export function ArrivalsFilters({ searchParams }: ArrivalsFiltersProps) {
  const router = useRouter()
  const currentSearchParams = useSearchParams()
  
  const [terminals, setTerminals] = useState<Array<{ id: string; name: string }>>([])
  const [lines, setLines] = useState<Array<{ id: string; name: string }>>([])
  const [loading, setLoading] = useState(true)

  // Локальное состояние фильтров
  const [filters, setFilters] = useState({
    date_from: searchParams.date_from || '',
    date_to: searchParams.date_to || '',
    terminal: searchParams.terminal || '',
    line: searchParams.line || '',
    search: searchParams.search || ''
  })

  // Загрузка справочников
  useEffect(() => {
    async function loadReferences() {
      const supabase = createClient()
      
      try {
        const [terminalsResult, linesResult] = await Promise.all([
          supabase.from('terminals').select('id, name').order('name'),
          supabase.from('shipping_lines').select('id, name').order('name')
        ])

        if (terminalsResult.data) setTerminals(terminalsResult.data)
        if (linesResult.data) setLines(linesResult.data)
      } catch (error) {
        console.error('Error loading references:', error)
      } finally {
        setLoading(false)
      }
    }

    loadReferences()
  }, [])

  // Обновление URL при изменении фильтров
  const updateFilters = useCallback((newFilters: typeof filters) => {
    const params = new URLSearchParams(currentSearchParams)
    
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    })
    
    // Сброс страницы при изменении фильтров
    params.delete('page')
    
    router.push(`/arrivals?${params.toString()}`)
  }, [router, currentSearchParams])

  // Обработчики изменений
  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    updateFilters(newFilters)
  }

  const clearFilters = () => {
    const clearedFilters = {
      date_from: '',
      date_to: '',
      terminal: '',
      line: '',
      search: ''
    }
    setFilters(clearedFilters)
    updateFilters(clearedFilters)
  }

  const hasActiveFilters = Object.values(filters).some(value => value !== '')

  if (loading) {
    return <div>Загрузка фильтров...</div>
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Поиск */}
        <div className="lg:col-span-2">
          <Label htmlFor="search">Поиск по номеру рейса</Label>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="MSC123E..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Дата от */}
        <div>
          <Label htmlFor="date_from">Дата от</Label>
          <Input
            id="date_from"
            type="date"
            value={filters.date_from}
            onChange={(e) => handleFilterChange('date_from', e.target.value)}
          />
        </div>

        {/* Дата до */}
        <div>
          <Label htmlFor="date_to">Дата до</Label>
          <Input
            id="date_to"
            type="date"
            value={filters.date_to}
            onChange={(e) => handleFilterChange('date_to', e.target.value)}
          />
        </div>

        {/* Терминал */}
        <div>
          <Label htmlFor="terminal">Терминал</Label>
          <Select value={filters.terminal} onValueChange={(value) => handleFilterChange('terminal', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Все терминалы" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Все терминалы</SelectItem>
              {terminals.map((terminal) => (
                <SelectItem key={terminal.id} value={terminal.id}>
                  {terminal.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Линия */}
        <div>
          <Label htmlFor="line">Линия</Label>
          <Select value={filters.line} onValueChange={(value) => handleFilterChange('line', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Все линии" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Все линии</SelectItem>
              {lines.map((line) => (
                <SelectItem key={line.id} value={line.id}>
                  {line.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Кнопки управления */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {hasActiveFilters ? 'Активные фильтры' : 'Нет активных фильтров'}
          </span>
        </div>
        
        {hasActiveFilters && (
          <Button variant="outline" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-2" />
            Очистить фильтры
          </Button>
        )}
      </div>
    </div>
  )
}
```

### Компонент списка рейсов

Создать файл `apps/web/src/components/arrivals/arrivals-list.tsx`:

```typescript
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import Link from 'next/link'

interface ArrivalsListProps {
  searchParams: Record<string, string | undefined>
}

export async function ArrivalsList({ searchParams }: ArrivalsListProps) {
  const supabase = createClient()
  
  // Построение запроса с фильтрами
  let query = supabase
    .from('mv_upcoming_voyages')
    .select('*')
    .order('eta', { ascending: true })

  // Применение фильтров
  if (searchParams.date_from) {
    query = query.gte('eta', searchParams.date_from)
  }
  
  if (searchParams.date_to) {
    query = query.lte('eta', searchParams.date_to)
  }
  
  if (searchParams.terminal) {
    query = query.eq('terminal_id', searchParams.terminal)
  }
  
  if (searchParams.line) {
    query = query.eq('line_id', searchParams.line)
  }
  
  if (searchParams.search) {
    query = query.ilike('voyage_no', `%${searchParams.search}%`)
  }

  // Пагинация
  const page = parseInt(searchParams.page || '1')
  const pageSize = 20
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  query = query.range(from, to)

  const { data: voyages, error, count } = await query

  if (error) {
    console.error('Error fetching voyages:', error)
    return <div>Ошибка загрузки данных</div>
  }

  const totalPages = count ? Math.ceil(count / pageSize) : 0

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      'scheduled': 'default',
      'arrived': 'secondary',
      'departed': 'outline',
      'canceled': 'destructive'
    }
    
    return (
      <Badge variant={variants[status] || 'default'}>
        {status === 'scheduled' && 'Запланирован'}
        {status === 'arrived' && 'Прибыл'}
        {status === 'departed' && 'Отбыл'}
        {status === 'canceled' && 'Отменён'}
      </Badge>
    )
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Судно</TableHead>
            <TableHead>Рейс</TableHead>
            <TableHead>ETA</TableHead>
            <TableHead>ETD</TableHead>
            <TableHead>Терминал</TableHead>
            <TableHead>Линия</TableHead>
            <TableHead>Контейнеры</TableHead>
            <TableHead>Статус</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {voyages?.map((voyage) => (
            <TableRow key={voyage.id}>
              <TableCell className="font-medium">{voyage.vessel_name}</TableCell>
              <TableCell>{voyage.voyage_no}</TableCell>
              <TableCell>
                {voyage.eta ? format(new Date(voyage.eta), 'dd.MM.yyyy HH:mm', { locale: ru }) : '-'}
              </TableCell>
              <TableCell>
                {voyage.etd ? format(new Date(voyage.etd), 'dd.MM.yyyy HH:mm', { locale: ru }) : '-'}
              </TableCell>
              <TableCell>{voyage.terminal_name}</TableCell>
              <TableCell>{voyage.line_name}</TableCell>
              <TableCell>
                {voyage.containers_available}/{voyage.containers_total}
              </TableCell>
              <TableCell>{getStatusBadge(voyage.status)}</TableCell>
              <TableCell>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/arrivals/${voyage.id}`}>
                    Детали
                  </Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      {(!voyages || voyages.length === 0) && (
        <div className="text-center py-8 text-muted-foreground">
          Рейсы не найдены
        </div>
      )}

      {/* Пагинация */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Показано {from + 1}-{Math.min(to + 1, count || 0)} из {count} рейсов
          </div>
          <div className="flex items-center space-x-2">
            {page > 1 && (
              <Button asChild variant="outline" size="sm">
                <Link href={`/arrivals?${new URLSearchParams({ ...searchParams, page: (page - 1).toString() })}`}>
                  Назад
                </Link>
              </Button>
            )}
            <span className="text-sm">
              Страница {page} из {totalPages}
            </span>
            {page < totalPages && (
              <Button asChild variant="outline" size="sm">
                <Link href={`/arrivals?${new URLSearchParams({ ...searchParams, page: (page + 1).toString() })}`}>
                  Вперёд
                </Link>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
```

### Детальная страница рейса

Создать файл `apps/web/src/app/arrivals/[voyageId]/page.tsx`:

```typescript
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { VoyageDetails } from '@/components/arrivals/voyage-details'
import { ContainersList } from '@/components/arrivals/containers-list'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface VoyagePageProps {
  params: {
    voyageId: string
  }
}

export default async function VoyagePage({ params }: VoyagePageProps) {
  const supabase = createClient()
  
  // Получение данных рейса
  const { data: voyage, error } = await supabase
    .from('mv_upcoming_voyages')
    .select('*')
    .eq('id', params.voyageId)
    .single()

  if (error || !voyage) {
    notFound()
  }

  // Получение контейнеров рейса
  const { data: containers } = await supabase
    .from('containers')
    .select(`
      *,
      container_events (
        event_type,
        event_time,
        payload
      )
    `)
    .eq('voyage_id', params.voyageId)
    .order('cntr_no')

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      'scheduled': 'default',
      'arrived': 'secondary',
      'departed': 'outline',
      'canceled': 'destructive'
    }
    
    return (
      <Badge variant={variants[status] || 'default'}>
        {status === 'scheduled' && 'Запланирован'}
        {status === 'arrived' && 'Прибыл'}
        {status === 'departed' && 'Отбыл'}
        {status === 'canceled' && 'Отменён'}
      </Badge>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Заголовок */}
      <div className="flex items-center space-x-4">
        <Button asChild variant="outline" size="sm">
          <Link href="/arrivals">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад к списку
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{voyage.vessel_name}</h1>
          <p className="text-muted-foreground">Рейс {voyage.voyage_no}</p>
        </div>
      </div>

      {/* Информация о рейсе */}
      <VoyageDetails voyage={voyage} />

      {/* Контейнеры */}
      <Card>
        <CardHeader>
          <CardTitle>Контейнеры рейса ({containers?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <ContainersList containers={containers || []} />
        </CardContent>
      </Card>
    </div>
  )
}
```

## Команды для выполнения

```bash
# Создание компонентов
mkdir -p apps/web/src/components/arrivals
mkdir -p apps/web/src/app/arrivals

# Создание файлов
touch apps/web/src/components/arrivals/arrivals-filters.tsx
touch apps/web/src/components/arrivals/arrivals-list.tsx
touch apps/web/src/components/arrivals/voyage-details.tsx
touch apps/web/src/components/arrivals/containers-list.tsx
touch apps/web/src/app/arrivals/page.tsx
touch apps/web/src/app/arrivals/[voyageId]/page.tsx
```

## Тестирование

### Проверка фильтров

```typescript
// Тест фильтрации по дате
const filteredData = await fetch('/arrivals?date_from=2024-01-01&date_to=2024-01-31')
console.log('Filtered data:', await filteredData.json())

// Тест поиска
const searchData = await fetch('/arrivals?search=MSC')
console.log('Search results:', await searchData.json())
```

## Зависимости

- **UI-001** - Supabase clients (должен быть завершён)
- **UI-002** - Dashboard (должен быть завершён)
- **DB-004** - Seeds (должен быть завершён)

## Следующие тикеты

- **UI-004** - Containers search
- **UI-005** - Orders list/new/detail

## Примечания

- Использовать server-side фильтрацию для производительности
- Добавить debounce для поиска
- Кэшировать справочники терминалов и линий
- Оптимизировать запросы с пагинацией
- Добавить индексы для быстрого поиска
