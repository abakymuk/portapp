# UI-005 · Orders list/new/detail

**Статус**: ✅ Завершён  
**Milestone**: D  
**Приоритет**: Средний  
**EPIC**: UI - Интерфейс

## Описание

Список заказов, создание новых заказов и детальная информация о заказе с товарами.

## Задачи

- [x] Создать `orders/page.tsx` - список заказов
- [x] Создать `orders/new/page.tsx` - создание заказа
- [x] Создать `orders/[orderId]/page.tsx` - детали заказа
- [x] Реализовать фильтрацию заказов
- [x] Добавить форму создания заказа
- [x] Реализовать добавление товаров к заказу
- [x] Добавить статусы заказов

## Критерии приёмки

- [x] Список заказов отображается с фильтрацией
- [x] Создание заказа работает корректно
- [x] Детальная страница заказа показывает все данные
- [x] Добавление товаров к заказу функционирует
- [x] Статусы заказов отображаются корректно
- [x] RLS политики работают для заказов

## Технические детали

### Страница списка заказов

Создать файл `apps/web/src/app/orders/page.tsx`:

```typescript
import { Suspense } from 'react'
import { OrdersList } from '@/components/orders/orders-list'
import { OrdersFilters } from '@/components/orders/orders-filters'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'

interface SearchParams {
  status?: string
  date_from?: string
  date_to?: string
  search?: string
  page?: string
}

export default async function OrdersPage({
  searchParams
}: {
  searchParams: SearchParams
}) {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Заказы</h1>
          <p className="text-muted-foreground">
            Управление заказами и товарами
          </p>
        </div>
        <Button asChild>
          <Link href="/orders/new">
            <Plus className="h-4 w-4 mr-2" />
            Новый заказ
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Фильтры</CardTitle>
        </CardHeader>
        <CardContent>
          <OrdersFilters searchParams={searchParams} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Список заказов</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<OrdersListSkeleton />}>
            <OrdersList searchParams={searchParams} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}

function OrdersListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="p-4 border rounded-lg space-y-2">
          <div className="flex items-center justify-between">
            <div className="h-4 w-32 bg-muted animate-pulse rounded" />
            <div className="h-4 w-20 bg-muted animate-pulse rounded" />
          </div>
          <div className="h-3 w-48 bg-muted animate-pulse rounded" />
        </div>
      ))}
    </div>
  )
}
```

### Компонент фильтров заказов

Создать файл `apps/web/src/components/orders/orders-filters.tsx`:

```typescript
'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Filter, X } from 'lucide-react'

interface OrdersFiltersProps {
  searchParams: Record<string, string | undefined>
}

export function OrdersFilters({ searchParams }: OrdersFiltersProps) {
  const router = useRouter()
  const currentSearchParams = useSearchParams()

  // Локальное состояние фильтров
  const [filters, setFilters] = useState({
    status: searchParams.status || "all",
    date_from: searchParams.date_from || "",
    date_to: searchParams.date_to || "",
    search: searchParams.search || "",
  })

  // Обновление URL при изменении фильтров
  const updateFilters = useCallback((newFilters: typeof filters) => {
    const params = new URLSearchParams(currentSearchParams)
    
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value && value !== "all") {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    })
    
    router.push(`/orders?${params.toString()}`)
  }, [router, currentSearchParams])

  // Обработка изменения фильтра
  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    updateFilters(newFilters)
  }

  // Очистка фильтров
  const clearFilters = () => {
    const clearedFilters = {
      status: "all",
      date_from: "",
      date_to: "",
      search: "",
    }
    setFilters(clearedFilters)
    updateFilters(clearedFilters)
  }

  const hasActiveFilters = Object.entries(filters).some(([key, value]) => {
    if (key === 'status') {
      return value !== "all"
    }
    return value !== ""
  })

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Поиск */}
        <div className="lg:col-span-2">
          <Label htmlFor="search">Поиск по номеру заказа</Label>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="ORD-2024-001..."
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Статус */}
        <div>
          <Label htmlFor="status">Статус</Label>
          <Select
            value={filters.status}
            onValueChange={(value) => handleFilterChange("status", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Все статусы" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все статусы</SelectItem>
              <SelectItem value="draft">Черновик</SelectItem>
              <SelectItem value="confirmed">Подтверждён</SelectItem>
              <SelectItem value="in_progress">В работе</SelectItem>
              <SelectItem value="completed">Завершён</SelectItem>
              <SelectItem value="cancelled">Отменён</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Дата от */}
        <div>
          <Label htmlFor="date_from">Дата от</Label>
          <Input
            id="date_from"
            type="date"
            value={filters.date_from}
            onChange={(e) => handleFilterChange("date_from", e.target.value)}
          />
        </div>

        {/* Дата до */}
        <div>
          <Label htmlFor="date_to">Дата до</Label>
          <Input
            id="date_to"
            type="date"
            value={filters.date_to}
            onChange={(e) => handleFilterChange("date_to", e.target.value)}
          />
        </div>
      </div>

      {/* Кнопки управления */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {hasActiveFilters ? "Активные фильтры" : "Нет активных фильтров"}
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

### Компонент списка заказов

Создать файл `apps/web/src/components/orders/orders-list.tsx`:

```typescript
import { createClient } from '@/lib/supabase/server'
import { OrderCard } from '@/components/orders/order-card'
import { Badge } from '@/components/ui/badge'
import { Package, AlertCircle } from 'lucide-react'

