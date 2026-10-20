import { CalendarIcon, MailIcon, PencilIcon, PhoneIcon } from '@youj/icons'
import type { DataGridOptionTone } from '../data-grid'

/* The records table's types, its English and its demo: a sales team's
 * people, seeded so every render (server and browser) shows the same rows,
 * dated from a fixed moment. */

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

/** Where a contact is in the funnel. */
export interface RecordsTableStage {
  id: string
  label: string
  /** The stage's color: a status tone, or a chart color for stages that aren't good or bad. */
  tone: DataGridOptionTone
}

/** A teammate who owns contacts. */
export interface RecordsTableOwner {
  id: string
  name: string
  /** An image URL for the avatar. Without one, initials. */
  avatar?: string
}

/** A kind of touch (email, call…): its name, shown to screen readers, and the icon beside the date. */
export interface RecordsTableActivityKind {
  id: string
  label: string
  icon?: typeof MailIcon
  /** The icon in the accent color: the touches that matter most. */
  accent?: boolean
}

/** A tab: the records that match all it names. */
export interface RecordsTableView {
  id: string
  label: string
  /** An owner id; `'me'` is the signed-in teammate (`me`), and the tab is left out without one. */
  owner?: string
  /** A key from `tags`. */
  tag?: string
  /** A stage id. */
  stage?: string
  /** Highest score first. */
  byScore?: boolean
}

/** A person, one row of the table. */
export interface RecordsTableRecord {
  id: string
  name: string
  email: string
  avatar?: string
  title?: string
  /** Who or what they belong to (a company, a clinic), under their name. */
  org: string
  /** Under the organization's name (its domain). */
  orgNote?: string
  /** A stage id from `stages`. */
  stage: string
  /** An owner id from `owners`. */
  owner?: string
  /** How strong the signal is, 0–100 (the demo: how likely they are to buy). */
  score: number
  /** Tag keys from `tags`. */
  tags: string[]
  /** What their open deals are worth. */
  value: number
  /** The last touch: what it was and when (ISO). */
  lastActivity?: { kind: string; at: string }
  phone?: string
  location?: string
}

export const STAGES: RecordsTableStage[] = [
  { id: 'lead', label: 'Lead', tone: 'neutral' },
  { id: 'contacted', label: 'Contacted', tone: 'neutral' },
  { id: 'qualified', label: 'Qualified', tone: 'warning' },
  { id: 'customer', label: 'Customer', tone: 'success' },
  { id: 'churned', label: 'Churned', tone: 'danger' },
]

export const OWNERS: RecordsTableOwner[] = [
  { id: 'mira', name: 'Mira Chen' },
  { id: 'jonas', name: 'Jonas Weber' },
  { id: 'priya', name: 'Priya Raman' },
  { id: 'kenji', name: 'Kenji Sato' },
]

export const TAGS: Record<string, { label: string; tone?: DataGridOptionTone }> = {
  hot: { label: 'Hot', tone: 'danger' },
  champion: { label: 'Champion', tone: 'success' },
  'decision-maker': { label: 'Decision maker', tone: 'neutral' },
  trial: { label: 'On trial', tone: 'warning' },
  event: { label: 'Met at event', tone: 'neutral' },
}

export const ACTIVITIES: RecordsTableActivityKind[] = [
  { id: 'email', label: 'Emailed', icon: MailIcon },
  { id: 'call', label: 'Called', icon: PhoneIcon },
  { id: 'meeting', label: 'Met', icon: CalendarIcon, accent: true },
  { id: 'note', label: 'Note', icon: PencilIcon },
]

export const VIEWS: RecordsTableView[] = [
  { id: 'all', label: 'All contacts' },
  { id: 'mine', label: 'My contacts', owner: 'me' },
  { id: 'hot', label: 'Hot leads', tag: 'hot', byScore: true },
  { id: 'customers', label: 'Customers', stage: 'customer' },
]

