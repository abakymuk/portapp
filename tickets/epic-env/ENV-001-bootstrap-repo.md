# ENV-001 · Bootstrap repo

**Статус**: 🚧 В работе  
**Milestone**: A  
**Приоритет**: Высокий  
**EPIC**: ENV - Среда разработки

## Описание

Инициализация монорепо с базовой структурой для проекта PortOps MVP.

## Задачи

- [ ] Инициализировать git репозиторий
- [ ] Создать pnpm workspace конфигурацию
- [ ] Создать структуру папок: `apps/web`, `packages/shared`
- [ ] Настроить базовый `package.json` в корне
- [ ] Создать `.gitignore` файл
- [ ] Настроить базовые скрипты в `package.json`

## Критерии приёмки

- [ ] Репозиторий собирается без ошибок
- [ ] `pnpm install` выполняется успешно
- [ ] Структура папок соответствует монорепо архитектуре
- [ ] Все базовые файлы конфигурации созданы
- [ ] Git репозиторий инициализирован

## Технические детали

### Структура папок
```
portops/
├── apps/
│   └── web/          # Next.js приложение (будет создано позже)
├── packages/
│   └── shared/       # Общие пакеты
├── docs/             # Документация
├── tickets/          # Тикеты проекта
├── package.json      # Корневой package.json
├── pnpm-workspace.yaml
└── .gitignore
```

### Файлы конфигурации

**package.json**:
```json
{
  "name": "portops",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "pnpm -C apps/web dev",
    "build": "pnpm -C apps/web build",
    "start": "pnpm -C apps/web start"
  }
}
```

**pnpm-workspace.yaml**:
```yaml
packages:
  - apps/*
  - packages/*
```

**.gitignore**:
```
node_modules/
.env
.env.local
.DS_Store
*.log
```

## Команды для выполнения

```bash
# Инициализация git
git init
git add .
git commit -m "Initial commit: bootstrap repo structure"

# Проверка workspace
pnpm install
pnpm list
```

## Зависимости

Нет зависимостей - это первый тикет в проекте.

## Следующие тикеты

- **ENV-002** - Next 15 app (зависит от этого тикета)
- **ENV-003** - Supabase setup
- **ENV-004** - Env vars

## Примечания

- Использовать `pnpm-workspace.yaml` для настройки workspace
- Убедиться, что все папки созданы с правильными правами
- Проверить, что pnpm корректно распознает workspace структуру
