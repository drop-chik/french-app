import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ru } from './ru';
import { en } from './en';
import type { Translations } from './ru';

type Lang = 'ru' | 'en';

interface I18nState {
  lang: Lang;
  t: Translations;
  setLang: (lang: Lang) => void;
}

const translations: Record<Lang, Translations> = { ru, en };

// Keep <html lang="…"> in sync with the active UI language. Screen readers
// switch pronunciation rules based on this attribute — a Russian voice
// pronouncing English text in Cyrillic phonetics is harsh on the ear and
// fails WCAG 3.1.1 / 3.1.2.
function syncDocumentLang(lang: Lang): void {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lang;
  }
}

export const useI18n = create<I18nState>()(
  persist(
    (set) => ({
      lang: 'ru',
      t: ru,
      setLang: (lang) => {
        set({ lang, t: translations[lang] });
        syncDocumentLang(lang);
      },
    }),
    {
      name: 'french-app-lang',
      // Сохраняем только lang — t пересчитывается при восстановлении
      partialize: (state) => ({ lang: state.lang }),
      // При восстановлении из localStorage подставляем правильный объект переводов
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.t = translations[state.lang] ?? ru;
          syncDocumentLang(state.lang);
        }
      },
    },
  ),
);
