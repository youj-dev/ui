import type { Meta, StoryObj } from '@storybook/react-vite'
import { useEffect, useState, type ReactNode } from 'react'
import { YoujProvider } from '@youj/core'
import { ArrowRightIcon, ArrowUpIcon, BriefcaseIcon, FlameIcon, PhoneIcon, TargetIcon, TimerIcon, UsersIcon, ZapIcon } from '@youj/icons'
import { ActivityRings, type ActivityRing, type ActivityRingsProps } from './activity-rings'
import { Button } from './button'

const DAY: ActivityRing[] = [
  { label: 'Move', value: 420, max: 500, unit: 'calories', tone: 'danger', icon: <ArrowRightIcon /> },
  { label: 'Exercise', value: 26, max: 30, unit: 'minutes', tone: 'success', icon: <ZapIcon /> },
  { label: 'Stand', value: 9, max: 12, unit: 'hours', tone: 'info', icon: <ArrowUpIcon /> },
]

const meta: Meta<ActivityRingsProps> = {
  title: 'UI/Data/Activity Rings',
  component: ActivityRings,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Goals side by side as concentric rings: a day’s move, exercise and stand, a team’s quotas, a quarter’s key results. Each of the two to four rings is its own goal, a round-capped arc over a faint track of its tone, clockwise from twelve o’clock. Past its goal a ring keeps going for a second lap, its head casting a small shadow onto the lap beneath. The bowl holds the pointed ring’s share (or the first’s), or your own content; the legend gives each ring its value, goal and share, and pointing at a ring or focusing its row singles both out. Each ring is a meter spoken as “Move: 420 of 500 calories, 84%”. The rings fill on the smooth spring as they come into view and retarget from where they are; closing a ring glows once and plays the success cue. A dial turns clockwise in every script, so the rings keep their direction in RTL. Reduced motion: drawn at their values, no glow.',
      },
    },
  },
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'default', 'lg', 'xl'] },
    legend: { control: 'inline-radio', options: [false, 'side', 'below'] },
  },
  args: { rings: DAY, size: 'lg' },
}
export default meta
type Story = StoryObj<ActivityRingsProps>

const frame = (children: ReactNode) => <div className="w-[36rem] max-w-[calc(100vw-2rem)] rounded-2xl border border-line bg-surface p-6">{children}</div>

export const Playground: Story = { render: (args) => frame(<ActivityRings {...args} />) }

/** A day’s move, exercise and stand, each with its glyph at the ring’s start and the legend beside. */
export const DailyGoals: Story = {
  name: 'Daily goals',
  args: { legend: 'side' },
  render: (args) => frame(<ActivityRings {...args} />),
}

/** A sales team’s quarter: two quotas past their goal run a second lap, the head of each casting its shadow on the lap beneath. */
export const TeamQuotas: Story = {
  name: 'Team quotas (over 100%)',
  args: {
    legend: 'below',
    size: 'xl',
    format: { notation: 'compact', maximumFractionDigits: 1 },
    rings: [
      { label: 'New revenue', value: 1_380_000, max: 1_000_000, unit: 'USD', tone: 'accent', icon: <TargetIcon /> },
      { label: 'Meetings booked', value: 162, max: 120, tone: 'chart-2', icon: <UsersIcon /> },
      { label: 'Calls', value: 1_740, max: 2_000, tone: 'chart-3', icon: <PhoneIcon /> },
    ],
  },
  render: (args) => <div className="w-80 rounded-2xl border border-line bg-surface p-6">{<ActivityRings {...args} />}</div>,
}

/** OKRs with the legend: point at a row (or Tab to it) and its ring is singled out; point at a ring and its row is. */
export const WithLegend: Story = {
  name: 'With legend',
  args: {
    legend: 'side',
    size: 'default',
    rings: [
      { label: 'Activation', value: 31, max: 40, tone: 'chart-1' },
      { label: 'Weekly retention', value: 54, max: 60, tone: 'chart-2' },
      { label: 'Self-serve upgrades', value: 210, max: 300, tone: 'chart-3' },
      { label: 'Docs NPS', value: 48, max: 50, tone: 'chart-4' },
    ],
  },
  render: (args) => frame(<ActivityRings {...args} />),
}

/** A sixth of each goal more, back to zero once a ring is well past it. */
const advance = (rings: ActivityRing[]) => rings.map((r) => ({ ...r, value: r.value >= r.max * 1.4 ? 0 : r.value + r.max / 6 }))

function LiveUpdate(args: ActivityRingsProps) {
  const [rings, setRings] = useState<ActivityRing[]>([
    { label: 'Focus', value: 70, max: 120, unit: 'minutes', tone: 'accent', icon: <TimerIcon /> },
    { label: 'Deep work', value: 1, max: 3, unit: 'blocks', tone: 'chart-2', icon: <BriefcaseIcon /> },
  ])
  const [auto, setAuto] = useState(true)
  const step = () => setRings(advance)
  useEffect(() => {
    if (!auto) return
    const timer = setInterval(() => setRings(advance), 1600)
    return () => clearInterval(timer)
  }, [auto])
  return frame(
    <div className="flex flex-col items-center gap-5">
      <ActivityRings {...args} rings={rings} format={{ maximumFractionDigits: 0 }} />
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={step}>
          Log progress
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setAuto((a) => !a)}>
          {auto ? 'Pause' : 'Play'}
        </Button>
      </div>
    </div>,
  )
}

/** New values retarget from where each ring is; a ring that crosses its goal glows once and plays the success cue. */
export const Live: Story = {
  name: 'Live update',
  args: { legend: 'below', size: 'default' },
  render: (args) => <LiveUpdate {...args} />,
}

/** sm (96px, no bowl), default, lg and xl. */
export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-8">
      {(['sm', 'default', 'lg', 'xl'] as const).map((size) => (
        <ActivityRings key={size} {...args} size={size} inView={false} />
      ))}
    </div>
  ),
}

/** Two rings with your own content in the bowl. */
export const CenterContent: Story = {
  name: 'Streak in the bowl',
  args: {
    rings: [
      { label: 'Read', value: 22, max: 20, unit: 'pages', tone: 'chart-1' },
      { label: 'Write', value: 380, max: 500, unit: 'words', tone: 'chart-4' },
    ],
    children: (
      <span className="flex flex-col items-center gap-1">
        <FlameIcon className="size-5 text-warning" />
        <span className="text-2xl font-semibold tabular-nums text-fg">12</span>
        <span className="text-ui-xs text-fg-muted">day streak</span>
      </span>
    ),
  },
  render: (args) => frame(<ActivityRings {...args} />),
}

/** Reduced motion: the rings are drawn at their values from the first frame, with no glow; the values are still spoken. */
export const ReducedMotion: Story = {
  name: 'Reduced motion',
  args: { legend: 'side' },
  render: (args) => <YoujProvider reducedMotion="always">{frame(<ActivityRings {...args} />)}</YoujProvider>,
}
