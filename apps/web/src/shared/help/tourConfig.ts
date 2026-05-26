/**
 * Per-page tour scripts. Each tour is a sequence of overlay steps. A step
 * either points at a real DOM node via `[data-tour="<id>"]` (and the overlay
 * cuts a hole around it + anchors the popup near it) or is a centered modal
 * step (`selector` omitted).
 *
 * Conventions:
 *  - Selectors live in the markup as `data-tour="<id>"` attributes; if a
 *    selector is missing at runtime, the step gracefully falls back to a
 *    centered modal so the tour never deadends.
 *  - Title / body are i18n string literals (not keys) — Russian content
 *    inline; English variants live in i18n if we ever localize the tour.
 *    Keeping them inline trades one indirection for a much shorter file.
 *  - `match(path)` returns true if this tour should fire on the current
 *    pathname. The first matching tour wins.
 *
 * Adding a tour:
 *  1. Add the page's elements: `data-tour="my-id"` on each anchor element.
 *  2. Add a new entry below with the matching path + steps.
 *  3. (Optional) bump `version` to force-replay for users who already
 *     dismissed the previous version on that page.
 */
export interface TourStep {
  /** CSS selector for [data-tour] anchor. Omit for centered intro/outro. */
  selector?: string;
  title: string;
  body: string;
  /** Preferred placement of the popup relative to the anchor. */
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
}

export interface PageTour {
  /** Stable id used as the localStorage key suffix. */
  key: string;
  /** Bump to invalidate stored "seen" flag for this page. */
  version: number;
  match: (pathname: string) => boolean;
  steps: TourStep[];
}

const normalize = (p: string) =>
  p !== '/' && p.endsWith('/') ? p.slice(0, -1) : p;

export const TOURS: PageTour[] = [
  {
    key: 'dashboard',
    version: 1,
    match: (p) => normalize(p) === '/dashboard',
    steps: [
      {
        title: 'Это твоя главная',
        body: 'Здесь дисплейчик «что делать прямо сейчас»: повторение слов, темы грамматики, аудирование. Меню разделов — слева.',
      },
      {
        selector: '[data-tour="dashboard-today"]',
        title: 'План на сегодня',
        body: 'Слова на повторение по SRS + порция новых. Достаточно нажать «Заниматься» — карточки придут сами.',
        placement: 'right',
      },
      {
        selector: '[data-tour="sidebar-friends"]',
        title: 'Друзья',
        body: 'Новый раздел: добавляй людей по тегу, смотри их прогресс и достижения.',
        placement: 'right',
      },
      {
        selector: '[data-tour="help-button"]',
        title: 'Знак вопроса — твой друг',
        body: 'На любой странице открой эту кнопку: получишь тур по экрану и каталог всех разделов.',
        placement: 'top',
      },
    ],
  },
  {
    key: 'vocabulary',
    version: 1,
    match: (p) => normalize(p) === '/vocabulary',
    steps: [
      {
        title: 'Сессия изучения слов',
        body: 'Алгоритм SM-2 сам решает что показать сейчас: новые слова + те, что пора повторить. Чем чаще угадываешь — тем реже слово возвращается.',
      },
      {
        selector: '[data-tour="session-progress"]',
        title: 'Прогресс сессии',
        body: 'Показывает сколько карточек прошёл из плановых на сегодня.',
        placement: 'bottom',
      },
    ],
  },
  {
    key: 'reading',
    version: 1,
    match: (p) => normalize(p) === '/reading' || normalize(p).startsWith('/reading/'),
    steps: [
      {
        title: 'Чтение под уровень',
        body: 'Тексты с переводом каждого слова. Тапни любое слово — мгновенно получишь перевод и транскрипцию (никаких запросов в сеть).',
      },
    ],
  },
  {
    key: 'grammar',
    version: 1,
    match: (p) => normalize(p) === '/grammar',
    steps: [
      {
        title: 'Темы грамматики',
        body: 'Каждая тема — теория + упражнения. Прогресс копится автоматически, когда выполняешь упражнения.',
      },
    ],
  },
  {
    key: 'friends',
    version: 1,
    match: (p) => normalize(p) === '/friends',
    steps: [
      {
        title: 'Социальная часть',
        body: 'Добавляй друзей по тегу (он у тебя в Профиле), смотри их streak, уровень и достижения. Здесь же входящие/исходящие заявки и лента активности.',
      },
    ],
  },
  {
    key: 'profile',
    version: 1,
    match: (p) => normalize(p) === '/profile',
    steps: [
      {
        title: 'Твой профиль',
        body: 'Уровень, серия, статистика, настройки. Здесь же — твой тег (по нему тебя могут добавить в друзья).',
      },
    ],
  },
];

export function tourFor(pathname: string): PageTour | null {
  return TOURS.find((t) => t.match(pathname)) ?? null;
}

const SEEN_KEY = (key: string, version: number) =>
  `frenchup:tour:${key}:v${version}`;

export function hasSeen(tour: PageTour): boolean {
  try {
    return localStorage.getItem(SEEN_KEY(tour.key, tour.version)) === '1';
  } catch {
    return true; // private mode etc — don't auto-show
  }
}

export function markSeen(tour: PageTour): void {
  try {
    localStorage.setItem(SEEN_KEY(tour.key, tour.version), '1');
  } catch {
    /* noop */
  }
}
