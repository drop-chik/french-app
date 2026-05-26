import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useRouterState } from '@tanstack/react-router';
import { HelpTour } from './HelpTour';
import { hasSeen, tourFor, type PageTour } from './tourConfig';

interface HelpCtx {
  /** Opens the contextual tour for the current page (no-op if none). */
  startTourForCurrentPage: () => boolean;
  /** True when the current pathname has a tour defined. */
  tourAvailable: boolean;
}

const Ctx = createContext<HelpCtx | null>(null);

export function useHelp(): HelpCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error('useHelp must be used inside <HelpProvider>');
  return v;
}

/**
 * Wraps the auth shell. Owns the active-tour state, watches the current
 * pathname, and on first visit of any page with a tour, auto-shows it after
 * a short delay (so the DOM anchors are mounted). Subsequent visits don't
 * re-show — until the user explicitly requests the tour from the "?" menu.
 */
export function HelpProvider({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [activeTour, setActiveTour] = useState<PageTour | null>(null);

  const currentTour = useMemo(() => tourFor(pathname), [pathname]);

  // Auto-show on first visit per page (one-shot, gated by localStorage flag
  // inside the tour module). 600ms delay lets the page's DOM settle before
  // we try to measure anchors.
  useEffect(() => {
    if (!currentTour) return;
    if (hasSeen(currentTour)) return;
    const tid = window.setTimeout(() => setActiveTour(currentTour), 600);
    return () => window.clearTimeout(tid);
  }, [currentTour]);

  const startTourForCurrentPage = useCallback(() => {
    if (!currentTour) return false;
    setActiveTour(currentTour);
    return true;
  }, [currentTour]);

  const close = useCallback(() => setActiveTour(null), []);

  const value = useMemo<HelpCtx>(() => ({
    startTourForCurrentPage,
    tourAvailable: !!currentTour,
  }), [startTourForCurrentPage, currentTour]);

  return (
    <Ctx.Provider value={value}>
      {children}
      {activeTour && <HelpTour tour={activeTour} onClose={close} />}
    </Ctx.Provider>
  );
}
