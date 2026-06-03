import type { ReactNode, MouseEvent } from 'react';
import { Link } from '@tanstack/react-router';
import styles from './Action.module.css';

interface BaseProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | undefined;
  size?: 'md' | 'lg' | undefined;
  fullWidth?: boolean | undefined;
  disabled?: boolean | undefined;
  className?: string | undefined;
  icon?: ReactNode | undefined;
}

interface ButtonProps extends BaseProps {
  to?: undefined;
  href?: undefined;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | undefined;
}

interface RouterLinkProps extends BaseProps {
  to: string;
  href?: undefined;
  onClick?: undefined;
  type?: undefined;
}

interface AnchorProps extends BaseProps {
  href: string;
  to?: undefined;
  onClick?: undefined;
  type?: undefined;
  target?: string | undefined;
  rel?: string | undefined;
}

type ActionProps = ButtonProps | RouterLinkProps | AnchorProps;

/**
 * Single primary action component shared across landing / level pages /
 * dashboards. Picks the underlying element from props:
 *   - `to`   → TanStack Router <Link>
 *   - `href` → plain <a>
 *   - neither → <button>
 *
 * SavoirX-style discipline: at most ONE `variant='primary'` per screen.
 * Use `secondary` for the discovery CTA, `ghost` for the "learn more"
 * tertiary link.
 */
export function Action(props: ActionProps) {
  const { children, variant = 'primary', size = 'md', fullWidth, disabled, className, icon } = props;
  const cls = [
    styles.action,
    styles[variant],
    styles[size],
    fullWidth ? styles.fullWidth : '',
    disabled ? styles.disabled : '',
    className ?? '',
  ].join(' ');

  const content = (
    <>
      <span>{children}</span>
      {icon && <span className={styles.icon}>{icon}</span>}
    </>
  );

  if ('to' in props && props.to) {
    return (
      <Link to={props.to as never} className={cls} aria-disabled={disabled}>
        {content}
      </Link>
    );
  }
  if ('href' in props && props.href) {
    return (
      <a
        href={props.href}
        target={props.target}
        rel={props.rel}
        className={cls}
        aria-disabled={disabled}
      >
        {content}
      </a>
    );
  }
  return (
    <button
      type={props.type ?? 'button'}
      onClick={props.onClick}
      disabled={disabled}
      className={cls}
    >
      {content}
    </button>
  );
}
