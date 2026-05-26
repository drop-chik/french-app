import { useEffect, useRef, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { HelpCircle, PlayCircle, Compass } from 'lucide-react';
import { useI18n } from '../i18n';
import { useHelp } from './HelpProvider';
import styles from './HelpButton.module.css';

/**
 * Fixed "?" button rendered by AppLayout. Click opens a small popover with
 * two actions: start the contextual tour for the current page (if any),
 * or open the /help catalog. Visible on every authenticated screen.
 */
export function HelpButton() {
  const { t } = useI18n();
  const { startTourForCurrentPage, tourAvailable } = useHelp();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Click outside closes popover.
  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  function handleTour() {
    setOpen(false);
    startTourForCurrentPage();
  }

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <button
        type="button"
        className={styles.fab}
        onClick={() => setOpen((v) => !v)}
        aria-label={t.nav.help}
        aria-expanded={open}
        data-tour="help-button"
      >
        <HelpCircle size={20} />
      </button>

      {open && (
        <div className={styles.popover} role="menu">
          <button
            type="button"
            className={`${styles.item} ${!tourAvailable ? styles.itemDisabled : ''}`}
            onClick={handleTour}
            disabled={!tourAvailable}
            role="menuitem"
          >
            <PlayCircle size={16} />
            <span>{tourAvailable ? t.help.tourOnThisPage : t.help.tourUnavailable}</span>
          </button>
          <Link
            to="/help"
            className={styles.item}
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            <Compass size={16} />
            <span>{t.help.catalogButton}</span>
          </Link>
        </div>
      )}
    </div>
  );
}
