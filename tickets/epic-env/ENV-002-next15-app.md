# ENV-002 · Next 15 app

**Статус**: ⏳ Ожидает  
**Milestone**: A  
**Приоритет**: Высокий  
**EPIC**: ENV - Среда разработки

## Описание

Создание Next.js 15 приложения с современным стеком технологий в папке `apps/web`.

## Задачи

- [ ] Создать Next.js 15 app с TypeScript
- [ ] Настроить App Router
- [ ] Добавить Tailwind CSS
- [ ] Интегрировать shadcn/ui компоненты
- [ ] Настроить ESLint и базовую конфигурацию
- [ ] Добавить базовые зависимости
- [ ] Настроить TypeScript конфигурацию

## Критерии приёмки

- [ ] `pnpm dev` запускается без ошибок
- [ ] Приложение открывается на `http://localhost:3000`
- [ ] Tailwind стили применяются корректно
- [ ] shadcn/ui компоненты доступны для импорта
- [ ] TypeScript компилируется без ошибок
- [ ] ESLint работает корректно

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
