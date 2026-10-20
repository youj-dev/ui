import type { DataGridPerson, DataGridView } from '../../tables/data-grid'

/* Tessera's customer accounts: a seeded set, so the page renders the same on
 * the server and in the browser. Pass your own as the page's `customers`. */

export const NOW = Date.UTC(2026, 8, 29, 9, 0)
const DAY = 86_400_000

export type DefaultHealth = 'healthy' | 'trial' | 'at-risk' | 'churning'
/** An account's health: the demo's four, or your own keys (give them labels in the page's `healths`). */
export type Health = DefaultHealth | (string & {})
export type Plan = 'Enterprise' | 'Business' | 'Pro' | 'Starter'
export type DefaultRenewal = 'overdue' | 'month' | 'quarter' | 'later'
/** Where an account is in its renewal: the demo's four, or your own keys (give them labels in the page's `renewals`). */
export type Renewal = DefaultRenewal | (string & {})

export interface Customer {
  id: string
  name: string
  domain: string
  /** The plan's name: the demo's are Enterprise, Business, Pro and Starter. */
  plan: Plan | (string & {})
  health: Health
  /** Monthly recurring revenue, in dollars. */
  mrr: number
  seats: number
  seatLimit: number
  /** Weekly active users over the last 12 weeks. */
  usage: number[]
  owners: DataGridPerson[]
  tags: string[]
  region: string
  /** An ISO date. */
  renewsAt: string
  renewal: Renewal
  /** An ISO date. */
  lastSeen: string
  autoRenew: boolean
  contact: { name: string; email: string; role: string }
  tickets: number
  nps: number
}

export const OWNERS: DataGridPerson[] = [
  { id: 'mira', name: 'Mira Chen' },
  { id: 'jonas', name: 'Jonas Weber' },
  { id: 'priya', name: 'Priya Raman' },
  { id: 'kenji', name: 'Kenji Sato' },
  { id: 'sara', name: 'Sara Okafor' },
  { id: 'leo', name: 'Leo Martins' },
]

export const HEALTH = {
  healthy: { label: 'Healthy', tone: 'success' },
  trial: { label: 'Trial', tone: 'accent' },
  'at-risk': { label: 'At risk', tone: 'warning' },
  churning: { label: 'Churning', tone: 'danger' },
} as const

export const RENEWAL = {
  overdue: { label: 'Overdue', tone: 'danger' },
  month: { label: 'This month', tone: 'warning' },
  quarter: { label: 'Next quarter', tone: 'accent' },
  later: { label: 'Later', tone: 'neutral' },
} as const

export const TAGS = {
  expansion: { label: 'Expansion' },
  sso: { label: 'SSO' },
  eu: { label: 'EU data' },
  api: { label: 'API-heavy' },
  beta: { label: 'Beta' },
  referral: { label: 'Referral' },
  migration: { label: 'Migration' },
} as const

const COMPANIES = [
  'Northwind Traders', 'Brightline Health', 'Fathom Analytics', 'Kestrel Labs', 'Lattice Freight', 'Ember & Oak',
  'Meridian Bank', 'Halcyon Studio', 'Juniper Robotics', 'Parallax Games', 'Quill Legal', 'Sable Security',
  'Tidewater Logistics', 'Orbital Foods', 'Cobalt Energy', 'Vantage Retail', 'Wren Education', 'Aster Clinics',
  'Mosaic Media', 'Pinecone Travel', 'Summit Outdoor', 'Beacon Insurance', 'Driftwood Hotels', 'Nimbus Cloud',
  'Redwood Capital', 'Solstice Solar', 'Terra Farms', 'Umbra Design', 'Verdant Bio', 'Zephyr Air',
  'Atlas Mobility', 'Copperline Media', 'Foxglove Pharma', 'Granite Works', 'Harbor & Co', 'Ironbark Tools',
]

const PLANS: Record<Plan, { seats: number[]; price: number }> = {
  Enterprise: { seats: [120, 200, 350], price: 72 },
  Business: { seats: [40, 60, 90], price: 38 },
  Pro: { seats: [10, 15, 25], price: 24 },
  Starter: { seats: [3, 5], price: 12 },
}

function renewalOf(time: number): Renewal {
  const days = (time - NOW) / DAY
  return days < 0 ? 'overdue' : days <= 30 ? 'month' : days <= 90 ? 'quarter' : 'later'
}

