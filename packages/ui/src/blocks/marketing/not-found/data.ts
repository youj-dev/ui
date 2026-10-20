import type { ElementType, MouseEventHandler, ReactNode } from 'react'

export type LinkComponent = ElementType
export type HeadingTag = 'h1' | 'h2' | 'h3'

/** A likely destination under the 404. */
export interface NotFoundDestination {
  title: string
  description: string
  href: string
  icon?: ReactNode
}

/** A call to action link. */
export interface NotFoundCta {
  label: string
  href: string
  onClick?: MouseEventHandler<HTMLAnchorElement>
}

export const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

declare const process: { env: { NODE_ENV?: string } }
const warned = new Set<string>()
/** Stands in for an action the app hasn't wired (`action` is "Block: onVerb"): warns once in development, then waits like a request. */
export function demo(action: string, ms: number) {
  if (process.env.NODE_ENV !== 'production' && !warned.has(action)) {
    warned.add(action)
    console.warn(`${action} isn't wired; showing demo behaviour`)
  }
  return wait(ms)
}

export const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
/** The demo's launch: 12 days, 7 hours and 42 minutes after the page opens. */
export const DEMO_LEAD = 12 * 86_400_000 + 7 * 3_600_000 + 42 * 60_000

export const DEFAULT_COPY = {
  code: '404',
  /** The small line over the headline beside a picture; the code is set large without one. */
  errorCode: (code: string) => `Error ${code}`,
  title: 'This page drifted off',
  description: 'The link may be old, or the page may have moved. Nothing you did: let’s get you somewhere useful.',
  searchLabel: 'Search the site',
  searchPlaceholder: 'Search docs, guides and changelog',
  search: 'Search',
  /** Empty hides the Go back button. */
  back: 'Go back',
  destinationsLabel: 'Popular pages',
  /** The default cards under the 404 (used when `destinations` isn't passed). */
  docsTitle: 'Documentation',
  docsDescription: 'Guides and the API reference.',
  changelogTitle: 'Changelog',
  changelogDescription: 'What shipped this week.',
  supportTitle: 'Support',
  supportDescription: 'Talk to an engineer.',
  /** The default way home (used when `homeCta` isn't passed). */
  home: 'Back to home',
  eyebrow: 'Northwind Edge Functions',
  comingTitle: 'Something fast is on its way',
  comingDescription: 'Server code in 38 regions that starts in under five milliseconds. Be first in line when the beta opens.',
  countdownLabel: 'Time until launch',
  days: 'Days',
  hours: 'Hours',
  minutes: 'Minutes',
  seconds: 'Seconds',
  notifyLabel: 'Get notified',
  emailLabel: 'Email',
  placeholder: 'you@company.com',
  notify: 'Notify me',
  notifying: 'Adding…',
  notified: 'You’re on the list',
  retry: 'Try again',
  notifyHint: 'One email when the beta opens. Nothing else.',
  invalidEmail: 'Enter an email like you@company.com.',
  notifyFailed: 'Couldn’t add you. Try again.',
}

export type NotFoundCopy = typeof DEFAULT_COPY
