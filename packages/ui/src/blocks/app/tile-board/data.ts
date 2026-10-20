/* A fictional plant's Line 3 and its eight stations: pass yours through the block's props. */

/** The tones a status can wear: its bar on the tile and its detail's ink. */
export type TileBoardTone = 'success' | 'neutral' | 'warning' | 'danger'

export interface TileBoardStatus {
  id: string
  label: string
  tone: TileBoardTone
  /** The status the board handles: its tiles run a timer, take a reason, show who is coming and can be escalated or resolved. */
  alert?: boolean
}

export interface TileBoardResponder {
  name: string
  /** What they are and where they are, "maintenance · on the way". */
  detail: string
  /** Minutes until they arrive. */
  etaMinutes: number
}

export interface TileBoardTile {
  id: string
  name: string
  /** A status's `id`. */
  status: string
  /** Seconds per cycle, shown with `format.cycle` when it has no `note`. */
  cycleSeconds?: number
  /** The line under its name, unless it is in the alert status: "QC hold", "idle". */
  note?: string
  /** Alert: since when, an ISO date-time. */
  since?: string
  /** Alert: the chosen reason's `id`. */
  reason?: string
  /** Alert: who is coming. */
  responder?: TileBoardResponder
  /** Alert: when it is escalated if nobody has resolved it, an ISO date-time. */
  escalateAt?: string
}

export interface TileBoardReason {
  id: string
  label: string
}

/** The moment the demo's clock starts at; the demo's timers count up from it. */
export const DEMO_NOW = '2026-10-13T14:12:12Z'

export const STATUSES: TileBoardStatus[] = [
  { id: 'running', label: 'Running', tone: 'success' },
  { id: 'idle', label: 'Idle', tone: 'neutral' },
  { id: 'hold', label: 'On hold', tone: 'warning' },
  { id: 'stopped', label: 'Stopped', tone: 'danger', alert: true },
]

export const REASONS: TileBoardReason[] = [
  { id: 'maintenance', label: 'Maintenance' },
  { id: 'material', label: 'Material' },
  { id: 'quality', label: 'Quality' },
]

export const TILES: TileBoardTile[] = [
  { id: 'cut', name: 'Cut', status: 'running', cycleSeconds: 38 },
  { id: 'bend', name: 'Bend', status: 'running', cycleSeconds: 41 },
  {
    id: 'weld-1',
    name: 'Weld 1',
    status: 'stopped',
    since: '2026-10-13T14:08:00Z',
    reason: 'maintenance',
    responder: { name: 'Ben Okafor', detail: 'maintenance · on the way', etaMinutes: 2 },
    escalateAt: '2026-10-13T14:14:00Z',
  },
  { id: 'weld-2', name: 'Weld 2', status: 'idle', note: 'idle' },
  { id: 'paint', name: 'Paint', status: 'running', cycleSeconds: 34 },
  { id: 'assy', name: 'Assy', status: 'hold', note: 'QC hold' },
  { id: 'qc', name: 'QC', status: 'running', cycleSeconds: 29 },
  { id: 'pack', name: 'Pack', status: 'idle', note: 'idle' },
]

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
  title: 'Station board',
  subtitle: (tiles: number) => `Line 3 · ${tiles} stations`,
  demoData: 'Demo data',
  allClear: 'All running',
  alertCount: (n: number) => `${n} stopped`,
  gridLabel: 'Stations',
  cycle: (seconds: string) => `${seconds} s`,
  /** The panel's heading for a tile in the alert status. */
  alertTitle: (name: string, status: string) => `${name} ${status.toLowerCase()}`,
  /** The panel's heading for any other tile. */
  statusTitle: (name: string, status: string) => `${name} is ${status.toLowerCase()}`,
  nothing: 'Nothing to resolve here.',
  timerLabel: 'Stopped for',
  reasonLabel: 'Stop reason',
  eta: (minutes: string) => `${minutes} min`,
  etaLabel: 'Arrives in',
  escalatesIn: (clock: string) => `Supervisor paged in ${clock}`,
  paged: 'Supervisor paged',
  escalate: 'Escalate now',
  escalating: 'Paging',
  escalated: 'Paged',
  resolve: 'Resolve',
  resolving: 'Resolving',
  resolved: 'Resolved',
  announceResolved: (name: string) => `${name} is running again`,
  announceEscalated: (name: string) => `Supervisor paged for ${name}`,
  announceReason: (name: string, reason: string) => `${name}: ${reason}`,
}

export type TileBoardCopy = typeof DEFAULT_COPY

/** How long the supervisor's countdown is, in seconds, when the ring is drawn full. */
export const ESCALATION_WINDOW = 300

/** Seconds as "4:12" (or "1:04:12" past an hour). */
export function clockText(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const two = (n: number) => String(n).padStart(2, '0')
  return h ? `${h}:${two(m)}:${two(s % 60)}` : `${two(m)}:${two(s % 60)}`
}

/** Seconds from `since` to `now`, never negative. */
export function secondsBetween(since: string, now: number): number {
  return Math.max(0, Math.floor((now - Date.parse(since)) / 1000))
}