export function makeCustomers(count: number, seed = 7): Customer[] {
  let s = seed
  const next = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646
  // A seeded Fisher-Yates: a random comparator in sort() shuffles differently per JS engine (server vs browser).
  const shuffle = <T>(list: readonly T[]) => {
    const out = [...list]
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(next() * (i + 1))
      ;[out[i], out[j]] = [out[j]!, out[i]!]
    }
    return out
  }
  const pick = <T>(list: readonly T[]) => list[Math.floor(next() * list.length)]!
  const healths: Health[] = ['healthy', 'healthy', 'healthy', 'healthy', 'trial', 'at-risk', 'at-risk', 'churning']
  const plans: Plan[] = ['Enterprise', 'Business', 'Business', 'Pro', 'Pro', 'Pro', 'Starter']
  const tagKeys = Object.keys(TAGS)
  return Array.from({ length: count }, (_, i) => {
    const base = COMPANIES[i % COMPANIES.length]!
    const name = i < COMPANIES.length ? base : `${base} ${['EU', 'US', 'APAC', 'Labs', 'Group'][Math.floor(i / COMPANIES.length) % 5]}`
    const plan = pick(plans)
    const health = pick(healths)
    const seatLimit = pick(PLANS[plan].seats)
    const fill = health === 'churning' ? 0.3 + next() * 0.3 : health === 'trial' ? 0.2 + next() * 0.5 : 0.55 + next() * 0.5
    const seats = Math.max(1, Math.min(seatLimit, Math.round(seatLimit * fill)))
    const drift = health === 'churning' ? -0.06 : health === 'at-risk' ? -0.02 : health === 'trial' ? 0.05 : 0.025
    let level = 40 + next() * 60
    const usage = Array.from({ length: 12 }, () => (level = Math.max(4, level * (1 + drift + (next() - 0.5) * 0.14))))
    const owners = shuffle(OWNERS).slice(0, 1 + Math.floor(next() * (plan === 'Enterprise' ? 3.4 : 2)))
    const tags = shuffle(tagKeys).slice(0, Math.floor(next() * 4.2))
    const slug = base.toLowerCase().replace(/&/g, 'and').replace(/[^a-z]+/g, '')
    const first = pick(['Hana', 'Oliver', 'Amara', 'Lucas', 'Ines', 'Noah', 'Yuki', 'Elena', 'Marcus', 'Zara'])
    const last = pick(['Novak', 'Brennan', 'Okoye', 'Lindqvist', 'Moreau', 'Tanaka', 'Silva', 'Haddad'])
    const renews = NOW + Math.round((next() * 330 - 20) * DAY)
    return {
      id: `cus_${(0x8f2a91 + i * 104729).toString(16).slice(-6)}`,
      name,
      domain: `${slug}.com`,
      plan,
      health,
      mrr: Math.round((seats * PLANS[plan].price * (0.85 + next() * 0.3)) / 10) * 10,
      seats,
      seatLimit,
      usage,
      owners,
      tags,
      region: pick(['North America', 'North America', 'Europe', 'Europe', 'Asia Pacific', 'Latin America'] as const),
      renewsAt: new Date(renews).toISOString(),
      renewal: renewalOf(renews),
      lastSeen: new Date(NOW - Math.round(next() * (health === 'churning' ? 40 : 6) * DAY + next() * DAY)).toISOString(),
      autoRenew: health !== 'churning' && next() > 0.25,
      contact: { name: `${first} ${last}`, email: `${first.toLowerCase()}@${slug}.com`, role: pick(['Head of Ops', 'CTO', 'VP Finance', 'IT Lead', 'Founder']) },
      tickets: Math.floor(next() * (health === 'healthy' ? 3 : 9)),
      nps: Math.round((health === 'healthy' ? 40 : health === 'trial' ? 20 : -10) + next() * 40),
    }
  })
}

/** The saved views, with how many customers each holds (the same rules their filters apply). */
export function customerViews(customers: readonly Customer[], labels: CustomersCopy['views'] = DEFAULT_COPY.views): DataGridView[] {
  return [
    { id: 'all', label: labels.all, count: customers.length, state: {} },
    {
      id: 'risk',
      label: labels.risk,
      count: customers.filter((c) => c.health === 'at-risk' || c.health === 'churning').length,
      state: { columnFilters: [{ id: 'health', value: ['at-risk', 'churning'] }], sorting: [{ id: 'mrr', desc: true }] },
    },
    {
      id: 'enterprise',
      label: labels.enterprise,
      count: customers.filter((c) => c.plan === 'Enterprise').length,
      state: { columnFilters: [{ id: 'plan', value: ['Enterprise'] }], sorting: [{ id: 'mrr', desc: true }] },
    },
    {
      id: 'renewals',
      label: labels.renewals,
      count: customers.filter((c) => c.renewal !== 'later').length,
      state: { columnFilters: [{ id: 'renewal', value: ['overdue', 'month', 'quarter'] }], sorting: [{ id: 'renewsAt', desc: false }], grouping: 'renewal' },
    },
  ]
}

