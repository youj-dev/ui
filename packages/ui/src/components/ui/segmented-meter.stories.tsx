import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from './button'
import { SegmentedMeter, type SegmentedMeterProps, type SegmentedMeterThreshold } from './segmented-meter'
import { UsageByFeature } from './usage-by-feature.fixtures'

const HOT: SegmentedMeterThreshold[] = [
  { value: 80, tone: 'warning', label: 'High' },
  { value: 95, tone: 'danger', label: 'Critical' },
]

const meta: Meta<SegmentedMeterProps> = {
  title: 'UI/Data/Segmented Meter',
  component: SegmentedMeter,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'How full a resource is, in cells you can count (`role="meter"`): a label and its value on one line, a row of discrete cells under them, lit from the inline start. Cells past a threshold light in that band’s tone, so the warning shows exactly where usage crossed the line, and the band’s label is spoken after the value. The cells light one after another at a constant rate, so a fuller meter takes longer to fill; a new value sweeps on from the edge on screen. Reduced motion: lit at once.',
      },
    },
  },
  argTypes: {
    value: { control: { type: 'range', min: 0, max: 100, step: 1 } },
    segments: { control: { type: 'range', min: 8, max: 60, step: 1 } },
    tone: { control: 'select', options: ['neutral', 'accent', 'success', 'warning', 'danger'] },
  },
  args: { label: 'Disk', value: 84, thresholds: HOT },
  decorators: [(Story) => <div className="w-[26rem] max-w-full">{Story()}</div>],
}
export default meta
type Story = StoryObj<SegmentedMeterProps>

/** Three resources on one panel: the cells past 80% light amber on the one running hot. */
export const Hero: Story = {
  render: () => (
    <div className="flex flex-col gap-6 rounded-xl border border-line bg-surface p-6">
      <SegmentedMeter label="Threads" value={47} thresholds={HOT} />
      <SegmentedMeter label="Disk" value={84} thresholds={HOT} />
      <SegmentedMeter label="Backlog" value={870} max={2400} format={{}} thresholds={[{ value: 1900, tone: 'warning' }]} />
    </div>
  ),
}

export const Playground: Story = {}

/** New values sweep from the edge on screen; press quickly and the sweep turns around where it is. */
export const Live: Story = {
  name: 'Live value',
  render: function Render(args) {
    const [value, setValue] = useState(40)
    return (
      <div className="flex flex-col gap-4">
        <SegmentedMeter {...args} value={value} />
        <div className="flex gap-2">
          {[12, 40, 86, 99].map((v) => (
            <Button key={v} size="sm" variant={v === value ? 'secondary' : 'outline'} onClick={() => setValue(v)}>
              {v}%
            </Button>
          ))}
        </div>
      </div>
    )
  },
}

/** Fewer, wider cells for a compact card; a tone for meters that aren't neutral. */
export const Variants: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <SegmentedMeter label="Seats" value={7} max={10} segments={10} format={{}} tone="accent" />
      <SegmentedMeter label="Storage" value={31} segments={24} tone="success" />
      <SegmentedMeter label="Error budget spent" value={97} thresholds={HOT} segments={32} />
      <SegmentedMeter aria-label="Disk" value={54} showValue={false} />
    </div>
  ),
}

const HEALTH: SegmentedMeterThreshold[] = [
  { value: 0, tone: 'danger', label: 'At risk' },
  { value: 40, tone: 'warning', label: 'Watch' },
  { value: 70, tone: 'success', label: 'Healthy' },
]

const WORKSPACES = [
  { name: 'Northline Studio', score: 96 },
  { name: 'Harbor & Pine', score: 52 },
  { name: 'Fieldnote', score: 81 },
  { name: 'Quarry Labs', score: 18 },
  { name: 'Tidewater Co.', score: 67 },
]

/** A score per row as pips, every lit pip in the band the score falls in (`colorBy="value"`), so a column of scores reads by color at a glance. */
export const HealthScores: Story = {
  name: 'Health scores',
  render: () => (
    <div className="flex flex-col rounded-xl border border-line bg-surface">
      {WORKSPACES.map((row) => (
        <div key={row.name} className="flex items-center gap-4 border-b border-line-subtle px-4 py-3 last:border-b-0">
          <span className="min-w-0 flex-1 truncate text-ui">{row.name}</span>
          <span className="w-7 text-end text-ui font-medium tabular-nums">{row.score}</span>
          <SegmentedMeter
            aria-label={`${row.name} health`}
            value={row.score}
            segments={12}
            thresholds={HEALTH}
            colorBy="value"
            showValue={false}
            className="w-36 shrink-0 [&_[data-slot=segmented-meter-cell]]:rounded-full [&_[data-slot=segmented-meter-track]]:h-3 [&_[data-slot=segmented-meter-track]]:gap-1"
          />
        </div>
      ))}
    </div>
  ),
}

/**
 * Credit usage in a dialog: the month's total over a progress bar and when it resets, a filter and a sort over the features,
 * and a tick meter per feature that turns amber from 80% of its limit and red from 95%. The rows sit in a region of fixed height,
 * so filtering never resizes the dialog.
 */
export const UsageByFeatureStory: Story = {
  name: 'Usage by feature',
  decorators: [(Story) => <div className="w-auto">{Story()}</div>],
  render: () => <UsageByFeature defaultOpen />,
}

/** Reduced motion lights the cells at once; the value and its band are still spoken. */
export const ReducedMotion: Story = {
  name: 'Reduced motion',
  parameters: { docs: { description: { story: 'Set the toolbar’s Motion to reduced: the cells are lit at once.' } } },
}
