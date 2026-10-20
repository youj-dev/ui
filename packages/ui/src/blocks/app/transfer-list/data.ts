import type { TransferItem } from '../../../components/ui/progress-list'
import { numberFormat } from '../../../lib/utils'

/* Fixtures and types for the transfer-list card: fourteen files mid-sync as
 * the demo. Pass yours through the block's props. */

/** A transfer plus the rate it moves at while active (a second's worth of its `size` unit: bytes by default). */
export interface TransferListItem extends TransferItem {
  speed: number
}

const MB = 1_000_000
const GB = 1_000_000_000

/** Fourteen files mid-sync: three moving, one failed, one paused, some queued and a few done. */
export const ITEMS: TransferListItem[] = [
  { id: 'still', name: 'hero-still-04.png', size: 14.6 * MB, transferred: 9.4 * MB, rate: 2.9 * MB, speed: 2.9 * MB, status: 'active' },
  { id: 'film', name: 'launch-film-master.mov', size: 2.31 * GB, transferred: 1.402 * GB, rate: 18.9 * MB, speed: 18.9 * MB, status: 'active' },
  { id: 'train', name: 'training-set-v4.parquet', size: 1.84 * GB, transferred: 0.612 * GB, rate: 21.4 * MB, speed: 21.4 * MB, status: 'active' },
  { id: 'traces', name: 'eval-traces-0926.jsonl', size: 386 * MB, transferred: 243 * MB, speed: 12.2 * MB, status: 'failed' },
  { id: 'brand', name: 'brand-guidelines.key', size: 212 * MB, transferred: 81 * MB, speed: 9.6 * MB, status: 'paused' },
  { id: 'deck', name: 'q4-planning-deck.pdf', size: 38.2 * MB, transferred: 0, speed: 6.1 * MB, status: 'queued' },
  { id: 'interviews', name: 'customer-interviews.zip', size: 940 * MB, transferred: 0, speed: 16.4 * MB, status: 'queued' },
  { id: 'schema', name: 'warehouse-schema.sql', size: 2.4 * MB, transferred: 0, speed: 1.8 * MB, status: 'queued' },
  { id: 'audio', name: 'podcast-ep-31.wav', size: 612 * MB, transferred: 0, speed: 14.2 * MB, status: 'queued' },
  { id: 'review', name: 'q3-board-review.pdf', size: 48.2 * MB, transferred: 48.2 * MB, speed: 8 * MB, status: 'done' },
  { id: 'logo', name: 'logo-system.svg', size: 1.2 * MB, transferred: 1.2 * MB, speed: 1 * MB, status: 'done' },
  { id: 'notes', name: 'release-notes.md', size: 0.18 * MB, transferred: 0.18 * MB, speed: 1 * MB, status: 'done' },
  { id: 'export', name: 'crm-export-0927.csv', size: 96 * MB, transferred: 96 * MB, speed: 8 * MB, status: 'done' },
  { id: 'backup', name: 'db-snapshot-0928.tar.gz', size: 1.12 * GB, transferred: 1.12 * GB, speed: 20 * MB, status: 'done' },
]

/** How many files move at once. */
export const CONCURRENCY = 3
/** The demo's clock: how often the bytes move, in ms. */
export const TICK = 500

const UNITS = ['byte', 'kilobyte', 'megabyte', 'gigabyte', 'terabyte']

/** Bytes in the largest unit under a thousand: "6.8 GB". */
export function formatBytes(bytes: number, locale: string) {
  const i = Math.min(UNITS.length - 1, Math.max(0, Math.floor(Math.log10(Math.max(1, bytes)) / 3)))
  const value = bytes / 1000 ** i
  return numberFormat(locale, { style: 'unit', unit: UNITS[i], maximumFractionDigits: i > 0 && value < 100 ? 1 : 0 }).format(value)
}

export const DEFAULT_COPY = {
  title: 'Transfers',
  subtitle: (count: number, size: string) => `${count} ${count === 1 ? 'file' : 'files'} · ${size}`,
  more: 'More options',
  overall: 'Overall progress',
  items: 'Files',
  /** The footer's status line. */
  status: (active: number, queued: number) => `${active} active · ${queued} queued`,
  settled: 'All settled',
  pauseAll: 'Pause all',
  resumeAll: 'Resume all',
  cancelAll: 'Cancel all',
  /** Why the demo's failed file stopped. */
  connectionReset: 'Connection reset at 63%',
  emptyTitle: 'Nothing in flight',
  emptyBody: 'Files you send or fetch show up here while they move.',
  loadingLabel: 'Loading transfers',
  retry: 'Retry',
}

export type TransferListCopy = typeof DEFAULT_COPY & {
  /** The BCP 47 locale its numbers and dates are written in. Default: the app's (YoujProvider's `locale`), else en-US. */
  locale: string
}
