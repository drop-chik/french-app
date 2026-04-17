# FrenchUp — приложение для изучения французского

## Требования

- Node.js 22+
- pnpm 9+
- PostgreSQL 16
- Redis

## Быстрый старт

### 1. Установить зависимости
```bash
pnpm install
```

### 2. Настроить переменные окружения
```bash
cp apps/api/.env.example apps/api/.env
# Заполни DATABASE_URL, REDIS_URL, JWT_SECRET, OPENAI_API_KEY и т.д.
```

### 3. Создать базу данных и запустить миграции
```bash
# Создать БД в PostgreSQL, затем:
pnpm db:generate  # сгенерировать миграции из схемы
pnpm db:migrate   # применить миграции
```

### 4. Запустить в режиме разработки
```bash
pnpm dev          # запускает api + web параллельно
```

- Фронтенд: http://localhost:5173
- API: http://localhost:3001
- Health check: http://localhost:3001/health

## Структура проекта

```
french-app/
├── apps/
│   ├── web/          React 19 + TypeScript + Vite + TanStack Router
│   └── api/          Fastify 5 + TypeScript + Drizzle ORM
├── packages/
│   ├── shared-types/ Общие TypeScript типы (User, Word, Progress...)
│   └── srs-engine/   SM-2 алгоритм интервального повторения
```

## Разделы приложения

| Раздел | Статус | Описание |
|---|---|---|
| Изучение слов | 🔧 Скелет | 8 механик: карточки, выбор, написание... |
| Грамматика | 🔧 Скелет | 60-80 тем A1–B2 |
| Аудирование | 🔧 Скелет | TTS-озвученные упражнения |
| Диалоги с AI | 🔧 Скелет | GPT-4o собеседник |
| Словарь | 🔧 Скелет | Все изученные слова |

## Переменные окружения (apps/api/.env)

```
DATABASE_URL=postgresql://user:pass@localhost:5432/french_app
REDIS_URL=redis://localhost:6379
JWT_SECRET=...минимум 32 символа...
JWT_REFRESH_SECRET=...минимум 32 символа...
OPENAI_API_KEY=sk-...
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=french-app-assets
R2_PUBLIC_URL=https://...
PORT=3001
FRONTEND_URL=http://localhost:5173
```

## Следующие шаги (Фаза 2)

- [ ] Seed 500 слов A1
- [ ] Реализовать FlashcardMode (карточки + SRS)
- [ ] Подключить DALL-E для генерации иллюстраций
- [ ] Страница грамматики с первыми 15-20 темами A1
