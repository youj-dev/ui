import type { ScaleKind } from './scale'

export type PairedBarsTone = 'accent' | 'chart-1' | 'chart-2' | 'chart-3' | 'chart-4' | 'chart-5'

/** One of the two sides being compared. */
export interface PairedBarsSide {
  id: string
  /** Its name: "Starter". */
  label: string
  /** The color of its bars. Default: the first side chart-2, the second chart-1. */
  tone?: PairedBarsTone
}

/** A second figure a side has for a row, written as money in `copy.currency` (a price, a fee). */
export interface PairedBarsFigure {
  amount: number
  /** What it was before: shown struck through beside the figure. */
  was?: number
}

export interface PairedBarsBadge {
  label: string
  /** `accent` for something new, `warning` for a limit. Default `secondary`. */
  tone?: 'default' | 'secondary' | 'warning' | 'success' | 'danger' | 'outline'
}

export interface PairedBarsRow {
  id: string
  /** What is compared: "Marlin 2". */
  name: string
  /** A line under the name. */
  detail?: string
  badges?: readonly PairedBarsBadge[]
  /** What each side has: one number per side, in the sides' order, on the one shared axis. */
  values: readonly [number, number]
  /** Writes this row's numbers. Default: the card's `format`. */
  format?: Intl.NumberFormatOptions
  /** A second figure for each side, in the sides' order; no column when no row has one. */
  figures?: readonly [PairedBarsFigure | undefined, PairedBarsFigure | undefined]
}

export const DEFAULT_COPY = {
  title: 'Plan comparison',
  description: 'Requests each plan includes a month, and what each model adds to the bill.',
  /** The table's name. */
  tableLabel: 'Models by plan',
  nameHeader: 'Model',
  /** The numbers column. */
  valuesHeader: 'Requests',
  /** The bars column, and its axis. */
  chartHeader: (scale: ScaleKind): string => (scale === 'log' ? 'Requests, log scale' : 'Requests'),
  /** A figure column's head. */
  figureHeader: (side: string) => `${side} / mo`,
  /** Before a struck-through figure, for a screen reader. */
  was: 'was',
  /** When a side does not charge for or offer the row. */
  noFigure: 'Not offered',
  search: 'Search models',
  /** The count under the table. */
  count: (shown: number, total: number) => (shown === total ? `${total} models` : `${shown} of ${total} models`),
  viewAll: (total: number) => `View all ${total}`,
  showFewer: 'Show fewer',
  /** Named for the scrolling region when every row is shown. */
  region: 'All models',
  empty: 'No models match',
  emptyDescription: 'Try another name.',
  loading: 'Loading the plans',
  retry: 'Retry',
  /** The ISO 4217 code the figures are written in. */
  currency: 'USD',
}

export type PairedBarsCopy = typeof DEFAULT_COPY & {
  /** The BCP 47 locale every figure is written in. Default: the app's (YoujProvider's `locale`), else en-US. */
  locale: string
}

export const SIDES: [PairedBarsSide, PairedBarsSide] = [
  { id: 'starter', label: 'Starter' },
  { id: 'team', label: 'Team' },
]

const NEW: PairedBarsBadge = { label: 'New', tone: 'default' }
const LIMITED: PairedBarsBadge = { label: 'Limited', tone: 'warning' }

/** Fictional models by fictional makers. */
export const ROWS: PairedBarsRow[] = [
  {
    id: 'marlin-2',
    name: 'Marlin 2',
    detail: 'General chat',
    badges: [NEW],
    values: [1_200, 38_000],
    figures: [{ amount: 9 }, { amount: 29, was: 39 }],
  },
  { id: 'marlin-mini', name: 'Marlin 2 Mini', detail: 'Fast and light', values: [8_500, 40_000], figures: [{ amount: 4 }, { amount: 12 }] },
  {
    id: 'quill-vision',
    name: 'Quill Vision',
    detail: 'Reads images',
    badges: [LIMITED],
    values: [120, 4_800],
    figures: [{ amount: 15, was: 19 }, { amount: 45 }],
  },
  { id: 'quill-chat', name: 'Quill Chat', detail: 'Support replies', values: [2_400, 22_000], figures: [{ amount: 6 }, { amount: 18 }] },
  { id: 'orrery-embed', name: 'Orrery Embed', detail: 'Search vectors', values: [14_000, 40_000], figures: [{ amount: 2 }, { amount: 5 }] },
  {
    id: 'orrery-rerank',
    name: 'Orrery Rerank',
    detail: 'Orders results',
    badges: [NEW],
    values: [900, 16_000],
    figures: [{ amount: 5 }, { amount: 14 }],
  },
  { id: 'fenwick-speech', name: 'Fenwick Speech', detail: 'Transcription', values: [300, 9_500], figures: [{ amount: 11 }, { amount: 32, was: 36 }] },
  {
    id: 'fenwick-voice',
    name: 'Fenwick Voice',
    detail: 'Spoken replies',
    badges: [LIMITED],
    values: [100, 2_600],
    figures: [undefined, { amount: 40 }],
  },
  { id: 'sable-code', name: 'Sable Code', detail: 'Completions', values: [3_800, 31_000], figures: [{ amount: 8 }, { amount: 24 }] },
  { id: 'sable-review', name: 'Sable Review', detail: 'Pull requests', values: [450, 7_200], figures: [{ amount: 7 }, { amount: 19 }] },
  {
    id: 'brindle-image',
    name: 'Brindle Image',
    detail: 'Pictures from text',
    badges: [LIMITED],
    values: [150, 3_900],
    figures: [{ amount: 20 }, { amount: 55, was: 65 }],
  },
  { id: 'brindle-fast', name: 'Brindle Fast', detail: 'Drafts in seconds', values: [1_900, 12_500], figures: [{ amount: 10 }, { amount: 26 }] },
  { id: 'tallow-search', name: 'Tallow Search', detail: 'Finds in your files', values: [5_200, 36_000], figures: [{ amount: 3 }, { amount: 9 }] },
  {
    id: 'tallow-notes',
    name: 'Tallow Notes',
    detail: 'Meeting summaries',
    badges: [NEW],
    values: [620, 8_800],
    figures: [{ amount: 6 }, { amount: 17 }],
  },
]
