import type { Meta, StoryObj } from '@storybook/react-vite'
import { Alert, AlertTitle } from './alert'
import { DiffBar, type DiffBarProps } from './diff-bar'

const meta: Meta<DiffBarProps> = {
  title: 'UI/Data/Diff Bar',
  component: DiffBar,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Two values of one measure, A against B, as a diverging bar: each side grows out from a shared center toward its own end, in cells, with the values in mono at the outer ends. The better side (higher or lower, per `better`) is lit in `tone` and its value in ink. `diffWinner(a, b, better)` gives the same verdict for your own chips. The cells light outward from the center as the bar scrolls into view; screen readers hear both values, then the verdict. Reduced motion: drawn at once.',
      },
    },
  },
  argTypes: {
    better: { control: 'inline-radio', options: ['higher', 'lower'] },
    tone: { control: 'select', options: ['accent', 'success', 'chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5'] },
    segments: { control: { type: 'number', min: 0, max: 30 } },
    layout: { control: 'inline-radio', options: ['diverging', 'stacked'] },
  },
  args: { a: 91.2, b: 92.4, label: 'Accuracy', format: { style: 'unit', unit: 'percent', maximumFractionDigits: 1 }, better: 'higher', segments: 14 },
}
export default meta
type Story = StoryObj<DiffBarProps>

export const Playground: Story = {
  render: (args) => (
    <div className="w-[32rem] max-w-[calc(100vw-2rem)]">
      <DiffBar {...args} />
    </div>
  ),
}

const ROWS: DiffBarProps[] = [
  { label: 'Accuracy', a: 91.2, b: 92.4, format: { style: 'unit', unit: 'percent', maximumFractionDigits: 1 } },
  { label: 'Latency p95', a: 1840, b: 910, better: 'lower', format: { style: 'unit', unit: 'millisecond' } },
  { label: 'Cost / 1K runs', a: 4.1, b: 1.35, better: 'lower', format: { style: 'currency', currency: 'USD' } },
  { label: 'Faithfulness', a: 88.4, b: 86.9, format: { style: 'unit', unit: 'percent', maximumFractionDigits: 1 } },
  { label: 'Toxicity', a: 0.4, b: 0.4, better: 'lower', format: { style: 'unit', unit: 'percent', maximumFractionDigits: 1 } },
]

/** A comparison table: lower-is-better rows light the smaller side, and a tie lights neither. */
export const Comparison: Story = {
  render: () => (
    <div className="flex w-[34rem] max-w-[calc(100vw-2rem)] flex-col gap-5 rounded-2xl border border-line bg-surface p-5">
      {ROWS.map((row) => (
        <DiffBar key={String(row.label)} {...row} />
      ))}
    </div>
  ),
}

/** Solid bars instead of cells, in a chart color. */
export const Solid: Story = { args: { segments: 0, tone: 'chart-3' }, render: Playground.render }

const USD: Intl.NumberFormatOptions = { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }

/** Stacked: what the agreement allows against what the vendor quoted, on one scale; past the allowance the quote turns danger. */
export const AllowanceCheck: Story = {
  name: 'Allowed against quoted',
  render: () => (
    <div className="flex w-[30rem] max-w-[calc(100vw-2rem)] flex-col gap-4 rounded-2xl border border-line bg-surface p-5">
      <DiffBar
        layout="stacked"
        label="Increase for next year"
        names={['Allowed', 'Quoted']}
        a={18_000}
        b={31_500}
        better="lower"
        segments={0}
        format={USD}
        by="$13,500"
      />
      <Alert variant="danger">
        <AlertTitle>The quote is $13,500 over the allowance. Push back before the notice date.</AlertTitle>
      </Alert>
    </div>
  ),
}

/** Stacked in cells: the same check counted out, the overage as the danger cells past the allowance. */
export const StackedCells: Story = {
  name: 'Stacked, in cells',
  args: { layout: 'stacked', names: ['Allowed', 'Quoted'], a: 18_000, b: 31_500, better: 'lower', label: 'Increase for next year', format: USD, segments: 24, by: '$13,500' },
  render: Playground.render,
}
