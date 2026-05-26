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
        body: 'Показывает сколько карточек прошёл из плановых на сегодня. Зелёная заливка кольца = всё повторено.',
        placement: 'bottom',
      },
    ],
  },
  {
    key: 'dictionary',
    version: 1,
    match: (p) => normalize(p) === '/dictionary',
    steps: [
      {
        title: 'Словарь',
        body: 'Все слова твоего уровня с переводом, IPA и примерами. Можно сортировать, фильтровать по статусу, искать.',
      },
      {
        selector: '[data-tour="dictionary-filters"]',
        title: 'Фильтры и сортировка',
        body: 'Покажи только новые / в изучении / выученные. Сортировка — по алфавиту, частоте, дате добавления.',
        placement: 'bottom',
      },
      {
        selector: '[data-tour="dictionary-tools"]',
        title: 'Инструменты справа',
        body: 'Переключи вид (сетка/список), включи bulk-выбор для массовых действий, добавь своё слово, поиск.',
        placement: 'left',
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
      {
        selector: '[data-tour="grammar-levels"]',
        title: 'Уровни',
        body: 'Переключай A1 → A2 → B1 → B2, чтобы видеть темы своего уровня. Текущий выделен цветом.',
        placement: 'bottom',
      },
    ],
  },
  {
    key: 'drills',
    version: 1,
    match: (p) => normalize(p) === '/drills',
    steps: [
      {
        title: 'Тренажёры грамматики',
        body: 'Микро-упражнения на конкретный навык: артикли, времена, согласования. Быстрее теории — сразу руками.',
      },
      {
        selector: '[data-tour="drills-filters"]',
        title: 'Категория + уровень',
        body: 'Двойной фильтр: выбери тип упражнения и сложность. Сетка ниже подстроится.',
        placement: 'bottom',
      },
    ],
  },
  {
    key: 'conjugation',
    version: 1,
    match: (p) => normalize(p) === '/conjugation',
    steps: [
      {
        title: 'Спряжения глаголов',
        body: 'Вбей любой французский глагол в инфинитиве — увидишь все формы во всех временах: présent, passé composé, imparfait, futur, conditionnel, subjonctif, impératif.',
      },
      {
        selector: '[data-tour="conj-form"]',
        title: 'Попробуй сейчас',
        body: 'Введи глагол или ткни в подсказку ниже. Работает для всех правильных и для популярных неправильных глаголов.',
        placement: 'bottom',
      },
    ],
  },
  {
    key: 'reading-detail',
    version: 1,
    match: (p) => normalize(p).startsWith('/reading/') && normalize(p) !== '/reading',
    steps: [
      {
        title: 'Тапай слова',
        body: 'Тапни любое слово в тексте — увидишь перевод и транскрипцию во всплывающей карточке. После прочтения — тест на понимание.',
      },
    ],
  },
  {
    key: 'writing',
    version: 1,
    match: (p) => normalize(p) === '/writing',
    steps: [
      {
        title: 'Письмо',
        body: 'Темы для письменных работ с проверкой ИИ. Пишешь — получаешь оценку по грамматике, словарю, связности, стилю.',
      },
      {
        selector: '[data-tour="writing-tabs"]',
        title: 'Три источника тем',
        body: '«Темы» — готовые задания по уровням. «AI» — сгенерировать тему под себя. «История» — твои предыдущие работы и оценки.',
        placement: 'bottom',
      },
      {
        selector: '[data-tour="writing-ai"]',
        title: 'Своя тема через AI',
        body: 'Если готовые темы не зашли — попроси ИИ сгенерировать персональную тему по твоему уровню.',
        placement: 'bottom',
      },
    ],
  },
  {
    key: 'listening',
    version: 1,
    match: (p) => normalize(p) === '/listening',
    steps: [
      {
        title: 'Аудирование',
        body: 'Короткие аудио на французском с вопросами на понимание. Слушай — отвечай — получаешь процент правильных.',
      },
      {
        selector: '[data-tour="listening-levels"]',
        title: 'Выбор уровня',
        body: 'A1 — самые простые, медленный темп. B1/B2 — натуральная скорость, длиннее. Стрипа справа показывает твой прогресс по уровню.',
        placement: 'bottom',
      },
      {
        selector: '[data-tour="listening-continue"]',
        title: 'Продолжить с прошлого',
        body: 'Большая карточка сверху — следующее упражнение которое ты ещё не выполнил. Тапни Play и поехали.',
        placement: 'top',
      },
    ],
  },
  {
    key: 'conversation',
    version: 1,
    match: (p) => normalize(p) === '/conversation',
    steps: [
      {
        title: 'Разговоры с AI',
        body: 'Голосовые или текстовые диалоги с AI-собеседником на твоём уровне. AI задаёт вопросы, поправляет, поддерживает беседу.',
      },
      {
        selector: '[data-tour="conversation-new"]',
        title: 'Начать новый диалог',
        body: 'Кнопка «+» открывает выбор темы. Можно выбрать из готовых или вписать свою.',
        placement: 'right',
      },
      {
        selector: '[data-tour="conversation-sidebar"]',
        title: 'История бесед',
        body: 'Все твои прошлые диалоги хранятся слева. Тапни любой, чтобы вернуться и продолжить.',
        placement: 'right',
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
        body: 'Добавляй друзей, смотри их прогресс и достижения, мотивируйте друг друга. Лента активности, лидерборд, поиск, подписки.',
      },
      {
        selector: '[data-tour="friends-mycard"]',
        title: 'Твой публичный профиль',
        body: 'Твой тег и QR-код — поделись с друзьями, чтобы они тебя нашли. По кнопкам «Поделиться» и QR.',
        placement: 'bottom',
      },
      {
        selector: '[data-tour="friends-tabs"]',
        title: 'Четыре вкладки',
        body: '«Лента» — что делают подписки прямо сейчас. «Лидерборд» — кто впереди по XP. «Поиск» — найти по тегу или имени. «Подписки» — те, на кого подписан.',
        placement: 'bottom',
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
  {
    key: 'achievements',
    version: 1,
    match: (p) => normalize(p) === '/achievements',
    steps: [
      {
        title: 'Достижения',
        body: 'Бейджи за milestone’ы по словарю, серии, грамматике, чтению, диалогам. Каждый даёт XP — копят уровень.',
      },
      {
        selector: '[data-tour="ach-xp"]',
        title: 'XP-уровень',
        body: 'Сумма XP за всё определяет уровень аккаунта (не путать с CEFR — A1/A2). Полоска — сколько до следующего.',
        placement: 'bottom',
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
