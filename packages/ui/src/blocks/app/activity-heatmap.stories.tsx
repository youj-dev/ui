import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { ActivityHeatmap, type ActivityHeatmapDay } from './activity-heatmap'

const meta: Meta<typeof ActivityHeatmap> = {
  title: 'Blocks/App/Activity heatmap',
  component: ActivityHeatmap,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'card' },
    docs: {
      description: {
        component:
          'When it happens: a year of days as a grid, weeks across and weekdays down, with the total, daily average, busiest day and streak over it. Hours shows the same days by hour of the week. The legend steps light only their days.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof ActivityHeatmap>

export const Default: Story = {}

/** The same year as each hour of the week, a day's average: the evenings sell. */
export const Hours: Story = { args: { defaultView: 'hours' } }

export const Loading: Story = { args: { loading: true } }

export const LoadError: Story = { name: 'Error', args: { error: "The orders couldn't be loaded.", onRetry: fn() } }

export const Empty: Story = { args: { days: [] } }

/* A team's production deploys for half a year: busy weekdays, quiet
 * weekends, a code freeze over the holidays and a release push in March. */
const DEPLOYS: ActivityHeatmapDay[] = Array.from({ length: 182 }, (_, i) => {
  const time = Date.UTC(2026, 0, 12) + i * 86_400_000
  const date = new Date(time).toISOString().slice(0, 10)
  const weekday = new Date(time).getUTCDay()
  const jitter = (i * 37) % 7
  const freeze = date >= '2026-04-01' && date <= '2026-04-07'
  const push = date >= '2026-03-16' && date <= '2026-03-27'
  const value = freeze ? 0 : weekday === 0 || weekday === 6 ? jitter % 3 === 0 ? 1 : 0 : 3 + (jitter % 5) + (push ? 6 : 0)
  return { date, value }
})

export const WithYourData: Story = {
  name: 'With your data',
  args: {
    days: DEPLOYS,
    today: '2026-07-12',
    weeks: 26,
    weekStart: 1,
    goal: 1,
    tone: 'chart-3',
    copy: {
      title: 'Deploys',
      description: { days: (span: string) => `Production deploys per day · ${span}`, hours: (span: string) => span },
      total: 'Deploys',
      busiestDay: 'Most in a day',
      weekday: (weekday: string) => `${weekday} ships most`,
      count: { days: (value: string) => `${value} deploys`, hours: (value: string) => `${value} deploys a day` },
      grid: { days: 'Deploys per day', hours: 'Deploys by hour' },
      none: { days: 'Days without a deploy', hours: 'Hours without a deploy' },
      step: { days: (range: string) => `Days with ${range} deploys`, hours: (range: string) => `Hours with ${range} deploys` },
      summary: { days: (total: string, weeks: number, busiest: string, weekday: string) => `${total} over ${weeks} weeks. Most in a day: ${busiest}. ${weekday} ships most.`, hours: () => '' },
    },
    onDaySelect: fn(),
  },
}

/* A developer's commits for half a year: heavy on weekdays, light weekends, a quiet week at the end of June and a crunch before a release in May. */
const COMMITS: ActivityHeatmapDay[] = Array.from({ length: 182 }, (_, i) => {
  const time = Date.UTC(2026, 0, 12) + i * 86_400_000
  const date = new Date(time).toISOString().slice(0, 10)
  const weekday = new Date(time).getUTCDay()
  const jitter = (i * 53) % 11
  const vacation = date >= '2026-06-22' && date <= '2026-06-28'
  const crunch = date >= '2026-05-04' && date <= '2026-05-15'
  const value = vacation ? 0 : weekday === 0 || weekday === 6 ? (jitter % 4 === 0 ? 2 + (jitter % 3) : 0) : 4 + jitter + (crunch ? 9 : 0)
  return { date, value }
})
/** Average commits in each hour of the week, Sunday first, midnight first: late mornings and early afternoons on weekdays. */
const COMMIT_SHAPE = [0, 0, 0, 0, 0, 0, 0.1, 0.3, 0.8, 1.6, 2.4, 2.6, 1.2, 1.4, 2.2, 2.5, 2.1, 1.3, 0.7, 0.4, 0.5, 0.6, 0.3, 0.1]
const COMMIT_HOURS = Array.from({ length: 7 }, (_, weekday) => COMMIT_SHAPE.map((v) => (weekday === 0 || weekday === 6 ? Math.round(v * 0.18 * 10) / 10 : v)))

export const CodeCommits: Story = {
  name: 'Code commits',
  args: {
    days: COMMITS,
    hours: COMMIT_HOURS,
    today: '2026-07-12',
    weeks: 26,
    weekStart: 1,
    goal: 1,
    tone: 'chart-2',
    copy: {
      title: 'Commits',
      description: { days: (span: string) => `Commits to main per day · ${span}`, hours: (span: string) => `Commits in each hour, a day on average · ${span}` },
      total: 'Commits',
      busiestDay: 'Most in a day',
      busiestHour: 'Busiest hour',
      weekday: (weekday: string) => `${weekday} is busiest`,
      count: { days: (value: string, n: number) => `${value} ${n === 1 ? 'commit' : 'commits'}`, hours: (value: string) => `${value} commits a day` },
      grid: { days: 'Commits per day', hours: 'Commits in each hour of the week' },
      none: { days: 'Days with no commits', hours: 'Hours with no commits' },
      step: { days: (range: string) => `Days with ${range} commits`, hours: (range: string) => `Hours with ${range} commits a day` },
      summary: {
        days: (total: string, weeks: number, busiest: string, weekday: string) => `${total} over ${weeks} weeks. Most in a day: ${busiest}. ${weekday} is busiest.`,
        hours: (busiest: string, quietest: string) => `Busiest hour: ${busiest}. Quietest: ${quietest}.`,
      },
      loading: 'Loading commits',
      empty: 'No commits yet',
      emptyDescription: 'Days fill in as commits land.',
    },
    onDaySelect: fn(),
  },
}

/* Minutes meditated each day for 20 weeks: a daily habit that grows, longer sits on weekends and a few missed days. */
const SITS: ActivityHeatmapDay[] = Array.from({ length: 140 }, (_, i) => {
  const time = Date.UTC(2026, 4, 25) + i * 86_400_000
  const date = new Date(time).toISOString().slice(0, 10)
  const weekday = new Date(time).getUTCDay()
  const missed = i % 17 === 5 || i % 29 === 11
  const minutes = Math.round((8 + (i / 139) * 12 + ((i * 7) % 5) * 2 + (weekday === 0 || weekday === 6 ? 10 : 0)) / 5) * 5
  return { date, value: missed ? 0 : minutes }
})

export const MeditationMinutes: Story = {
  name: 'Meditation minutes',
  args: {
    days: SITS,
    today: '2026-10-11',
    weeks: 20,
    weekStart: 1,
    goal: 10,
    tone: 'chart-4',
    format: { style: 'unit', unit: 'minute', unitDisplay: 'narrow', maximumFractionDigits: 0 },
    copy: {
      title: 'Meditation',
      description: { days: (span: string) => `Minutes meditated per day · ${span}`, hours: (span: string) => span },
      total: 'Total time',
      average: 'Daily average',
      busiestDay: 'Longest sit',
      streak: 'Streak',
      best: (best: string, goal: string) => `best ${best} · ${goal}+ a day`,
      weekday: (weekday: string) => `${weekday} is your longest`,
      activeDays: (days: string) => `over ${days} days`,
      count: { days: (value: string) => value, hours: (value: string) => `${value} a day` },
      grid: { days: 'Minutes meditated per day', hours: 'Minutes in each hour of the week' },
      none: { days: 'Days without a sit', hours: 'Hours without a sit' },
      step: { days: (range: string) => `Days with ${range}`, hours: (range: string) => `Hours with ${range} a day` },
      scale: 'Each step holds a quarter of the days you sat',
      summary: { days: (total: string, weeks: number, busiest: string) => `${total} over ${weeks} weeks. Longest sit: ${busiest}.`, hours: () => '' },
      loading: 'Loading your sits',
      empty: 'No sits yet',
      emptyDescription: 'Days fill in as you meditate.',
    },
  },
}

export const Standalone: Story = { args: { embedded: false } }
