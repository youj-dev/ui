import type { ReactNode } from 'react'
import { numberFormat } from '../../../lib/utils'

/* Canopy's feature requests: what customers asked for, who asked, and
 * where each one stands. Fixed data, so the page renders the same on the
 * server and in the browser. Swap `REQUESTS` for your feedback tool's API. */

export const NOW = Date.UTC(2026, 8, 29, 9, 0)
const DAY = 86_400_000

export type Status = 'review' | 'planned' | 'building' | 'shipped' | 'declined'
export type Area = 'Editor' | 'Sharing' | 'Integrations' | 'Admin' | 'Billing' | 'Mobile'
export type SortBy = 'priority' | 'votes' | 'newest'

export interface Asker {
  company: string
  /** The customer's plan; Enterprise, Business and Team get their own badge tone. */
  plan: 'Enterprise' | 'Business' | 'Team' | (string & {})
  /** Annual recurring revenue, in dollars. */
  arr: number
}

export interface FeatureRequest {
  id: string
  title: string
  area: Area | (string & {})
  status: Status
  votes: number
  owner: string
  /** The original ask, in the customer's words. */
  quote: { text: string; by: string; company: string }
  /** What the team knows so far. */
  notes: string
  askers: Asker[]
  createdAt: number
  updatedAt: number
}

export const STATUS: Record<Status, { label: string }> = {
  review: { label: 'Under review' },
  planned: { label: 'Planned' },
  building: { label: 'In progress' },
  shipped: { label: 'Shipped' },
  declined: { label: 'Declined' },
}

export const SORTS: Record<SortBy, string> = { priority: 'Priority', votes: 'Votes', newest: 'Newest' }

const COMPANIES: Asker[] = [
  { company: 'Northwind Traders', plan: 'Enterprise', arr: 148_000 },
  { company: 'Fathom Analytics', plan: 'Business', arr: 42_000 },
  { company: 'Kestrel Labs', plan: 'Business', arr: 36_500 },
  { company: 'Meridian Bank', plan: 'Enterprise', arr: 212_000 },
  { company: 'Halcyon Studio', plan: 'Team', arr: 8_400 },
  { company: 'Juniper Robotics', plan: 'Business', arr: 51_000 },
  { company: 'Quill Legal', plan: 'Team', arr: 12_600 },
  { company: 'Tidewater Logistics', plan: 'Enterprise', arr: 96_000 },
  { company: 'Wren Education', plan: 'Team', arr: 6_000 },
  { company: 'Aster Clinics', plan: 'Business', arr: 28_800 },
  { company: 'Solstice Solar', plan: 'Business', arr: 33_000 },
  { company: 'Parallax Games', plan: 'Team', arr: 9_600 },
]

type Seed = [title: string, area: Area, status: Status, votes: number, owner: string, quote: string, by: string, notes: string, askers: number[], age: number, touched: number]

