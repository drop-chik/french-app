import type { ComponentType } from 'react';
import {
  Home, BookOpen, LayoutGrid, GraduationCap, UserCircle,
  Book, Type, Dumbbell, Headphones, BookMarked, PenLine, MessageCircle, Users,
} from 'lucide-react';

export type IconType = ComponentType<{ size?: number | string; className?: string }>;

export type Level = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
const LEVEL_ORDER: Level[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export function levelRank(l: string | undefined): number {
  const i = LEVEL_ORDER.indexOf((l ?? 'A1') as Level);
  return i < 0 ? 0 : i;
}

/** Visual gating only — never blocks the route, just hides/locks it in the UI. */
export function isUnlocked(minLevel: Level, userLevel: string | undefined): boolean {
  return levelRank(userLevel) >= levelRank(minLevel);
}

export interface NavTab {
  key: string;
  route: string;     // exact root route of the tab
  navKey: string;    // i18n leaf under t.nav
  icon: IconType;
  minLevel: Level;
}

export interface NavHub {
  key: string;
  navKey: string;    // i18n leaf under t.nav
  icon: IconType;
  defaultRoute: string;
  badge?: 'wordsDue';
  adminOnly?: boolean;
  /** Route prefixes that belong to this hub (incl. detail/param routes). */
  prefixes: string[];
  tabs?: NavTab[];   // sub-tabs (rendered only when length > 1)
}

export const HUBS: NavHub[] = [
  {
    key: 'home',
    navKey: 'dashboard',
    icon: Home,
    defaultRoute: '/dashboard',
    prefixes: ['/dashboard'],
  },
  {
    key: 'words',
    navKey: 'words',
    icon: BookOpen,
    defaultRoute: '/vocabulary',
    badge: 'wordsDue',
    prefixes: ['/vocabulary', '/dictionary'],
    tabs: [
      { key: 'learn', route: '/vocabulary', navKey: 'learnTab', icon: BookOpen, minLevel: 'A1' },
      { key: 'dict', route: '/dictionary', navKey: 'dictionary', icon: Book, minLevel: 'A1' },
    ],
  },
  {
    key: 'grammar',
    navKey: 'grammar',
    icon: LayoutGrid,
    defaultRoute: '/grammar',
    prefixes: ['/grammar', '/conjugation', '/drills'],
    tabs: [
      { key: 'topics', route: '/grammar', navKey: 'topicsTab', icon: LayoutGrid, minLevel: 'A1' },
      { key: 'drills', route: '/drills', navKey: 'drills', icon: Dumbbell, minLevel: 'A2' },
      { key: 'conj', route: '/conjugation', navKey: 'conjugation', icon: Type, minLevel: 'A2' },
    ],
  },
  {
    key: 'practice',
    navKey: 'groupPractice',
    icon: GraduationCap,
    defaultRoute: '/reading',
    prefixes: ['/listening', '/reading', '/writing', '/conversation'],
    tabs: [
      { key: 'reading', route: '/reading', navKey: 'reading', icon: BookMarked, minLevel: 'A2' },
      { key: 'writing', route: '/writing', navKey: 'writing', icon: PenLine, minLevel: 'B1' },
      { key: 'listening', route: '/listening', navKey: 'listening', icon: Headphones, minLevel: 'A2' },
      { key: 'conversation', route: '/conversation', navKey: 'conversations', icon: MessageCircle, minLevel: 'A2' },
    ],
  },
  {
    key: 'friends',
    navKey: 'friends',
    icon: Users,
    defaultRoute: '/friends',
    // Social hub: friends list + public profile pages live here.
    prefixes: ['/friends', '/u/'],
  },
  {
    key: 'profile',
    navKey: 'profile',
    icon: UserCircle,
    defaultRoute: '/profile',
    // Profile is a landing with cards — Achievements still live under it.
    prefixes: ['/profile', '/achievements'],
  },
  {
    key: 'admin',
    navKey: 'admin',
    icon: LayoutGrid,
    defaultRoute: '/admin',
    adminOnly: true,
    prefixes: ['/admin'],
  },
];

function normalize(path: string): string {
  return path !== '/' && path.endsWith('/') ? path.slice(0, -1) : path;
}

export function hubForPath(pathname: string): NavHub | undefined {
  const p = normalize(pathname);
  return HUBS.find((h) =>
    h.prefixes.some((pre) => {
      const base = pre.endsWith('/') ? pre.slice(0, -1) : pre;
      return p === base || p.startsWith(base + '/');
    }),
  );
}

/** The tab whose root exactly matches the path (null on detail/param routes). */
export function activeTabRoute(pathname: string, hub: NavHub): string | null {
  const p = normalize(pathname);
  return hub.tabs?.find((t) => t.route === p)?.route ?? null;
}

/** Where a hub link should point: the first tab the user can actually open. */
export function hubEntryRoute(hub: NavHub, userLevel: string | undefined): string {
  if (!hub.tabs || hub.tabs.length === 0) return hub.defaultRoute;
  const firstOpen = hub.tabs.find((t) => isUnlocked(t.minLevel, userLevel));
  return firstOpen?.route ?? hub.defaultRoute;
}

/** True when every tab in the hub is still locked for this user's level. */
export function hubAllLocked(hub: NavHub, userLevel: string | undefined): boolean {
  if (!hub.tabs || hub.tabs.length === 0) return false;
  return hub.tabs.every((t) => !isUnlocked(t.minLevel, userLevel));
}
