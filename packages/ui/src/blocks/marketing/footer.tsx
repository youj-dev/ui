'use client'

import { type ComponentProps, type ElementType, type ReactNode } from 'react'
import { GlobeIcon, ShieldCheckIcon } from '@youj/icons'
import { Badge } from '../../components/ui/badge'
import { NativeSelect, NativeSelectOption } from '../../components/ui/native-select'
import { useControllableState } from '../../hooks/use-controllable-state'
import { cn } from '../../lib/utils'
import {
  BADGES,
  BRAND,
  COLUMNS,
  DEFAULT_COPY,
  LANGUAGES,
  LEGAL,
  SOCIAL,
  type FooterBrand,
  type MarketingFooterCopy,
  type FooterLanguage,
  type FooterLink,
  type FooterLinkColumn,
  type FooterSocialLink,
  type FooterStatusState,
} from './footer/data'
import { Newsletter } from './footer/newsletter'

/* A site footer that is a sitemap: the brand with its line, a newsletter
 * sign-up (its states in the button, the reason under the field) and trust
 * badges on the inline start; four columns of links on the end, any of them
 * tagged ("Beta", "Hiring"). A bottom bar carries the copyright, the legal
 * links, a cookie-settings button, the language switch (a native select: the
 * platform's picker on phones), the live status as a pill whose dot follows
 * the state, and the social icons, with a `controls` slot beside them (a theme
 * toggle). Everything is a link or a named control, and the nav is named.
 * Reduced motion: the sign-up's states change instantly.
 *
 * Pass your own `brand`, `columns`, `legalLinks`, `badges`, `social` and
 * `languages`, send sign-ups through `onSubscribe`, hear language and cookie
 * choices through `onLanguageChange` and `onCookieSettings`, and set
 * `linkComponent` for your router; every string is in `copy`. */

type LinkComponent = ElementType

const DOT: Record<FooterStatusState, string> = {
  operational: 'bg-success ring-success-line',
  degraded: 'bg-warning ring-warning-line',
  outage: 'bg-danger ring-danger-line',
}

declare const process: { env: { NODE_ENV?: string } }
const warned = new Set<string>()
/** Stands in for an action the app hasn't wired (`action` is "Block: onVerb"): warns once in development, then waits like a request. */
function demo(action: string, ms: number) {
  if (process.env.NODE_ENV !== 'production' && !warned.has(action)) {
    warned.add(action)
    console.warn(`${action} isn't wired; showing demo behaviour`)
  }
  // lint-blocks-allow: this is demo()'s own wait, behind the warning
  return new Promise((resolve) => setTimeout(resolve, ms))
}

interface MarketingFooterProps extends Omit<ComponentProps<'footer'>, 'children'> {
  /** Resolve once subscribed; reject with an Error whose message says why not. Default: a short demo wait. */
  onSubscribe?: (email: string) => Promise<unknown> | unknown
  /** Shows the newsletter sign-up. Default true. */
  newsletter?: boolean
  /** The product's name, logo, home link and tagline. Default: the demo's Northwind. */
  brand?: FooterBrand
  /** The link columns, in order. Default: the demo's Product, Solutions, Developers and Company. */
  columns?: FooterLinkColumn[]
  /** The legal links beside the copyright. An empty array hides them. Default: Privacy, Terms, Security and Accessibility. */
  legalLinks?: FooterLink[]
  /** Trust marks under the sign-up; an empty array hides them. Default: SOC 2 Type II, ISO 27001 and GDPR. */
  badges?: FooterLink[]
  /** The social profiles, as icon buttons. An empty array hides them. Default: GitHub, X and LinkedIn. */
  social?: FooterSocialLink[]
  /** The languages offered; fewer than two hides the switch. Default: the demo's five. */
  languages?: FooterLanguage[]
  /** The language shown, controlled. */
  language?: string
  /** The language shown at first, uncontrolled. Default: the first. */
  defaultLanguage?: string
  /** Called with the language the visitor picked. */
  onLanguageChange?: (language: string) => void
  /** Called when "Cookie settings" is pressed; without it the button is hidden. */
  onCookieSettings?: () => void
  /** The live status's state: the pill's dot and words follow it. Default `operational`. */
  statusState?: FooterStatusState
  /** Where the status pill goes. Default `#status`. */
  statusHref?: string
  /** Extra controls at the end of the bottom bar, e.g. a theme toggle. */
  controls?: ReactNode
  /** The element every internal link renders as, e.g. Next.js `Link`. Default `'a'`. */
  linkComponent?: LinkComponent
  /** Any of the block's strings, to rewrite or translate. */
  copy?: Partial<MarketingFooterCopy>
}

