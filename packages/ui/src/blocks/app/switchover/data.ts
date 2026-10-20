/* The switchover as a script: one step per grid check, from the grid
 * carrying the whole home, through a voltage sag and three failed checks,
 * the load moving a quarter at a time onto the battery and solar, the grid
 * coming back, and the switch back. Every figure on the card is read from
 * the step it has reached, so the story replays the same way each time. */

export type SwitchoverHealth = 'healthy' | 'degraded' | 'down'
export type SwitchoverTone = 'neutral' | 'success' | 'warning' | 'danger' | 'accent'
export type SwitchoverStage = 'detect' | 'transfer' | 'backup' | 'return'

export interface SwitchoverSource {
  /** Its name, short: "Grid". */
  id: string
  /** What it is, in a few words: "Utility · 240 V". */
  detail: string
}

export interface Step {
  /** Share of the home's load the grid carries, 0–1; the battery and solar carry the rest. */
  weight: number
  health: SwitchoverHealth
  /** Whether the grid passes this interval's check (the backup always does). */
  check: boolean
  /** Consecutive failed checks on the grid. */
  failed: number
  /** The grid's voltage at the panel (0 while it's out) and the battery's reserve, 0–1. */
  signal: number
  reserve: number
  stage: SwitchoverStage | null
  /** What happened at this step, for the timeline; the text is `copy.events[key]`. */
  event?: { key: keyof typeof EVENTS; tone: SwitchoverTone }
}

/** The event texts, keyed; `{p}` is the primary source's name, `{s}` the backup's. A figure and its unit are joined by a no-break space, so a line never ends on a bare number. */
export const EVENTS = {
  degraded: '{p} voltage sagging to 221\u00a0V, under the 228\u00a0V floor',
  check1: '{p} check failed · 214\u00a0V · 1\u00a0of\u00a03',
  check2: '{p} check failed · 59.3\u00a0Hz · 2\u00a0of\u00a03',
  unhealthy: '{p} marked out · switchover starts',
  shift75: '{p} 3.6\u00a0kW · {s} 1.2\u00a0kW',
  shift50: '{p} 2.4\u00a0kW · {s} 2.4\u00a0kW',
  shift25: '{p} 1.2\u00a0kW · {s} 3.6\u00a0kW',
  switched: 'All 4.8\u00a0kW on {s} · solar covering 2.1\u00a0kW',
  reserve: '{s} at 88% · about 4\u00a0h of reserve at this load',
  recovered: '{p} steady at 240\u00a0V, 60\u00a0Hz · ready to switch back',
  back25: 'Switching back · {p} 1.2\u00a0kW · {s} 3.6\u00a0kW',
  back50: '{p} 2.4\u00a0kW · {s} 2.4\u00a0kW',
  back75: '{p} 3.6\u00a0kW · {s} 1.2\u00a0kW',
  restored: 'Switch back complete · {p} carries the home, {s} recharging',
}

const steady: Step = { weight: 1, health: 'healthy', check: true, failed: 0, signal: 240, reserve: 0.92, stage: null }
const out: Step = { ...steady, health: 'down', check: false, failed: 3, signal: 0, stage: 'transfer' }
const back: Step = { ...steady, stage: 'return' }

/** Step 0 is steady; the outage runs 1–10 and stops once the grid is back; the switch back runs 11–14. */
export const SCRIPT: Step[] = [
  steady,
  { ...steady, health: 'degraded', signal: 221, stage: 'detect', event: { key: 'degraded', tone: 'warning' } },
  { ...steady, health: 'degraded', check: false, failed: 1, signal: 214, stage: 'detect', event: { key: 'check1', tone: 'warning' } },
  { ...steady, health: 'degraded', check: false, failed: 2, signal: 203, stage: 'detect', event: { key: 'check2', tone: 'warning' } },
  { ...out, event: { key: 'unhealthy', tone: 'danger' } },
  { ...out, weight: 0.75, reserve: 0.915, event: { key: 'shift75', tone: 'accent' } },
  { ...out, weight: 0.5, reserve: 0.91, event: { key: 'shift50', tone: 'accent' } },
  { ...out, weight: 0.25, reserve: 0.9, event: { key: 'shift25', tone: 'accent' } },
  { ...out, weight: 0, reserve: 0.89, stage: 'backup', event: { key: 'switched', tone: 'success' } },
  { ...out, weight: 0, reserve: 0.88, stage: 'backup', event: { key: 'reserve', tone: 'neutral' } },
  { ...steady, weight: 0, signal: 239, reserve: 0.875, stage: 'backup', event: { key: 'recovered', tone: 'success' } },
  { ...back, weight: 0.25, signal: 239, reserve: 0.87, event: { key: 'back25', tone: 'accent' } },
  { ...back, weight: 0.5, reserve: 0.87, event: { key: 'back50', tone: 'accent' } },
  { ...back, weight: 0.75, reserve: 0.875, event: { key: 'back75', tone: 'accent' } },
  { ...steady, reserve: 0.88, event: { key: 'restored', tone: 'success' } },
]

