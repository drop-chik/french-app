import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import * as RadixToast from '@radix-ui/react-toast';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import styles from './Toast.module.css';

export type ToastKind = 'success' | 'error' | 'info';

export interface ToastOptions {
  kind?: ToastKind;
  /** Auto-dismiss timeout in ms. Default 5000 (5s). Pass 0 to disable. */
  duration?: number;
}

interface ToastEntry {
  id: number;
  message: string;
  kind: ToastKind;
  duration: number;
}

interface ToastCtx {
  /** Fire a toast. Returns the id so caller can dismiss programmatically. */
  show: (message: string, options?: ToastOptions) => number;
  /** Shortcut helpers. */
  success: (message: string, options?: Omit<ToastOptions, 'kind'>) => number;
  error:   (message: string, options?: Omit<ToastOptions, 'kind'>) => number;
  info:    (message: string, options?: Omit<ToastOptions, 'kind'>) => number;
  dismiss: (id: number) => void;
}

const Ctx = createContext<ToastCtx | null>(null);

export function useToast(): ToastCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useToast() must be called inside <ToastProvider>');
  return ctx;
}

/**
 * App-wide toast layer. Wraps Radix's toast primitive so we get
 * accessibility (role=status, screen-reader announcement, focus
 * management) for free. The visual design lives in Toast.module.css.
 *
 * Usage:
 *   const toast = useToast();
 *   toast.error('Could not save changes');
 *   toast.success('Saved');
 *
 * Manual dismiss:
 *   const id = toast.info('Working...', { duration: 0 });
 *   ...
 *   toast.dismiss(id);
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  // Incrementing id so each toast key is stable across renders.
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback((message: string, options: ToastOptions = {}): number => {
    const id = nextId.current++;
    const entry: ToastEntry = {
      id,
      message,
      kind: options.kind ?? 'info',
      duration: options.duration ?? 5000,
    };
    setToasts((prev) => [...prev, entry]);
    return id;
  }, []);

  const value = useMemo<ToastCtx>(() => ({
    show,
    success: (message, opts) => show(message, { ...opts, kind: 'success' }),
    error:   (message, opts) => show(message, { ...opts, kind: 'error' }),
    info:    (message, opts) => show(message, { ...opts, kind: 'info' }),
    dismiss,
  }), [show, dismiss]);

  return (
    <Ctx.Provider value={value}>
      <RadixToast.Provider swipeDirection="right" duration={5000}>
        {children}
        {toasts.map((t) => (
          <ToastEntryItem
            key={t.id}
            entry={t}
            onClose={() => dismiss(t.id)}
          />
        ))}
        <RadixToast.Viewport className={styles.viewport} />
      </RadixToast.Provider>
    </Ctx.Provider>
  );
}

function ToastEntryItem({ entry, onClose }: { entry: ToastEntry; onClose: () => void }) {
  const Icon = entry.kind === 'success' ? CheckCircle2 : entry.kind === 'error' ? AlertCircle : Info;
  return (
    <RadixToast.Root
      className={`${styles.toast} ${styles[entry.kind]}`}
      duration={entry.duration === 0 ? Infinity : entry.duration}
      onOpenChange={(open) => { if (!open) onClose(); }}
    >
      <Icon size={18} className={styles.icon} />
      <RadixToast.Description className={styles.message}>
        {entry.message}
      </RadixToast.Description>
      <RadixToast.Close className={styles.closeBtn} aria-label="Close">
        <X size={14} />
      </RadixToast.Close>
    </RadixToast.Root>
  );
}
