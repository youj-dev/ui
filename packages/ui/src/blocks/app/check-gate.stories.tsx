import type { Meta, StoryObj } from '@storybook/react-vite'
import { CheckGate } from './check-gate'
import { GROUPS, passRate, type CheckGateGroup } from './check-gate/data'

const meta: Meta<typeof CheckGate> = {
  title: 'Blocks/App/Check Gate',
  component: CheckGate,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'card', preset: 'basalt', address: 'console.harbor.app/checks' },
    docs: {
      description: {
        component:
          'Review the checks a candidate needs to pass before it goes through: a mobile build, a loan application or a site inspection. Groups under the bar block it.',
      },
    },
  },
  argTypes: { theme: { control: false } },
}
export default meta
type Story = StoryObj<typeof CheckGate>

/** A mobile build: six test suites against a 97% bar, three of them blocking. */
export const Default: Story = { name: 'Mobile release' }

/** Every group over the bar: the pill says nothing blocks, and Review blockers rests. */
export const AllClear: Story = {
  name: 'All clear',
  args: { groups: GROUPS.map((g) => ({ ...g, passed: Math.max(g.passed, Math.ceil(g.total * 0.98)) })) },
}

const LOAN: CheckGateGroup[] = [
  { id: 'Identity', owner: 'KYC team', total: 18, passed: 18, delta: null },
  { id: 'Income', owner: 'Underwriting', total: 24, passed: 21, delta: -2.1 },
  { id: 'Credit', owner: 'Bureau pull', total: 32, passed: 31, delta: 1.4 },
  { id: 'Collateral', owner: 'Appraisal', total: 15, passed: 12, delta: -6.7 },
]

/** Finance: a loan application against a 95% bar. Income and collateral are under it, so the loan can't fund until they clear. */
export const LoanUnderwriting: Story = {
  name: 'Loan underwriting',
  parameters: { showcase: { kind: 'card', preset: 'basalt', address: 'lending.harbor.app/applications/LN-2291' } },
  args: {
    threshold: 95,
    groups: LOAN,
    candidates: [93.1, 96.4, 94.8, 97.2, 95.6, 93.9, 96.8, 95.1, 94.2, 96.0, 95.4]
      .map((rate, i) => ({ id: `LN-${2280 + i}`, rate }))
      .concat({ id: 'LN-2291', rate: passRate(LOAN) }),
    copy: {
      title: 'Underwriting checks',
      subject: 'Application LN-2291 · Okafor household',
      ran: 'ran 9:42 AM on 4 data sources',
      clear: 'Cleared to fund',
      blockingCount: (count: number) => `${count} ${count === 1 ? 'check group' : 'check groups'} blocking`,
      passRate: 'Checks passed',
      delta: (points: string, previous: string) => `${points} pt on ${previous}`,
      checks: (passed: string, total: string) => `${passed} of ${total} checks passed`,
      history: (count: number) => `Last ${count} applications`,
      chartLabel: (count: number, under: number, bar: string, candidate: string) =>
        `Check pass rate of the last ${count} applications against the ${bar} bar: ${under} fell under it. This application is at ${candidate}.`,
      candidate: 'this one',
      groups: 'Check groups',
      filter: 'Show check groups',
      noneBlocking: 'Nothing blocking: every check group cleared the bar.',
      promote: 'Approve and fund',
      promoting: 'Funding',
      promoted: 'Funded',
    },
  },
}

const SITE: CheckGateGroup[] = [
  { id: 'Electrical', owner: 'Sparks Electric', total: 64, passed: 64, delta: 1.6 },
  { id: 'Plumbing', owner: 'Pell & Rowe', total: 40, passed: 40, delta: null },
  { id: 'Fire safety', owner: 'City inspector', total: 36, passed: 33, delta: -4.2 },
  { id: 'Structure', owner: 'Halden Engineering', total: 52, passed: 51, delta: 0.4 },
]

/** Construction: a floor's walkthrough against a 98% bar. Fire safety is the only group under it, so the floor stays closed until it clears. */
export const SiteInspection: Story = {
  name: 'Site inspection',
  parameters: { showcase: { kind: 'card', preset: 'basalt', address: 'sites.harbor.app/maple-court/inspections' } },
  args: {
    threshold: 98,
    groups: SITE,
    candidates: [97.2, 98.4, 99.1, 97.8, 98.6, 98.9, 96.9, 98.2, 99.3, 98.0, 98.5]
      .map((rate, i) => ({ id: `F${i + 1}`, rate }))
      .concat({ id: 'F12', rate: passRate(SITE) }),
    copy: {
      title: 'Inspection checks',
      subject: 'Maple Court · floor 12',
      ran: 'walked Tuesday 10:30 AM with 4 trades',
      clear: 'Ready to close out',
      blockingCount: (count: number) => `${count} ${count === 1 ? 'trade' : 'trades'} blocking`,
      passRate: 'Items passed',
      delta: (points: string, previous: string) => `${points} pt on floor ${previous.slice(1)}`,
      checks: (passed: string, total: string) => `${passed} of ${total} items passed`,
      history: (count: number) => `Last ${count} floors`,
      chartLabel: (count: number, under: number, bar: string, candidate: string) =>
        `Item pass rate of the last ${count} floors against the ${bar} bar: ${under} fell under it. This floor is at ${candidate}.`,
      candidate: 'this floor',
      groups: 'Trades',
      filter: 'Show trades',
      noneBlocking: 'Nothing blocking: every trade cleared the bar.',
      since: (previous: string) => `since floor ${previous.slice(1)}`,
      failed: (count: number) => `${count} open`,
      review: (count: number) => (count ? `Review ${count} open ${count === 1 ? 'trade' : 'trades'}` : 'Nothing open'),
      promote: 'Sign off floor',
      promoting: 'Signing off',
      promoted: 'Signed off',
    },
  },
}
