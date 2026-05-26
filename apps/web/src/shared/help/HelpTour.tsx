import { useEffect, useLayoutEffect, useMemo, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useI18n } from '../i18n';
import type { PageTour, TourStep } from './tourConfig';
import { markSeen } from './tourConfig';
import styles from './HelpTour.module.css';

interface Props {
  tour: PageTour;
  onClose: () => void;
}

interface AnchorRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const PADDING = 8;        // hole padding around the anchor
const POPUP_GAP = 12;     // distance from anchor to popup
const POPUP_W = 320;      // estimated popup width for positioning
const POPUP_H = 160;      // estimated popup height for positioning

/**
 * Coachmark-style overlay tour. Steps that point at a `[data-tour="..."]`
 * anchor get a cutout in the backdrop + a popup positioned next to them.
 * Steps without a selector (or whose anchor is missing) fall back to a
 * centered modal so the tour can't deadend on layout drift.
 */
export function HelpTour({ tour, onClose }: Props) {
  const { t } = useI18n();
  const [i, setI] = useState(0);
  const [rect, setRect] = useState<AnchorRect | null>(null);

  const step: TourStep | undefined = tour.steps[i];
  const total = tour.steps.length;

  const close = useCallback(() => {
    markSeen(tour);
    onClose();
  }, [tour, onClose]);

  // Position recompute on step change / resize / scroll.
  useLayoutEffect(() => {
    if (!step) return;
    function update() {
      if (!step?.selector) {
        setRect(null);
        return;
      }
      const el = document.querySelector<HTMLElement>(step.selector);
      if (!el) {
        setRect(null);
        return;
      }
      // Make sure the anchor is on screen.
      el.scrollIntoView({ block: 'center', behavior: 'smooth' });
      const r = el.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    }
    update();
    const ro = new ResizeObserver(update);
    if (step.selector) {
      const el = document.querySelector<HTMLElement>(step.selector);
      if (el) ro.observe(el);
    }
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    // Re-measure shortly after smooth scroll completes.
    const tid = window.setTimeout(update, 350);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
      window.clearTimeout(tid);
    };
  }, [step, i]);

  // Esc to close.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight' && i < total - 1) setI(i + 1);
      if (e.key === 'ArrowLeft' && i > 0) setI(i - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [i, total, close]);

  const popupStyle = useMemo<React.CSSProperties>(() => {
    if (!rect) {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        maxWidth: `${POPUP_W}px`,
      };
    }
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const placement = step?.placement ?? 'auto';

    // Auto: prefer bottom, then top, then right, then left.
    const fitsBelow = rect.top + rect.height + POPUP_GAP + POPUP_H < vh;
    const fitsAbove = rect.top - POPUP_GAP - POPUP_H > 0;
    const fitsRight = rect.left + rect.width + POPUP_GAP + POPUP_W < vw;
    const fitsLeft  = rect.left - POPUP_GAP - POPUP_W > 0;

    let actual: 'top' | 'bottom' | 'left' | 'right';
    if (placement === 'auto') {
      actual = fitsBelow ? 'bottom' : fitsAbove ? 'top' : fitsRight ? 'right' : 'left';
    } else {
      actual = placement;
    }

    let top: number, left: number;
    switch (actual) {
      case 'bottom':
        top = rect.top + rect.height + POPUP_GAP;
        left = rect.left + rect.width / 2 - POPUP_W / 2;
        break;
      case 'top':
        top = rect.top - POPUP_GAP - POPUP_H;
        left = rect.left + rect.width / 2 - POPUP_W / 2;
        break;
      case 'right':
        top = rect.top + rect.height / 2 - POPUP_H / 2;
        left = rect.left + rect.width + POPUP_GAP;
        break;
      case 'left':
        top = rect.top + rect.height / 2 - POPUP_H / 2;
        left = rect.left - POPUP_GAP - POPUP_W;
        break;
    }

    // Clamp inside viewport with 12px margin.
    left = Math.max(12, Math.min(left, vw - POPUP_W - 12));
    top  = Math.max(12, Math.min(top,  vh - POPUP_H - 12));

    return { top: `${top}px`, left: `${left}px`, maxWidth: `${POPUP_W}px` };
  }, [rect, step]);

  if (!step) return null;

  // Backdrop: full-screen dim. If we have a rect, punch a hole via clip-path.
  const backdropStyle: React.CSSProperties = rect
    ? {
        clipPath: `polygon(
          0 0, 100% 0, 100% 100%, 0 100%, 0 0,
          ${rect.left - PADDING}px ${rect.top - PADDING}px,
          ${rect.left - PADDING}px ${rect.top + rect.height + PADDING}px,
          ${rect.left + rect.width + PADDING}px ${rect.top + rect.height + PADDING}px,
          ${rect.left + rect.width + PADDING}px ${rect.top - PADDING}px,
          ${rect.left - PADDING}px ${rect.top - PADDING}px
        )`,
      }
    : {};

  const ringStyle: React.CSSProperties | null = rect
    ? {
        top: `${rect.top - PADDING}px`,
        left: `${rect.left - PADDING}px`,
        width: `${rect.width + PADDING * 2}px`,
        height: `${rect.height + PADDING * 2}px`,
      }
    : null;

  const stepLabel = t.help.step.replace('{n}', String(i + 1)).replace('{total}', String(total));

  return createPortal(
    <div className={styles.root} role="dialog" aria-modal="true" aria-label={tour.key}>
      <div className={styles.backdrop} style={backdropStyle} onClick={close} />
      {ringStyle && <div className={styles.ring} style={ringStyle} />}

      <div className={styles.popup} style={popupStyle}>
        <button className={styles.closeBtn} onClick={close} aria-label={t.help.skip}>
          <X size={16} />
        </button>
        <div className={styles.stepLabel}>{stepLabel}</div>
        <h3 className={styles.title}>{step.title}</h3>
        <p className={styles.body}>{step.body}</p>

        <div className={styles.actions}>
          {i > 0 ? (
            <button className={styles.btnGhost} onClick={() => setI(i - 1)}>
              <ChevronLeft size={14} />
              <span>{t.help.prev}</span>
            </button>
          ) : (
            <button className={styles.btnGhost} onClick={close}>
              {t.help.skip}
            </button>
          )}

          {i < total - 1 ? (
            <button className={styles.btnPrimary} onClick={() => setI(i + 1)}>
              <span>{t.help.next}</span>
              <ChevronRight size={14} />
            </button>
          ) : (
            <button className={styles.btnPrimary} onClick={close}>
              {t.help.done}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
