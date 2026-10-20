import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { CarIcon, CoffeeIcon, GiftIcon, ShoppingCartIcon, TicketIcon } from '@youj/icons'
import { AllocationMeter, type Envelope, type AllocationMeterProps } from './allocation-meter'

const ENVELOPES: Envelope[] = [
  { id: 'groceries', name: 'Groceries', icon: <ShoppingCartIcon />, budget: 520, spent: 402, rollover: 40 },
  { id: 'eating', name: 'Eating out', icon: <CoffeeIcon />, budget: 220, spent: 252 },
  { id: 'fun', name: 'Fun', icon: <TicketIcon />, budget: 160, spent: 71 },
  { id: 'transport', name: 'Transport', icon: <CarIcon />, budget: 120, spent: 103 },
  { id: 'gifts', name: 'Gifts', icon: <GiftIcon />, budget: 80, spent: 12, rollover: 30 },
]

const meta: Meta<AllocationMeterProps> = {
  title: 'UI/Data/Allocation Meter',
  component: AllocationMeter,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Budget envelopes as a rack of cells, one column each, draining from the top as money goes. Rollover sits on top, hatched, and goes first; an envelope spent past empty turns its base the danger tone and drips under it. Drag money from one envelope onto another, or from the keyboard: Space picks it up, the arrows choose where (mirrored in RTL), Up and Down change the amount, Enter moves it and Escape cancels. While money is in hand the source dims the cells it would lose and the target shows the ones it would gain; on the drop a chip carries the amount across and both columns relight from their edges. Every step is announced. Reduced motion: cells light at once and no chip travels.',
      },
    },
  },
  args: { envelopes: ENVELOPES, step: 10 },
}
export default meta
type Story = StoryObj<AllocationMeterProps>

function Rack(args: AllocationMeterProps) {
  const [envelopes, setEnvelopes] = useState(args.envelopes)
  return (
    <div className="w-[40rem] max-w-[calc(100vw-2rem)] rounded-2xl border border-line bg-surface p-6">
      <AllocationMeter
        {...args}
        envelopes={envelopes}
        onMove={(from, to, amount) => setEnvelopes((list) => list.map((e) => (e.id === from ? { ...e, budget: e.budget - amount } : e.id === to ? { ...e, budget: e.budget + amount } : e)))}
      />
    </div>
  )
}

export const Default: Story = { name: 'Budget envelopes', render: (args) => <Rack {...args} /> }

/** Without `onMove` the rack only reads: nothing picks up or drags. */
export const ReadOnly: Story = {
  name: 'Read only',
  render: (args) => (
    <div className="w-[40rem] max-w-[calc(100vw-2rem)] rounded-2xl border border-line bg-surface p-6">
      <AllocationMeter {...args} />
    </div>
  ),
}
