import { useEffect } from 'react';

/**
 * Sets `document.title` to `${page} — FrenchUp` while this component is
 * mounted, and restores the previous title on unmount.
 *
 * Why a custom hook and not TanStack Router's `head` config: head requires
 * declaring titles at route definition level, which doesn't fit our setup
 * where page components live separately from route files and many titles
 * need useI18n() data (translated headings, dynamic content). The hook is
 * one call per page component and stays close to the data it depends on.
 *
 * Browser tabs, bookmarks, and history entries all read document.title —
 * having every page show "FrenchUp — Учи французский" (the index.html
 * default) made bookmarks indistinguishable and was flagged in the audit.
 *
 * Pass `null` or undefined to skip (e.g. while a query is still loading).
 */
export function useDocumentTitle(title: string | null | undefined): void {
  useEffect(() => {
    if (!title) return;
    const prev = document.title;
    document.title = `${title} — FrenchUp`;
    return () => {
      document.title = prev;
    };
  }, [title]);
}
