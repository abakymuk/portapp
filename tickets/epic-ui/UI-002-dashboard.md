# UI-002 · Dashboard

**Статус**: ⏳ Ожидает  
**Milestone**: D  
**Приоритет**: Высокий  
**EPIC**: UI - Интерфейс

## Описание

Создание главной страницы с KPI, графиками и таблицей ближайших рейсов.

## Задачи

- [ ] Создать `app/page.tsx` с Server Components
- [ ] Реализовать компоненты KPI
- [ ] Создать `UpcomingTable` для рейсов
- [ ] Создать `DwellChart` для графика dwell
- [ ] Добавить загрузку данных из MV
- [ ] Настроить responsive дизайн

## Критерии приёмки

- [ ] Отображаются KPI
- [ ] Таблица ближайших рейсов работает
- [ ] График dwell отображается корректно
- [ ] Данные загружаются быстро (<1s)
- [ ] Responsive дизайн работает

## Технические детали

### Главная страница

Создать файл `apps/web/src/app/page.tsx`:

```typescript
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { KPICard } from '@/components/dashboard/kpi-card'
import { UpcomingTable } from '@/components/dashboard/upcoming-table'
import { DwellChart } from '@/components/dashboard/dwell-chart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default async function DashboardPage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">PortOps Dashboard</h1>
        <p className="text-muted-foreground">
          Мониторинг рейсов и контейнеров в порту
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Suspense fallback={<KPISkeleton />}>
          <KPICard 
            title="Рейсы сегодня"
            metric="today_voyages"
            description="Количество рейсов сегодня"
          />
        </Suspense>
        
        <Suspense fallback={<KPISkeleton />}>
          <KPICard 
            title="Доступные контейнеры"
            metric="available_containers"
            description="Контейнеры готовые к вывозу"
          />
        </Suspense>
        
        <Suspense fallback={<KPISkeleton />}>
          <KPICard 
            title="Средний dwell"
            metric="avg_dwell"
            description="Среднее время простоя (часы)"
          />
        </Suspense>
        
        <Suspense fallback={<KPISkeleton />}>
          <KPICard 
            title="Активные заказы"
            metric="active_orders"
            description="Заказы в работе"
          />
        </Suspense>
      </div>

      {/* Charts and Tables */}
      <div className="grid gap-8 md:grid-cols-2">
        {/* Upcoming Voyages */}
        <Card>
          <CardHeader>
            <CardTitle>Ближайшие рейсы</CardTitle>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<TableSkeleton />}>
              <UpcomingTable />
            </Suspense>
          </CardContent>
        </Card>

        {/* Dwell Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Dwell Time Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<ChartSkeleton />}>
              <DwellChart />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function KPISkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-16 mb-2" />
        <Skeleton className="h-3 w-32" />
      </CardContent>
    </Card>
  )
}

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
      ))}
    </div>
  )
}

function ChartSkeleton() {
  return <Skeleton className="h-64 w-full" />
}
```

### KPI компонент

Создать файл `apps/web/src/components/dashboard/kpi-card.tsx`:

```typescript
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface KPICardProps {
  title: string
  metric: string
  description: string
}

export async function KPICard({ title, metric, description }: KPICardProps) {
  const supabase = createClient()
  
  let value: string | number = '0'
  let trend: 'up' | 'down' | 'neutral' = 'neutral'
  let trendValue = 0

  try {
    switch (metric) {
      case 'today_voyages':
        const { count: voyagesCount } = await supabase
          .from('mv_upcoming_voyages')
          .select('*', { count: 'exact', head: true })
          .gte('eta', new Date().toISOString().split('T')[0])
          .lt('eta', new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        
        value = voyagesCount?.toString() || '0'
        break

      case 'available_containers':
        const { count: containersCount } = await supabase
          .from('containers')
          .select('*', { count: 'exact', head: true })
          .eq('last_known_status', 'available')
        
        value = containersCount?.toString() || '0'
        break

      case 'avg_dwell':
        const { data: dwellData } = await supabase
          .from('mv_dwell')
          .select('dwell_hours')
          .not('dwell_hours', 'is', null)
          .limit(100)
        
        if (dwellData && dwellData.length > 0) {
          const avgDwell = dwellData.reduce((sum, item) => sum + (item.dwell_hours || 0), 0) / dwellData.length
          value = avgDwell.toFixed(1)
        }
        break

      case 'active_orders':
        const { count: ordersCount } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .in('status', ['submitted', 'in_process'])
        
        value = ordersCount?.toString() || '0'
        break
    }
  } catch (error) {
    console.error('Error fetching KPI data:', error)
  }

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />
      default:
        return <Minus className="h-4 w-4 text-gray-400" />
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {getTrendIcon()}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
        {trend !== 'neutral' && (
          <p className="text-xs text-muted-foreground mt-1">
            {trend === 'up' ? '+' : '-'}{trendValue}% с прошлой недели
          </p>
        )}
      </CardContent>
    </Card>
  )
}
```

