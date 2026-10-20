import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { LimitMeter, type LimitMeterProps } from './limit-meter'
import { Button } from './button'

const EUR = { style: 'currency', currency: 'EUR' } as const

const meta: Meta<LimitMeterProps> = {
  title: 'UI/Data/Limit Meter',
  component: LimitMeter,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A budget read like an instrument (`role="meter"`): what is left, large, with its decimals quiet; the spent and the limit as a quiet readout under it; and a ruler of minor and major ticks from zero to the limit, with an index caret under it at the spend and named lines for policies such as a freeze. Spent ticks are lit in `tone`, the stretch still to go before a marker takes the marker’s tone (the runway to it), and ticks past the last marker are dim. When it scrolls into view the spend sweeps up from zero at a constant rate with the caret riding the front; a new spend or limit sweeps on from where the caret is. Reduced motion: drawn at its value.',
      },
    },
  },
  argTypes: {
    spent: { control: { type: 'range', min: 0, max: 2600, step: 20 } },
    limit: { control: { type: 'range', min: 500, max: 4000, step: 100 } },
    ticks: { control: { type: 'range', min: 10, max: 80, step: 5 } },
    tone: { control: 'select', options: ['success', 'accent', 'warning', 'danger', 'neutral'] },
  },
  args: { spent: 1240, limit: 2000, format: EUR, markers: [{ value: 1800, label: 'freeze', tone: 'warning' }], label: 'Card limit' },
  decorators: [(Story) => <div className="w-[36rem] max-w-full">{Story()}</div>],
}
export default meta
type Story = StoryObj<LimitMeterProps>

/** A card a little past half spent: the runway to the freeze glows amber ahead of the spend. */
export const Hero: Story = {
  render: (args) => (
    <div className="rounded-xl border border-line bg-surface p-6">
      <LimitMeter {...args} />
    </div>
  ),
}

export const Playground: Story = { name: 'Spend limit' }

/** Charge and raise the limit: the caret and the lit ticks sweep on from where they are. Past the freeze the ticks turn its tone; past the limit the headline turns to what's over. */
export const Live: Story = {
  name: 'Live spend',
  render: function Render(args) {
    const [spent, setSpent] = useState(1240)
    const [limit, setLimit] = useState(2000)
    return (
      <div className="flex flex-col gap-5">
        <LimitMeter {...args} spent={spent} limit={limit} />
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => setSpent((s) => s + 180)}>
            Charge €180
          </Button>
          <Button size="sm" variant="outline" onClick={() => setLimit((l) => l + 250)}>
            Raise limit €250
          </Button>
          <Button size="sm" variant="ghost" onClick={() => (setSpent(1240), setLimit(2000))}>
            Reset
          </Button>
        </div>
      </div>
    )
  },
}

/** Past a marker and past the limit: the spent ticks beyond the freeze take its tone, and the headline shows what's over. */
export const OverLimit: Story = {
  name: 'Over the limit',
  args: { spent: 2080, markers: [{ value: 1600, label: 'notify', tone: 'warning' }, { value: 1800, label: 'freeze', tone: 'danger' }] },
}

/** A different scale: fewer ticks, no markers, the accent for the spend. */
export const Compact: Story = {
  args: { spent: 3720, limit: 6000, ticks: 20, majorEvery: 5, markers: [], tone: 'accent', format: { style: 'currency', currency: 'CHF' }, locale: 'de-CH' },
}

/** Reduced motion draws the ruler at its value; the amounts, the markers and the remainder are all spoken. */
export const ReducedMotion: Story = {
  name: 'Reduced motion',
  parameters: { docs: { description: { story: 'Set the toolbar’s Motion to reduced: the ruler is drawn at its value and changes jump.' } } },
}
