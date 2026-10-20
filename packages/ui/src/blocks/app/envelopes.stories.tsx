import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { BugIcon, CloudIcon, CodeIcon, CpuIcon, DatabaseIcon, MegaphoneIcon, PaletteIcon, RocketIcon, UsersIcon } from '@youj/icons'
import { Envelopes } from './envelopes'
import { ENVELOPES } from './envelopes/data'

const meta: Meta<typeof Envelopes> = {
  title: 'Blocks/App/Envelopes',
  component: Envelopes,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'card' },
    docs: {
      description: {
        component:
          'Plan spending with envelopes you can move between as your needs change: a household’s dollars, a team’s hours, a cloud account’s credits. Each envelope drains as it is spent and spills in the danger tone when it is over.',
      },
    },
  },
  argTypes: { theme: { control: false } },
}
export default meta
type Story = StoryObj<typeof Envelopes>

export const Default: Story = { name: 'Household budget' }

/** Nothing overspent, a week to payday. */
export const Comfortable: Story = {
  args: { daysLeft: 7, envelopes: ENVELOPES.map((e) => (e.id === 'eating' ? { ...e, spent: 148.3 } : e)) },
}

/** A team's sprint in hours: the format writes hours, a drag moves four, and Backend is over. */
export const TeamTimeBudget: Story = {
  name: 'Team time budget',
  args: {
    format: { style: 'unit', unit: 'hour', unitDisplay: 'narrow', maximumFractionDigits: 1 },
    step: 4,
    daysLeft: 4,
    today: '2026-10-14',
    envelopes: [
      { id: 'web', name: 'Web app', icon: <CodeIcon />, budget: 120, spent: 96.5, rollover: 8, tone: 'chart-1' },
      { id: 'api', name: 'API', icon: <DatabaseIcon />, budget: 140, spent: 151, tone: 'chart-2' },
      { id: 'design', name: 'Design', icon: <PaletteIcon />, budget: 60, spent: 41.5, tone: 'chart-3' },
      { id: 'qa', name: 'QA', icon: <BugIcon />, budget: 48, spent: 22, rollover: 6, tone: 'chart-4' },
      { id: 'launch', name: 'Launch', icon: <MegaphoneIcon />, budget: 32, spent: 9.5, tone: 'chart-5' },
    ],
    entries: [
      { id: 'e1', title: 'Checkout redesign review', envelope: 'design', amount: 3.5, date: '2026-10-14' },
      { id: 'e2', title: 'Invoice export endpoint', envelope: 'api', amount: 6, date: '2026-10-14' },
      { id: 'e3', title: 'Release checklist', envelope: 'launch', amount: 1.5, date: '2026-10-13' },
      { id: 'e4', title: 'Regression pass', envelope: 'qa', amount: 4, date: '2026-10-13' },
      { id: 'e5', title: 'Settings page', envelope: 'web', amount: 5.5, date: '2026-10-12' },
    ],
    copy: {
      title: 'Team hours',
      subtitle: (days: number) => `Sprint 42 · ${days} working days left`,
      safe: 'Hours free per day',
      safeHint: (days: number) => `What’s left across the workstreams, spread over ${days} working days.`,
      left: 'Left this sprint',
      envelopes: 'Workstreams',
      dragHint: (step: string) => `Drag between workstreams to move ${step}`,
      recent: 'Logged',
      payday: 'Sprint ends Oct 18',
      cover: 'Cover overrun',
      covered: (amount: string, from: string, to: string) => `Moved ${amount} from ${from} to cover ${to}`,
      add: 'Log hours',
      adding: 'Logging…',
      added: (title: string, amount: string) => `${title}, ${amount}, logged`,
    },
    onAdd: fn(() => ({ title: 'Pairing session', envelope: 'web', amount: 2 })),
  },
}

/** A cloud account's monthly credits per project: plain numbers, a step of 500, one project over its share. */
export const CloudCredits: Story = {
  name: 'Cloud credits',
  args: {
    format: { style: 'decimal', maximumFractionDigits: 0 },
    step: 500,
    daysLeft: 9,
    today: '2026-10-22',
    envelopes: [
      { id: 'ml', name: 'Training', icon: <CpuIcon />, budget: 12000, spent: 13250, tone: 'chart-1' },
      { id: 'web', name: 'Web', icon: <CloudIcon />, budget: 6000, spent: 3980, rollover: 500, tone: 'chart-2' },
      { id: 'data', name: 'Data', icon: <DatabaseIcon />, budget: 5000, spent: 4120, tone: 'chart-3' },
      { id: 'ci', name: 'CI', icon: <RocketIcon />, budget: 3000, spent: 1260, rollover: 400, tone: 'chart-4' },
      { id: 'labs', name: 'Labs', icon: <UsersIcon />, budget: 2000, spent: 310, tone: 'chart-5' },
    ],
    entries: [
      { id: 'c1', title: 'Nightly training run', envelope: 'ml', amount: 1240, date: '2026-10-22' },
      { id: 'c2', title: 'Warehouse refresh', envelope: 'data', amount: 380, date: '2026-10-22' },
      { id: 'c3', title: 'Preview deploys', envelope: 'web', amount: 95, date: '2026-10-21' },
      { id: 'c4', title: 'Test matrix', envelope: 'ci', amount: 210, date: '2026-10-21' },
      { id: 'c5', title: 'Sandbox cluster', envelope: 'labs', amount: 60, date: '2026-10-20' },
    ],
    copy: {
      title: 'Cloud credits',
      subtitle: (days: number) => `October · ${days} days to renewal`,
      safe: 'Credits per day',
      safeHint: (days: number) => `What’s left across your projects, spread over ${days} days.`,
      left: 'Left this month',
      envelopes: 'Projects',
      dragHint: (step: string) => `Drag between projects to move ${step} credits`,
      recent: 'Recent usage',
      payday: 'Renews Nov 1',
      add: 'Add usage',
      adding: 'Adding…',
    },
  },
}

/** Skeletons in the figures, the envelopes and the entries. */
export const Loading: Story = { args: { loading: true } }

/** Nothing to show yet. */
export const Empty: Story = { args: { envelopes: [], entries: [] } }

/** The envelopes failed to load: the message and Retry take their place. */
export const Error: Story = { args: { error: 'Couldn’t load the budget.', onRetry: fn() } }

/** Drawn as its own page, with the card's title as the page's `h1`. */
export const Standalone: Story = { args: { embedded: false } }
