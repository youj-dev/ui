import { useEffect, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from './button'
import { DayRing, findOverlaps, type ScheduleJob, type DayRingProps } from './day-ring'

const every = (step: number, offset = 0) => Array.from({ length: Math.ceil((1440 - offset) / step) }, (_, i) => offset + i * step)

const JOBS: ScheduleJob[] = [
  { id: 'backup', name: 'backup-db', runs: [120], duration: 40, tone: 'chart-1' },
  { id: 'reindex', name: 'reindex-search', runs: [150], duration: 25, tone: 'chart-2' },
  { id: 'sync', name: 'sync-crm', runs: every(240, 15), duration: 10, tone: 'chart-3' },
  { id: 'digest', name: 'send-digest', runs: [540], duration: 5, tone: 'chart-4' },
  { id: 'billing', name: 'billing-export', runs: [1210], duration: 15, tone: 'chart-5' },
  { id: 'cache', name: 'warm-cache', runs: every(30), tone: 'neutral', paused: true },
]

const time = (minute: number) => `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`

const meta: Meta<DayRingProps> = {
  title: 'UI/Data/Day Ring',
  component: DayRing,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A day of scheduled runs on a 24-hour dial (`role="img"`, described in words): midnight at the top, clockwise, a quarter-hour ruler with the elapsed part of the day shaded, and one thin track per job with its runs as arcs as long as they take (ticks when they have no duration). Where runs of different jobs collide, a warning wedge crosses the tracks and a marker points at it. A hand points at now and the center counts down to the next run, or to the highlighted job’s. On first view the runs appear as a radar pass while the hand turns to now on the smooth spring; a run that moves glides round its track. `findOverlaps(jobs)` returns the collisions for your own list. Reduced motion: drawn in place; the countdown still ticks.',
      },
    },
  },
  argTypes: {
    highlight: { control: 'select', options: [undefined, ...JOBS.map((j) => j.id)] },
  },
  args: { jobs: JOBS, timeZone: 'UTC', className: 'w-[22rem] max-w-full' },
}
export default meta
type Story = StoryObj<DayRingProps>

/** A production day: two collisions (02:30 and 20:15) and a paused cache warmer, dashed and dim. */
export const Hero: Story = {
  render: (args) => {
    const overlaps = findOverlaps(args.jobs)
    return (
      <div className="flex w-[36rem] max-w-full flex-col items-center gap-8 rounded-xl border border-line bg-surface p-6 sm:flex-row sm:items-center">
        <DayRing {...args} className="w-64 shrink-0" />
        <ul className="flex w-full min-w-0 flex-col gap-2.5 text-ui">
          {args.jobs.map((job, i) => (
            <li key={job.id} className="flex items-center gap-2.5">
              <span aria-hidden className="size-2 shrink-0 rounded-[2px]" style={{ background: job.tone === 'neutral' ? 'var(--color-fg-subtle)' : `var(--color-${job.tone ?? `chart-${(i % 5) + 1}`})` }} />
              <span className={job.paused ? 'min-w-0 flex-1 truncate font-mono text-fg-muted' : 'min-w-0 flex-1 truncate font-mono'}>{job.name}</span>
              <span className="font-mono text-fg-muted tabular-nums">{job.runs.length > 4 ? `×${job.runs.length}` : job.runs.map(time).join(' ')}</span>
            </li>
          ))}
          <li className="mt-1 font-mono text-ui-sm text-warning-text tabular-nums">{overlaps.length === 1 ? '1 overlap' : `${overlaps.length} overlaps`}</li>
        </ul>
      </div>
    )
  },
}

export const Playground: Story = { name: 'Job schedule' }

/** Highlight a job: its runs stay lit, the rest dim, and the center counts down to its next run. */
export const Highlight: Story = {
  render: function Render(args) {
    const [highlight, setHighlight] = useState<string>()
    return (
      <div className="flex flex-col items-center gap-5">
        <DayRing {...args} highlight={highlight} />
        <div className="flex flex-wrap justify-center gap-1.5">
          {args.jobs.map((job) => (
            <Button key={job.id} size="sm" variant={highlight === job.id ? 'secondary' : 'outline'} onClick={() => setHighlight((h) => (h === job.id ? undefined : job.id))}>
              {job.name}
            </Button>
          ))}
        </div>
      </div>
    )
  },
}

/** A clock running at 60× speed: the hand walks round and the countdown rolls over as each run starts. */
export const Live: Story = {
  name: 'Live clock',
  render: function Render(args) {
    const [now, setNow] = useState(() => Date.UTC(2026, 8, 28, 1, 40))
    useEffect(() => {
      const id = setInterval(() => setNow((t) => t + 60_000), 250)
      return () => clearInterval(id)
    }, [])
    return <DayRing {...args} now={now} />
  },
}

/** Pause and resume a job: its collisions come and go, and its runs dim and dash. */
export const Paused: Story = {
  render: function Render(args) {
    const [paused, setPaused] = useState(false)
    const jobs = args.jobs.map((j) => (j.id === 'reindex' ? { ...j, paused } : j))
    return (
      <div className="flex flex-col items-center gap-5">
        <DayRing {...args} jobs={jobs} />
        <Button size="sm" variant="outline" onClick={() => setPaused((p) => !p)}>
          {paused ? 'Resume reindex-search' : 'Pause reindex-search'}
        </Button>
      </div>
    )
  },
}

/** Reduced motion draws every run and the hand in place; the countdown still ticks. */
export const ReducedMotion: Story = {
  name: 'Reduced motion',
  parameters: { docs: { description: { story: 'Set the toolbar’s Motion to reduced: no radar pass, no sweep; runs that move jump.' } } },
}
