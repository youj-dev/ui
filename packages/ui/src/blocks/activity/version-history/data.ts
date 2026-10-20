import type { DocBlock } from './diff'

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

const plural = (n: number, one: string, other: string) => (new Intl.PluralRules('en').select(n) === 'one' ? one : other)

export interface VersionHistoryPerson {
  id: string
  name: string
  avatar?: string
}

/** The document as it was at one version. */
export interface VersionHistoryDoc {
  title: string
  blocks: DocBlock[]
  /** Fields beside the text (status, owner, price), compared as before → after. */
  properties?: Record<string, string>
}

export interface VersionHistoryVersion {
  id: string
  createdAt: Date | number | string
  /** Who changed it in this version. */
  authors: VersionHistoryPerson[]
  /** A name someone gave it, "Sent to legal". Named versions stand out, and Named only keeps just them. */
  name?: string
  /** Saved by itself while someone typed. */
  auto?: boolean
  /** The version it was restored from, when it's a restore. */
  restoredFrom?: string
  doc: VersionHistoryDoc
}

export type { DocBlock as VersionHistoryBlock }

/** Every string the block shows or announces. Pass any of them through `copy` to rewrite or translate it. */
export const DEFAULT_COPY = {
  title: 'Version history',
  demoData: 'Demo data',
  versions: 'Versions',
  namedOnly: 'Named only',
  current: 'Current version',
  autosave: 'Autosave',
  restoredFrom: (when: string) => `Restored from ${when}`,
  today: 'Today',
  yesterday: 'Yesterday',
  counts: (added: number, removed: number) => `+${added} −${removed}`,
  countsLabel: (added: number, removed: number) => `${added} ${plural(added, 'word', 'words')} added, ${removed} removed`,
  compareTo: 'Compare to',
  previous: 'Previous version',
  currentShort: 'Current',
  showChanges: 'Show changes',
  changes: (n: number) => `${n} ${plural(n, 'change', 'changes')}`,
  changeOf: (n: number, total: number) => `Change ${n} of ${total}`,
  noChanges: 'No changes',
  previousChange: 'Previous change',
  nextChange: 'Next change',
  added: 'Added',
  removed: 'Removed',
  properties: 'Properties',
  empty: 'Empty',
  restore: 'Restore this version',
  restoring: 'Restoring…',
  restoreTitle: 'Restore this version?',
  restoreDescription: (when: string) =>
    `The document goes back to how it was ${when}. The current version stays in the history, so you can return to it.`,
  restoreConfirm: 'Restore',
  cancel: 'Cancel',
  rename: 'Name this version',
  renamePlaceholder: 'Name, e.g. Sent to legal',
  save: 'Save',
  announceRestored: (when: string) => `Restored the version from ${when}.`,
  announceRenamed: (name: string) => `Named the version ${name}.`,
  failed: 'That didn’t go through. Try again.',
  loading: 'Loading the history…',
  emptyTitle: 'No versions yet',
  emptyDescription: 'Versions are saved as the document changes.',
  errorTitle: 'The history didn’t load',
  retry: 'Retry',
}

export type VersionHistoryCopy = typeof DEFAULT_COPY & {
  /** The BCP 47 locale its times and dates are written in. Default: the app's (YoujProvider's `locale`), else en-US. */
  locale: string
}

/** The demo's clock, fixed so the server and the browser render the same history. */
export const DEMO_NOW = Date.UTC(2026, 9, 9, 15, 20)
const MIN = 60_000
const HOUR = 60 * MIN

const MARA: VersionHistoryPerson = { id: 'mara', name: 'Mara Okafor' }
const THEO: VersionHistoryPerson = { id: 'theo', name: 'Theo Lindqvist' }
const PRIYA: VersionHistoryPerson = { id: 'priya', name: 'Priya Raman' }
export const DEMO_USER: VersionHistoryPerson = { id: 'you', name: 'Jordan Diaz' }

const doc = (blocks: [string, string][], properties: Record<string, string>, title = 'Pricing page copy'): VersionHistoryDoc => ({
  title,
  blocks: blocks.map(([id, text]) => ({ id, type: id.startsWith('h') ? 'heading' : 'paragraph', text })),
  properties,
})

/** A pricing page's copy over two days, newest first. */
export const demoVersions = (now: number): VersionHistoryVersion[] => [
  {
    id: 'v6',
    createdAt: now - 26 * MIN,
    authors: [MARA],
    auto: true,
    doc: doc(
      [
        ['h-plans', 'Plans that grow with your team'],
        ['p-intro', 'Start free, then pay only for the seats you use. Every plan includes unlimited projects and a 14-day trial of Team.'],
        ['p-annual', 'Save 20% with annual billing, billed once a year. Switch between monthly and annual at any time.'],
        ['h-faq', 'Questions'],
        ['p-trial', 'Your trial starts the day you invite a second person, so you can set up on your own first.'],
      ],
      { Status: 'Approved', Owner: 'Mara Okafor', 'Launch date': 'October 21' },
    ),
  },
  {
    id: 'v5',
    createdAt: now - 66 * MIN,
    authors: [MARA, THEO],
    name: 'Sent to legal',
    doc: doc(
      [
        ['h-plans', 'Plans that grow with your team'],
        ['p-intro', 'Start free, then pay only for the seats you use. Every plan includes unlimited projects.'],
        ['p-annual', 'Save 20% with annual billing. Switch between monthly and annual at any time.'],
        ['h-faq', 'Questions'],
        ['p-trial', 'Your trial starts the day you invite a second person, so you can set up on your own first.'],
      ],
      { Status: 'In review', Owner: 'Mara Okafor', 'Launch date': 'October 21' },
    ),
  },
  {
    id: 'v4',
    createdAt: now - 4 * HOUR,
    authors: [THEO],
    auto: true,
    doc: doc(
      [
        ['h-plans', 'Plans that grow with your team'],
        ['p-intro', 'Start free, then pay for the seats you use. Every plan includes unlimited projects.'],
        ['p-annual', 'Save 15% with annual billing. Switch between monthly and annual at any time.'],
        ['h-faq', 'Questions'],
        ['p-trial', 'Your trial starts when you invite a second person.'],
      ],
      { Status: 'In review', Owner: 'Theo Lindqvist', 'Launch date': 'October 21' },
    ),
  },
  {
    id: 'v3',
    createdAt: now - 23 * HOUR,
    authors: [PRIYA],
    name: 'First draft',
    doc: doc(
      [
        ['h-plans', 'Simple pricing for every team'],
        ['p-intro', 'Start free, then pay for the seats you use. Every plan includes unlimited projects.'],
        ['p-annual', 'Save 15% with annual billing.'],
        ['p-enterprise', 'Need more than 200 seats? Talk to sales about Enterprise.'],
      ],
      { Status: 'Draft', Owner: 'Priya Raman', 'Launch date': 'October 28' },
    ),
  },
  {
    id: 'v2',
    createdAt: now - 25 * HOUR,
    authors: [PRIYA],
    auto: true,
    doc: doc(
      [
        ['h-plans', 'Simple pricing for every team'],
        ['p-intro', 'Start free, then pay per seat.'],
        ['p-enterprise', 'Need more than 200 seats? Talk to sales.'],
      ],
      { Status: 'Draft', Owner: 'Priya Raman' },
    ),
  },
  {
    id: 'v1',
    createdAt: now - 26 * HOUR,
    authors: [PRIYA],
    auto: true,
    doc: doc([['h-plans', 'Simple pricing']], { Status: 'Draft', Owner: 'Priya Raman' }),
  },
]
