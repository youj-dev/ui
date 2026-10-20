import type { IllustrationId } from '@youj/illustrations'

/** The full-page moments this block covers. */
export type IllustratedStateKind = 'welcome' | 'empty' | 'not-found' | 'maintenance' | 'success' | 'offline'

export const STATE_KINDS: readonly IllustratedStateKind[] = ['welcome', 'empty', 'not-found', 'maintenance', 'success', 'offline']

export interface StateCopy {
  /** The small line over the title: what kind of page this is. */
  eyebrow: string
  title: string
  body: string
  primary: string
  secondary: string
}

/** Each state's scene, used when `illustration` is left out. */
export const SCENES: Record<IllustratedStateKind, IllustrationId> = {
  welcome: 'handshake',
  empty: 'empty',
  'not-found': 'not-found',
  maintenance: 'server-rack',
  success: 'success',
  offline: 'cloud',
}

export const COPY: Record<IllustratedStateKind, StateCopy> = {
  welcome: {
    eyebrow: 'Welcome to Northwind',
    title: 'Good to have you here, Maya',
    body: 'Northwind keeps your projects, people and releases in one calm place. Three short steps and your workspace is ready.',
    primary: 'Get started',
    secondary: 'Take the tour',
  },
  empty: {
    eyebrow: 'Acme workspace',
    title: 'Nothing here yet',
    body: 'Projects hold your docs, tasks and files. Start with a blank one, or pick a template and change it as you go.',
    primary: 'New project',
    secondary: 'Import from a file',
  },
  'not-found': {
    eyebrow: 'Error 404',
    title: 'We can’t find that page',
    body: 'It may have moved, or the link has a typo. Check the address, or head somewhere you know.',
    primary: 'Go to dashboard',
    secondary: 'Search the docs',
  },
  maintenance: {
    eyebrow: 'Scheduled maintenance',
    title: 'Back in a little while',
    body: 'We’re moving your data to faster storage. Everything stays safe, and nothing you queued is lost.',
    primary: 'Open the status page',
    secondary: 'Email me when it’s done',
  },
  success: {
    eyebrow: 'Payment complete',
    title: 'You’re all set',
    body: 'Your team is on the Pro plan from today. A receipt is on its way to your inbox.',
    primary: 'Go to dashboard',
    secondary: 'View receipt',
  },
  offline: {
    eyebrow: 'No connection',
    title: 'You’re offline',
    body: 'Check your Wi‑Fi or network cable. Anything you change now is kept on this device and syncs once you’re back.',
    primary: 'Try again',
    secondary: 'Keep working offline',
  },
}

export const FIRST_STEPS = [
  { title: 'Create a project', detail: 'A home for one piece of work' },
  { title: 'Invite your team', detail: 'They get an email with a link' },
  { title: 'Connect your tools', detail: 'GitHub, Slack, Figma and more' },
] as const

export const TEMPLATES = ['Product launch', 'Weekly planning', 'Bug tracker'] as const

export const MISSING_PATH = '/settings/billing/invoice-2031'

export const POPULAR_PAGES = [
  { label: 'Dashboard', href: '#dashboard' },
  { label: 'Projects', href: '#projects' },
  { label: 'Billing', href: '#billing' },
  { label: 'Help center', href: '#help' },
] as const

export const MAINTENANCE = { until: '14:30 UTC', progress: 64, steps: ['Copy every database', 'Switch reads to the new storage', 'Check and reopen writes'], done: 1 } as const

export const RECEIPT = [
  { term: 'Plan', value: 'Pro, yearly' },
  { term: 'Seats', value: '8 people' },
  { term: 'Paid', value: '$960.00' },
  { term: 'Next renewal', value: 'October 1, 2027' },
] as const

export const PENDING_SYNC = 'Edits to “Q4 roadmap” and “Launch notes” are saved here.'

export const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
