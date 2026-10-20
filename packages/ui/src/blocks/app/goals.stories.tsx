import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { Goals, type GoalsGoal } from './goals'

const meta: Meta<typeof Goals> = {
  title: 'Blocks/App/Goals',
  component: Goals,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'card' },
    docs: {
      description: {
        component:
          'The period’s targets and where each will land: progress against an even pace, a status from the recent rate, and the picked goal as a burn-up with its forecast and likely range.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof Goals>

export const Default: Story = {}

/** Team activations, at risk: the forecast falls short of the target. */
export const AtRisk: Story = { name: 'At risk', args: { defaultGoal: 'activated' } }

export const Loading: Story = { args: { loading: true } }

export const LoadError: Story = { name: 'Error', args: { error: "Goals couldn't be loaded.", onRetry: fn() } }

export const Empty: Story = { args: { goals: [] } }

/* A sales team's October quotas in euros, ten days in, in Spanish. */
const day = (base: number, i: number) => Math.round(base * (0.7 + ((i * 37) % 11) / 18))
const QUOTAS: GoalsGoal[] = [
  { id: 'emea', label: 'EMEA', target: 420_000, daily: Array.from({ length: 10 }, (_, i) => day(15_500, i)), format: { style: 'currency', currency: 'EUR', notation: 'compact', maximumSignificantDigits: 3 } },
  { id: 'dach', label: 'DACH', target: 180_000, daily: Array.from({ length: 10 }, (_, i) => day(4_900, i)), format: { style: 'currency', currency: 'EUR', notation: 'compact', maximumSignificantDigits: 3 } },
  { id: 'nordics', label: 'Nórdicos', target: 95_000, daily: Array.from({ length: 10 }, (_, i) => day(3_600, i)), format: { style: 'currency', currency: 'EUR', notation: 'compact', maximumSignificantDigits: 3 } },
]

export const WithYourData: Story = {
  name: 'With your data',
  args: {
    goals: QUOTAS,
    start: '2026-10-01',
    end: '2026-10-31',
    locale: 'es-ES',
    copy: { title: 'Cuotas de octubre', goals: 'Cuotas', projected: 'Previsto', daysLeft: 'Días restantes' },
    onGoalChange: fn(),
  },
}

/* Two stand-ins for real data: a steady rate with a weekly swing, and a count that lands every few days. */
const steady = (days: number, base: number, swing: number, phase: number) => Array.from({ length: days }, (_, d) => Math.max(0, Math.round(base * (1 + swing * Math.sin(d * 2.1 + phase)))))
const every = (days: number, gap: number, offset: number, size = 1) => Array.from({ length: days }, (_, d) => (d % gap === offset ? size : 0))

const USD: Intl.NumberFormatOptions = { style: 'currency', currency: 'USD', notation: 'compact', maximumSignificantDigits: 3 }

/* A food bank's fall campaign: 1 September to 30 November, 44 days in. */
const FUNDRAISING: GoalsGoal[] = [
  { id: 'annual', label: 'Annual fund', target: 250_000, daily: steady(44, 3_100, 0.45, 0.4), format: USD },
  { id: 'donors', label: 'New monthly donors', target: 400, daily: steady(44, 3, 0.6, 1.3) },
  { id: 'hours', label: 'Volunteer hours', target: 1_800, daily: steady(44, 20, 0.3, 2.2) },
  { id: 'grants', label: 'Grant applications', target: 4, daily: every(44, 11, 5) },
]

export const FundraisingTargets: Story = {
  name: 'Fundraising targets',
  args: {
    goals: FUNDRAISING,
    start: '2026-09-01',
    end: '2026-11-30',
    copy: { title: 'Fall campaign', goals: 'Campaign targets', projected: 'Expected', neededPerWeek: 'Needed a week', soFarPerWeek: 'Raised a week', empty: 'No targets yet', emptyDescription: 'Set a campaign target to track it here.' },
  },
}

/* One reader's 2026: 1 January to 31 December, 287 days in. */
const READING: GoalsGoal[] = [
  { id: 'books', label: 'Books finished', target: 40, daily: every(287, 8, 3) },
  { id: 'pages', label: 'Pages read', target: 12_000, daily: steady(287, 36, 0.5, 0.8) },
  { id: 'nonfiction', label: 'Nonfiction books', target: 15, daily: every(287, 31, 12) },
  { id: 'reviews', label: 'Reviews written', target: 24, daily: every(287, 17, 6) },
]

export const ReadingGoals: Story = {
  name: 'Reading goals',
  args: {
    goals: READING,
    start: '2026-01-01',
    end: '2026-12-31',
    copy: { title: 'Reading year', goals: 'Reading goals', projected: 'On track for', neededPerWeek: 'Needed a week', soFarPerWeek: 'Read a week', empty: 'No reading goals yet', emptyDescription: 'Add a goal to start tracking.' },
  },
}

export const Standalone: Story = { args: { embedded: false } }
