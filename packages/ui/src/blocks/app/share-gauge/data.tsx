import type { ReactNode } from 'react'
import { BotIcon, CloudIcon, CpuIcon, DatabaseIcon, GlobeIcon, HardDriveIcon, KeyIcon, MailIcon, MessageIcon, NetworkIcon, ShieldIcon, TerminalIcon, ZapIcon } from '@youj/icons'

/** One thing the total is spent on. */
export interface ShareGaugeItem {
  id: string
  /** What it is: "Compute hours". */
  label: string
  /** Who it comes from, under the name: "Orrery". */
  detail?: string
  /** What it came to. */
  value: number
  /** A mark for its row. Default: none. */
  icon?: ReactNode
}

/** A stretch of time the gauge can show, with what was spent in it. */
export interface ShareGaugePeriod {
  id: string
  /** On the switch: "Month". */
  label: string
  /** In the middle of the gauge, under the total: "September 2026". */
  name: string
  items: readonly ShareGaugeItem[]
}

export const DEFAULT_COPY = {
  title: 'Spend by service',
  /** The row for the folded tail; `count` is how many items it holds. */
  other: (count: number) => `Other · ${count}`,
  /** The tail's line under its name. */
  otherDetail: 'Everything smaller',
  /** Names the switch between periods. */
  periodLabel: 'Period',
  /** Names the ranked list. */
  listLabel: 'Spend by service, largest first',
  /** What the gauge says to a screen reader: the total, the period and the parts. */
  summary: (total: string, period: string, parts: string) => `${total} in ${period}. ${parts}`,
  /** One part in that summary. */
  part: (label: string, share: string) => `${label} ${share}`,
  empty: 'No spend yet',
  emptyDescription: 'Spend appears here once something is billed.',
  loading: 'Loading the spend',
  retry: 'Retry',
  /** The ISO 4217 code the amounts are written in. */
  currency: 'USD',
}

export type ShareGaugeCopy = typeof DEFAULT_COPY & {
  /** The BCP 47 locale every figure is written in. Default: the app's (YoujProvider's `locale`), else en-US. */
  locale: string
}

const I = 16

/** Fictional services and the fictional companies behind them. Amounts are US dollars. */
const MONTH: ShareGaugeItem[] = [
  { id: 'compute', label: 'Compute hours', detail: 'Orrery', value: 4820.4, icon: <CpuIcon size={I} /> },
  { id: 'storage', label: 'Object storage', detail: 'Brindle', value: 3140.75, icon: <HardDriveIcon size={I} /> },
  { id: 'database', label: 'Managed database', detail: 'Tallow', value: 2610.2, icon: <DatabaseIcon size={I} /> },
  { id: 'email', label: 'Email delivery', detail: 'Quillmark', value: 1385.9, icon: <MailIcon size={I} /> },
  { id: 'cdn', label: 'Edge network', detail: 'Fenwick', value: 1042.35, icon: <GlobeIcon size={I} /> },
  { id: 'queue', label: 'Message queue', detail: 'Orrery', value: 688.1, icon: <MessageIcon size={I} /> },
  { id: 'auth', label: 'Sign-in service', detail: 'Marlow', value: 540, icon: <KeyIcon size={I} /> },
  { id: 'scan', label: 'Code scanning', detail: 'Sable', value: 412.6, icon: <ShieldIcon size={I} /> },
  { id: 'logs', label: 'Log search', detail: 'Tallow', value: 355.25, icon: <TerminalIcon size={I} /> },
  { id: 'dns', label: 'Name servers', detail: 'Fenwick', value: 210.8, icon: <NetworkIcon size={I} /> },
  { id: 'bots', label: 'Support assistant', detail: 'Quillmark', value: 176.4, icon: <BotIcon size={I} /> },
  { id: 'fn', label: 'Scheduled jobs', detail: 'Brindle', value: 124.15, icon: <ZapIcon size={I} /> },
  { id: 'misc', label: 'Backups', detail: 'Brindle', value: 96.5, icon: <CloudIcon size={I} /> },
]

const scale = (items: readonly ShareGaugeItem[], factors: Record<string, number>): ShareGaugeItem[] =>
  items.map((item) => ({ ...item, value: Math.round(item.value * (factors[item.id] ?? 1) * 100) / 100 }))

export const PERIODS: ShareGaugePeriod[] = [
  { id: 'month', label: 'Month', name: 'September 2026', items: MONTH },
  {
    id: 'quarter',
    label: 'Quarter',
    name: 'Q3 2026',
    items: scale(MONTH, { compute: 2.7, storage: 3.1, database: 2.4, email: 3.4, cdn: 2.2, queue: 2.9, auth: 3, scan: 3.2, logs: 2.6, dns: 3, bots: 2.8, fn: 3.1, misc: 3 }),
  },
  {
    id: 'year',
    label: 'Year',
    name: '2026 so far',
    items: scale(MONTH, { compute: 8.4, storage: 8.9, database: 10.6, email: 7.2, cdn: 9.1, queue: 8, auth: 9, scan: 6.5, logs: 8.8, dns: 9.2, bots: 5.5, fn: 8, misc: 9 }),
  },
]
