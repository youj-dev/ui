/* A fictional product's year, milestone by milestone: pass yours through the block's props. */

export type RoadmapTimelineTone = 'accent' | 'info' | 'success' | 'warning' | 'danger'

/** A state an item can be in. Its role says how the ruler draws it and what the foot counts. */
export interface RoadmapTimelineStatus {
  id: string
  /** In the foot for the `done` and `attention` roles: "Shipped", "At risk". */
  label: string
  /** The dot the foot gives the `attention` role's count. Default 'warning'. */
  tone?: RoadmapTimelineTone
  /** `done` is a solid pin and what the foot counts as finished (the default before today), `upcoming` a hollow one (the default from today on), `attention` an amber one the foot counts apart. */
  role: 'done' | 'upcoming' | 'attention'
}

/** One item on the year. */
export interface RoadmapTimelineItem {
  id: string
  /** The day it lands, "2026-11-26". */
  date: string
  title: string
  /** One line under the title. */
  description?: string
  /** A `RoadmapTimelineStatus` id. Default: the finished status before today, the upcoming one from it on. */
  status?: string
  /** A taller pin, for the releases that matter most. */
  major?: boolean
}

export const STATUSES: RoadmapTimelineStatus[] = [
  { id: 'done', label: 'Shipped', role: 'done' },
  { id: 'upcoming', label: 'Upcoming', role: 'upcoming' },
  { id: 'at-risk', label: 'At risk', tone: 'warning', role: 'attention' },
]

/** The demo's today, so the demo reads the same on the server and in every time zone. */
export const DEMO_TODAY = '2026-10-13'

export const ITEMS: RoadmapTimelineItem[] = [
  { id: 'offline', date: '2026-02-09', title: 'Offline mode', description: 'Edits sync when you reconnect' },
  { id: 'folders', date: '2026-04-01', title: 'Shared folders', description: 'Invite a team to a folder' },
  { id: 'v1-5', date: '2026-06-04', title: 'Version 1.5', description: 'New editor, search three times faster', major: true },
  { id: 'mobile', date: '2026-08-31', title: 'Mobile beta', description: 'iOS and Android, read and comment' },
  { id: 'api', date: '2026-09-02', title: 'Public API', description: 'Read and write through REST' },
  { id: 'sso', date: '2026-10-28', title: 'SSO and audit log', description: 'Waiting on the security review', status: 'at-risk' },
  { id: 'v2', date: '2026-11-26', title: 'Version 2', description: 'Rebuilt sync engine', major: true },
]

const plural = (n: number, one: string, other: string) => (new Intl.PluralRules('en').select(n) === 'one' ? one : other)

export const DEFAULT_COPY = {
  title: (year: number) => `${year} roadmap`,
  subtitle: 'Relay',
  count: (n: number) => `${n} ${plural(n, 'milestone', 'milestones')}`,
  rulerLabel: 'Milestones this year',
  doneValue: (done: string, total: string) => `${done} of ${total}`,
  next: 'Next',
  none: 'None',
  loadingLabel: 'Loading the timeline',
  retry: 'Retry',
}

export type RoadmapTimelineCopy = typeof DEFAULT_COPY