const SEEDS: Seed[] = [
  ['Two-way sync with Linear issues', 'Integrations', 'building', 214, 'Mira Chen', 'We plan in Canopy and ship in Linear. Right now someone copies status back by hand every Friday.', 'Hana Novak', 'Status and assignee sync first; comments later. Webhooks are in place, the mapping screen is in design.', [0, 1, 3, 5, 7], 64, 1],
  ['SAML single sign-on on the Business plan', 'Admin', 'planned', 188, 'Jonas Weber', 'Our security review blocks any tool without SSO, and Enterprise is more than we need.', 'Lucas Moreau', 'Pricing agreed: SSO moves to Business in Q4. Okta and Entra ID at launch, Google Workspace after.', [1, 2, 5, 9, 10], 92, 3],
  ['Offline mode for the desktop app', 'Editor', 'review', 176, 'Priya Raman', 'Half our field team edits on trains. They lose changes when the tunnel drops the connection.', 'Amara Okoye', 'Needs a sync engine rethink. Scoping a read-only offline cache as a first step.', [7, 3, 11, 4], 140, 6],
  ['Longer version history than 30 days', 'Editor', 'planned', 151, 'Priya Raman', 'Legal asked us to keep every revision of contract drafts for a year.', 'Ines Silva', 'Storage cost is fine. 365 days on Business, unlimited on Enterprise.', [6, 3, 0], 75, 4],
  ['Guest links that expire', 'Sharing', 'building', 137, 'Kenji Sato', 'We share boards with agencies. We need links to stop working when the project ends.', 'Noah Lindqvist', 'Expiry dates and a revoke-all button. Behind a flag for three design partners.', [4, 11, 1, 8], 51, 0],
  ['Export boards to PDF with page breaks', 'Sharing', 'review', 122, 'Kenji Sato', 'Clients want a PDF of the workshop board, and right now it prints as one giant page.', 'Elena Brennan', 'Page-break guides on the canvas, then a print layout. Waiting on the renderer upgrade.', [4, 9, 6], 118, 9],
  ['Slack digest of mentions', 'Integrations', 'shipped', 118, 'Mira Chen', 'I miss mentions because email is noise. A morning Slack digest would fix it.', 'Yuki Tanaka', 'Shipped in 4.12: a daily digest per person, sent at 9:00 in their time zone.', [2, 5, 10], 160, 12],
  ['Comment on a single table cell', 'Editor', 'review', 97, 'Leo Martins', 'Our finance team reviews budgets in Canopy tables and wants to pin questions to a figure.', 'Marcus Haddad', 'Comments anchor to blocks today. Cell anchors need a stable cell id; design is exploring.', [3, 7], 88, 15],
  ['Invoices in euro', 'Billing', 'planned', 84, 'Sara Okafor', 'Our accounts team in Lyon can only pay invoices in euro.', 'Zara Moreau', 'EUR and GBP at the next price book. Existing plans convert at renewal.', [10, 9, 2], 57, 8],
  ['Audit log export to S3', 'Admin', 'review', 76, 'Jonas Weber', 'We keep every audit event in our own bucket for seven years.', 'Oliver Brennan', 'Streaming export to S3 and GCS. Needs a customer-managed key story first.', [3, 0, 7], 102, 21],
  ['Handwriting to text with Apple Pencil', 'Mobile', 'review', 71, 'Leo Martins', 'I sketch in meetings on the iPad and then retype everything afterwards.', 'Hana Tanaka', 'On-device recognition is good enough now. A spike is planned for next cycle.', [4, 11, 8], 44, 5],
  ['Templates shared across a workspace', 'Editor', 'building', 66, 'Priya Raman', 'Every team rebuilds the same retro board. Let admins publish templates once.', 'Noah Silva', 'Workspace templates with an admin-curated shelf. Ships with the new "New page" menu.', [5, 2, 10, 1], 71, 2],
  ['Move pages between spaces in bulk', 'Editor', 'review', 58, 'Leo Martins', 'We reorganised into squads and had to move four hundred pages one by one.', 'Ines Okoye', 'Bulk move with link rewriting. Blocked on permissions checks for mixed-access pages.', [0, 7], 38, 10],
  ['Monthly billing per seat', 'Billing', 'declined', 49, 'Sara Okafor', 'We add contractors for a month at a time, and annual seats don’t fit that.', 'Lucas Haddad', 'Declined for now: flexible seats on annual plans (true-up each quarter) covers most of it.', [11, 8], 130, 30],
  ['Read receipts on shared pages', 'Sharing', 'review', 41, 'Kenji Sato', 'I need to know the client actually opened the proposal before I chase them.', 'Elena Novak', 'Privacy review first. Likely opt-in per page, and never for guests who opt out.', [6, 4], 26, 7],
  ['Custom keyboard shortcuts', 'Editor', 'review', 33, 'Mira Chen', 'I came from Vim. Let me remap the block shortcuts.', 'Marcus Lindqvist', 'A shortcut editor in settings; conflicts shown inline. Low effort, low reach.', [2], 19, 4],
  ['Quick-note widget on Android', 'Mobile', 'planned', 29, 'Leo Martins', 'The iOS widget is great. Our Android folks keep asking for the same thing.', 'Zara Okoye', 'Parity with the iOS widget: quick note, recent pages. After the Android 16 update.', [9, 11], 33, 11],
]

