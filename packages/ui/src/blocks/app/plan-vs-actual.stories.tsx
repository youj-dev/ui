import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { PlanVsActual } from './plan-vs-actual'

const meta: Meta<typeof PlanVsActual> = {
  title: 'Blocks/App/Plan vs Actual',
  component: PlanVsActual,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'card' },
    docs: {
      description: {
        component:
          'See how each row of a set adds up over a year against its plan, whether that is agent spend, department budgets or a harvest: a row of month cells per big one and one for the rest, on one scale with each plan as a dashed tick, the year by quarter, the total to date against the plan to date, the projected year, a few facts and the biggest movers with why.',
      },
    },
  },
  argTypes: { theme: { control: false } },
}
export default meta
type Story = StoryObj<typeof PlanVsActual>

/** An engineering team's agent spend, nine months settled: the nightly summarizer and the code reviewer run past their plans every month, while the triage bot's cache brings it under. */
export const Default: Story = { name: 'Agent spend' }

/** Other data: four agents in euros, six months settled, two rows of their own, German words and the actions in Actions. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    locale: 'de-DE',
    settled: 6,
    top: 2,
    rows: [
      {
        id: 'a',
        name: 'angebots-agent',
        monthly: [300, 320, 360, 420, 480, 540, 560, 580, 600, 610, 620, 630],
        plan: 400,
        note: 'mehr Anfragen seit der Messe',
      },
      {
        id: 'b',
        name: 'support-agent',
        monthly: [380, 360, 340, 320, 300, 290, 285, 280, 280, 280, 280, 280],
        plan: 360,
        note: 'Antworten aus dem Cache',
      },
      { id: 'c', name: 'export-agent', monthly: [90, 95, 90, 92, 94, 96, 95, 95, 95, 95, 95, 95], plan: 100 },
      { id: 'd', name: 'qa-agent', monthly: [60, 62, 60, 64, 66, 64, 65, 65, 65, 65, 65, 65], plan: 70 },
    ],
    facts: [{ id: 'budget', label: 'Budget', value: 'KI-26', icon: 'wallet' }],
    copy: {
      title: 'Agentenkosten',
      subtitle: (year: number, agents: number) => `${year} · ${agents} Agenten`,
      overPlan: (percent: string) => `${percent} über Plan`,
      underPlan: (percent: string) => `${percent} unter Plan`,
      monthly: (from: string, to: string) => `Monatlich, ${from} – ${to}`,
      actual: 'Ist',
      projected: 'Prognose',
      others: (count: number) => `${count} weitere Agenten`,
      byQuarter: 'Nach Quartal, gegen Plan',
      plan: 'Plan',
      spentYtd: 'Bisher ausgegeben',
      againstPlan: (plan: string) => `gegen ${plan} Plan`,
      projectedYear: 'Prognose Jahr',
      rowsOver: 'Agenten über Plan',
      rowsOverValue: (over: number, total: number) => `${over} von ${total}`,
      movers: 'Größte Abweichungen',
      insight: 'Der Angebots-Agent wächst mit den Anfragen',
      setPlan: 'Budget festlegen',
      action: 'Limit setzen',
      currency: 'EUR',
    },
    onSetPlan: fn(),
    onAction: fn(),
  },
}

/** Finance: six departments month by month against their plan; Engineering and Sales run over, Operations stays under. */
export const DepartmentBudgets: Story = {
  name: 'Department budgets',
  args: {
    rows: [
      {
        id: 'eng',
        name: 'Engineering',
        monthly: [380000, 385000, 390000, 400000, 410000, 420000, 430000, 440000, 450000, 455000, 460000, 465000],
        plan: 395000,
        note: 'cloud bill grew with the new region',
      },
      {
        id: 'sales',
        name: 'Sales',
        monthly: [210000, 215000, 225000, 240000, 250000, 262000, 270000, 280000, 285000, 292000, 300000, 305000],
        plan: 235000,
        note: 'commissions on three large renewals',
      },
      {
        id: 'ops',
        name: 'Operations',
        monthly: [180000, 176000, 172000, 170000, 168000, 166000, 165000, 164000, 164000, 163000, 163000, 162000],
        plan: 190000,
        note: 'vendor contracts renegotiated in March',
      },
      {
        id: 'mkt',
        name: 'Marketing',
        monthly: [120000, 130000, 150000, 170000, 160000, 150000, 140000, 135000, 130000, 125000, 120000, 120000],
        plan: 135000,
      },
      {
        id: 'support',
        name: 'Support',
        monthly: [95000, 96000, 96000, 98000, 99000, 100000, 101000, 101000, 102000, 102000, 103000, 103000],
        plan: 100000,
      },
      { id: 'people', name: 'People', monthly: [70000, 70000, 72000, 71000, 72000, 73000, 72000, 72000, 72000, 72000, 72000, 72000], plan: 75000 },
    ],
    top: 3,
    facts: [
      { id: 'open', label: 'Open requests', value: '7', icon: 'bell' },
      { id: 'fy', label: 'Fiscal year', value: 'FY26', icon: 'wallet' },
      { id: 'close', label: 'Books close', value: 'Oct 31', icon: 'clock' },
    ],
    copy: {
      title: 'Department budgets',
      subtitle: (year: number, rows: number) => `${year} · ${rows} departments`,
      rows: 'Departments by spend',
      others: (count: number) => `${count} more`,
      rowsOver: 'Departments over plan',
      insight: 'Engineering and Sales account for the overrun',
      setPlan: 'Set budget',
      action: 'Request review',
      acting: 'Requesting…',
      acted: 'Requested',
    },
    onSetPlan: fn(),
    onAction: fn(),
  },
}