/** The book's figures that don't come from the rows: the quarter's target and last month's numbers. */
export interface CustomersSummary {
  /** The quarter's MRR target. */
  mrrTarget: number
  /** How far through the quarter today is, 0–1: the target meter's notch. */
  quarterPace: number
  /** Accounts a month ago, for the change under the count. */
  lastMonthCount: number
  /** MRR's change since last month, as a fraction (0.064 is +6.4%). */
  mrrChange: number
  /** The at-risk count's change since last month, as a fraction. */
  riskChange: number
}

export const SUMMARY: CustomersSummary = { mrrTarget: 130_000, quarterPace: 12 / 13, lastMonthCount: 60, mrrChange: 0.064, riskChange: -0.12 }

export const DEFAULT_COPY = {
  section: 'Revenue',
  period: 'Q3 · Week 39',
  title: 'Customers',
  description: 'Every account you bill, how it’s doing, and who looks after it.',
  import: 'Import',
  create: 'New customer',
  noun: 'customers',
  emptyTitle: 'No customers yet',
  emptyDescription: 'Accounts appear here once they start a trial, or when you import them.',
  emptyAction: 'Import customers',
  views: { all: 'All', risk: 'At risk', enterprise: 'Enterprise', renewals: 'Renewing soon' },
  columns: {
    name: 'Customer', health: 'Health', plan: 'Plan', mrr: 'MRR', seats: 'Seats', usage: 'Active users', owners: 'Owners', tags: 'Tags',
    renewsAt: 'Renews', renewal: 'Renewal', autoRenew: 'Auto-renew', lastSeen: 'Last seen', id: 'ID', domain: 'Website', region: 'Region',
  },
  perMonth: '/mo',
  health: { healthy: 'Healthy', trial: 'Trial', 'at-risk': 'At risk', churning: 'Churning' } as Record<DefaultHealth, string>,
  renewal: { overdue: 'Overdue', month: 'This month', quarter: 'Next quarter', later: 'Later' } as Record<DefaultRenewal, string>,
  actions: { email: 'Email contact', open: 'Open account', assign: 'Assign owner', tag: 'Add tag', archive: 'Archive' },
  bulk: { assign: 'Assign', tag: 'Tag', export: 'Export', archive: 'Archive' },
  undo: 'Undo',
  /** Shown when a callback rejects without a message of its own. */
  failed: 'Something went wrong',
  /** A number of customers, as the toasts name a selection. */
  many: (count: number) => `${count} customers`,
  archived: (subject: string) => `Archived ${subject}`,
  autoRenewOn: (name: string) => `${name} renews automatically`,
  autoRenewOff: (name: string) => `${name} renews by hand`,
  drafting: (name: string) => `Drafting an email to ${name}`,
  opening: (name: string) => `Opening ${name}`,
  chooseOwner: (subject: string) => `Choose an owner for ${subject}`,
  tagging: (subject: string) => `Tag ${subject}`,
  exported: (subject: string) => `Exported ${subject}`,
  exportFile: 'customers.csv',
  stats: 'Revenue this quarter',
  customers: 'Customers',
  vsLastMonth: 'vs. last month',
  noAccounts: 'No accounts yet',
  mrr: 'Monthly recurring revenue',
  nothingBilled: 'Nothing billed yet',
  toGo: (amount: string) => `${amount} to go`,
  ofTarget: (amount: string) => `of ${amount} Q3 target`,
  atRisk: 'At risk',
  accounts: (count: number) => (count === 1 ? 'account' : 'accounts'),
  nothingAtRisk: 'Nothing at risk',
  exposed: 'of MRR exposed',
  renewing: 'Renewing this month',
  upForRenewal: (amount: string) => `${amount} MRR up for renewal`,
  overdue: 'Overdue',
  dueThisMonth: 'Due this month',
  contact: 'Primary contact',
  email: 'Email',
  viewAccount: 'View account',
  usage: 'Usage',
  usageHeading: 'Active users · 12 weeks',
  usageLabel: (name: string) => `Weekly active users at ${name}, last 12 weeks`,
  tickets: 'Open tickets',
  nps: 'NPS',
  region: 'Region',
  seats: 'Seats',
  seatsOf: (seats: number, limit: number) => `${seats} of ${limit}`,
}

export type CustomersCopy = typeof DEFAULT_COPY
