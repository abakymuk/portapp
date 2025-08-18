# PortOps MVP

Система управления портовыми операциями с расписаниями рейсов, контейнерами и заказами.

## Архитектура

- **Frontend**: Next.js 15 (App Router, Server Components, Server Actions)
- **UI**: Tailwind CSS + shadcn/ui
- **Backend**: Supabase (PostgreSQL + RLS, Edge Functions, Storage)
- **Deploy**: Vercel (UI) + Supabase (Backend)

## Быстрый старт

### Предварительные требования

```bash
# macOS
brew install node pnpm git
brew install supabase/tap/supabase
npm i -g vercel

# Docker Desktop (для локального Supabase)
```

### Установка

```bash
# Клонирование и настройка
git clone <repo>
cd portops
pnpm install

# Supabase
supabase login
supabase init
supabase start
supabase link --project-ref <your-project-ref>

# Next.js
cd apps/web
pnpm dev
```

### Переменные окружения

Создайте `apps/web/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
INGEST_SECRET=your_ingest_secret
DEFAULT_TZ=America/Los_Angeles
```

## Команды

```bash
# Разработка
pnpm dev              # Запуск Next.js
pnpm build            # Сборка
pnpm start            # Продакшн

# Supabase
pnpm sb:start         # Локальный Supabase
pnpm sb:stop          # Остановка
pnpm db:studio        # Открыть Studio

# Деплой
vercel                # Деплой UI
supabase functions deploy  # Деплой функций
```

## Структура проекта

```
portops/
├── apps/
│   └── web/          # Next.js приложение
├── packages/
│   └── shared/       # Общие пакеты
├── supabase/
│   └── functions/    # Edge Functions
└── docs/             # Документация
```

## Документация

- [Roadmap](./docs/ROADMAP.md) - План развития
- [Tickets](./docs/TICKETS.md) - Тикеты и задачи
- [Database](./docs/DATABASE.md) - Схема БД
- [API](./docs/API.md) - API документация
- [Operations](./docs/OPERATIONS.md) - Операционные процедуры

## Статус

🚧 В разработке - Milestone A (Среда и скелеты)

Следуйте [Roadmap](./docs/ROADMAP.md) для понимания текущего прогресса.