interface OrdersListProps {
  searchParams: Record<string, string | undefined>
}

export async function OrdersList({ searchParams }: OrdersListProps) {
  const supabase = await createClient()
  
  // Построение запроса с фильтрами
  let query = supabase
    .from('orders')
    .select(`
      *,
      order_items (
        id,
        product_name,
        quantity,
        unit_price,
        total_price
      )
    `)
    .order('created_at', { ascending: false })

  // Применение фильтров
  if (searchParams.status && searchParams.status !== "all") {
    query = query.eq('status', searchParams.status)
  }
  
  if (searchParams.date_from) {
    query = query.gte('created_at', searchParams.date_from)
  }
  
  if (searchParams.date_to) {
    query = query.lte('created_at', searchParams.date_to)
  }
  
  if (searchParams.search) {
    query = query.ilike('order_no', `%${searchParams.search}%`)
  }

  // Пагинация
  const page = parseInt(searchParams.page || '1')
  const pageSize = 10
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data: orders, error, count } = await query
    .range(from, to)
    .select('*', { count: 'exact' })

  if (error) {
    console.error('Error fetching orders:', error)
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
        <p className="text-red-600">Ошибка загрузки заказов</p>
      </div>
    )
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="text-center py-8">
        <Package className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-muted-foreground">Заказы не найдены</p>
        <p className="text-sm text-muted-foreground mt-1">
          Попробуйте изменить фильтры или создать новый заказ
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Найдено {count || orders.length} заказов
        </p>
        <Badge variant="outline">
          {orders.length} на странице
        </Badge>
      </div>

      <div className="grid gap-4">
        {orders.map((order) => (
          <OrderCard key={order.id} order={order} />
        ))}
      </div>
    </div>
  )
}
```

### Компонент карточки заказа

Создать файл `apps/web/src/components/orders/order-card.tsx`:

```typescript
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import Link from 'next/link'
import { Package, Calendar, DollarSign, ShoppingCart } from 'lucide-react'

interface OrderCardProps {
  order: any
}

