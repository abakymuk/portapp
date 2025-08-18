# ENV-002 · Next 15 app

**Статус**: ✅ Завершён  
**Milestone**: A  
**Приоритет**: Высокий  
**EPIC**: ENV - Среда разработки

## Описание

Создание Next.js 15 приложения с современным стеком технологий в папке `apps/web`.

## Задачи

- [x] Создать Next.js 15 app с TypeScript
- [x] Настроить App Router
- [x] Добавить Tailwind CSS
- [x] Интегрировать shadcn/ui компоненты
- [x] Настроить ESLint и базовую конфигурацию
- [x] Добавить базовые зависимости
- [x] Настроить TypeScript конфигурацию

## Критерии приёмки

- [x] `pnpm dev` запускается без ошибок
- [x] Приложение открывается на `http://localhost:3000`
- [x] Tailwind стили применяются корректно
- [x] shadcn/ui компоненты доступны для импорта
- [x] TypeScript компилируется без ошибок
- [x] ESLint работает корректно

## Технические детали

### Команда создания

```bash
cd apps
pnpm create next-app@latest web --ts --eslint --src-dir --app --tailwind --use-pnpm
```

### Дополнительные зависимости

```bash
cd apps/web
pnpm add @supabase/supabase-js @supabase/ssr
pnpm add -D @types/node
```

### shadcn/ui настройка

```bash
npx shadcn@latest init
npx shadcn@latest add button input textarea card table badge dropdown-menu
```

### Конфигурация TypeScript

**tsconfig.json**:
```json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### Структура приложения

```
apps/web/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/
│   │   └── ui/
│   └── lib/
├── public/
├── package.json
├── next.config.js
├── tailwind.config.ts
└── tsconfig.json
```

## Команды для выполнения

```bash
# Создание приложения
cd apps
pnpm create next-app@latest web --ts --eslint --src-dir --app --tailwind --use-pnpm

# Переход в папку приложения
cd web

# Установка дополнительных зависимостей
pnpm add @supabase/supabase-js @supabase/ssr
pnpm add -D @types/node

# Настройка shadcn/ui
npx shadcn@latest init
npx shadcn@latest add button input textarea card table badge dropdown-menu

# Проверка работы
pnpm dev
```

## Зависимости

- **ENV-001** - Bootstrap repo (должен быть завершён)

## Следующие тикеты

- **ENV-003** - Supabase setup
- **ENV-004** - Env vars
- **UI-001** - Supabase clients (зависит от этого тикета)

## Примечания

- Использовать `create-next-app@latest` с флагами `--ts --eslint --src-dir --app --tailwind --use-pnpm`
- Убедиться, что App Router настроен корректно
- Проверить, что все shadcn/ui компоненты установлены
- Настроить пути TypeScript для удобства импортов

## Результаты выполнения

✅ **Тикет успешно завершён!**

### Выполненные действия:
1. **Next.js 15 приложение**: Создано с TypeScript, ESLint, App Router и Tailwind CSS
2. **Supabase зависимости**: Установлены `@supabase/supabase-js` и `@supabase/ssr`
3. **shadcn/ui**: Инициализирован и добавлены компоненты (button, input, textarea, card, table, badge, dropdown-menu)
4. **Тестовая страница**: Создана демонстрационная страница с использованием shadcn/ui компонентов

### Проверки:
- ✅ `pnpm dev` запускается без ошибок
- ✅ Приложение доступно на `http://localhost:3000`
- ✅ `pnpm build` компилируется успешно
- ✅ `pnpm lint` не показывает ошибок
- ✅ TypeScript компилируется без ошибок
- ✅ shadcn/ui компоненты импортируются корректно

### Установленные версии:
- **Next.js**: 15.4.6
- **React**: 19.1.0
- **TypeScript**: 5.9.2
- **Tailwind CSS**: 4.1.12
- **Supabase**: 2.55.0 (js), 0.6.1 (ssr)

### Структура приложения:
```
apps/web/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx (обновлена с shadcn/ui)
│   │   └── globals.css
│   ├── components/
│   │   └── ui/ (shadcn/ui компоненты)
│   └── lib/
│       └── utils.ts
├── public/
├── components.json (shadcn/ui конфигурация)
├── next.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

### Следующие шаги:
- 🎯 Перейти к тикету **ENV-003** - Supabase setup
- 🎯 Перейти к тикету **ENV-004** - Env vars
- 🎯 Перейти к тикету **UI-001** - Supabase clients
