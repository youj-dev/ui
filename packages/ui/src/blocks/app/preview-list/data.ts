import type { ReactNode } from 'react'

/* The projects of a fictional hosting product, Fernbit: pass yours through the block's props. */

/** Where an item stands: the dot and word beside its name. */
export interface PreviewListStatus {
  id: string
  label: string
  tone: 'success' | 'warning' | 'danger' | 'neutral' | 'accent' | 'info'
}

/** The page an item's placeholder picture draws, when there is no screenshot: SVG shapes in a 176 × 104 box, in the theme's colors (`fill-(--thumb-tone)` is the item's tone). */
export interface PreviewListLook {
  id: string
  page: ReactNode
}

/** The latest thing that happened to an item: a label and a reference (the demo's branch and short hash), what it was and when. */
export interface PreviewListLatest {
  /** The demo: the branch, "main". */
  label: string
  /** The demo: the short hash, "a3f9c21". Set in mono. */
  ref: string
  message: string
  /** When it happened: an ISO date-time. */
  at: string
}

export interface PreviewListItem {
  id: string
  name: string
  /** A `PreviewListStatus` id; one it doesn't know shows as itself. */
  status: string
  /** Where it can be found, e.g. "shop.fernbit.app" or an address, joined with dots; the first is the visit link unless `href` says otherwise. */
  locations: string[]
  /** The visit link. Default: `https://` and the first of `locations`. `null`: no visit link. */
  href?: string | null
  createdBy: { name: string; image?: string }
  /** An ISO date-time. */
  createdAt: string
  /** The latest activity. */
  latest: PreviewListLatest
  /** A `PreviewListLook` id, the placeholder page to draw. Default: the first look. */
  look?: string
  /** The placeholder's color. Default: the chart colors in turn. */
  tone?: 'chart-1' | 'chart-2' | 'chart-3' | 'chart-4' | 'chart-5'
  /** Your own picture of the site, in place of the drawn placeholder (a 11:6.5 box). */
  thumbnail?: ReactNode
}

export type PreviewListSort = 'activity' | 'name' | 'created'

/** The moment the demo's relative times count to. */
export const DEMO_NOW = '2026-10-13T12:00:00Z'

export const STATUSES: PreviewListStatus[] = [
  { id: 'live', label: 'Live', tone: 'success' },
  { id: 'building', label: 'Building', tone: 'warning' },
  { id: 'failed', label: 'Failed', tone: 'danger' },
  { id: 'paused', label: 'Paused', tone: 'neutral' },
]

export const PROJECTS: PreviewListItem[] = [
  {
    id: 'storefront',
    name: 'Alder Market',
    status: 'live',
    locations: ['alder.market', 'api.alder.market'],
    createdBy: { name: 'Ada Lovelace' },
    createdAt: '2026-08-21T09:30:00Z',
    latest: { label: 'main', ref: 'a3f9c21', message: 'Cache product pages at the edge and revalidate on stock changes', at: '2026-10-13T10:42:00Z' },
    look: 'store',
    tone: 'chart-1',
  },
  {
    id: 'docs',
    name: 'Halyard Docs',
    status: 'live',
    locations: ['docs.halyard.dev'],
    createdBy: { name: 'Grace Hopper' },
    createdAt: '2026-06-02T14:05:00Z',
    latest: { label: 'main', ref: '7be04d9', message: 'Add the migration guide and fix the sidebar order', at: '2026-10-12T16:20:00Z' },
    look: 'docs',
    tone: 'chart-2',
  },
  {
    id: 'console',
    name: 'Kestrel Console',
    status: 'building',
    locations: ['console.kestrel.run', 'api.kestrel.run'],
    createdBy: { name: 'Katherine Johnson' },
    createdAt: '2026-09-14T08:10:00Z',
    latest: { label: 'feat/usage-limits', ref: 'c81d2f4', message: 'Show plan limits next to each usage chart', at: '2026-10-13T11:51:00Z' },
    look: 'dashboard',
    tone: 'chart-3',
  },
  {
    id: 'journal',
    name: 'Mossgrove Journal',
    status: 'live',
    locations: ['journal.mossgrove.co'],
    createdBy: { name: 'Margaret Hamilton' },
    createdAt: '2026-03-18T11:45:00Z',
    latest: { label: 'main', ref: '0d5a6e8', message: 'Publish the autumn issue', at: '2026-10-09T08:03:00Z' },
    look: 'landing',
    tone: 'chart-4',
  },
  {
    id: 'status',
    name: 'Quill Status',
    status: 'failed',
    locations: ['status.quill.app'],
    createdBy: { name: 'Ada Lovelace' },
    createdAt: '2026-07-07T17:00:00Z',
    latest: { label: 'fix/incident-feed', ref: 'e42b9a0', message: 'Read incidents from the new feed endpoint', at: '2026-10-11T19:14:00Z' },
    look: 'dashboard',
    tone: 'chart-5',
  },
  {
    id: 'booking',
    name: 'Tarn Bookings',
    status: 'paused',
    locations: ['book.tarn.studio', 'admin.tarn.studio'],
    createdBy: { name: 'Edith Clarke' },
    createdAt: '2026-01-26T10:20:00Z',
    latest: { label: 'main', ref: '5c19f73', message: 'Pause deploys while the calendar vendor migrates', at: '2026-09-18T13:37:00Z' },
    look: 'landing',
    tone: 'chart-1',
  },
  {
    id: 'changelog',
    name: 'Fernbit Changelog',
    status: 'live',
    locations: ['changelog.fernbit.dev'],
    createdBy: { name: 'Grace Hopper' },
    createdAt: '2025-11-30T12:00:00Z',
    latest: { label: 'main', ref: '91e7c3b', message: 'Group entries by month and add RSS', at: '2026-10-05T09:48:00Z' },
    look: 'docs',
    tone: 'chart-2',
  },
]

export const DEFAULT_COPY = {
  title: 'Projects',
  count: (shown: number, total: number) => (shown === total ? `${total}` : `${shown} of ${total}`),
  searchLabel: 'Search projects',
  searchPlaceholder: 'Search projects',
  sortLabel: 'Sort projects',
  sortActivity: 'Latest activity',
  sortName: 'Name',
  sortCreated: 'Newest',
  create: 'Create project',
  details: 'Project details',
  visit: (name: string) => `Visit ${name}`,
  activity: (name: string) => `Deployments of ${name}`,
  settings: (name: string) => `Settings of ${name}`,
  more: (count: number) => `+${count} more`,
  createdBy: (name: string, when: string) => `${name} created it ${when}`,
  emptyTitle: 'No projects yet',
  emptyDescription: 'Create a project to deploy your first site.',
  noMatchTitle: 'No projects match',
  noMatchDescription: (query: string) => `Nothing matches “${query}”. Try a name, a domain or a commit message.`,
  loading: 'Loading projects',
  error: 'Couldn’t load your projects.',
  retry: 'Try again',
}

export type PreviewListCopy = typeof DEFAULT_COPY
