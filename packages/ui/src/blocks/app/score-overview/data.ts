/* A fictional company's security posture over the last 30 days: pass yours through the block's props. */

export type ScoreOverviewTone = 'danger' | 'warning' | 'success' | 'accent' | 'muted' | 'subtle'

/** A level of seriousness a finding can have. */
export interface ScoreOverviewSeverity {
  id: string
  label: string
  /** The short word on a finding's chip. Default: the label. */
  short?: string
  /** The color of its chip, its dots and its band in the chart. */
  tone: ScoreOverviewTone
}

/** The levels, worst first: the chart stacks the first at the bottom and the lists sort by this order. */
export const SEVERITIES: ScoreOverviewSeverity[] = [
  { id: 'critical', label: 'Critical', short: 'Crit', tone: 'danger' },
  { id: 'high', label: 'High', short: 'High', tone: 'warning' },
  { id: 'medium', label: 'Medium', short: 'Med', tone: 'muted' },
  { id: 'low', label: 'Low', short: 'Low', tone: 'subtle' },
]

/** The headline counts under the score. */
export interface ScoreOverviewStats {
  /** Findings still open, and how many of them are of the first (worst) severity. */
  open: number
  urgent: number
  /** Findings resolved in the period. */
  resolved: number
  /** Assets watched, and how many joined in the period. */
  assets: number
  newAssets: number
  /** The median time to fix a finding, in days. */
  fixDays: number
}

/** Open findings on one day, by severity. */
export interface ScoreOverviewTrendPoint {
  /** The day, "2026-10-13". */
  date: string
  /** Open findings that day, by severity id. */
  counts: Record<string, number>
}

/** One open finding. */
export interface ScoreOverviewFinding {
  id: string
  title: string
  /** A `ScoreOverviewSeverity` id. */
  severity: string
  /** The asset it is on, set in mono: "edge-proxy". */
  asset: string
  /** When it was found, an ISO date-time. */
  openedAt: string
}

/** One watched asset and its open findings by severity. */
export interface ScoreOverviewAsset {
  id: string
  /** Set in mono: "invoices-archive". */
  name: string
  /** What it is: "Storage". */
  kind: string
  /** Open findings on it, by severity id. */
  findings: Record<string, number>
}

/** The demo's now, so the demo reads the same on the server and in every time zone. */
export const DEMO_NOW = '2026-10-13T14:32:00Z'

export const STATS: ScoreOverviewStats = { open: 13, urgent: 2, resolved: 21, assets: 26, newAssets: 2, fixDays: 2.4 }

/** The score a day over the period: 64 a month ago, 77 today. */
export const SCORE_HISTORY = [64, 64, 63, 65, 66, 66, 65, 67, 68, 68, 69, 68, 70, 71, 71, 70, 72, 73, 72, 73, 74, 74, 73, 75, 75, 76, 75, 76, 77, 77]

/** A wave around a falling line, so the 30 days read as real readings. */
const wave = (from: number, to: number, swing: number, phase: number) =>
  Array.from({ length: 30 }, (_, i) => Math.max(0, Math.round(from + ((to - from) * i) / 29 + swing * Math.sin(i / 3.2 + phase))))
const CRITICAL = [3, 3, 3, 4, 4, 4, 3, 3, 3, 3, 2, 2, 2, 3, 3, 3, 2, 2, 2, 2, 2, 3, 3, 2, 2, 2, 2, 2, 2, 2]
const HIGH = wave(7, 4, 0.8, 0)
const MEDIUM = wave(7, 4, 0.9, 1.4)
const LOW = wave(5, 3, 0.7, 2.6)

/** Today's readings are the open findings below. */
const TODAY = { critical: 2, high: 4, medium: 4, low: 3 }

export const TREND: ScoreOverviewTrendPoint[] = Array.from({ length: 30 }, (_, i) => ({
  date: new Date(Date.UTC(2026, 8, 14 + i)).toISOString().slice(0, 10),
  counts: i === 29 ? TODAY : { critical: CRITICAL[i]!, high: HIGH[i]!, medium: MEDIUM[i]!, low: LOW[i]! },
}))

const ago = (hours: number) => new Date(Date.parse(DEMO_NOW) - hours * 3_600_000).toISOString()

