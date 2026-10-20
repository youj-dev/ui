import type { MouseEventHandler, ReactNode } from 'react'

/** A link in the floating bar. An in-page link (`#pricing`) is marked current while its section is in view. */
export interface NavbarFloatingLink {
  label: string
  href: string
  /** A small tag after the label ("New"). */
  badge?: string
}

/** The product's name, mark and home link. */
export interface NavbarFloatingBrand {
  name: string
  /** A 20px mark. Condensed, the bar shows the mark alone (the name stays its accessible name). */
  logo?: ReactNode
  href?: string
}

/** A call to action link. */
export interface NavbarFloatingCta {
  label: string
  href: string
  onClick?: MouseEventHandler<HTMLAnchorElement>
}

export const LINKS: NavbarFloatingLink[] = [
  { label: 'Features', href: '#features' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Customers', href: '#customers' },
  { label: 'Changelog', href: '#changelog', badge: 'New' },
]

export function Logo() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="text-accent">
      <circle cx="12" cy="12" r="9" fill="currentColor" opacity={0.25} />
      <path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor" />
      <circle cx="12" cy="12" r="3.5" className="fill-canvas" />
    </svg>
  )
}

export const BRAND: NavbarFloatingBrand = { name: 'Halden', logo: <Logo />, href: '#home' }

export const PRIMARY_CTA: NavbarFloatingCta = { label: 'Get started', href: '#signup' }

export const SECONDARY_CTA: NavbarFloatingCta = { label: 'Sign in', href: '#login' }

export const DEFAULT_COPY = {
  /** Names the navigation landmark. */
  navLabel: 'Main',
  /** The phone menu button, closed and open. */
  openMenu: 'Open menu',
  closeMenu: 'Close menu',
  /** The first stop for the keyboard: jumps past the bar to the page's content. */
  skipLink: 'Skip to content',
}

export type NavbarFloatingCopy = typeof DEFAULT_COPY