export const DEFAULT_COPY = {
  title: 'Contacts',
  description: (people: string, companies: string) => `${people} people across ${companies} companies`,
  noun: 'contacts',
  search: 'Search contacts…',
  add: 'Add contact',
  import: 'Import',
  columns: { name: 'Name', org: 'Company', stage: 'Stage', owner: 'Owner', score: 'Score', value: 'Open deals', lastActivity: 'Last activity', tags: 'Tags', title: 'Title', location: 'Location' },
  changeStage: (name: string) => `Change the stage of ${name}`,
  stageChanged: (name: string, stage: string) => `${name} moved to ${stage}`,
  stageFailed: (name: string) => `Couldn't move ${name}`,
  actions: { email: 'Email', call: 'Copy phone number', open: 'Open contact', assign: 'Assign to', tag: 'Add tag', delete: 'Delete' },
  bulk: { assign: 'Assign', tag: 'Tag', export: 'Export', delete: 'Delete' },
  deleted: (count: string) => `Deleted ${count}`,
  people: (count: string, n: number) => `${count} ${new Intl.PluralRules('en').select(n) === 'one' ? 'contact' : 'contacts'}`,
  failed: 'Something went wrong. Try again.',
  dismiss: 'Dismiss',
  detail: { org: 'Company', phone: 'Phone', location: 'Location', owner: 'Owner', noOwner: 'Unassigned', email: 'Send email' },
  emptyTitle: 'No contacts yet',
  emptyDescription: 'Import a spreadsheet or add the first person you talked to.',
  demoData: 'Demo data',
}

export type RecordsTableCopy = typeof DEFAULT_COPY

/** The moment the demo's relative dates count from, so the server and the browser agree. */
export const DEMO_NOW = Date.UTC(2026, 8, 29, 15, 0)

const FIRST = ['Hana', 'Oliver', 'Amara', 'Lucas', 'Ines', 'Noah', 'Yuki', 'Elena', 'Marcus', 'Zara', 'Theo', 'Leila', 'Rafael', 'Maya', 'Jonah', 'Sofia', 'Kai', 'Nora']
const LAST = ['Novak', 'Brennan', 'Okoye', 'Lindqvist', 'Moreau', 'Tanaka', 'Silva', 'Haddad', 'Fischer', 'Adeyemi', 'Costa', 'Varga']
const COMPANIES: ReadonlyArray<[string, string]> = [
  ['Northwind Traders', 'northwind.com'],
  ['Brightline Health', 'brightline.health'],
  ['Fathom Analytics', 'fathom.io'],
  ['Kestrel Labs', 'kestrel.dev'],
  ['Lattice Freight', 'lattice.co'],
  ['Ember & Oak', 'emberoak.com'],
  ['Meridian Bank', 'meridian.bank'],
  ['Halcyon Studio', 'halcyon.studio'],
  ['Juniper Robotics', 'juniper.ai'],
  ['Quill Legal', 'quill.law'],
  ['Sable Security', 'sable.sh'],
  ['Orbital Foods', 'orbital.food'],
]
const TITLES = ['Head of Operations', 'CTO', 'VP Finance', 'IT Lead', 'Founder', 'Procurement Manager', 'Product Lead', 'COO']
const CITIES = ['Berlin', 'Lisbon', 'Austin', 'Toronto', 'Singapore', 'London', 'São Paulo', 'Nairobi']
const KINDS = ['email', 'email', 'call', 'meeting', 'note']

export function makeRecords(count = 36): RecordsTableRecord[] {
  let seed = 41
  const next = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646
  const pick = <T,>(list: readonly T[]) => list[Math.floor(next() * list.length)]!
  const stages = ['lead', 'lead', 'contacted', 'contacted', 'qualified', 'qualified', 'customer', 'customer', 'churned']
  const tagKeys = Object.keys(TAGS)
  return Array.from({ length: count }, (_, i) => {
    const first = FIRST[i % FIRST.length]!
    const last = LAST[(i * 5 + Math.floor(i / FIRST.length)) % LAST.length]!
    const [company, domain] = COMPANIES[(i * 7) % COMPANIES.length]!
    const stage = pick(stages)
    const score = Math.round(stage === 'customer' ? 70 + next() * 30 : stage === 'churned' ? next() * 30 : stage === 'qualified' ? 50 + next() * 40 : next() * 70)
    const days = next() * (stage === 'churned' ? 60 : 14)
    return {
      id: `con_${(0x5a17 + i * 977).toString(16)}`,
      name: `${first} ${last}`,
      email: `${first.toLowerCase()}.${last.toLowerCase()}@${domain}`,
      title: pick(TITLES),
      org: company,
      orgNote: domain,
      stage,
      owner: next() > 0.12 ? pick(OWNERS).id : undefined,
      score,
      tags: [...tagKeys].sort(() => next() - 0.5).slice(0, Math.floor(next() * 2.6)),
      value: stage === 'churned' || stage === 'lead' ? 0 : Math.round((4 + next() * 90) * 1000),
      lastActivity: { kind: pick(KINDS), at: new Date(DEMO_NOW - Math.round(days * 86_400_000)).toISOString() },
      phone: `+1 (555) ${String(100 + ((i * 37) % 900)).padStart(3, '0')}-${String(1000 + ((i * 7919) % 9000)).slice(0, 4)}`,
      location: pick(CITIES),
    }
  })
}