function MarketingFooter({
  onSubscribe = () => demo('Footer: onSubscribe', 1000),
  newsletter = true,
  brand = BRAND,
  columns = COLUMNS,
  legalLinks = LEGAL,
  badges = BADGES,
  social = SOCIAL,
  languages = LANGUAGES,
  language: languageProp,
  defaultLanguage = languages[0]?.id ?? '',
  onLanguageChange,
  onCookieSettings,
  statusState = 'operational',
  statusHref = '#status',
  controls,
  linkComponent: Link = 'a',
  copy: copyProp,
  className,
  ...rest
}: MarketingFooterProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const [language, setLanguage] = useControllableState(languageProp, defaultLanguage)
  const status = { operational: copy.status, degraded: copy.statusDegraded, outage: copy.statusOutage }[statusState]
  const muted = 'rounded-sm text-fg-muted transition-colors yj-duration-fast ease-standard focus-ring hover:text-fg'
  return (
    <footer className={cn('border-t border-line bg-canvas', className)} {...rest}>
      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 py-14 sm:px-6 md:py-16">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <Link href={brand.href ?? '/'} className="inline-flex w-fit items-center gap-2 rounded-sm text-ui-lg font-semibold tracking-tight text-fg focus-ring">
                {brand.logo}
                {brand.name}
              </Link>
              {brand.tagline && <p className="max-w-xs text-pretty text-ui text-fg-muted">{brand.tagline}</p>}
            </div>
            {newsletter && <Newsletter onSubscribe={onSubscribe} copy={copy} />}
            {badges.length > 0 && (
              <ul aria-label={copy.badgesLabel} className="flex flex-wrap gap-2">
                {badges.map((badge) => (
                  <li key={badge.label}>
                    <Link href={badge.href} className="inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-ui-sm text-fg-muted transition-colors yj-duration-fast ease-standard hover:border-line-control hover:text-fg focus-ring">
                      <ShieldCheckIcon size={13} aria-hidden />
                      {badge.label}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <nav aria-label={copy.navLabel} className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4">
            {columns.map((column) => (
              <div key={column.title} className="flex flex-col gap-3">
                <h2 className="text-ui-sm font-medium text-fg">{column.title}</h2>
                <ul className="flex flex-col gap-2">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <Link href={link.href} className={cn('inline-flex items-center gap-2 text-ui', muted)}>
                        {link.label}
                        {link.badge && (
                          <Badge variant="default" className="text-ui-xs">
                            {link.badge}
                          </Badge>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="flex flex-col gap-6 border-t border-line pt-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6">
            <p className="text-ui-sm text-fg-muted">{copy.legal}</p>
            {(legalLinks.length > 0 || (onCookieSettings && copy.cookieSettings)) && (
              <ul aria-label={copy.legalLabel} className="flex flex-wrap items-center gap-x-5 gap-y-2 text-ui-sm">
                {legalLinks.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className={muted}>
                      {link.label}
                    </Link>
                  </li>
                ))}
                {onCookieSettings && copy.cookieSettings && (
                  <li>
                    <button type="button" onClick={onCookieSettings} className={muted}>
                      {copy.cookieSettings}
                    </button>
                  </li>
                )}
              </ul>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            {languages.length > 1 && (
              <label className="inline-flex items-center gap-2 text-ui-sm text-fg-muted">
                <GlobeIcon size={14} aria-hidden />
                <span className="sr-only">{copy.languageLabel}</span>
                <NativeSelect
                  size="sm"
                  value={language}
                  onChange={(event) => {
                    setLanguage(event.target.value)
                    onLanguageChange?.(event.target.value)
                  }}
                >
                  {languages.map((l) => (
                    <NativeSelectOption key={l.id} value={l.id} lang={l.id}>
                      {l.label}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </label>
            )}
            {status && (
              <Link href={statusHref} className="inline-flex items-center gap-2 rounded-full border border-line px-3 py-1 text-ui-sm text-fg-muted transition-colors yj-duration-fast ease-standard hover:border-line-control hover:text-fg focus-ring">
                <span aria-hidden className={cn('size-2 rounded-full ring-4', DOT[statusState])} />
                {status}
              </Link>
            )}
            {social.length > 0 && (
              <ul aria-label={copy.socialLabel} className="flex items-center gap-1">
                {social.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      aria-label={link.label}
                      className="grid size-control-sm place-items-center rounded-md text-fg transition-colors yj-duration-fast ease-standard focus-ring hover:bg-hover"
                    >
                      {link.icon}
                    </a>
                  </li>
                ))}
              </ul>
            )}
            {controls}
          </div>
        </div>
      </div>
    </footer>
  )
}

export { MarketingFooter }
export type { MarketingFooterProps, MarketingFooterCopy, FooterBrand, FooterLink, FooterLinkColumn, FooterSocialLink, FooterLanguage, FooterStatusState }
