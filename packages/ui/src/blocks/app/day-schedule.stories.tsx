import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { DaySchedule } from './day-schedule'
import { CLEAR_JOBS, type DayScheduleJob } from './day-schedule/data'

const meta: Meta<typeof DaySchedule> = {
  title: 'Blocks/App/Day Schedule',
  component: DaySchedule,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'card' },
    docs: {
      description: {
        component:
          'See when things happen throughout the day and which is coming next: a 24-hour ring with each schedule on its own track, collisions drawn as warning zones, and the schedules listed below with a switch to pause each. Scheduled jobs, medication and ferry departures read the same way.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof DaySchedule>

/** A production day of scheduled jobs: backup and reindex collide at 02:30, the CRM sync and the billing export at 20:15, and the cache warmer is paused. */
export const Default: Story = { name: 'Scheduled jobs' }

/** The same day once the collisions are staggered: no warning zones, no badges. */
export const NoOverlaps: Story = { name: 'No overlaps', args: { jobs: CLEAR_JOBS } }

/** 10:00 on a Monday in New York (14:00 UTC). */
const MORNING = Date.UTC(2026, 8, 28, 14, 0, 0)

const DOSES: DayScheduleJob[] = [
  { id: 'metformin', name: 'Metformin', cron: '0 8,20 * * *', minutes: 5, tone: 'chart-1' },
  { id: 'lisinopril', name: 'Lisinopril', cron: '0 8 * * *', minutes: 5, tone: 'chart-2' },
  { id: 'drops', name: 'Eye drops', cron: '0 8,14,20 * * *', minutes: 10, tone: 'chart-3' },
  { id: 'insulin', name: 'Insulin check', cron: '30 7,12,18 * * *', minutes: 15, tone: 'chart-4' },
  { id: 'statin', name: 'Atorvastatin', cron: '0 21 * * *', minutes: 5, tone: 'chart-5' },
  { id: 'iron', name: 'Iron', cron: '0 13 * * 1-5', minutes: 5, tone: 'neutral', paused: true },
]

/** Health: one patient's doses through the day. Three medicines land at 08:00, so the ring warns and Space doses moves the later ones 15 minutes on. */
export const MedicationSchedule: Story = {
  name: 'Medication schedule',
  args: {
    jobs: DOSES,
    timeZone: 'America/New_York',
    now: MORNING,
    onStagger: fn(),
    copy: {
      title: 'Medication',
      subtitle: 'Mary Lane · Eastern',
      ring: 'Today’s doses',
      runsToday: 'Doses today',
      overlaps: 'Clashes',
      next: 'Next dose',
      nextRun: 'Next dose',
      paused: 'On hold',
      jobs: 'Medicines',
      noRuns: 'None today',
      overlapsWith: (names: string, time: string) => `Same time as ${names} at ${time}`,
      enabled: (name: string) => `Take ${name}`,
      synced: 'Eastern · updated {ago} ago',
      syncedNow: 'Eastern · updated just now',
      exportCrontab: 'Print the chart',
      pauseAll: 'Hold all',
      resumeAll: 'Resume all',
      stagger: 'Space doses',
      staggering: 'Spacing…',
      staggered: 'Spaced',
      newSchedule: 'Add medicine',
      atTimes: (times: string) => `Doses at ${times}`,
      dailyAt: (time: string) => `One dose at ${time}`,
      weekdaysAt: (time: string) => `Weekdays at ${time}`,
      custom: 'Special schedule',
    },
  },
}

const SAILINGS: DayScheduleJob[] = [
  { id: 'north-out', name: 'Harbor → Northgate', cron: '0 6,9,12,15,18 * * *', minutes: 40, tone: 'chart-1' },
  { id: 'north-back', name: 'Northgate → Harbor', cron: '30 7,10,13,16,19 * * *', minutes: 40, tone: 'chart-2' },
  { id: 'east-out', name: 'Harbor → Eastport', cron: '15 8,14,20 * * *', minutes: 60, tone: 'chart-3' },
  { id: 'east-back', name: 'Eastport → Harbor', cron: '45 9,15,21 * * *', minutes: 60, tone: 'chart-4' },
  { id: 'cargo', name: 'Cargo run', cron: '0 5 * * 1-5', minutes: 90, tone: 'chart-5' },
]

/** Transport: sailings through the day, the next one named on the ring's hand. Where two crossings share the water the ring warns. */
export const FerryDepartures: Story = {
  name: 'Ferry departures',
  args: {
    jobs: SAILINGS,
    timeZone: 'Europe/Copenhagen',
    now: Date.UTC(2026, 8, 28, 6, 40, 0),
    copy: {
      title: 'Ferry departures',
      subtitle: 'Harbor terminal · local time',
      ring: 'Today’s sailings',
      runsToday: 'Sailings today',
      overlaps: 'At sea together',
      next: 'Next sailing',
      nextRun: 'Next sailing',
      paused: 'Cancelled',
      jobs: 'Routes',
      noRuns: 'None today',
      overlapsWith: (names: string, time: string) => `At sea with ${names} from ${time}`,
      enabled: (name: string) => `Sail ${name}`,
      synced: 'Local time · updated {ago} ago',
      syncedNow: 'Local time · updated just now',
      exportCrontab: 'Print the timetable',
      pauseAll: 'Cancel all',
      resumeAll: 'Restore all',
      stagger: 'Retime sailings',
      staggering: 'Retiming…',
      staggered: 'Retimed',
      newSchedule: 'Add a sailing',
      atTimes: (times: string) => `Departs at ${times}`,
      dailyAt: (time: string) => `Departs daily at ${time}`,
      weekdaysAt: (time: string) => `Weekdays at ${time}`,
      custom: 'Special timetable',
    },
  },
}

/** Skeletons hold the ring, the readout and the list's place while the schedules load. */
export const Loading: Story = { args: { loading: true } }

/** Nothing scheduled: the empty message in the list's place. */
export const Empty: Story = { args: { jobs: [] } }

/** The load failed: the message with Retry in the list's place. */
export const Error: Story = { args: { error: 'Couldn’t load the schedule.', onRetry: fn() } }

/** On a page of its own: `embedded={false}` draws the centered canvas and the page's `h1` around it. By default it's the card alone, for your page to place. */
export const Standalone: Story = { args: { embedded: false } }
