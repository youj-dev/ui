import { ArchiveIcon } from '@youj/icons/components/youj/icons/archive'
import { ArrowUpRightIcon } from '@youj/icons/components/youj/icons/arrow-up-right'
import { MailIcon } from '@youj/icons/components/youj/icons/mail'
import { TagIcon } from '@youj/icons/components/youj/icons/tag'
import { UserPlusIcon } from '@youj/icons/components/youj/icons/user-plus'
import { createDataGridColumns, type DataGridPerson, type DataGridRowAction, type DataGridView } from './data-grid'

/* A B2B product's customer accounts: seeded, so every story, test and
 * screenshot shows the same rows. */

export const NOW = Date.UTC(2026, 8, 29, 9, 0)
const DAY = 86_400_000

export type Health = 'healthy' | 'trial' | 'at-risk' | 'churning'
export type Plan = 'Enterprise' | 'Business' | 'Pro' | 'Starter'
export type Renewal = 'overdue' | 'month' | 'quarter' | 'later'

export interface Customer {
  id: string
  name: string
  domain: string
  plan: Plan
  health: Health
  mrr: number
  seats: number
  seatLimit: number
  usage: number[]
  owners: DataGridPerson[]
  tags: string[]
  region: 'North America' | 'Europe' | 'Asia Pacific' | 'Latin America'
  renewsAt: string
  /** How soon it renews, from `renewsAt`. */
  renewal: Renewal
  lastSeen: string
  autoRenew: boolean
  contact: { name: string; email: string; role: string }
  tickets: number
  nps: number
}

export const PEOPLE: DataGridPerson[] = [
  { id: 'mira', name: 'Mira Chen' },
  { id: 'jonas', name: 'Jonas Weber' },
  { id: 'priya', name: 'Priya Raman' },
  { id: 'kenji', name: 'Kenji Sato' },
  { id: 'sara', name: 'Sara Okafor' },
  { id: 'leo', name: 'Leo Martins' },
  { id: 'ana', name: 'Ana Lima' },
]

const COMPANIES = [
  'Northwind Traders', 'Brightline Health', 'Fathom Analytics', 'Kestrel Labs', 'Lattice Freight', 'Ember & Oak',
  'Meridian Bank', 'Halcyon Studio', 'Juniper Robotics', 'Parallax Games', 'Quill Legal', 'Sable Security',
  'Tidewater Logistics', 'Orbital Foods', 'Cobalt Energy', 'Vantage Retail', 'Wren Education', 'Aster Clinics',
  'Mosaic Media', 'Pinecone Travel', 'Summit Outdoor', 'Beacon Insurance', 'Driftwood Hotels', 'Nimbus Cloud',
  'Redwood Capital', 'Solstice Solar', 'Terra Farms', 'Umbra Design', 'Verdant Bio', 'Zephyr Air',
  'Atlas Mobility', 'Copperline Media', 'Foxglove Pharma', 'Granite Works', 'Harbor & Co', 'Ironbark Tools',
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

function renewalOf(time: number): Renewal {
  const days = (time - NOW) / DAY
  return days < 0 ? 'overdue' : days <= 30 ? 'month' : days <= 90 ? 'quarter' : 'later'
}

export const TAGS = {
  expansion: { label: 'Expansion' },
  sso: { label: 'SSO' },
  eu: { label: 'EU data' },
  api: { label: 'API-heavy' },
  beta: { label: 'Beta' },
  referral: { label: 'Referral' },
  migration: { label: 'Migration' },
} as const

const PLANS: Record<Plan, { seats: number[]; price: number }> = {
  Enterprise: { seats: [120, 200, 350], price: 72 },
  Business: { seats: [40, 60, 90], price: 38 },
  Pro: { seats: [10, 15, 25], price: 24 },
  Starter: { seats: [3, 5], price: 12 },
}

export function makeCustomers(count: number, seed = 7): Customer[] {
  let s = seed
  const next = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646
  const pick = <T,>(list: readonly T[]) => list[Math.floor(next() * list.length)]!
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
    const seats = Math.max(1, Math.min(seatLimit + (next() > 0.9 ? 3 : 0), Math.round(seatLimit * fill)))
    const drift = health === 'churning' ? -0.06 : health === 'at-risk' ? -0.02 : health === 'trial' ? 0.05 : 0.025
    let level = 40 + next() * 60
    const usage = Array.from({ length: 12 }, () => (level = Math.max(4, level * (1 + drift + (next() - 0.5) * 0.14))))
    const owners = [...PEOPLE].sort(() => next() - 0.5).slice(0, 1 + Math.floor(next() * (plan === 'Enterprise' ? 3.4 : 2)))
    const tags = [...tagKeys].sort(() => next() - 0.5).slice(0, Math.floor(next() * 4.2))
    const slug = base.toLowerCase().replace(/&/g, 'and').replace(/[^a-z]+/g, '')
    const first = pick(['Hana', 'Oliver', 'Amara', 'Lucas', 'Ines', 'Noah', 'Yuki', 'Elena', 'Marcus', 'Zara'])
    const last = pick(['Novak', 'Brennan', 'Okoye', 'Lindqvist', 'Moreau', 'Tanaka', 'Silva', 'Haddad'])
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
      ...(() => {
        const renews = NOW + Math.round((next() * 330 - 20) * DAY)
        return { renewsAt: new Date(renews).toISOString(), renewal: renewalOf(renews) }
      })(),
      lastSeen: new Date(NOW - Math.round(next() * (health === 'churning' ? 40 : 6) * DAY + next() * DAY)).toISOString(),
      autoRenew: health !== 'churning' && next() > 0.25,
      contact: { name: `${first} ${last}`, email: `${first.toLowerCase()}@${slug}.com`, role: pick(['Head of Ops', 'CTO', 'VP Finance', 'IT Lead', 'Founder']) },
      tickets: Math.floor(next() * (health === 'healthy' ? 3 : 9)),
      nps: Math.round((health === 'healthy' ? 40 : health === 'trial' ? 20 : -10) + next() * 40),
    }
  })
}

