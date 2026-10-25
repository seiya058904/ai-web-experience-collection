import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { useScroll } from '../motion';

export function Icon({ name, size = 20 }: { name: 'bookmark' | 'close' | 'menu' | 'arrow' | 'plus' | 'check'; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {name === 'bookmark' && <path d="M6 3.5h12v17l-6-4-6 4z" />}
    {name === 'close' && <path d="m6 6 12 12M18 6 6 18" />}
    {name === 'menu' && <path d="M3 8h18M3 16h18" />}
    {name === 'arrow' && <path d="M4 12h16m-6-6 6 6-6 6" />}
    {name === 'plus' && <path d="M12 4v16M4 12h16" />}
    {name === 'check' && <path d="m5 12 4 4L19 6" />}
  </svg>;
}

export function Image({ name, alt, className = '', priority = false, sizes = '(min-width: 960px) 33vw, 50vw' }: { name: string; alt: string; className?: string; priority?: boolean; sizes?: string }) {
  return <img className={className} src={`${import.meta.env.BASE_URL}varen/images/${name}-960.webp`} srcSet={`${import.meta.env.BASE_URL}varen/images/${name}-480.webp 480w, ${import.meta.env.BASE_URL}varen/images/${name}-960.webp 960w, ${import.meta.env.BASE_URL}varen/images/${name}-1120.webp 1120w`} sizes={sizes} width={1120} height={name === 'lapel' || name === 'texture' ? 840 : 1400} alt={alt} loading={priority ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : 'auto'} decoding="async" />;
}

export function Anchor({ href, children, onClick, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & { children: ReactNode }) {
  const { scrollTo } = useScroll();
  return <a href={href} {...rest} onClick={event => {
    onClick?.(event);
    if (!event.defaultPrevented && href?.startsWith('#') && document.querySelector(href)) {
      event.preventDefault();
      scrollTo(href);
    }
  }}>{children}</a>;
}

export function SaveButton({ title, active, onClick, withLabel = false }: { title: string; active: boolean; onClick: () => void; withLabel?: boolean }) {
  return <button type="button" className={withLabel ? 'button save-action' : 'icon-button save-button'} aria-label={active ? `Remove ${title} from saved looks` : `Save ${title}`} aria-pressed={active} onClick={onClick}>
    <Icon name={active && withLabel ? 'check' : 'bookmark'} />
    {withLabel && <span>{active ? 'Look saved' : 'Save this look'}</span>}
  </button>;
}
