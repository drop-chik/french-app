# FrenchUp

A full-stack French language learning web app built around spaced repetition, grammar progression, and AI-powered conversation practice.

**Live**: [frenchup.vercel.app](https://frenchup.vercel.app)

---

## Features

### Vocabulary (SRS)
8 learning modes powered by the SM-2 spaced repetition algorithm:
- **Flashcard** — flip cards with text-to-speech audio
- **Multiple Choice** — 4 options with distractors
- **Spelling** — type the French word with TTS feedback
- **Matching** — connect words to translations
- **Fill in the Blank** — complete sentences in context
- **Speed Round** — swipe-based card stack
- **Context Builder** — compose sentences from learned words
- **Listening Recall** — hear and recall

**SmartSession** chains modes in phases (flashcard → multiple-choice → spelling → speed-round) for optimal retention. Words are ordered by frequency rank and progress through statuses: `new → learning → review → mastered`.

### Grammar
Theory articles with interactive exercises — fill-in-the-blank, multiple choice, reorder, and translation. Topics unlock progressively as you complete them.

### Listening Comprehension
Audio exercises with transcripts and comprehension questions. Audio stored as MP3 in the database for fast delivery.

### AI Conversation
Chat with an AI tutor on selected topics. Streaming responses via SSE. Full session history with the ability to resume or delete sessions.

### Drills
15 focused grammar drill sets covering verb conjugation, articles, tenses, prepositions, and more.

### Dictionary
All your learned words in one place, filterable by status (learning / review / mastered) with a quick-practice button.

### Profile & Progress
- 30-day activity heatmap
- Weekly accuracy chart
- Word status breakdown (donut chart)
- Streak tracking with badges
- Avatar upload

### Placement Test
New users take a placement test to determine their starting CEFR level (A1–C2), which personalizes their word and grammar queue.

---

## Content

| Level | Vocabulary | Grammar Topics | Listening Exercises |
|-------|-----------|----------------|---------------------|
| A1    | ~745 words (46 categories) | 25+ | 13 |
| A2    | ~795 words (59 categories) | 16+ | 10 |
| B1    | —         | 18             | 12 |

All vocabulary is CEFR-compliant and includes French word, Russian translation, English translation, example sentence (FR/RU/EN), part of speech, gender, and frequency rank.

---

## Tech Stack

**Frontend** (`apps/web`)
- React 19, Vite
- TanStack Router (file-based), TanStack Query
- Zustand (auth + i18n + theme state)
- CSS Modules + CSS custom properties (no Tailwind)
- Framer Motion (landing page only)
- Lucide icons

**Backend** (`apps/api`)
- Fastify 5
- Drizzle ORM + PostgreSQL
- JWT auth — access token in memory, refresh token in httpOnly cookie
- Zod request validation
- OpenAI API — GPT conversation, TTS audio generation

**Shared packages**
- `@french-app/shared-types` — TypeScript interfaces (User, Word, LanguageLevel, etc.)
- `@french-app/srs-engine` — SM-2 algorithm implementation

**Tooling**
- pnpm 9 workspaces + Turborepo
- TypeScript strict mode (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`)

---

## Project Structure

```
french-app/
├── apps/
│   ├── web/                  # React SPA (port 5173 in dev)
│   │   └── src/
│   │       ├── app/routes/   # File-based routes (TanStack Router)
│   │       ├── features/     # Auth, words, grammar, listening, etc.
│   │       ├── pages/        # Page components
│   │       ├── shared/       # Layout, i18n, shared components
│   │       └── styles/       # CSS tokens + dark/light themes
│   └── api/                  # Fastify REST API (port 3001 in dev)
│       └── src/
│           ├── db/           # Drizzle schema + migrations + seed data
│           └── modules/      # Route handlers (auth, words, grammar, etc.)
├── packages/
│   ├── shared-types/         # Shared TypeScript types
│   └── srs-engine/           # SM-2 spaced repetition algorithm
├── .github/workflows/        # GitHub Actions — auto-deploy to Vercel
├── vercel.json               # Frontend deploy config
├── railway.toml              # Backend deploy config
└── pnpm-workspace.yaml
```

---

## Getting Started

**Prerequisites**: Node.js ≥ 22, pnpm 9, PostgreSQL

```bash
# Install dependencies
pnpm install

# Set up environment
cp apps/api/.env.example apps/api/.env
# Fill in: DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET, OPENAI_API_KEY, FRONTEND_URL

# Run database migrations
cd apps/api
npx drizzle-kit migrate

# Seed content (vocabulary, grammar, listening, drills)
npx tsx src/db/seed/index.ts

# Start development servers
cd ../..
pnpm dev
```

- Frontend: http://localhost:5173
- API: http://localhost:3001

---

## Deployment

**Frontend** → Vercel (auto-deploys via GitHub Actions on push to `main`)  
**Backend** → Railway (auto-deploys on push to `main`, ~3-5 min)

Both deploy automatically on every `git push origin main`. No manual steps required.

### Seed production database
```powershell
cd apps/api
$vars = railway variables --json | ConvertFrom-Json
$env:DATABASE_URL = $vars.DATABASE_PUBLIC_URL
npx tsx src/db/seed/index.ts
```

---

## i18n

The UI supports Russian and English. Language can be toggled on the landing page and persists via localStorage. When adding new UI strings, update both `apps/web/src/shared/i18n/ru.ts` and `en.ts`.

---

## License

Private project.