const col = createDataGridColumns<Customer>()

export function customerColumns(onAutoRenew?: (row: Customer, value: boolean) => void) {
  return [
    col.identity('name', { header: 'Customer', shape: 'square', secondary: (c) => c.domain, size: 232 }),
    col.status('health', { header: 'Health', options: HEALTH, size: 132 }),
    col.text('plan', { header: 'Plan', groupable: true, facet: true, size: 108 }),
    col.currency('mrr', { header: 'MRR', currency: 'USD', unit: '/mo', size: 124 }),
    col.meter('seats', { header: 'Seats', max: (c) => c.seatLimit, size: 152 }),
    col.trend('usage', { header: 'Active users', size: 164 }),
    col.people('owners', { header: 'Owners', size: 112 }),
    col.tags('tags', { header: 'Tags', options: TAGS, size: 200, minSize: 170, meta: { grow: true } }),
    col.date('renewsAt', { header: 'Renews', size: 124 }),
    col.status('renewal', { header: 'Renewal', options: RENEWAL, size: 144 }),
    col.boolean('autoRenew', { header: 'Auto-renew', onToggle: onAutoRenew, size: 112 }),
    col.date('lastSeen', { header: 'Last seen', size: 124 }),
    col.id('id', { header: 'ID', size: 140 }),
    col.link('domain', { header: 'Website', href: (c) => `https://${c.domain}`, size: 188 }),
    col.text('region', { header: 'Region', groupable: true, facet: true, size: 140 }),
  ]
}

export const customerViews: DataGridView[] = [
  { id: 'all', label: 'All customers', state: {} },
  { id: 'risk', label: 'At risk', state: { columnFilters: [{ id: 'health', value: ['at-risk', 'churning'] }], sorting: [{ id: 'mrr', desc: true }] } },
  { id: 'enterprise', label: 'Enterprise', state: { columnFilters: [{ id: 'plan', value: ['Enterprise'] }], sorting: [{ id: 'mrr', desc: true }] } },
  { id: 'renewals', label: 'Renewing soon', state: { columnFilters: [{ id: 'renewal', value: ['overdue', 'month', 'quarter'] }], sorting: [{ id: 'renewsAt', desc: false }] } },
]

/** How many customers each view holds: the same rules its filters apply. */
export function viewCounts(data: readonly Customer[]): Record<string, number> {
  return {
    all: data.length,
    risk: data.filter((c) => c.health === 'at-risk' || c.health === 'churning').length,
    enterprise: data.filter((c) => c.plan === 'Enterprise').length,
    renewals: data.filter((c) => c.renewal !== 'later').length,
  }
}

export function customerActions(log: (message: string) => void = () => {}): (c: Customer) => DataGridRowAction<Customer>[] {
  return () => [
    { label: 'Email contact', icon: MailIcon, inline: true, onSelect: (c) => log(`Email ${c.contact.email}`) },
    { label: 'Open account', icon: ArrowUpRightIcon, inline: true, onSelect: (c) => log(`Open ${c.name}`) },
    { label: 'Assign owner', icon: UserPlusIcon, onSelect: (c) => log(`Assign ${c.name}`) },
    { label: 'Add tag', icon: TagIcon, onSelect: (c) => log(`Tag ${c.name}`) },
    { label: 'Archive', icon: ArchiveIcon, destructive: true, separated: true, onSelect: (c) => log(`Archive ${c.name}`) },
  ]
}
