import type { MouseEventHandler, ReactNode } from 'react'

/** The customer the story is about. */
export interface CustomerStoryCustomer {
  name: string
  industry: string
  /** The customer's wordmark, an `<img>` or `<svg>`. Without it, `mark` sits beside the name. */
  logo?: ReactNode
  /** A glyph drawn in a 24×24 viewBox (the children of an `<svg>`), filled with the text color. */
  mark?: ReactNode
}

/** One result: where it started and where it is now. */
export interface CustomerStoryMetric {
  label: string
  /** The figure before. Without it, only the new figure shows. */
  before?: number
  /** The figure now: what the counter rolls to. */
  after: number
  /** How the numbers are written (`Intl.NumberFormat` options). */
  format?: Intl.NumberFormatOptions
  /** A unit set after each figure ("ms", "%"). */
  suffix?: string
  /** Which way is good: fewer incident minutes is. Colors the change. Default 'up'. */
  better?: 'up' | 'down'
}

/** One part of the story: a heading and its paragraphs. */
export interface CustomerStoryChapter {
  /** The id its section and its contents link use; keep it a plain word (`problem`). */
  id: string
  /** The contents link's label, and the heading. */
  heading: string
  paragraphs: string[]
  /** A short list under the paragraphs. */
  points?: string[]
}

/** A fact in the header ("Team size · 320 engineers"). */
export interface CustomerStoryFact {
  label: string
  value: string
}

/** The pull quote. */
export interface CustomerStoryQuote {
  text: string
  name: string
  role: string
  avatar?: string
}

/** Where to go after the story. */
export interface CustomerStoryNext {
  customer: string
  title: string
  href: string
  onClick?: MouseEventHandler<HTMLAnchorElement>
}

export const CUSTOMER: CustomerStoryCustomer = { name: 'Lumen', industry: 'Commerce', mark: <circle cx="12" cy="12" r="7" /> }

export const HEADLINE = 'How Lumen stopped freezing deploys before sale day'
export const SUMMARY = 'A 140-service storefront moved to Northwind in one quarter and now ships twenty-four times a day, with a checkout that is 61% faster.'

export const FACTS: CustomerStoryFact[] = [
  { label: 'Industry', value: 'Commerce' },
  { label: 'Team', value: '320 engineers' },
  { label: 'Traffic', value: '14M visits a day at peak' },
  { label: 'Uses', value: 'Previews, rollbacks, analytics' },
]

export const METRICS: CustomerStoryMetric[] = [
  { label: 'Checkout p95', before: 540, after: 212, suffix: ' ms', better: 'down' },
  { label: 'Deploys a day', before: 2, after: 24 },
  { label: 'Incident minutes a quarter', before: 410, after: 148, better: 'down' },
  { label: 'Days from idea to production', before: 11, after: 2, better: 'down' },
]

export const CHAPTERS: CustomerStoryChapter[] = [
  {
    id: 'problem',
    heading: 'A freeze every sale day',
    paragraphs: [
      'Lumen sells to 14 million visitors on its biggest days, and for years the playbook was the same: freeze deploys two weeks before, and hope. A release took eleven days from merge to production, because every change waited for a shared staging environment.',
      'When something did break, it broke slowly. Rolling back meant rebuilding, and a bad release cost an average of forty minutes of degraded checkout.',
    ],
    points: ['Eleven days from merge to production', 'One shared staging environment for 320 engineers', 'Rollbacks that took a rebuild'],
  },
  {
    id: 'approach',
    heading: 'Move a service at a time',
    paragraphs: [
      'The platform team did not plan a migration, they planned a pace: three services a week, starting with the ones nobody was afraid of. Every pull request got its own preview, so reviews happened on the real thing and staging could be retired one team at a time.',
      'Canary releases came next. A new checkout build now takes five percent of traffic, then twenty-five, and promotes itself when error rates and latency hold. If they do not, it rolls back before anyone is paged.',
    ],
    points: ['Previews on every pull request', 'Canaries that promote on the numbers', 'Instant rollback, no rebuild'],
  },
  {
    id: 'results',
    heading: 'Sale day became a Tuesday',
    paragraphs: [
      'Black Friday came and went with eleven deploys and no freeze. Checkout is 61% faster at the 95th percentile, incident minutes fell by almost two thirds, and the team that used to spend a week preparing now spends it on the next feature.',
    ],
  },
]

export const QUOTE: CustomerStoryQuote = {
  text: 'The previews alone paid for it. Design review happens on the real thing now, not on screenshots, and the first time we rolled back in an incident it was over before the pager stopped buzzing.',
  name: 'Mara Okafor',
  role: 'Head of Platform, Lumen',
}

export const NEXT: CustomerStoryNext = { customer: 'Northstar', title: 'Northstar rolled back an incident in under a second', href: '#story-northstar' }

export const DEFAULT_COPY = {
  eyebrow: 'Customer story',
  /** Names the contents. */
  onThisPage: 'In this story',
  factsLabel: 'About the customer',
  resultsTitle: 'The results',
  /** The change on a metric: "−61%" is built from this and the percent. */
  down: (percent: string) => `Down ${percent}`,
  up: (percent: string) => `Up ${percent}`,
  /** "From 540 ms". */
  from: (value: string) => `From ${value}`,
  /** The bars' names. */
  before: 'Before',
  after: 'Now',
  quoteLabel: 'What they said',
  next: 'Next story',
  /** The call to action under the story; empty hides it. */
  ctaTitle: 'Ship like Lumen does',
  ctaDescription: 'Talk to someone who has run this migration before, or start with a free project today.',
  ctaPrimary: 'Talk to us',
  ctaSecondary: 'Start free',
}
export type CustomerStoryCopy = typeof DEFAULT_COPY