/** Where the outage stops (the grid is back: switching back is up to you) and where the switch back ends. */
export const RECOVERED = 10
export const RESTORED = SCRIPT.length - 1
/** Seconds between steps: the grid-check interval. */
export const INTERVAL = 10
/** Checks shown per source. */
export const CHECKS = 12
/** The home's clock at step 0, seconds after midnight (19:42:00, the evening peak). */
export const START = 19 * 3600 + 42 * 60
/** What the home draws, kW; the two sources split it by the step's weight. */
export const LOAD = 4.8
/** Grid voltage outside this band fails its check. */
export const SIGNAL_MIN = 228

export const PRIMARY: SwitchoverSource = { id: 'Grid', detail: 'Utility · 240 V, 60 Hz' }
export const BACKUP: SwitchoverSource = { id: 'Battery', detail: '13.5 kWh · 6.2 kW solar on the roof' }

export const DEFAULT_COPY = {
  title: 'Backup power',
  subtitle: (site: string) => `${site} · grid-tied with battery and solar`,
  site: '14 Alder Lane',
  more: 'More power actions',
  openSettings: 'Backup settings',
  status: {
    steady: (p: string) => `${p} powering the home`,
    degraded: (p: string) => `${p} unstable`,
    switching: 'Switching over',
    backup: (s: string) => `${s} powering the home`,
    ready: (p: string) => `${p} back · ready to switch`,
    switchingBack: 'Switching back',
  },
  rig: 'The home’s panel, the grid and the battery with solar, with the share of load each line carries',
  split: 'Load',
  loadSplit: (primary: string, backup: string) => `${primary} / ${backup} kW`,
  signal: 'Grid',
  signalValue: (v: string) => `${v} V`,
  reserve: 'Battery',
  primary: 'Primary',
  backup: 'Backup',
  health: { healthy: 'Online', degraded: 'Unstable', down: 'Out' } as Record<SwitchoverHealth, string>,
  unit: 'kW',
  ofLoad: 'of load',
  /** A source's share of the load, as spoken. */
  carries: (id: string, kw: string) => `${id} carries ${kw} kW of the load`,
  checks: 'Checks',
  checksLabel: (id: string, failed: number) => (failed ? `${id}: ${failed} of the last checks failed` : `${id}: all recent checks passing`),
  failedOf: (n: number) => `${n} of 3 failed`,
  passing: 'Passing',
  timeline: 'Timeline',
  stages: { detect: 'Detect', transfer: 'Transfer', backup: 'On backup', return: 'Switch back' } as Record<SwitchoverStage, string>,
  empty: 'No events yet. Simulate an outage to test the switchover.',
  events: EVENTS as Record<keyof typeof EVENTS, string>,
  started: '{p} outage simulated',
  rule: 'Grid checked every 10 s · switches after 3 failures',
  simulate: 'Simulate outage',
  switchBack: 'Switch back',
  switchingBack: 'Switching back…',
  switchedBack: 'On grid',
}

export type SwitchoverCopy = typeof DEFAULT_COPY & {
  /** The locale shares and kilowatts are written in (BCP 47). Default: the app's (YoujProvider's `locale`), else en-US. */
  locale: string
}

/** An event's text with the sources' names filled in. */
export const fill = (text: string, primary: SwitchoverSource, backup: SwitchoverSource) =>
  text.replaceAll('{p}', primary.id).replaceAll('{s}', backup.id)

/** Seconds after midnight as hh:mm:ss. */
export const clock = (seconds: number) =>
  [Math.floor(seconds / 3600) % 24, Math.floor(seconds / 60) % 60, seconds % 60].map((n) => String(n).padStart(2, '0')).join(':')
