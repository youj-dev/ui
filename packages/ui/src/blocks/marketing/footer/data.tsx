import type { ReactNode } from 'react'
import { BrandGithubIcon, BrandLinkedinIcon, BrandXIcon } from '@youj/icons'

/** A link in a footer column. */
export interface FooterLink {
  label: string
  href: string
  /** A small tag after the label ("New", "Hiring"). */
  badge?: string
}

/** A titled column of links. */
export interface FooterLinkColumn {
  title: string
  links: FooterLink[]
}

/** A social profile, shown as an icon button named by `label`. */
export interface FooterSocialLink {
  label: string
  href: string
  icon: ReactNode
}

/** The product's name, mark and home link. */
export interface FooterBrand {
  name: string
  logo?: ReactNode
  href?: string
  /** A line under the name. */
  tagline?: string
}

/** A language the site is offered in. */
export interface FooterLanguage {
  /** A BCP 47 tag ("de"). */
  id: string
  /** The language in its own words ("Deutsch"). */
  label: string
}

export type FooterStatusState = 'operational' | 'degraded' | 'outage'

const column = (title: string, links: (string | [string, string])[]): FooterLinkColumn => ({
  title,
  links: links.map((entry) => {
    const [label, badge] = typeof entry === 'string' ? [entry, undefined] : entry
    return { label, badge, href: `#${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}` }
  }),
})

export const COLUMNS: FooterLinkColumn[] = [
  column('Product', ['Deployments', 'Previews', 'Analytics', 'Firewall', ['Storage', 'Beta'], 'Pricing']),
  column('Solutions', ['Commerce', 'SaaS', 'Platform teams', 'Agencies', 'Enterprise']),
  column('Developers', ['Docs', 'CLI', 'API reference', 'Templates', 'Changelog', 'System status']),
  column('Company', ['About', 'Customers', ['Careers', 'Hiring'], 'Blog', 'Press', 'Contact sales']),
]

/** Each owner's single-color mark, in the foreground color: X and LinkedIn allow black or white only. */
export const SOCIAL: FooterSocialLink[] = [
  { label: 'GitHub', href: '#github', icon: <BrandGithubIcon className="size-4" /> },
  { label: 'X', href: '#x', icon: <BrandXIcon className="size-4" /> },
  { label: 'LinkedIn', href: '#linkedin', icon: <BrandLinkedinIcon className="size-4" /> },
]

export const LEGAL: FooterLink[] = [
  { label: 'Privacy', href: '#privacy' },
  { label: 'Terms', href: '#terms' },
  { label: 'Security', href: '#security' },
  { label: 'Accessibility', href: '#accessibility' },
]

/** Trust marks under the sign-up; each links to where the proof is. */
export const BADGES: FooterLink[] = [
  { label: 'SOC 2 Type II', href: '#security' },
  { label: 'ISO 27001', href: '#security' },
  { label: 'GDPR', href: '#security' },
]

export const LANGUAGES: FooterLanguage[] = [
  { id: 'en', label: 'English' },
  { id: 'de', label: 'Deutsch' },
  { id: 'es', label: 'Español' },
  { id: 'fr', label: 'Français' },
  { id: 'ja', label: '日本語' },
]

export const BRAND: FooterBrand = {
  name: 'Northwind',
  href: '#home',
  tagline: 'The platform for teams who ship every day.',
  logo: (
    <svg viewBox="0 0 24 24" aria-hidden className="size-6 text-accent">
      <path d="M4 5h4l4 7-4 7H4l4-7z" fill="currentColor" />
      <path d="M12 5h4l4 7-4 7h-4l4-7z" fill="currentColor" opacity={0.45} />
    </svg>
  ),
}

export const DEFAULT_COPY = {
  newsletter: 'Newsletter',
  subscribeLabel: 'Get the changelog in your inbox',
  placeholder: 'you@company.com',
  subscribe: 'Subscribe',
  subscribing: 'Subscribing…',
  subscribed: 'Subscribed',
  retry: 'Try again',
  subscribeHint: 'Once a month. Unsubscribe with one click.',
  invalidEmail: 'Enter an email like you@company.com.',
  subscribeFailed: 'Couldn’t subscribe. Try again.',
  /** Announced under the field once subscribed; empty says nothing. */
  subscribedNote: 'Thanks. Check your inbox to confirm.',
  navLabel: 'Footer',
  legal: '© 2026 Northwind Labs, Inc.',
  /** The status pill's text while operational; empty hides the pill. */
  status: 'All systems normal',
  statusDegraded: 'Some systems degraded',
  statusOutage: 'Service disruption',
  legalLabel: 'Legal',
  languageLabel: 'Language',
  badgesLabel: 'Security and compliance',
  socialLabel: 'Social',
  /** The cookie settings button's label; empty hides it. */
  cookieSettings: 'Cookie settings',
}
export type MarketingFooterCopy = typeof DEFAULT_COPY
