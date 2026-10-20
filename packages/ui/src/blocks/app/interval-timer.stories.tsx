import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { YoujProvider } from '@youj/core'
import { IntervalTimer, type IntervalTimerEntry, type IntervalTimerInterval, type IntervalTimerItem } from './interval-timer'

const meta: Meta<typeof IntervalTimer> = {
  title: 'Blocks/App/Interval Timer',
  component: IntervalTimer,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'card' },
    docs: {
      description: {
        component:
          'Run intervals of work and rest with the item at hand beside a log of entries: a ring with an arc for every interval, a countdown that drains while resting, then what’s next, and count × amount steppers. The demo is an evening HIIT session; stories show focus and break cycles and a pour-over brew.',
      },
    },
  },
  argTypes: { theme: { control: false }, onLog: { action: 'log' } },
}
export default meta
type Story = StoryObj<typeof IntervalTimer>

/** Eight rounds of 40 s work and 20 s rest through four exercises, with a warm-up and a cool-down. */
export const Default: Story = { name: 'Evening HIIT' }

/** Between rounds: the countdown drains, with +15 s and Skip rest. */
export const Resting: Story = { args: { elapsed: 60 + 2 * 60 + 40 + 6 } }

/** Before the first interval. */
export const Ready: Story = { args: { elapsed: 0 } }

/* Focus: four 25-minute cycles with 5-minute breaks and a long one at the end. */

const POMODORO: IntervalTimerInterval[] = [
  { kind: 'warmup', duration: 120, label: 'Plan' },
  { kind: 'work', duration: 1500, label: 'Write report' },
  { kind: 'rest', duration: 300 },
  { kind: 'work', duration: 1500, label: 'Review pull requests' },
  { kind: 'rest', duration: 300 },
  { kind: 'work', duration: 1500, label: 'Answer email' },
  { kind: 'rest', duration: 300 },
  { kind: 'work', duration: 1500, label: 'Sketch the roadmap' },
  { kind: 'cooldown', duration: 900, label: 'Long break' },
]

const TASKS: IntervalTimerItem[] = [
  { id: 'report', name: 'Write report', target: 'first draft of section 3', count: 1, amount: 25 },
  { id: 'review', name: 'Review pull requests', target: 'clear the queue', count: 1, amount: 25 },
  { id: 'email', name: 'Answer email', target: 'inbox under 10', count: 1, amount: 25 },
  { id: 'roadmap', name: 'Sketch the roadmap', target: 'three themes', count: 1, amount: 25 },
]

const CYCLES: IntervalTimerEntry[] = [{ id: 'c1', item: 'report', count: 1, amount: 25 }]

/** Focus: tasks as the items, 25-minute cycles with breaks between, and the minutes of focus as the total. */
export const Pomodoro: Story = {
  args: {
    intervals: POMODORO,
    items: TASKS,
    entries: CYCLES,
    elapsed: 120 + 1500 + 300 + 640,
    copy: {
      title: 'Pomodoro',
      subtitle: (minutes) => `4 cycles · ${minutes} min`,
      more: 'Timer options',
      now: 'Focus',
      rest: 'Break',
      restHint: 'Stand up. Look away from the screen.',
      addRestLabel: 'Add 15 seconds of break',
      skipRest: 'Skip break',
      target: (target) => `Goal: ${target}`,
      skipLabel: 'Skip to the next block',
      done: 'Session complete',
      log: 'Log cycle',
      logLabel: 'Cycle log',
      count: 'Cycles',
      amount: 'Focus',
      unit: 'min',
      noAmount: 'Open',
      noEntries: 'No cycles logged yet.',
      entryNumber: (n) => `Cycle ${n}`,
      total: 'Focused',
    },
  },
}

/* Brewing: a V60 pour-over, from the rinse to serving. */

const POUR_OVER: IntervalTimerInterval[] = [
  { kind: 'warmup', duration: 30, label: 'Rinse' },
  { kind: 'work', duration: 45, label: 'Bloom' },
  { kind: 'rest', duration: 15 },
  { kind: 'work', duration: 40, label: 'First pour' },
  { kind: 'rest', duration: 20 },
  { kind: 'work', duration: 40, label: 'Second pour' },
  { kind: 'rest', duration: 25 },
  { kind: 'work', duration: 60, label: 'Drawdown' },
  { kind: 'cooldown', duration: 30, label: 'Serve' },
]

const STEPS: IntervalTimerItem[] = [
  { id: 'bloom', name: 'Bloom', target: '50 g water, wet every ground', count: 1, amount: 50 },
  { id: 'pour1', name: 'First pour', target: 'to 150 g, slow circles', count: 1, amount: 100 },
  { id: 'pour2', name: 'Second pour', target: 'to 250 g, center only', count: 1, amount: 100 },
  { id: 'drawdown', name: 'Drawdown', target: 'bed flat by 3:00', count: 1, amount: 0 },
]

/** Brewing: the steps of a pour-over as the items, the water poured as the log. */
export const Brewing: Story = {
  // The ring speaks the provider's labels: say pour and wait there.
  decorators: [
    (Story) => (
      <YoujProvider labels={{ intervalWork: 'Pour', intervalRest: 'Wait', intervalWarmup: 'Rinse', intervalCooldown: 'Serve', intervalFinished: 'Brew complete' }}>
        <Story />
      </YoujProvider>
    ),
  ],
  args: {
    intervals: POUR_OVER,
    items: STEPS,
    entries: [{ id: 'b1', item: 'bloom', count: 1, amount: 50 }],
    elapsed: 30 + 20,
    copy: {
      title: 'Pour-over',
      subtitle: (minutes) => `V60 · 15 g coffee · ${minutes} min`,
      more: 'Recipe options',
      restHint: 'Let the bed settle.',
      rest: 'Wait',
      skipRest: 'Skip wait',
      addRestLabel: 'Add 15 seconds of waiting',
      target: (target) => target,
      done: 'Brew complete',
      log: 'Log pour',
      logLabel: 'Pour log',
      count: 'Pours',
      amount: 'Water',
      unit: 'g',
      noAmount: 'None',
      noEntries: 'No pours logged yet.',
      entryNumber: (n) => `Pour ${n}`,
      total: 'Poured',
    },
  },
}

/** Skeletons in the card’s body while your intervals load. */
export const Loading: Story = { args: { loading: true } }

/** No intervals yet: the message takes the body’s room. */
export const Empty: Story = { args: { intervals: [] } }

/** The intervals failed to load: the message and Retry take the body’s room. */
export const Error: Story = { args: { error: 'Couldn’t load the timer.', onRetry: fn() } }
