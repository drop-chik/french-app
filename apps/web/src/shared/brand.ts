/**
 * FrenchUp brand lexicon — capitalised, consistent product-feature names.
 *
 * Why this exists: SavoirX's cohesion comes partly from naming every
 * AI/learning feature as a proper noun and re-using the same string
 * across landing pages, in-app UI, and pricing. The user reads
 * 'Smart Credits' five times in five contexts and it crystallises as
 * a real thing. We were calling our equivalents 'обучение' /
 * 'умные карточки' / 'AI-проверка' / 'mock-режим' — same feature,
 * different label, no crystallisation.
 *
 * Use these constants in marketing-surface code (LandingPage, level
 * pages, dashboard hero) so a rename happens in one place. UI labels
 * inside game-mode flows can still use plain verbs ('Тренировать',
 * 'Слушать') — proper-noun branding is for the framing surfaces.
 */

export const BRAND = {
  /** Адаптивная SRS-сессия с авто-выбором слов и режимов. */
  SmartPractice: { ru: 'Smart-практика', en: 'Smart Practice' },
  /** Колоды слов с IPA, аудио, примерами. Наш аналог Smart Word Cards. */
  WordCards: { ru: 'Smart-карточки', en: 'Smart Cards' },
  /** Pre-quiz preview overlay перед SRS-сессией. */
  PreviewMode: { ru: 'Превью слов', en: 'Preview Mode' },
  /** Симуляция DELF-чтения с таймером, 3 текстами, баллами. */
  DelfMock: { ru: 'DELF Mock', en: 'DELF Mock' },
  /** AI-проверка эссе по 7 рубрикам в стиле DELF. */
  DelfScorer: { ru: 'DELF Scorer', en: 'DELF Scorer' },
  /** AI-разговор для практики. */
  PracticeChat: { ru: 'Practice Chat', en: 'Practice Chat' },
  /** Ежедневное напоминание о слове дня. */
  DailyWord: { ru: 'Слово дня', en: 'Daily Word' },
} as const;

export type BrandKey = keyof typeof BRAND;

/** Resolve a brand name in the active UI language. */
export function brand(key: BrandKey, lang: 'ru' | 'en'): string {
  return BRAND[key][lang];
}