/** Agriculture: bushels per field across a closed season; the corn beats its plan, the soybeans fall short, and the foot's figures are plain counts. */
export const CropYield: Story = {
  name: 'Crop yield',
  args: {
    year: 2025,
    settled: 12,
    better: 'over',
    rows: [
      {
        id: 'river',
        name: 'river-bottom',
        monthly: [0, 0, 0, 0, 0, 0, 0, 0, 2400, 21000, 38000, 9000],
        plan: 5800,
        note: 'corn came in a week early',
      },
      {
        id: 'east',
        name: 'east-quarter',
        monthly: [0, 0, 0, 0, 0, 0, 0, 0, 5200, 17800, 3000, 0],
        plan: 2400,
        note: 'soybeans lost to a dry August',
      },
      { id: 'creek', name: 'creek-parcel', monthly: [0, 0, 0, 0, 0, 6200, 14800, 3100, 0, 0, 0, 0], plan: 2000 },
      { id: 'hill', name: 'hill-field', monthly: [0, 0, 0, 0, 0, 0, 4100, 5200, 0, 0, 0, 0], plan: 900 },
      { id: 'orchard', name: 'orchard-lane', monthly: [0, 0, 0, 0, 2100, 3400, 0, 0, 0, 0, 0, 0], plan: 500 },
      { id: 'sandy', name: 'sandy-strip', monthly: [0, 0, 0, 0, 0, 0, 1900, 2300, 0, 0, 0, 0], plan: 200, note: 'second cutting added in July' },
    ],
    formats: { value: { maximumFractionDigits: 0 }, compact: { notation: 'compact', maximumFractionDigits: 1 } },
    facts: [
      { id: 'acres', label: 'Acres planted', value: '640', icon: 'gauge' },
      { id: 'moisture', label: 'Avg. moisture', value: '14.5%', icon: 'clock' },
      { id: 'bins', label: 'Bins filled', value: '9 of 11', icon: 'wallet' },
    ],
    copy: {
      title: 'Crop yield',
      subtitle: (year: number, rows: number) => `${year} season · ${rows} fields`,
      monthly: (from: string, to: string) => `Bushels by month, ${from} – ${to}`,
      rows: 'Fields by yield',
      others: (count: number) => `${count} other fields`,
      spendOf: (name: string) => `${name}, bushels by month`,
      byQuarter: 'By quarter, against plan',
      spentYtd: 'Bushels harvested',
      againstPlan: (plan: string) => `against a ${plan} bu plan`,
      projectedYear: 'Season total',
      rowsOver: 'Fields over plan',
      movers: 'Biggest swings against plan',
      insight: 'The east quarter’s soybeans fell furthest short of plan',
      setPlan: 'Set targets',
      action: 'Plan next season',
      acting: 'Planning…',
      acted: 'Planned',
    },
    onSetPlan: fn(),
    onAction: fn(),
  },
}

/** Skeletons hold the rows and the summary while the data loads. */
export const Loading: Story = { args: { loading: true } }

/** Nothing planned yet: the empty message over the body's own room. */
export const Empty: Story = { args: { rows: [] } }

/** The load failed: the message with Retry over the body's own room. */
export const Error: Story = { args: { error: 'Couldn’t load the plan.', onRetry: fn() } }

/** Drawn as its own page, with the title as the page's `h1`. */
export const Standalone: Story = { args: { embedded: false } }
