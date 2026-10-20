import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { LayoutGridIcon, LayoutListIcon, KanbanIcon } from '@youj/icons'
import { SegmentedControl, SegmentedControlItem } from './segmented-control'

const meta: Meta<typeof SegmentedControl> = {
  title: 'UI/Primitives/Segmented Control',
  component: SegmentedControl,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'One choice out of a few, always made: plain labels on a hairline, with a 2px accent bar that glides to the pressed segment on the smooth spring and retargets mid-flight (`variant="pill"` makes it a recessed track with a raised key). A thin wrapper over ToggleGroup’s segmented look with a single-string value that never empties. Reduced motion: the bar jumps.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof SegmentedControl>

const TOTALS: Record<string, { visitors: string; change: string }> = {
  '24h': { visitors: '1,284', change: '+4.1%' },
  '7d': { visitors: '9,630', change: '+12.8%' },
  '30d': { visitors: '41,907', change: '+8.3%' },
  '90d': { visitors: '118,442', change: '−2.4%' },
}

/** A range picker in a card header: the number below follows the pressed segment. */
export const Hero: Story = {
  render: () => {
    const [range, setRange] = useState('7d')
    const total = TOTALS[range]!
    return (
      <div className="w-full max-w-[380px] rounded-xl border border-line bg-surface p-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-ui font-medium text-fg">Visitors</h3>
          <SegmentedControl aria-label="Range" size="sm" value={range} onValueChange={setRange}>
            {Object.keys(TOTALS).map((r) => (
              <SegmentedControlItem key={r} value={r}>
                {r}
              </SegmentedControlItem>
            ))}
          </SegmentedControl>
        </div>
        <p className="mt-4 text-3xl font-semibold tracking-tight text-fg tabular-nums">{total.visitors}</p>
        <p className="mt-1 text-ui-sm text-fg-muted tabular-nums">{total.change} vs previous period</p>
      </div>
    )
  },
}

/** Three sizes, each the height of the matching control, so it lines up with inputs and buttons. */
export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-4">
      {(['sm', 'default', 'lg'] as const).map((size) => (
        <SegmentedControl key={size} aria-label={`Plan billing, ${size}`} size={size} defaultValue="monthly">
          <SegmentedControlItem value="monthly">Monthly</SegmentedControlItem>
          <SegmentedControlItem value="yearly">Yearly</SegmentedControlItem>
        </SegmentedControl>
      ))}
    </div>
  ),
}

/** Icon segments are named by their `aria-label`. */
export const Icons: Story = {
  render: () => (
    <SegmentedControl aria-label="Layout" defaultValue="grid">
      <SegmentedControlItem value="grid" aria-label="Grid">
        <LayoutGridIcon size={16} />
      </SegmentedControlItem>
      <SegmentedControlItem value="list" aria-label="List">
        <LayoutListIcon size={16} />
      </SegmentedControlItem>
      <SegmentedControlItem value="board" aria-label="Board">
        <KanbanIcon size={16} />
      </SegmentedControlItem>
    </SegmentedControl>
  ),
}

/** Stretched to its container: the segments share the width. */
export const FullWidth: Story = {
  render: () => (
    <div className="w-[320px]">
      <SegmentedControl aria-label="Theme" defaultValue="system" className="w-full">
        <SegmentedControlItem value="light">Light</SegmentedControlItem>
        <SegmentedControlItem value="dark">Dark</SegmentedControlItem>
        <SegmentedControlItem value="system">System</SegmentedControlItem>
      </SegmentedControl>
    </div>
  ),
}
