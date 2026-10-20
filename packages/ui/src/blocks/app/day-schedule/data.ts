import type { ScheduleTone } from '../../../components/ui/day-ring'

export const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

declare const process: { env: { NODE_ENV?: string } }
const warned = new Set<string>()
/** Stands in for an action the app hasn't wired (`action` is "Block: onVerb"): warns once in development, then waits like a request. */
export function demo(action: string, ms: number) {
  if (process.env.NODE_ENV !== 'production' && !warned.has(action)) {
    warned.add(action)
    console.warn(`${action} isn't wired; showing demo behaviour`)
  }
  return wait(ms)
}

export interface DayScheduleJob {
  id: string
  name: string
  /** Five fields: minute hour day month weekday. */
  cron: string
  /** How many minutes a run takes. Without it runs draw as ticks. */
  minutes?: number
  tone: ScheduleTone
  paused?: boolean
}

/** A production day: backup and reindex collide at 02:30, the CRM sync and the billing export at 20:15, and the cache warmer is paused. */
export const JOBS: DayScheduleJob[] = [
  { id: 'backup', name: 'backup-db', cron: '0 2 * * *', minutes: 40, tone: 'chart-1' },
  { id: 'reindex', name: 'reindex-search', cron: '30 2 * * *', minutes: 25, tone: 'chart-2' },
  { id: 'sync', name: 'sync-crm', cron: '15 */4 * * *', minutes: 10, tone: 'chart-3' },
  { id: 'digest', name: 'send-digest', cron: '0 9 * * 1-5', minutes: 5, tone: 'chart-4' },
  { id: 'billing', name: 'billing-export', cron: '10 20 * * *', minutes: 15, tone: 'chart-5' },
  { id: 'cache', name: 'warm-cache', cron: '*/30 * * * *', tone: 'neutral', paused: true },
]

/** The same day with every collision already staggered. */
export const CLEAR_JOBS: DayScheduleJob[] = JOBS.map((job) =>
  job.id === 'reindex' ? { ...job, cron: '45 2 * * *' } : job.id === 'sync' ? { ...job, cron: '30 */4 * * *' } : job,
)

export const DEFAULT_COPY = {
  title: 'Schedules',
  subtitle: 'production · UTC',
  more: 'More actions',
  exportCrontab: 'Export crontab',
  pauseAll: 'Pause all',
  resumeAll: 'Resume all',
  ring: 'Today’s runs',
  today: 'Today',
  runsToday: 'Runs today',
  overlaps: 'Overlaps',
  next: 'Next',
  /** The dial's caption over the countdown. */
  nextRun: 'Next run',
  paused: 'Paused',
  jobs: 'Jobs',
  noRuns: 'None today',
  everyMinutes: (n: number) => (n === 1 ? 'Every minute' : `Every ${n} min`),
  everyHours: (n: number, minute: string) => `Every ${n} h at :${minute}`,
  hourlyAt: (minute: string) => `Hourly at :${minute}`,
  dailyAt: (time: string) => `Daily at ${time}`,
  weekdaysAt: (time: string) => `Weekdays at ${time}`,
  atTimes: (times: string) => `At ${times}`,
  custom: 'Custom schedule',
  /** `names` arrive joined as a list. */
  overlapsWith: (names: string, time: string) => `Overlaps ${names} at ${time}`,
  /** The switch that pauses and resumes a job. */
  enabled: (name: string) => `Run ${name}`,
  /** `{ago}` is replaced by the time since the last sync. */
  synced: 'UTC · synced {ago} ago',
  syncedNow: 'UTC · synced just now',
  stagger: 'Stagger overlaps',
  staggering: 'Staggering…',
  staggered: 'Staggered',
  newSchedule: 'New schedule',
  loadingLabel: 'Loading the schedule',
  retry: 'Retry',
  emptyTitle: 'Nothing scheduled',
  emptyDescription: 'Jobs show up here once they have a schedule.',
}

export type DayScheduleCopy = typeof DEFAULT_COPY & {
  /** The BCP 47 locale its numbers and dates are written in. Default: the app's (YoujProvider's `locale`), else en-US. */
  locale: string
}