### Таблица рейсов

Создать файл `apps/web/src/components/dashboard/upcoming-table.tsx`:

```typescript
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import Link from 'next/link'

export async function UpcomingTable() {
  const supabase = createClient()
  
  const { data: voyages, error } = await supabase
    .from('mv_upcoming_voyages')
    .select('*')
    .gte('eta', new Date().toISOString())
    .lte('eta', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString())
    .order('eta', { ascending: true })
    .limit(10)

  if (error) {
    console.error('Error fetching voyages:', error)
    return <div>Ошибка загрузки данных</div>
  }

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
            <TableHead>Терминал</TableHead>
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
              <TableCell>{voyage.terminal_name}</TableCell>
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
          Нет рейсов в ближайшие 7 дней
        </div>
      )}
    </div>
  )
}
```

### График dwell

Создать файл `apps/web/src/components/dashboard/dwell-chart.tsx`:

```typescript
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/browser'
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'

interface DwellData {
  range: string
  count: number
}

export function DwellChart() {
  const [data, setData] = useState<DwellData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchDwellData() {
      const supabase = createClient()
      
      try {
        const { data: dwellData, error } = await supabase
          .from('mv_dwell')
          .select('dwell_hours')
          .not('dwell_hours', 'is', null)
          .limit(1000)

        if (error) throw error

        // Группировка данных по диапазонам
        const ranges = [
          { min: 0, max: 24, label: '0-24ч' },
          { min: 24, max: 48, label: '24-48ч' },
          { min: 48, max: 72, label: '48-72ч' },
          { min: 72, max: 168, label: '3-7 дней' },
          { min: 168, max: null, label: '7+ дней' }
        ]

        const groupedData = ranges.map(range => ({
          range: range.label,
          count: dwellData?.filter(item => {
            const hours = item.dwell_hours || 0
            return hours >= range.min && (range.max === null || hours < range.max)
          }).length || 0
        }))

        setData(groupedData)
      } catch (error) {
        console.error('Error fetching dwell data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDwellData()
  }, [])

  if (loading) {
    return <div className="h-64 flex items-center justify-center">Загрузка...</div>
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="range" />
        <YAxis />
        <Tooltip 
          formatter={(value: number) => [`${value} контейнеров`, 'Количество']}
          labelFormatter={(label) => `Dwell time: ${label}`}
        />
        <Bar dataKey="count" fill="#3b82f6" />
      </BarChart>
    </ResponsiveContainer>
  )
}
```

### Дополнительные компоненты

Создать файл `apps/web/src/components/ui/skeleton.tsx`:

```typescript
import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

export { Skeleton }
```

## Команды для выполнения

```bash
# Установка зависимостей
cd apps/web
pnpm add date-fns recharts lucide-react

# Создание компонентов
mkdir -p src/components/dashboard
mkdir -p src/components/ui

# Создание файлов
touch src/components/dashboard/kpi-card.tsx
touch src/components/dashboard/upcoming-table.tsx
touch src/components/dashboard/dwell-chart.tsx
touch src/components/ui/skeleton.tsx
```

## Тестирование

### Проверка загрузки данных

```typescript
// Проверка KPI
const kpiData = await fetch('/api/kpi')
console.log('KPI data:', await kpiData.json())

// Проверка рейсов
const voyagesData = await fetch('/api/voyages/upcoming')
console.log('Voyages data:', await voyagesData.json())
```

### Проверка производительности

```bash
# Проверка времени загрузки
curl -w "@curl-format.txt" -o /dev/null -s "http://localhost:3000/"

# Проверка размера бандла
pnpm build
```

## Зависимости

- **UI-001** - Supabase clients (должен быть завершён)
- **DB-004** - Seeds (должен быть завершён)

## Следующие тикеты

- **UI-003** - Arrivals list & details
- **UI-004** - Containers search

## Примечания

- Использовать Server Components для загрузки данных
- Добавить Suspense для улучшения UX
- Оптимизировать запросы к БД
- Использовать кэширование для статических данных
- Добавить error boundaries для обработки ошибок
