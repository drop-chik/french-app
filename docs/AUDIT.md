# FrenchUp — Pre-Release Audit

**Started**: 2026-05-26
**Branch**: `main`
**Scope**: 12 категорий (см. roadmap Epic C)

## Severity

- **🔴 Critical** — блокер релиза (security hole, broken core flow)
- **🟠 High** — серьёзная проблема (плохой UX/perf, потенциальный bug)
- **🟡 Medium** — важно но не блокер
- **🟢 Low** — nice-to-have, можно отложить
- **✅ Pass** — проверено, всё ок

---

## TL;DR

Заполняется по мере прохождения категорий. Финальная сводка в конце.

---

## Lighthouse / axe pass (2026-05-27)

⚠️ Lighthouse CLI на Windows крашится с `EPERM, Permission denied` на
`temp/lighthouse.XXX` directory cleanup (известная chrome-launcher проблема
на Windows). Сделал manual a11y/perf/seo pass по чек-листу того что Lighthouse
обычно ловит.

### Fixed inline
- ✅ **Dead `composes` rule** в `global.css` — `body:not([data-theme]) { composes: global(...); }` это CSS Modules feature, не работает в global stylesheet. Молча игнорилось браузером, плюс шумело в Stylelint
- ✅ **Skip-to-content link** (WCAG 2.4.1) — keyboard и screen-reader users могут пропустить sidebar nav на каждой загрузке. Видимый только на focus, в `_auth.tsx` первым focusable элементом, target `#main-content` в `AppLayout main`
- ✅ **`tabIndex={-1}` на main** — позволяет программный focus от skip-link без попадания в natural tab order
- ✅ **Preconnect hints** в index.html для Google Fonts (gstatic + googleapis) — раньше первый paint blocked на DNS+TLS handshake к шрифту через @import

### Pass ✅
- `<html lang>` динамический (синхронится с useI18n.setLang) — закрыто в Pass 1
- OG/Twitter card meta + theme-color light/dark — закрыто в Pass 1
- robots.txt + sitemap.xml — закрыто в Pass 1
- Hero PNG → WebP (-92%) — Epic B
- Bundle splitting (366→171 KB gzip main) — Epic B
- DB indexes для поиска и активности — Epic B
- `prefers-reduced-motion: reduce` глобально в tokens.css
- `:focus-visible` outline 2px на всё — было до этого pass
- Avatars и chat-images с `loading="lazy"` — Pass 3 + текущий
- `<img alt="">` decorative / `alt="..."` informative — проверено через grep
- `<title>` per route — TanStack head — defer

### Defer (для следующих pass'ов)
- 🟡 **Color contrast audit** — нужен axe-core в CI или ручной spot-check `--color-text-tertiary` против фона
- 🟡 **Tap target audit** — некоторые Dictionary chips 28-32px вместо рекомендованных WCAG 44×44
- 🟡 **Per-route `<title>`** — сейчас фиксированный «FrenchUp — Учи французский». TanStack Router 1.45+ имеет head management — отдельный тикет
- 🟡 **schema.org JSON-LD** — для Google rich results
- 🟡 **hreflang** между ru/en версиями — сейчас одна URL, lang клиентский. Когда добавим SSR/per-locale URLs