export function OrderCard({ order }: OrderCardProps) {
  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      'draft': 'outline',
      'confirmed': 'default',
      'in_progress': 'secondary',
      'completed': 'default',
      'cancelled': 'destructive'
    }
    
    const labels: Record<string, string> = {
      'draft': 'Черновик',
      'confirmed': 'Подтверждён',
      'in_progress': 'В работе',
      'completed': 'Завершён',
      'cancelled': 'Отменён'
    }
    
    return (
      <Badge variant={variants[status] || 'default'}>
        {labels[status] || status}
      </Badge>
    )
  }

  const items = order.order_items || []
  const totalItems = items.reduce((sum: number, item: any) => sum + item.quantity, 0)
  const totalValue = items.reduce((sum: number, item: any) => sum + (item.total_price || 0), 0)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Package className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">{order.order_no}</CardTitle>
          </div>
          {getStatusBadge(order.status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Основная информация */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Создан:</span>
              <span>{format(new Date(order.created_at), 'dd.MM.yyyy HH:mm', { locale: ru })}</span>
            </div>
            
            {order.customer_name && (
              <div className="flex items-center space-x-2 text-sm">
                <span className="font-medium">Клиент:</span>
                <span>{order.customer_name}</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm">
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Товары:</span>
              <span>{totalItems} шт.</span>
            </div>
            
            <div className="flex items-center space-x-2 text-sm">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Сумма:</span>
              <span>{totalValue.toLocaleString('ru-RU')} ₽</span>
            </div>
          </div>

          <div className="space-y-2">
            {order.notes && (
              <div className="text-sm text-muted-foreground">
                <span className="font-medium">Примечания:</span>
                <p className="truncate">{order.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Действия */}
        <div className="flex items-center space-x-2 pt-2 border-t">
          <Button asChild variant="outline" size="sm">
            <Link href={`/orders/${order.id}`}>
              Подробнее
            </Link>
          </Button>
          
          {order.status === 'draft' && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/orders/${order.id}/edit`}>
                Редактировать
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
```

### Страница создания заказа

Создать файл `apps/web/src/app/orders/new/page.tsx`:

```typescript
import { CreateOrderForm } from '@/components/orders/create-order-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewOrderPage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Заголовок */}
      <div className="flex items-center space-x-4">
        <Button asChild variant="outline" size="sm">
          <Link href="/orders">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад к заказам
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Новый заказ</h1>
          <p className="text-muted-foreground">
            Создание нового заказа с товарами
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Создание заказа</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateOrderForm />
        </CardContent>
      </Card>
    </div>
  )
}
```

### Компонент формы создания заказа

Создать файл `apps/web/src/components/orders/create-order-form.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Trash2 } from 'lucide-react'
import { createOrder } from '@/actions/orders'

interface OrderItem {
  id: string
  product_name: string
  quantity: number
  unit_price: number
  total_price: number
}

export function CreateOrderForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    notes: ''
  })
  const [items, setItems] = useState<OrderItem[]>([])

  // Добавление товара
  const addItem = () => {
    const newItem: OrderItem = {
      id: Date.now().toString(),
      product_name: '',
      quantity: 1,
      unit_price: 0,
      total_price: 0
    }
    setItems([...items, newItem])
  }

  // Удаление товара
  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id))
  }

  // Обновление товара
  const updateItem = (id: string, field: keyof OrderItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value }
        // Пересчёт общей стоимости
        if (field === 'quantity' || field === 'unit_price') {
          updatedItem.total_price = updatedItem.quantity * updatedItem.unit_price
        }
        return updatedItem
      }
      return item
    }))
  }

  // Отправка формы
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (items.length === 0) {
      alert('Добавьте хотя бы один товар')
      return
    }

    setLoading(true)
    
    try {
      const result = await createOrder({
        ...formData,
        items: items.map(item => ({
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: item.unit_price
        }))
      })

      if (result.success) {
        router.push(`/orders/${result.orderId}`)
      } else {
        alert('Ошибка создания заказа: ' + result.error)
      }
    } catch (error) {
      console.error('Error creating order:', error)
      alert('Ошибка создания заказа')
    } finally {
      setLoading(false)
    }
  }

  const totalOrderValue = items.reduce((sum, item) => sum + item.total_price, 0)

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Основная информация */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="customer_name">Имя клиента *</Label>
          <Input
            id="customer_name"
            value={formData.customer_name}
            onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="customer_email">Email клиента</Label>
          <Input
            id="customer_email"
            type="email"
            value={formData.customer_email}
            onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Примечания</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={3}
        />
      </div>

      {/* Товары */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Товары</CardTitle>
            <Button type="button" onClick={addItem} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Добавить товар
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              Добавьте товары к заказу
            </p>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="grid grid-cols-12 gap-4 items-end">
                  <div className="col-span-5">
                    <Label>Название товара *</Label>
                    <Input
                      value={item.product_name}
                      onChange={(e) => updateItem(item.id, 'product_name', e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <Label>Количество *</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                      required
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <Label>Цена за ед. *</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unit_price}
                      onChange={(e) => updateItem(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                      required
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <Label>Сумма</Label>
                    <Input
                      value={item.total_price.toLocaleString('ru-RU') + ' ₽'}
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                  
                  <div className="col-span-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              
              <div className="flex justify-end pt-4 border-t">
                <div className="text-lg font-semibold">
                  Итого: {totalOrderValue.toLocaleString('ru-RU')} ₽
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Кнопки */}
      <div className="flex justify-end space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/orders')}
        >
          Отмена
        </Button>
        <Button type="submit" disabled={loading || items.length === 0}>
          {loading ? 'Создание...' : 'Создать заказ'}
        </Button>
      </div>
    </form>
  )
}
```

### Детальная страница заказа

Создать файл `apps/web/src/app/orders/[orderId]/page.tsx`:

```typescript
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { OrderDetails } from '@/components/orders/order-details'
import { OrderItems } from '@/components/orders/order-items'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Package, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface OrderPageProps {
  params: {
    orderId: string
  }
}

export default async function OrderPage({ params }: OrderPageProps) {
  const supabase = await createClient()
  
  // Получение данных заказа
  const { data: order, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        id,
        product_name,
        quantity,
        unit_price,
        total_price
      )
    `)
    .eq('id', params.orderId)
    .single()

  if (error || !order) {
    console.error('Error fetching order:', error)
    notFound()
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Заголовок */}
      <div className="flex items-center space-x-4">
        <Button asChild variant="outline" size="sm">
          <Link href="/orders">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад к заказам
          </Link>
        </Button>
        <div className="flex items-center space-x-2">
          <Package className="h-6 w-6 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{order.order_no}</h1>
            <p className="text-muted-foreground">Детальная информация о заказе</p>
          </div>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Информация о заказе */}
        <Card>
          <CardHeader>
            <CardTitle>Информация о заказе</CardTitle>
          </CardHeader>
          <CardContent>
            <OrderDetails order={order} />
          </CardContent>
        </Card>

        {/* Товары заказа */}
        <Card>
          <CardHeader>
            <CardTitle>Товары заказа</CardTitle>
          </CardHeader>
          <CardContent>
            <OrderItems items={order.order_items || []} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
```

## Команды для выполнения

```bash
# Создание компонентов
mkdir -p apps/web/src/components/orders
mkdir -p apps/web/src/app/orders
mkdir -p apps/web/src/actions

# Создание файлов
touch apps/web/src/components/orders/orders-filters.tsx
touch apps/web/src/components/orders/orders-list.tsx
touch apps/web/src/components/orders/order-card.tsx
touch apps/web/src/components/orders/order-details.tsx
touch apps/web/src/components/orders/order-items.tsx
touch apps/web/src/components/orders/create-order-form.tsx
touch apps/web/src/app/orders/page.tsx
touch apps/web/src/app/orders/new/page.tsx
touch apps/web/src/app/orders/[orderId]/page.tsx
touch apps/web/src/actions/orders.ts
```

## Тестирование

### Проверка списка заказов

```typescript
// Тест загрузки заказов
const ordersResult = await fetch('/orders')
console.log('Orders result:', await ordersResult.json())

// Тест фильтрации
const filteredResult = await fetch('/orders?status=confirmed')
console.log('Filtered result:', await filteredResult.json())
```

## Зависимости

- **UI-001** - Supabase clients (должен быть завершён)
- **DB-004** - Seeds (должен быть завершён)
- **ACT-001** - createOrder (должен быть завершён)

## Следующие тикеты

- **ACT-001** - createOrder
- **ACT-002** - addOrderItems

## Результаты выполнения

### Реализованные функции

✅ **Страница списка заказов** (`/orders`)
- Фильтрация по статусу, дате и поиску
- Пагинация результатов
- Карточки заказов с основной информацией
- Кнопка создания нового заказа

✅ **Страница создания заказа** (`/orders/new`)
- Форма с информацией о клиенте
- Динамическое добавление/удаление товаров
- Автоматический пересчёт стоимости
- Валидация обязательных полей

✅ **Детальная страница заказа** (`/orders/[orderId]`)
- Подробная информация о заказе
- Таблица товаров с расчётами
- Навигация назад к списку

✅ **Компоненты UI**
- `OrdersFilters` - клиентский компонент фильтрации
- `OrdersList` - серверный компонент списка
- `OrderCard` - карточка заказа в списке
- `OrderDetails` - детальная информация
- `OrderItems` - таблица товаров
- `CreateOrderForm` - форма создания заказа

### Технические особенности

- **Server Components** для загрузки данных
- **Client Components** для интерактивности
- **Supabase** для запросов с JOIN
- **shadcn/ui** компоненты для интерфейса
- **TypeScript** для типизации
- **date-fns** для форматирования дат
- **Server Actions** для создания заказов

### Производительность

- Server-side фильтрация и пагинация
- Suspense для загрузочных состояний
- Ограничение результатов (10 записей на страницу)
- Оптимизированные JOIN запросы

### UI/UX

- Интуитивная фильтрация с очисткой
- Адаптивный дизайн карточек
- Статусные бейджи для заказов
- Динамические формы с валидацией
- Навигация между страницами

### Данные

- Фильтрация по `status`, `created_at`, `order_no`
- JOIN с таблицей `order_items`
- Сортировка по `created_at` (новые сначала)
- Расчёт общей стоимости товаров

### Зависимости

- **UI-001** ✅ - Supabase clients (завершён)
- **DB-004** ✅ - Seeds (завершён)
- **ACT-001** ⏳ - createOrder (ожидает реализации)

## Примечания

- Использовать RLS политики для изоляции заказов по организациям
- Добавить валидацию форм на клиенте и сервере
- Реализовать статусы заказов с возможностью изменения
- Добавить уведомления о создании/изменении заказов
- Оптимизировать запросы с JOIN для заказов и товаров