export const REQUESTS: FeatureRequest[] = SEEDS.map(([title, area, status, votes, owner, text, by, notes, askers, age, touched], i) => {
  const list = askers.map((n) => COMPANIES[n]!)
  return {
    id: `req-${104 + i * 7}`,
    title,
    area,
    status,
    votes,
    owner,
    quote: { text, by, company: list[0]!.company },
    notes,
    askers: list,
    createdAt: NOW - age * DAY,
    updatedAt: NOW - touched * DAY - (i % 5) * 3_600_000,
  }
})

/** The list's item type, under the block's name. */
export type ListDetailItem = FeatureRequest
export type ListDetailAsker = Asker
export type ListDetailStatus = Status

export const arrOf = (request: FeatureRequest) => request.askers.reduce((sum, a) => sum + a.arr, 0)

/** Whole days from `time` to `now`. */
export const daysBetween = (time: number, now: number) => Math.floor((now - time) / DAY)

const agoText = (days: number) =>
  days < 1 ? 'today' : days === 1 ? 'yesterday' : days < 14 ? `${days}d ago` : days < 60 ? `${Math.round(days / 7)}w ago` : `${Math.round(days / 30)}mo ago`

export function ago(time: number, now = NOW) {
  return agoText(daysBetween(time, now))
}

/** Compact money, "$148K". */
export const moneyFormat = (locale: string, currency: string) => numberFormat(locale, { style: 'currency', currency, notation: 'compact', maximumFractionDigits: 1 }).format

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter((word) => /^[A-Za-z]/.test(word))
    .map((word) => word[0])
    .join('')
    .slice(0, 2)

/** The product in the standalone top bar. */
export interface ListDetailBrand {
  name: string
  /** Default: the name's first letter on a primary tile. */
  logo?: ReactNode
}

export const BRAND: ListDetailBrand = { name: 'Canopy' }

export const DEFAULT_COPY = {
  title: 'Requests',
  section: 'Feedback',
  newRequest: 'New request',
  resizeList: 'Resize the list',
  detailRegion: 'Request',
  search: 'Search requests',
  sortBy: 'Sort by',
  sorts: SORTS,
  statuses: Object.fromEntries(Object.entries(STATUS).map(([value, { label }]) => [value, label])) as Record<Status, string>,
  noMatch: (query: string) => `No requests match “${query}”`,
  clearSearch: 'Clear search',
  emptyTitle: 'No requests yet',
  emptyDescription: 'Requests from your customers show up here.',
  loading: 'Loading requests',
  errorTitle: 'Couldn’t load requests',
  retry: 'Try again',
  votes: ' votes',
  hint: (sortable: boolean) => `Up and down arrows move between requests, Enter opens one${sortable ? ', Alt with an arrow moves it in the priority order' : ''}.`,
  keyMove: 'Move',
  keyOpen: 'Open',
  keyReorder: 'Reorder',
  moved: (title: string, position: number, total: number) => `${title}, position ${position} of ${total}`,
  statusChanged: (status: string, title: string) => `${status}: ${title}`,
  undo: 'Undo',
  mergePrompt: (title: string) => `Pick a request to merge into “${title}”`,
  replyDraft: (companies: number) => `Drafting a reply to ${companies} companies`,
  /** "3d ago" from a number of whole days. */
  ago: agoText,
  status: 'Status',
  replyToAskers: 'Reply to askers',
  merge: 'Merge',
  figureVotes: 'Votes',
  figureRevenue: 'Revenue asking',
  figureOpened: 'Opened',
  updated: (ago: string) => `Updated ${ago}`,
  theAsk: 'The ask',
  whereItStands: 'Where it stands',
  ownedBy: 'Owned by',
  whosAsking: 'Who’s asking',
  pickTitle: 'Pick a request',
  pickMove: 'Move through the list with',
  pickOpen: 'and open one with',
}

export type ListDetailCopy = typeof DEFAULT_COPY