### Workaround для Lighthouse на Windows
Если нужно прогнать локально:
1. Запустить через WSL2 (`wsl lighthouse ...`) — там Chrome temp permissions работают
2. Или через Vercel — `vercel preview` URL → лить в [PageSpeed Insights](https://pagespeed.web.dev/)
3. В CI можно добавить headless Linux runner с Lighthouse CI Action

---

## Targeted security pass (2026-05-27 before Epic B)

Прицельный аудит на 9 пунктов: admin access, IDOR, privilege escalation,
locked-tab gating, rate limits, mass assignment, CORS, resource limits,
client-bundle secret leaks.

### Pass ✅
- **Admin routes** — все 5 эндпоинтов под `[authenticate, requireAdmin]`.
  `requireAdmin` re-checks `users.role` из БД на каждый запрос (не trust
  JWT cache), плюс fail-safe в `deleteUserAccount(LAST_ADMIN)` не даёт
  снять последнего админа
- **IDOR на personal data**: profile/conversation/writing endpoints везде
  фильтруют по `userId` AND `id`. Writing submissions / conversation
  sessions нельзя прочитать у чужого аккаунта по UUID
- **Privilege escalation** в `PATCH /profile`: Fastify body schema +
  TypeScript signature `updateProfile()` whitelist — `role` / `password` /
  `streakRepairUsedAt` физически нельзя переписать через self-update
- **CORS**: одна origin из `FRONTEND_URL` env (Vercel), credentials: true.
  Wildcard origin нет
- **Secrets в client bundle**: только `VITE_SENTRY_DSN` (полу-публичный
  identifier) — реальных секретов в JS bundle нет
- **Body limit**: 2MB (для аватарок base64), отрезает big payload DOS
- **Request schema validation**: zod + JSON schema на всех write endpoints

### Fixed inline в этом проходе
- 🟠 **Глобальный rate limit** 300→120 req/min/IP. 300 был 2x от
  реальной сессии и не помешал бы script. Все нормальные пиковые случаи
  (autosave + popovers) держатся в 120 с запасом
- 🟠 **AI/cost endpoints — per-route rate limit**:
  - `POST /words/:id/examples` — 30/час (gpt-4o-mini extra examples)
  - `POST /words/:id/image` — 5/час (DALL-E flag, $0.04/image)
  - `POST /writing/submissions/:id/feedback` — 20/час (GPT-4o eval ~$0.03)
  - `POST /writing/prompts/generate` — 10/час (GPT-4o prompt-gen ~$0.005)
  - `POST /conversation/sessions/:id/message` — 60/час (SSE GPT-4o stream)
  - `POST /listening/tts` — 200/час (TTS-1-HD + DB cache, словарные сессии)
- 🟠 **IDOR в `GET /words/:id/distractors`** — раньше любой userId доставал
  word по UUID без owner-check. Теоретически можно было подтвердить
  существование custom-слова чужого юзера. Добавлен фильтр
  `OR(NULL owner, equals current user)` через Drizzle relational query

### Findings — defer (не фиксил)
- 🟡 **Locked tabs ≠ security**: фронтовый Lock на /writing (B1+) /
  /drills (A2+) / /conjugation (A2+) это **только UX-нудж**. API эти
  endpoints ОТКРЫТ для любого авторизованного юзера независимо от
  CEFR-уровня. Это design choice (контент не персональный, юзер просто
  получает что-то «слишком сложное»), а не утечка данных. Если нужен
  hard gate — добавить middleware `requireLevel('B1')` per-route
- 🟡 **DDoS на сетевом уровне**: Railway не имеет DDoS shield. Per-route
  rate-limit защитит от cost-amplification (OpenAI bill), но не от
  network flooding. Решение — Cloudflare proxy перед Railway (отдельный
  setup, не в коде)
- 🟡 **`additionalProperties: false` на body schemas**: сейчас Fastify
  по умолчанию принимает любые extra поля. На текущих write-роутах это
  безопасно (services используют whitelist), но fragile. Прогон по
  всем PATCH/POST routes — отдельный тикет
- 🟡 **OpenAI hard cap**: даже с rate-limit, теоретически если 100 юзеров
  одновременно пробьют свои квоты — bill вырастет. Решение: установить
  monthly cap в OpenAI dashboard (user action, не код). Без cap первая
  атака может стоить сотни долларов до того как OpenAI отрубит ключ
- 🟢 **CSP на /docs**: уже зафиксирован выше
- 🟢 **Per-IP detection с прокси**: Railway видит IP клиента в
  X-Forwarded-For, Fastify rate-limit использует remote IP по умолчанию.
  За Cloudflare нужен `trustProxy: true` — пока живём на raw Railway
  без CDN, всё ок

---

## 1. Security

### Fixed inline (this audit pass)
- 🟠 **Rate limiting** — `@fastify/rate-limit` подключён: global 300 req/min/IP, `/auth/login` 10/min, `/auth/register` 5/15min. Брутфорс закрыт.
- 🟠 **Security headers** — `@fastify/helmet` (X-Frame-Options, X-Content-Type-Options, Referrer-Policy и т.д.). CSP отключён потому что Scalar API Reference требует inline scripts + cdn.jsdelivr.net — иначе ломается `/docs`. CSP сделать в отдельном тикете с per-route policy.
- 🔴 **Fail-fast на JWT secrets** — server.ts кидает на startup если в проде `JWT_SECRET` / `JWT_REFRESH_SECRET` равны дефолтам `'dev_secret_change_me'` / `'refresh_secret'`. Раньше silent fallback → forgeable tokens.

### Pass ✅
- bcrypt cost factor = 12 (медленный, нормально на регистрации)
- JWT access 7d + refresh 30d в httpOnly cookie, `sameSite: 'strict'`, `secure: true` в проде
- Refresh cookie scoped to `/auth` (нет в других путях)
- `requireAdmin` re-checks role from DB каждый раз (не trust cached JWT claim)
- `dangerouslySetInnerHTML` / `innerHTML` нигде не используется (XSS surface через React минимальна)
- Все raw `sql` теги через Drizzle (`sql\`... ${binding} ...\``) — параметризованы, SQL injection невозможна
- Zod validation на body всех write endpoints (registerSchema, loginSchema и т.д.)
- Password minLength: 8

### Findings — to fix in follow-up tickets
- 🟠 **Нет forgot-password flow** — юзер не может сбросить пароль. Critical для публичного релиза. Эстимейт: 1-2 дня (email service + reset token + UI)
- 🟡 **Нет email verification** — registration сразу создаёт активный аккаунт. Открыто к спам-регистрациям. Скоуп: confirmation email + `users.email_verified_at` column
- 🟡 **Нет account lockout / progressive backoff** — rate-limit спасёт от мгновенного брута, но distributed brute force (cross-IP) пройдёт. Long-term: track failed attempts per email
- 🟡 **CSRF на mutation endpoints** — JWT в `Authorization: Bearer` header (не cookie) защищает от CSRF на API. НО `/auth/refresh` читает refresh-token из cookie без CSRF token — атакующий с XSS в третьем домене не сможет, но точечный CSRF возможен. Добавить double-submit или custom header
- 🟡 **CSP на /docs** — Scalar `cdn.jsdelivr.net` нужен; можно настроить per-route helmet или вынести Scalar за отдельный nonce
- 🟡 **No password complexity** — только minLength 8. Добавить zxcvbn или хотя бы «1 letter + 1 digit»
- 🟢 **Helmet CSP report-only mode** — мониторить нарушения CSP не блокируя
- 🟢 **HSTS** — Vercel уже шлёт `Strict-Transport-Security`, Railway тоже; проверить
- 🟢 **Audit cookie attributes** — `Domain` явно не задан → host-only cookie. Если когда-то будет subdomain (`api.frenchup.com`) — пересмотреть

---

## 2. i18n completeness

### Fixed inline
- 🟠 **ErrorBoundary** — захардкоженный русский («Что-то пошло не так», «Технические детали», «Попробовать снова», «Обновить страницу»). Это **единственный экран который видит юзер при крахе любой страницы** — критично что был только RU. Добавлены `t.errors.boundary*` в ru.ts+en.ts, class-компонент читает через `useI18n.getState()`.
- 🟡 **WritingEditorPage** — «Задание не найдено», «Работа сдана. Получи оценку AI!»
- 🟡 **WritingResultPage** — «Работа не найдена», «Ваша работа»
- Все 4 строки переведены: `t.writing.{promptNotFound, submissionSent, submissionNotFound, yourWork}` в ru.ts + en.ts.

### Pass ✅
- `dangerouslySetInnerHTML` нет → React автоматически экранирует все строки
- Большая часть UI использует `t.*` правильно
- Tour системы (HelpTour) полностью переведена для EN
- Reading popup (POS-метки, кнопки) переведена

### Findings — defer
- 🟡 **Admin pages** (`AdminPage`, `MetricsTab`) — «Активные пользователи», «Удержание», «Сбросить весь SRS-прогресс» и т.д. захардкожены по-русски. Admin-only функция, RU-only пока приемлемо. Эстимейт перевода: ~2 часа
- 🟢 **Profile.tsx:572** «Русский» — название языка в LangSwitcher, ИДИОМАТИЧНО оставить на родном языке («Русский»/«English» внутри переключателя). Не баг.
- 🟢 **Plural-форма для русского** — local helpers в `t.nav.streakDay/streakDaysFew/streakDays`. Работает, но можно унифицировать через `Intl.PluralRules` — отдельный тикет
- 🟢 **Sweep tool** — добавить в CI `grep` который ищет `[А-Я][а-я]+|[A-Z][a-z]+` вне `i18n/` дирректории, чтобы regression не проскочил

---

## 3. Empty / loading / error states

### Fixed inline
- 🟠 **apiClient timeout** — fetch не имел timeout, зависший backend замораживал UI бесконечно. Добавлен AbortController-based timeout 30s default, кастомизируется через `timeoutMs` option. AbortError ловится отдельно и кидается как `'Request timed out'`.
- 🟡 **Writing AI endpoints timeout** — `generateFeedback` поднят до 90s (GPT-4o оценка 200-слов эссе занимает 30-60s), `generatePrompt` до 60s. Раньше падал по дефолтным 30s.

### Pass ✅
- DashboardPage: `isLoading`, `isError`, есть fallback с `errorHint`
- ReadingPage: `isLoading + isError + empty` все три явно отрендерены
- FriendsPage: `feedEmpty`, `leaderboardEmpty`, `searchHint`, `nothingFound` — 4 разных empty state
- ConversationPage: `streamingText` placeholder + `isStreaming` indicator + SSE `onError` callback
- WritingResultPage: `feedbackMutation.isError` показывает retry button
- ConversationPage delete: `onError` обрабатывается (console.error + dismiss)
- apiClient: refresh dedup через shared promise (нет thundering herd при истечении токена)
- apiClient 401 → refresh → retry once → если refresh упал → redirect /login

### Findings — defer
- 🟠 **WritingEditorPage save без onError** — saveMutation на autosave/submit не показывает ничего при network failure. Пользователь думает «сохранилось». Эстимейт: 15 мин — добавить toast / banner
- 🟠 **Conversation send без visible error** — `sendMessage` SSE error fires `onError` но в UI оно теряется (только в onError callback, нет toast'а). Эстимейт: 30 мин — глобальный toast layer
- 🟡 **Нет глобального toast/notification layer** — каждая страница изобретает свой banner. Унифицировать в `<ToastProvider>` + `useToast()` хук
- 🟡 **Network detection** — если `navigator.onLine === false`, показывать «нет интернета» баннер вместо API ошибок
- 🟢 **Retry policy для transient ошибок** — 502/503/504 можно retry с backoff
- 🟢 **Loading skeleton screens consistency** — некоторые страницы показывают `<p>Загрузка...</p>`, другие skeleton. Унифицировать

---

## 4. Accessibility (WCAG)

### Fixed inline
- 🟠 **`<html lang>` динамический** — было захардкожено `lang="ru"`. Screen reader произносил английский текст в кириллической фонетике на EN UI → WCAG 3.1.1/3.1.2 fail. Теперь `setLang` синхронит `document.documentElement.lang`, и при гидратации persist-store тоже подхватывает.

### Pass ✅
- `prefers-reduced-motion: reduce` глобально применён в `tokens.css` — все анимации/transitions становятся 0.01ms
- `aria-label` присутствует на icon-only кнопках во всех модалах и попапах (выборочно проверено: WordDetailsModal, DictionaryPage, VocabularyPage, HelpTour, HelpButton)
- `role="dialog"` / `aria-modal` в HelpTour, WordDetailsModal
- Esc closes modals + HelpTour
- Keyboard arrow keys в HelpTour (←/→) и в карточках обучения

### Findings — defer
- 🟡 **Color contrast** — нет автоматической проверки. Lighthouse/axe нужно прогнать. Подозрительные места: `--color-text-tertiary` на сером фоне, статусные чипы пастельных тонов в WordDetailsModal
- 🟡 **Focus rings** — `:focus-visible` стилизован не везде. Tab-навигация по приложению должна явно показывать где сейчас focus
- 🟡 **Tab order** в сложных layout'ах (Dictionary с bulk-mode, Conversation с sidebar) — не верифицирован
- 🟢 **Heading hierarchy** — кое-где H1 → H3 без H2 (легкая проблема для screen reader)
- 🟢 **ARIA live regions** для streaming bubble в Conversation, для toast notifications

---

## 5. Mobile UX

### Pass ✅
- `viewport-fit=cover` + `env(safe-area-inset-bottom)` в `AppLayout`, `DictionaryPage`, `HelpButton` — корректно учитывают iOS home indicator
- Mobile bottom nav 5→6 колонок (Друзья был добавлен), font 9.5px / 8.5px на 360px
- PWA manifest правильный: `display: standalone`, `start_url: /dashboard`, иконки 192/512 + maskable

### Findings — defer
- 🟡 **Tap targets <44px** — небольшие inline-кнопки (Dictionary chip-фильтры ~28-32px, audio play 32×32 в WordDetailsModal). Apple HIG / WCAG AA рекомендует ≥44×44
- 🟡 **PWA install prompt на iOS** — браузер не показывает нативный prompt, iOS юзер должен знать про «Поделиться → На экран Домой». Нужна отдельная инструкция (banner с шагами)
- 🟡 **`<img loading="lazy">`** — только 5 из 19 `<img>` имеют атрибут. Avatars, hero images можно лениво. Сильнее всего важно для landing
- 🟢 **Pinch zoom** — viewport meta не блокирует zoom (хорошо), но проверить что текст не ломается на >150%

---

## 6. Content QA (spot-check)

### Pass ✅
- Sample проверки seed-файлов: words-a1.ts формат корректный, `translation`, `translationEn`, `exampleFr/Ru/En`, `grammarTag` где применимо
- Grammar exercises имеют `explanation` поле (по схеме обязательно)
- 100% слов имеют IPA (3859/3859 — проверено SQL'ем выше)

### Findings — defer
- 🟢 **Sample human review** — не делал детальный grammar/translation audit. Эстимейт: 1 день на 50 случайных слов + 10 случайных тем + 5 listening transcripts (alignment с audio через manual play)
- 🟢 **Конъюгации irregulars** — `conjugation.service` имеет хардкод-словарь irregulars, проверить на актуальность (e.g. `aller`, `faire`, `dire`)
- 🟢 **B2 content density** — было 593 слов, сейчас 973. Проверить что новые не дубликаты A1/A2 (тематика)

---

## 7. Observability

### Pass ✅
- Pino logger (через Fastify) с уровнем `warn` в проде, `info` в dev
- Pretty-printing в dev через `pino-pretty`

### Findings — defer
- 🔴 **Нет error monitoring** (Sentry / Datadog / Vercel Speed Insights). Production exception → теряется в Railway logs (30 дней retention). Эстимейт: ~2 часа на Sentry SDK на web + api
- 🟠 **Нет structured event tracking** — не знаем какие фичи юзеры реально открывают. PostHog / Plausible / Vercel Analytics. ~3 часа
- 🟠 **Нет alerts** — 5xx rate >1%, latency p95 >2s, OpenAI quota приближается к лимиту → никто не узнает
- 🟡 **Frontend errors uncaught** — `ErrorBoundary` ловит React render errors, но async errors (rejected promises) логируются только в console. Добавить `window.onerror` + `unhandledrejection` listener
- 🟡 **API audit log** — кто залогинился, кто меняет admin role и т.д. Сейчас в общем log'е, можно отдельную таблицу `audit_log`

---

## 8. Legal / Compliance

### 🔴 Critical findings
- 🔴 **Privacy Policy lies** — текст явно говорит «Иным третьим лицам ваши данные не передаются», но conversation messages, writing submissions и слова при tap-translate передаются **OpenAI**. Это **breaking** для EU/UK GDPR. Для публичного релиза НУЖНО:
  - Добавить раздел про OpenAI (типы данных, юрисдикция США, ссылка на их Privacy Policy)
  - Упомянуть Vercel (frontend hosting)
  - Упомянуть Web Push (Mozilla / Google FCM endpoints)
- 🟠 **Self-service data export** — GDPR Article 15 (right of access). Сейчас юзер не может скачать свои данные. Admin может, но юзер сам — нет. Эстимейт: 1 день — endpoint `/profile/export` отдающий JSON всех связанных строк
- 🟠 **Self-service account delete** — GDPR Article 17 (right to erasure). Кнопка «Удалить аккаунт» в Профиле + endpoint. Эстимейт: 4 часа
- 🟡 **Cookie consent** — для EU нужен banner если есть analytics cookies. Сейчас только session cookie (technical / functional) — баннер не обязателен, но юристы рекомендуют

### Pass ✅
- Privacy Policy и Terms существуют (`/privacy`, `/terms`), есть link из landing/login
- Контактный email указан
- Возрастные ограничения упомянуты («младше 13 лет»)

---

## 9. Infrastructure

### Pass ✅
- Railway auto-deploys на push → main (через GitHub Actions)
- Vercel auto-deploys frontend (то же)
- Cron service `streak-reminder-cron` — отдельный Railway service, расписание `0 18 * * *` (18:00 UTC)
- Migrations applied on startup (`migrate()` в server.ts), idempotent
- DB backups — Railway default daily, retention 7 days

### Findings — defer
- 🟡 **Backup retention 7 дней мало** — после catastrophic data loss с user reports +10 дней. Включить point-in-time-recovery если Railway поддерживает на текущем плане
- 🟡 **DR plan** — нет документации «что делать если Railway уронит prod на час». Записать в `docs/RUNBOOK.md`
- 🟡 **Rollback procedure** — если задеплоен сломанный bundle, как откатиться? Vercel поддерживает promote previous deployment одной кнопкой. Railway — через `railway redeploy <oldSha>`. Записать процесс
- 🟢 **Migration safety** — long-running migrations (ALTER на больших таблицах) залочат запросы. Сейчас таблицы маленькие, но добавить feature flag для блокирующих migration'ов
- 🟢 **Streak cron health monitoring** — если cron упадёт, юзеры не получат напоминания и streak обнулится. Простой ping-check на cron URL раз в сутки

---

## 10. Performance budgets

### Fixed inline
- 🟢 **robots.txt + sitemap.xml** — добавлены, базовый SEO. Сейчас 4 URL (/, /login, /privacy, /terms) — реальные пользовательские страницы за auth, не индексируются (правильно)
- 🟢 **OG / Twitter tags + theme-color light/dark** — в index.html

### Critical / High findings
- 🔴 **Bundle 1MB JS** (gzip 314KB) — единый chunk. Lighthouse Performance провалится на 3G. Code splitting обязателен → **Epic B**
- 🔴 **fox-hero.png + fox-icon.png = 3MB на главной странице** — оба PNG по 1.5MB. WebP сократит до ~500KB суммарно. Срочный fix → **Epic B**
- 🟠 **Нет performance budgets в CI** — bundle size может расти незаметно. Добавить assertions в build (rollup `--silent` + size-limit или bundlewatch)
- 🟠 **React Query staleTime = 0 default** — каждый mount триггерит refetch. Уже частично проставлено (profile/streak/help), но не везде. Прогнать все `useQuery` и проставить разумные значения. **Epic B**

### Findings — defer (нерешено)
- 🟡 **No image CDN / format negotiation** — Vercel автоматически оптимизирует через `next/image`, но мы Vite SPA. Можно перейти на Vercel Image Optimization API или вручную генерить WebP+AVIF на этапе build
- 🟡 **HTTP caching headers** — Vercel serving с immutable max-age=1y на ассетах с hash в имени, проверить
- 🟢 **Preconnect / preload hints** — `<link rel="preconnect" href="https://french-app-production.up.railway.app">` ускорит первый API call

---

## 11. SEO

### Fixed inline
- robots.txt
- sitemap.xml (минимальный)
- OG + Twitter card meta (см. секция 5)

### Findings — defer
- 🟡 **Нет schema.org JSON-LD** — `EducationalOrganization`, `WebSite`, `Course` markup поможет в Google rich results
- 🟡 **Title per route** — `<title>` фиксированный «FrenchUp — Учи французский». Динамический per page (e.g. «Грамматика — Présent — FrenchUp»). TanStack Router head management
- 🟡 **i18n hreflang** — `<link rel="alternate" hreflang="ru" href="..." />` + `hreflang="en"` если будут отдельные URL по языкам. Сейчас одни URL, lang переключается клиентом
- 🟢 **Landing page meta description** — добавить ключевые слова «изучение французского», «AI-карточки», «грамматика DELF»

---

## 12. Infrastructure (см. п. 9)

(Объединено выше — Railway + Vercel + cron + backups)

---

## Финальная сводка по severity

### 🔴 Critical (нельзя релизить без фикса)
1. **Privacy Policy не упоминает OpenAI** — GDPR breaking для EU юзеров. ~2 часа на редакцию + legal review
2. **Bundle 1MB + 3MB изображений** — Lighthouse Performance провалится. → Epic B
3. **Нет error monitoring (Sentry)** — production исключения теряются. ~2 часа на интеграцию
4. **JWT secrets fallback** — ✅ FIXED inline (fail-fast на startup)

### 🟠 High
1. **Нет forgot-password flow** — нельзя релизить публично
2. **Нет self-service data export / delete** — GDPR Article 15/17
3. **WritingEditor save без onError** — silent failure UX
4. **`<img loading="lazy">`** не везде — perf
5. **Performance budgets в CI** — regression watch
6. **React Query staleTime aggressive** — много лишних refetch
7. **Rate limiting** — ✅ FIXED inline
8. **Helmet** — ✅ FIXED inline
9. **`<html lang>` динамический** — ✅ FIXED inline
10. **apiClient timeout** — ✅ FIXED inline
11. **ErrorBoundary i18n** — ✅ FIXED inline

### 🟡 Medium
- Email verification, account lockout, CSRF на /auth/refresh
- CSP, password complexity
- Admin pages i18n, plural-форма ru
- Global toast layer, network detection
- Color contrast audit, focus rings, tab order
- Tap targets <44px, PWA install прompt iOS
- Sample human content review
- Frontend uncaught errors, audit log
- Backup retention extend, DR plan docs, rollback runbook
- Image CDN, schema.org, dynamic title

### 🟢 Low
- HSTS verify, cookie domain
- CSP report-only, sweep tool в CI
- Retry policy для transient errors
- Skeleton consistency
- ARIA live regions, heading hierarchy
- Pinch zoom check, B2 content de-dup
- Conjugation irregulars review
- Migration feature flags, cron health ping
- Preconnect hints, landing meta description

---

## Что сделано в этом проходе (inline fixes)

Все ниже задеплоено в одном коммите:

1. ✅ `@fastify/rate-limit` global 300/min + /auth/login 10/min + /auth/register 5/15min
2. ✅ `@fastify/helmet` security headers (CSP off для /docs совместимости)
3. ✅ Fail-fast assert на JWT_SECRET / JWT_REFRESH_SECRET в проде
4. ✅ ErrorBoundary полностью переведён (RU + EN через t.errors.boundary*)
5. ✅ WritingEditor + WritingResult — захардкоженные RU строки в i18n
6. ✅ apiClient timeout через AbortController (30s default, override через `timeoutMs`)
7. ✅ Writing AI endpoints `timeoutMs: 60-90s`
8. ✅ `<html lang>` синхронится с активным языком (a11y)
9. ✅ OG + Twitter card meta + theme-color light/dark в index.html
10. ✅ robots.txt + sitemap.xml в public/

## Следующие шаги

**Этой неделей** (~5 дней):
- 🔴 Обновить Privacy Policy (OpenAI / Vercel / Web Push) — 2ч
- 🔴 Интегрировать Sentry в web + api — 2ч
- 🟠 Forgot-password flow — 1-2 дня
- 🟠 Self-service data export + account delete — 1 день
- 🟠 WritingEditor save onError + global toast — 1 день

**Дальше — Epic B (оптимизация)** уже подсветит остальное:
- Bundle splitting → -700KB на main chunk
- PNG → WebP → -2MB на главной
- React Query staleTime sweep
- Performance budgets в CI