export const FINDINGS: ScoreOverviewFinding[] = [
  { id: 'f1', title: 'Public bucket exposes invoices', severity: 'critical', asset: 'invoices-archive', openedAt: ago(5) },
  { id: 'f2', title: 'Admin key older than 400 days', severity: 'critical', asset: 'svc-billing', openedAt: ago(30) },
  { id: 'f3', title: 'MFA off for 3 admins', severity: 'high', asset: 'identity', openedAt: ago(52) },
  { id: 'f4', title: 'TLS 1.0 still accepted', severity: 'high', asset: 'edge-proxy', openedAt: ago(75) },
  { id: 'f5', title: 'Container runs as root', severity: 'high', asset: 'build-runner', openedAt: ago(96) },
  { id: 'f6', title: 'SSH open to the internet', severity: 'high', asset: 'edge-proxy', openedAt: ago(120) },
  { id: 'f7', title: 'Secrets printed in build logs', severity: 'medium', asset: 'build-runner', openedAt: ago(140) },
  { id: 'f8', title: 'Passwords shorter than 12', severity: 'medium', asset: 'identity', openedAt: ago(170) },
  { id: 'f9', title: 'Unused access key', severity: 'medium', asset: 'svc-billing', openedAt: ago(200) },
  { id: 'f10', title: 'Logs kept for 14 days', severity: 'medium', asset: 'invoices-archive', openedAt: ago(260) },
  { id: 'f11', title: 'Snapshot not encrypted', severity: 'low', asset: 'staging-db', openedAt: ago(300) },
  { id: 'f12', title: 'Missing owner tag', severity: 'low', asset: 'staging-db', openedAt: ago(330) },
  { id: 'f13', title: 'Stale DNS record', severity: 'low', asset: 'edge-proxy', openedAt: ago(410) },
]

export const ASSETS: ScoreOverviewAsset[] = [
  { id: 'a1', name: 'edge-proxy', kind: 'Network', findings: { critical: 0, high: 2, medium: 0, low: 1 } },
  { id: 'a2', name: 'invoices-archive', kind: 'Storage', findings: { critical: 1, high: 0, medium: 1, low: 0 } },
  { id: 'a3', name: 'svc-billing', kind: 'Service', findings: { critical: 1, high: 0, medium: 1, low: 0 } },
  { id: 'a4', name: 'build-runner', kind: 'CI', findings: { critical: 0, high: 1, medium: 1, low: 0 } },
  { id: 'a5', name: 'identity', kind: 'Identity', findings: { critical: 0, high: 1, medium: 1, low: 0 } },
  { id: 'a6', name: 'staging-db', kind: 'Database', findings: { critical: 0, high: 0, medium: 0, low: 2 } },
]

/** The letter for a score, from the band it is in. */
export const GRADES = [
  { from: 0, label: 'F', tone: 'danger' },
  { from: 40, label: 'D', tone: 'warning' },
  { from: 60, label: 'C', tone: 'warning' },
  { from: 75, label: 'B', tone: 'success' },
  { from: 90, label: 'A', tone: 'success' },
] as const

export type ScoreOverviewTab = 'trend' | 'findings' | 'assets'

declare const process: { env: { NODE_ENV?: string } }
const warned = new Set<string>()
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
/** Stands in for an action the app hasn't wired (`action` is "Block: onVerb"): warns once in development, then waits like a request. */
export function demo(action: string, ms: number) {
  if (process.env.NODE_ENV !== 'production' && !warned.has(action)) {
    warned.add(action)
    console.warn(`${action} isn't wired; showing demo behaviour`)
  }
  return wait(ms)
}

export const DEFAULT_COPY = {
  title: 'Security overview',
  subtitle: 'Last 30 days',
  scan: 'Scan now',
  scanning: 'Scanning',
  scanned: 'Scanned',
  score: 'Security score',
  outOf: (max: string) => `/ ${max}`,
  versus: 'vs 30 days ago',
  open: 'Open',
  urgentCount: (n: string) => `${n} critical`,
  resolved: 'Resolved',
  inPeriod: 'in 30 days',
  assets: 'Assets',
  newAssets: (n: string) => `+${n} new`,
  fixTime: 'Fix time',
  median: 'median',
  tabs: 'Views',
  trend: 'Trend',
  findings: 'Findings',
  assetsTab: 'Assets',
  chartTitle: 'Open findings by severity, last 30 days',
  chartSummary: (from: string, to: string) => `Open findings went from ${from} to ${to} over the period.`,
  openFinding: (title: string, asset: string, age: string) => `${title} on ${asset}, open ${age}`,
  assetFindings: (name: string, counts: string) => `${name}: ${counts}`,
  noFindings: 'No open findings',
  noFindingsHint: 'Every finding from the last scan is resolved.',
  noAssets: 'No assets at risk',
  noTrend: 'No scans yet',
  noTrendHint: 'The trend starts after the first scan.',
  scanningCaption: (done: string, total: string) => `Scanning · ${done} / ${total} assets`,
  scanningAll: (total: string) => `Scanning ${total} assets`,
  lastScan: (age: string, total: string) => `Scanned ${age} · ${total} assets`,
  export: 'Export report',
  exporting: 'Exporting',
  exported: 'Exported',
  failed: 'That didn’t go through',
  announceScanned: 'Scan finished',
  loadingLabel: 'Loading the overview',
  retry: 'Retry',
}

export type ScoreOverviewCopy = typeof DEFAULT_COPY
