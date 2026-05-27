import { lazy, Suspense, type ComponentType, type FC } from 'react';
import styles from './LazyRoute.module.css';

/**
 * Helper for code-splitting heavy page components without typing out the
 * Suspense + lazy boilerplate in every route file. Splits the page module
 * into its own chunk and renders a tiny full-viewport spinner while it loads.
 *
 * Returns a plain function component (`FC<P>`) — TanStack Router's
 * `RouteComponent` only accepts function components, not the broader
 * `ComponentType` (which would also allow class components).
 *
 * Usage in a route file:
 *   const AdminPage = lazyPage(() => import('../../pages/admin/AdminPage'), 'AdminPage');
 *   export const Route = createFileRoute('/_auth/admin')({
 *     component: AdminPage,
 *   });
 *
 * `exportName` is the named export from the page module — most pages export
 * their component by name (e.g. `export function AdminPage()`).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LazyImporter = () => Promise<Record<string, any>>;

export function lazyPage<P extends object = Record<string, never>>(
  importer: LazyImporter,
  exportName: string,
): FC<P> {
  const Lazy = lazy(async () => {
    const mod = await importer();
    const Comp = mod[exportName];
    if (!Comp) {
      throw new Error(`lazyPage: export "${exportName}" not found in module`);
    }
    return { default: Comp as ComponentType<P> };
  });

  const Wrapper: FC<P> = (props) => (
    <Suspense fallback={<PageSpinner />}>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <Lazy {...(props as any)} />
    </Suspense>
  );
  return Wrapper;
}

function PageSpinner() {
  return (
    <div className={styles.spinnerWrap} aria-label="Loading page">
      <div className={styles.spinner} />
    </div>
  );
}
