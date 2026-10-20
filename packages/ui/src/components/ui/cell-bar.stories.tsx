import type { Meta, StoryObj } from '@storybook/react-vite'
import { CellBar, type CellBarCell } from './cell-bar'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
/** A made-up bakery's flour bill a month: nine settled, three forecast. */
const cellsOf = (values: number[], settled = 9): CellBarCell[] => values.map((value, i) => ({ label: MONTHS[i]!, value, projected: i >= settled }))
const usd = (v: number) => `$${Math.round(v).toLocaleString('en-US')}`

const meta: Meta<typeof CellBar> = {
  title: 'UI/Data/Cell Bar',
  component: CellBar,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A total built from its periods: a cell per month, each as wide as its amount, solid when settled and hatched when projected. Bars that compare share `max`; a `target` is a dashed tick on the same scale. One tab stop: the arrows walk the cells and focus or hover shows each one. The cells open from the start as the bar scrolls into view. Reduced motion: drawn at its values.',
      },
    },
  },
  args: { cells: cellsOf([310, 320, 340, 360, 390, 420, 460, 500, 540, 560, 590, 620]), formatValue: usd, label: 'Flour, 2026' },
  argTypes: { cells: { control: false } },
  decorators: [
    (Story) => (
      <div className="w-120 max-w-full">
        <Story />
      </div>
    ),
  ],
}
export default meta
type Story = StoryObj<typeof CellBar>

export const Default: Story = {}

/** Three bars on one scale, each with its plan as a dashed tick: the first runs past its plan, the second shrinks under it. */
export const Compare: Story = {
  render: () => (
    <div className="grid grid-cols-[6rem_minmax(0,1fr)] items-center gap-x-3 gap-y-3 text-ui">
      <span className="text-fg-muted">Flour</span>
      <CellBar cells={cellsOf([310, 320, 340, 360, 390, 420, 460, 500, 540, 560, 590, 620])} max={6000} target={4800} tone="warning" formatValue={usd} label="Flour" />
      <span className="text-fg-muted">Butter</span>
      <CellBar cells={cellsOf([420, 410, 390, 360, 330, 300, 280, 270, 260, 255, 250, 245])} max={6000} target={4400} tone="success" formatValue={usd} label="Butter" />
      <span className="text-fg-muted">Sugar</span>
      <CellBar cells={cellsOf([120, 125, 118, 122, 130, 126, 124, 128, 125, 125, 125, 125])} max={6000} target={1500} tone="neutral" formatValue={usd} label="Sugar" />
    </div>
  ),
}

/** Quarters with their labels and amounts under them, the last one forecast, and the year's plan named over its tick. */
export const Captions: Story = {
  args: {
    cells: [
      { label: 'Q1', value: 4180 },
      { label: 'Q2', value: 4620 },
      { label: 'Q3', value: 5240 },
      { label: 'Q4', value: 5710, projected: true },
    ],
    target: 18400,
    targetLabel: 'Plan',
    captions: true,
    tone: 'chart-2',
    label: 'Spend by quarter',
  },
}

/** No cells yet: an empty track. */
export const Empty: Story = { args: { cells: [] } }
