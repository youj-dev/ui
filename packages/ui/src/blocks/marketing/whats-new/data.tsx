import type { MouseEventHandler, ReactNode } from 'react'
import { StatusPreviewList } from './media'

export type WhatsNewKind = 'new' | 'improved' | 'fixed'

/** A release or change. */
export interface WhatsNewEntry {
  id: string
  /** "2.0", "2.3.1". */
  version?: string
  /** When it shipped, a timestamp in milliseconds. */
  date: number
  title: string
  /** One or two sentences. */
  summary: string
  /** Its area ("Platform", "Edge"): the filter groups by it. */
  category: string
  kind: WhatsNewKind
  /** What to know, as short phrases; shown with the featured entry, and as the expandable detail of a row. */
  highlights?: string[]
  /** A picture or live piece for the featured entry. */
  media?: ReactNode
  /** The full release notes. */
  href: string
  onClick?: MouseEventHandler<HTMLAnchorElement>
}

const day = (month: number, date: number) => Date.UTC(2026, month, date, 12)

export const NOW = Date.UTC(2026, 8, 29, 9, 0)

export const ENTRIES: WhatsNewEntry[] = [
  {
    id: 'rollback',
    version: '2.0',
    date: day(8, 24),
    title: 'Instant rollbacks, preview comments and a faster edge',
    summary: 'Point production at any earlier deploy without a rebuild, comment on the pixels of any preview, and serve from 38 regions with a median 38 ms to first byte.',
    category: 'Platform',
    kind: 'new',
    highlights: ['Rollback in under a second, from the dashboard, the CLI or your phone', 'Comments pinned to a preview, no login for reviewers', 'Median time to first byte down from 62 ms to 38 ms'],
    media: <StatusPreviewList />,
    href: '#release-2-0',
  },
  {
    id: 'canary',
    version: '2.1',
    date: day(8, 17),
    title: 'Canary releases that promote themselves',
    summary: 'Send five percent of traffic to a new build, then twenty-five, and let it promote when error rates and latency hold.',
    category: 'Platform',
    kind: 'new',
    highlights: ['Set the steps and the thresholds per project', 'Automatic rollback when a threshold trips', 'Every step is in the audit log'],
    href: '#release-2-1',
  },
  {
    id: 'edge-cache',
    date: day(8, 9),
    title: 'Purge the cache in every region in under a second',
    summary: 'Tag-based purges now reach all 38 regions in a median 420 ms, down from eight seconds.',
    category: 'Edge',
    kind: 'improved',
    highlights: ['Purge by tag, path or whole deployment', 'A purge shows up in the audit log with who ran it'],
    href: '#release-edge-cache',
  },
  {
    id: 'scim',
    date: day(7, 28),
    title: 'SCIM provisioning for Okta and Entra ID',
    summary: 'People join and leave Northwind with your directory. Groups map to roles, and removed people lose access in seconds.',
    category: 'Security',
    kind: 'new',
    highlights: ['Groups map to roles', 'Deprovisioning revokes tokens and sessions immediately'],
    href: '#release-scim',
  },
  {
    id: 'logs',
    date: day(7, 19),
    title: 'Logs that keep up with a traffic spike',
    summary: 'The live log stream no longer drops lines above ten thousand requests a second, and search covers the last seven days.',
    category: 'Developer experience',
    kind: 'fixed',
    highlights: ['No dropped lines under load', 'Search across seven days of logs'],
    href: '#release-logs',
  },
  {
    id: 'cli',
    version: '3.4',
    date: day(7, 6),
    title: 'The CLI can deploy a preview from any branch',
    summary: 'northwind preview creates a shareable preview from whatever you have checked out, with its URL on your clipboard.',
    category: 'Developer experience',
    kind: 'new',
    href: '#release-cli',
  },
]

export const DEFAULT_COPY = {
  eyebrow: 'What’s new',
  title: 'Shipping, every week',
  description: 'The changes that matter, in plain language. The full list lives in the changelog.',
  /** The category filter's name. */
  filterLabel: 'Filter by area',
  all: 'All',
  /** The kind tags. */
  kind: { new: 'New', improved: 'Improved', fixed: 'Fixed' },
  /** The featured entry's tag. */
  latest: 'Latest',
  /** "Release 2.0". */
  release: (version: string) => `Release ${version}`,
  /** "5 days ago", built from the formatted relative time. */
  readNotes: 'Read the release notes',
  /** A row's disclosure: its accessible name, "More about Purge the cache…". */
  more: (title: string) => `More about ${title}`,
  moreLabel: 'Details',
  /** The link after the list. */
  changelog: 'See the full changelog',
  subscribe: 'Subscribe to updates',
  loadMore: 'Show earlier changes',
  loadingMore: 'Loading…',
  /** Shown when the filter leaves nothing. */
  empty: 'Nothing in this area yet.',
  loadingLabel: 'Loading the changelog',
}
export type WhatsNewCopy = typeof DEFAULT_COPY
