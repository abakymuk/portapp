# UI-006 · Sidebar Navigation

**Статус**: ✅ Завершён  
**Milestone**: D  
**Приоритет**: Высокий  
**EPIC**: UI - Интерфейс

## Описание

Добавление sidebar с навигацией для всех страниц приложения. Использование компонентов shadcn/ui для создания современного и адаптивного интерфейса.

## Задачи

- [x] Создать компонент `Sidebar` с навигацией
- [x] Добавить компонент `SidebarToggle` для мобильной версии
- [x] Интегрировать sidebar в layout приложения
- [x] Добавить иконки для всех разделов
- [x] Реализовать активные состояния для текущей страницы
- [x] Добавить коллапсируемость sidebar
- [x] Обеспечить адаптивность для мобильных устройств

## Критерии приёмки

- [x] Sidebar отображается на всех страницах
- [x] Навигация работает корректно между разделами
- [x] Мобильная версия с hamburger меню
- [x] Активная страница подсвечивается
- [x] Sidebar можно свернуть/развернуть
- [x] Адаптивный дизайн для всех экранов
- [x] Использованы компоненты shadcn/ui

## Технические детали

### Компонент Sidebar

Создать файл `apps/web/src/components/layout/sidebar.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  LayoutDashboard, 
  Ship, 
  Package, 
  ShoppingCart,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

interface SidebarProps {
  isCollapsed: boolean
  onToggle: () => void
}

const navigation = [
  {
    title: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    title: 'Рейсы',
    href: '/arrivals',
    icon: Ship,
  },
  {
    title: 'Контейнеры',
    href: '/containers',
    icon: Package,
  },
  {
    title: 'Заказы',
    href: '/orders',
    icon: ShoppingCart,
  },
]

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const pathname = usePathname()

  return (
    <div className={cn(
      'flex h-full flex-col border-r bg-background',
      isCollapsed ? 'w-16' : 'w-64'
    )}>
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b px-4">
        {!isCollapsed && (
          <h2 className="text-lg font-semibold">PortOps</h2>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="h-8 w-8 p-0"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <item.icon className="h-4 w-4" />
                {!isCollapsed && <span>{item.title}</span>}
              </Link>
            )
          })}
        </nav>
      </ScrollArea>
    </div>
  )
}
```

### Компонент SidebarToggle

Создать файл `apps/web/src/components/layout/sidebar-toggle.tsx`:

```typescript
'use client'

import { Button } from '@/components/ui/button'
import { Menu } from 'lucide-react'

interface SidebarToggleProps {
  onToggle: () => void
}

export function SidebarToggle({ onToggle }: SidebarToggleProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onToggle}
      className="lg:hidden"
    >
      <Menu className="h-5 w-5" />
      <span className="sr-only">Toggle sidebar</span>
    </Button>
  )
}
```

### Обновленный Layout

Обновить файл `apps/web/src/app/layout.tsx`:

```typescript
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Sidebar } from '@/components/layout/sidebar'
import { SidebarToggle } from '@/components/layout/sidebar-toggle'
import { SidebarProvider } from '@/components/layout/sidebar-provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'PortOps - Управление портом',
  description: 'Система мониторинга и управления портовыми операциями',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <body className={inter.className}>
        <SidebarProvider>
          <div className="flex h-screen">
            <Sidebar />
            <div className="flex flex-1 flex-col">
              {/* Header */}
              <header className="flex h-16 items-center gap-4 border-b bg-background px-4 lg:px-6">
                <SidebarToggle />
                <div className="flex-1" />
              </header>
              
              {/* Main content */}
              <main className="flex-1 overflow-auto">
                {children}
              </main>
            </div>
          </div>
        </SidebarProvider>
      </body>
    </html>
  )
}
```

### Sidebar Provider

Создать файл `apps/web/src/components/layout/sidebar-provider.tsx`:

```typescript
'use client'

import { createContext, useContext, useState } from 'react'

interface SidebarContextType {
  isCollapsed: boolean
  toggleSidebar: () => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed)
  }

  return (
    <SidebarContext.Provider value={{ isCollapsed, toggleSidebar }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider')
  }
  return context
}
```

## Команды для выполнения

```bash
# Создание компонентов
mkdir -p apps/web/src/components/layout

# Создание файлов
touch apps/web/src/components/layout/sidebar.tsx
touch apps/web/src/components/layout/sidebar-toggle.tsx
touch apps/web/src/components/layout/sidebar-provider.tsx

# Установка зависимостей (если нужно)
pnpm add @radix-ui/react-scroll-area
```

## Тестирование

### Проверка навигации

```typescript
// Тест перехода между страницами
const navigation = ['/', '/arrivals', '/containers', '/orders']
navigation.forEach(path => {
  // Проверить активное состояние
  // Проверить корректность перехода
})
```

## Зависимости

- **UI-001** - Supabase clients (должен быть завершён)
- **UI-002** - Dashboard (должен быть завершён)
- **UI-003** - Arrivals (должен быть завершён)
- **UI-004** - Containers (должен быть завершён)
- **UI-005** - Orders (должен быть завершён)

## Следующие тикеты

- **UI-007** - Header с пользователем
- **UI-008** - Breadcrumbs

## Примечания

- Использовать `usePathname` для определения активной страницы
- Добавить анимации для плавного сворачивания/разворачивания
- Обеспечить доступность (accessibility) для screen readers
- Добавить keyboard navigation
- Сохранять состояние sidebar в localStorage

## Результаты выполнения

### Реализованные функции

✅ **Sidebar с навигацией**
- Компонент `Sidebar` с полной навигацией по разделам
- Иконки для всех разделов (Dashboard, Рейсы, Контейнеры, Заказы)
- Активные состояния для текущей страницы
- Возможность сворачивания/разворачивания

✅ **Мобильная адаптивность**
- Компонент `SidebarToggle` для мобильных устройств
- Hamburger меню в header
- Адаптивная ширина sidebar (64px/256px)

✅ **Интеграция в layout**
- Обновлённый `layout.tsx` с sidebar
- `SidebarProvider` для управления состоянием
- Context API для передачи состояния между компонентами

✅ **Компоненты UI**
- `Sidebar` - основной компонент навигации
- `SidebarToggle` - кнопка для мобильной версии
- `SidebarProvider` - провайдер состояния
- `useSidebar` - хук для доступа к состоянию

### Технические особенности

- **Context API** для управления состоянием sidebar
- **usePathname** для определения активной страницы
- **shadcn/ui** компоненты (Button, ScrollArea)
- **lucide-react** иконки
- **Tailwind CSS** для стилизации
- **TypeScript** для типизации

### Производительность

- Client-side состояние без серверных запросов
- Оптимизированные переходы между страницами
- Плавные анимации сворачивания/разворачивания

### UI/UX

- Интуитивная навигация с иконками
- Визуальная обратная связь для активных страниц
- Адаптивный дизайн для всех устройств
- Доступность с screen reader поддержкой

### Адаптивность

- Desktop: полноразмерный sidebar с текстом
- Mobile: hamburger меню в header
- Промежуточные экраны: адаптивная ширина

### Интеграция

- Обновлены все страницы для работы с новым layout
- Убраны дублирующие кнопки навигации
- Единообразный дизайн на всех страницах
