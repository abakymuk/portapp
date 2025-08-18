# ACT-001 · createOrder

**Статус**: ⏳ Ожидает  
**Milestone**: E  
**Приоритет**: Высокий  
**EPIC**: ACTIONS - Server Actions & Mutations

## Описание

Server Action для создания заказа с валидацией и RLS поддержкой.

## Задачи

- [ ] Создать `actions/orders.ts`
- [ ] Реализовать валидацию `order_no`
- [ ] Добавить запись в таблицу `orders`
- [ ] Обеспечить работу с RLS
- [ ] Добавить обработку ошибок
- [ ] Реализовать revalidation
- [ ] Добавить типы TypeScript

## Критерии приёмки

- [ ] При валидном order_no запись создаётся в orders
- [ ] RLS пропускает с org_id
- [ ] Валидация работает корректно
- [ ] Ошибки обрабатываются и отображаются
- [ ] UI обновляется после создания заказа

## Технические детали

### Server Action

Создать файл `apps/web/src/actions/orders.ts`:

```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/supabase/utils'

export interface CreateOrderData {
  orderNo: string
  requestedPickupAt?: string
  note?: string
}

export interface CreateOrderResult {
  success: boolean
  data?: any
  error?: string
}

export async function createOrder(formData: FormData): Promise<CreateOrderResult> {
  try {
    // Получение данных из формы
    const orderNo = formData.get('orderNo') as string
    const requestedPickupAt = formData.get('requestedPickupAt') as string
    const note = formData.get('note') as string

    // Валидация
    if (!orderNo || orderNo.trim().length === 0) {
      return {
        success: false,
        error: 'Order number is required'
      }
    }

    if (orderNo.length > 50) {
      return {
        success: false,
        error: 'Order number must be less than 50 characters'
      }
    }

    // Получение текущего пользователя
    const user = await getCurrentUser()
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated'
      }
    }

    // Получение org_id из JWT
    const orgId = user.user_metadata?.org_id
    if (!orgId) {
      return {
        success: false,
        error: 'Organization not found in user metadata'
      }
    }

    // Создание клиента Supabase
    const supabase = createClient()

    // Проверка уникальности order_no
    const { data: existingOrder, error: checkError } = await supabase
      .from('orders')
      .select('id')
      .eq('order_no', orderNo.trim())
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      return {
        success: false,
        error: 'Error checking order number uniqueness'
      }
    }

    if (existingOrder) {
      return {
        success: false,
        error: 'Order number already exists'
      }
    }

    // Создание заказа
    const { data, error } = await supabase
      .from('orders')
      .insert({
        order_no: orderNo.trim(),
        org_id: orgId,
        created_by: user.id,
        requested_pickup_at: requestedPickupAt || null,
        note: note || null,
        status: 'draft'
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating order:', error)
      return {
        success: false,
        error: 'Failed to create order'
      }
    }

    // Обновление кэша
    revalidatePath('/orders')
    revalidatePath('/')

    return {
      success: true,
      data
    }

  } catch (error) {
    console.error('Unexpected error in createOrder:', error)
    return {
      success: false,
      error: 'An unexpected error occurred'
    }
  }
}

// Альтернативная функция с объектом данных
export async function createOrderWithData(data: CreateOrderData): Promise<CreateOrderResult> {
  try {
    // Валидация
    if (!data.orderNo || data.orderNo.trim().length === 0) {
      return {
        success: false,
        error: 'Order number is required'
      }
    }

    if (data.orderNo.length > 50) {
      return {
        success: false,
        error: 'Order number must be less than 50 characters'
      }
    }

    // Получение текущего пользователя
    const user = await getCurrentUser()
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated'
      }
    }

    // Получение org_id из JWT
    const orgId = user.user_metadata?.org_id
    if (!orgId) {
      return {
        success: false,
        error: 'Organization not found in user metadata'
      }
    }

    // Создание клиента Supabase
    const supabase = createClient()

    // Создание заказа
    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        order_no: data.orderNo.trim(),
        org_id: orgId,
        created_by: user.id,
        requested_pickup_at: data.requestedPickupAt || null,
        note: data.note || null,
        status: 'draft'
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating order:', error)
      return {
        success: false,
        error: 'Failed to create order'
      }
    }

    // Обновление кэша
    revalidatePath('/orders')
    revalidatePath('/')

    return {
      success: true,
      data: order
    }

  } catch (error) {
    console.error('Unexpected error in createOrderWithData:', error)
    return {
      success: false,
      error: 'An unexpected error occurred'
    }
  }
}
```

### Компонент формы

Создать файл `apps/web/src/components/orders/create-order-form.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { createOrder } from '@/actions/orders'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useRouter } from 'next/navigation'

export function CreateOrderForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleSubmit(formData: FormData) {
    setIsLoading(true)
    setError(null)

    const result = await createOrder(formData)

    if (result.success) {
      // Перенаправление на страницу заказа
      router.push(`/orders/${result.data.id}`)
    } else {
      setError(result.error || 'Failed to create order')
    }

    setIsLoading(false)
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Create New Order</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="orderNo">Order Number *</Label>
            <Input
              id="orderNo"
              name="orderNo"
              type="text"
              required
              placeholder="Enter order number"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="requestedPickupAt">Requested Pickup Date</Label>
            <Input
              id="requestedPickupAt"
              name="requestedPickupAt"
              type="datetime-local"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Notes</Label>
            <Textarea
              id="note"
              name="note"
              placeholder="Additional notes..."
              disabled={isLoading}
              rows={3}
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm">
              {error}
            </div>
          )}

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? 'Creating...' : 'Create Order'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
```

### Страница создания заказа

Создать файл `apps/web/src/app/orders/new/page.tsx`:

```typescript
import { CreateOrderForm } from '@/components/orders/create-order-form'

export default function NewOrderPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-center">
        <CreateOrderForm />
      </div>
    </div>
  )
}
```

## Команды для выполнения

```bash
# Создание файлов
mkdir -p apps/web/src/actions
mkdir -p apps/web/src/components/orders

# Создание файлов
touch apps/web/src/actions/orders.ts
touch apps/web/src/components/orders/create-order-form.tsx
touch apps/web/src/app/orders/new/page.tsx
```

## Тестирование

### Тест валидации

```typescript
// Тест с пустым order_no
const result1 = await createOrder(new FormData())
// result1.success = false, result1.error = 'Order number is required'

// Тест с длинным order_no
const formData = new FormData()
formData.append('orderNo', 'a'.repeat(51))
const result2 = await createOrder(formData)
// result2.success = false, result2.error = 'Order number must be less than 50 characters'
```

### Тест создания

```typescript
// Успешное создание
const formData = new FormData()
formData.append('orderNo', 'TEST-001')
formData.append('note', 'Test order')
const result = await createOrder(formData)
// result.success = true, result.data содержит созданный заказ
```

## Зависимости

- **UI-001** - Supabase clients (должен быть завершён)
- **DB-003** - RLS policies (должен быть завершён)

## Следующие тикеты

- **ACT-002** - addOrderItems (bulk)
- **UI-005** - Orders list/new/detail

## Примечания

- Использовать `revalidatePath` для обновления UI
- Проверять уникальность order_no
- Валидировать данные на сервере
- Обрабатывать все возможные ошибки
- Использовать RLS для изоляции данных по организациям
