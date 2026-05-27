import { useRouterState } from '@tanstack/react-router';
import { useI18n } from '../i18n';
import type { Translations } from '../i18n/ru';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

/**
 * Centralised per-route document.title. Mounted once inside the auth
 * layout (and again on the public-pages root), this component watches
 * pathname and updates the browser tab title accordingly.
 *
 * Decision: one switch table here vs. touching ~20 page components and
 * making each call useDocumentTitle. The table loses the ability to use
 * page-specific data (e.g. a reading text's title), but it's cheap and
 * covers 90% of the case. Pages that need a dynamic title (Grammar
 * topic, Reading text, Writing prompt) can still call useDocumentTitle
 * themselves — the hook restores the previous title on unmount so they
 * compose cleanly with this fallback.
 */
function titleFor(pathname: string, t: Translations): string | null {
  // Strict matches first — order matters because /vocabulary is a prefix
  // of nothing, but /grammar/$slug should fall through to dynamic.
  if (pathname === '/' || pathname === '/landing')        return null;       // landing keeps index.html default
  if (pathname === '/login')                              return t.home.tabLogin;
  if (pathname === '/forgot-password')                    return t.forgotPassword.title;
  if (pathname === '/reset-password')                     return t.resetPassword.title;
  if (pathname === '/verify-email')                       return t.verifyEmail.title;
  if (pathname === '/privacy')                            return t.legal.privacyTitle ?? 'Privacy';
  if (pathname === '/terms')                              return t.legal.termsTitle ?? 'Terms';
  if (pathname === '/placement')                          return t.nav.dashboard;

  if (pathname === '/dashboard')                          return t.nav.dashboard;
  if (pathname === '/vocabulary')                         return t.nav.words;
  if (pathname === '/dictionary')                         return t.nav.dictionary;
  if (pathname.startsWith('/grammar'))                    return t.nav.grammar;
  if (pathname.startsWith('/listening'))                  return t.nav.listening;
  if (pathname.startsWith('/reading'))                    return t.nav.reading;
  if (pathname.startsWith('/writing'))                    return t.nav.writing;
  if (pathname.startsWith('/drills'))                     return t.nav.drills;
  if (pathname.startsWith('/conjugation'))                return t.nav.conjugation;
  if (pathname.startsWith('/conversation'))               return t.nav.conversations;
  if (pathname === '/achievements')                       return t.nav.achievements;
  if (pathname === '/profile')                            return t.nav.profile;
  if (pathname.startsWith('/friends') || pathname.startsWith('/u/'))
                                                          return t.nav.friends;
  if (pathname === '/admin')                              return t.nav.admin;
  if (pathname === '/help')                               return t.nav.help;
  if (pathname === '/explore')                            return t.nav.moreSheetTitle;

  return null;
}

export function RouteTitle() {
  const { t } = useI18n();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  useDocumentTitle(titleFor(pathname, t));
  return null;
}
