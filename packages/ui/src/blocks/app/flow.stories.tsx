import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { fn } from 'storybook/test'
import { Flow, type FlowNode, type FlowPath } from './flow'

const meta: Meta<typeof Flow> = {
  title: 'Blocks/App/Flow',
  component: Flow,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'card' },
    docs: {
      description: {
        component:
          'Where things go: a sankey whose ribbons keep their source colour through every stage. Point at a node to light every path through it, press it to keep it lit; point at a ribbon to follow one path. A new range morphs the flow.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof Flow>

export const Default: Story = {}

/** Referral pinned: its trials, followed through plan to outcome, convert best. */
export const Pinned: Story = { args: { defaultSelected: 'referral' } }

export const Loading: Story = { args: { loading: true } }

export const LoadError: Story = { name: 'Error', args: { error: "The flow couldn't be loaded.", onRetry: fn() } }

export const Empty: Story = { args: { paths: [] } }

/* A support desk's week in four stages: where tickets came in, the team
 * that took them, who answered, and how they ended. */
const NODES: FlowNode[] = [
  { id: 'email', label: 'Email', stage: 0, tone: 'chart-5' },
  { id: 'chat', label: 'Chat', stage: 0, tone: 'chart-3' },
  { id: 'phone', label: 'Phone', stage: 0, tone: 'chart-4' },
  { id: 'billing', label: 'Billing', stage: 1 },
  { id: 'technical', label: 'Technical', stage: 1 },
  { id: 'accounts', label: 'Accounts', stage: 1 },
  { id: 'bot', label: 'Assistant', stage: 2 },
  { id: 'agent', label: 'Agent', stage: 2 },
  { id: 'solved', label: 'Solved', stage: 3, tone: 'success' },
  { id: 'escalated', label: 'Escalated', stage: 3, tone: 'warning' },
]
const SHARE = { email: 0.46, chat: 0.38, phone: 0.16 }
const TEAMS = { billing: 0.34, technical: 0.48, accounts: 0.18 }
const PATHS: FlowPath[] = Object.entries(SHARE).flatMap(([channel, c]) =>
  Object.entries(TEAMS).flatMap(([team, t]) => {
    const tickets = 1840 * c * t
    const bot = channel === 'phone' ? 0 : team === 'technical' ? 0.35 : 0.55
    return [
      { steps: [channel, team, 'bot', 'solved'], value: Math.round(tickets * bot * 0.82) },
      { steps: [channel, team, 'bot', 'escalated'], value: Math.round(tickets * bot * 0.18) },
      { steps: [channel, team, 'agent', 'solved'], value: Math.round(tickets * (1 - bot) * 0.93) },
      { steps: [channel, team, 'agent', 'escalated'], value: Math.round(tickets * (1 - bot) * 0.07) },
    ]
  }),
)

export const WithYourData: Story = {
  name: 'With your data',
  args: {
    stages: ['Channel', 'Team', 'Answered by', 'Outcome'],
    nodes: NODES,
    paths: PATHS,
    copy: {
      title: 'Ticket flow',
      description: () => 'This week’s tickets, from where they came in to how they ended',
      count: (value: string) => `${value} tickets`,
      chart: 'Ticket flow',
      columnValue: 'Tickets',
    },
    onSelectedChange: fn(),
  },
}

/* A city's budget in three stages: where the money comes from, the department that gets it and the program it funds. A year's switch. */
const BUDGET_NODES: FlowNode[] = [
  { id: 'property', label: 'Property tax', stage: 0, tone: 'chart-1' },
  { id: 'sales', label: 'Sales tax', stage: 0, tone: 'chart-2' },
  { id: 'fees', label: 'Fees', stage: 0, tone: 'chart-3' },
  { id: 'grants', label: 'Grants', stage: 0, tone: 'chart-4' },
  { id: 'safety', label: 'Public safety', stage: 1 },
  { id: 'works', label: 'Public works', stage: 1 },
  { id: 'parks', label: 'Parks', stage: 1 },
  { id: 'library', label: 'Libraries', stage: 1 },
  { id: 'patrol', label: 'Patrol', stage: 2 },
  { id: 'fire', label: 'Fire and rescue', stage: 2 },
  { id: 'roads', label: 'Roads', stage: 2 },
  { id: 'water', label: 'Water', stage: 2 },
  { id: 'programs', label: 'Recreation', stage: 2 },
]
const BUDGET_YEARS = [
  { id: 'fy25', label: 'FY25', name: 'fiscal year 2025', scale: 0.93 },
  { id: 'fy26', label: 'FY26', name: 'fiscal year 2026', scale: 1 },
  { id: 'fy27', label: 'FY27', name: 'fiscal year 2027 (proposed)', scale: 1.06 },
]
/** Millions of dollars (scaled to dollars below): source → department → program. */
const BUDGET_ROUTES: [string, string, string, number][] = [
  ['property', 'safety', 'patrol', 31],
  ['property', 'safety', 'fire', 24],
  ['property', 'works', 'roads', 12],
  ['property', 'library', 'programs', 9],
  ['property', 'parks', 'programs', 6],
  ['sales', 'safety', 'patrol', 14],
  ['sales', 'works', 'roads', 22],
  ['sales', 'works', 'water', 8],
  ['sales', 'parks', 'programs', 7],
  ['fees', 'works', 'water', 26],
  ['fees', 'parks', 'programs', 8],
  ['fees', 'library', 'programs', 2],
  ['grants', 'works', 'roads', 17],
  ['grants', 'safety', 'fire', 6],
  ['grants', 'library', 'programs', 3],
]
const budgetPaths = (scale: number): FlowPath[] => BUDGET_ROUTES.map(([a, b, c, v]) => ({ steps: [a, b, c], value: Math.round(v * scale * 10) * 100_000 }))

export const BudgetAllocation: Story = {
  name: 'Budget allocation',
  render: (args) => {
    const [year, setYear] = useState('fy26')
    return <Flow {...args} range={year} onRangeChange={setYear} paths={budgetPaths(BUDGET_YEARS.find((y) => y.id === year)?.scale ?? 1)} />
  },
  args: {
    stages: ['Revenue', 'Department', 'Program'],
    nodes: BUDGET_NODES,
    ranges: BUDGET_YEARS,
    format: { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 },
    copy: {
      title: 'Where the budget goes',
      description: (range: string) => `City revenue by department and program · ${range}`,
      count: (value: string) => value,
      chart: 'City budget flow',
      table: (range: string) => `City budget, step to step, ${range}`,
      columnValue: 'Amount',
      empty: 'No budget yet',
      emptyDescription: 'Lines appear once the budget is adopted.',
      summary: (total: string, sources: number, ends: string) => `${total} from ${sources} revenue sources. ${ends}.`,
    },
  },
}

/* A college's admissions funnel: where applicants are, how far they got and what they study. */
const ENROLL_NODES: FlowNode[] = [
  { id: 'applied', label: 'Applied', stage: 0, tone: 'chart-1' },
  { id: 'admitted', label: 'Admitted', stage: 1 },
  { id: 'waitlisted', label: 'Waitlisted', stage: 1, tone: 'warning' },
  { id: 'declined', label: 'Not admitted', stage: 1 },
  { id: 'enrolled', label: 'Enrolled', stage: 2, tone: 'success' },
  { id: 'elsewhere', label: 'Went elsewhere', stage: 2 },
  { id: 'sciences', label: 'Sciences', stage: 3, tone: 'chart-2' },
  { id: 'humanities', label: 'Humanities', stage: 3, tone: 'chart-3' },
  { id: 'business', label: 'Business', stage: 3, tone: 'chart-4' },
]
const ENROLL_PATHS: FlowPath[] = [
  { steps: ['applied', 'admitted', 'enrolled', 'sciences'], value: 260 },
  { steps: ['applied', 'admitted', 'enrolled', 'humanities'], value: 190 },
  { steps: ['applied', 'admitted', 'enrolled', 'business'], value: 230 },
  { steps: ['applied', 'admitted', 'elsewhere'], value: 480 },
  { steps: ['applied', 'waitlisted'], value: 200 },
  { steps: ['applied', 'declined'], value: 700 },
]

export const StudentEnrollment: Story = {
  name: 'Student enrollment',
  args: {
    stages: ['Applicants', 'Decision', 'Response', 'Major'],
    nodes: ENROLL_NODES,
    paths: ENROLL_PATHS,
    copy: {
      title: 'Fall admissions',
      description: () => 'Applicants through the decision, their reply and the major they chose',
      count: (value: string, n: number) => `${value} ${n === 1 ? 'student' : 'students'}`,
      chart: 'Admissions funnel',
      columnValue: 'Students',
      summary: (total: string, _sources: number, ends: string) => `${total} applied. ${ends}.`,
    },
  },
}

export const Standalone: Story = { args: { embedded: false } }
