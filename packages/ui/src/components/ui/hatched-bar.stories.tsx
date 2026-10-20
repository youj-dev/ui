import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from './button'
import { Hatch, HatchedBar, type HatchedBarProps } from './hatched-bar'

const meta: Meta<HatchedBarProps> = {
  title: 'UI/Data/Hatched Bar',
  component: HatchedBar,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Solid for what is settled, hatched for what isn’t: a baseline, a pending or projected amount, a run that missed its gate. `HatchedBar` is a bar that grows to `value` out of `max`, from the bottom or from the inline start; `Hatch` is the fill alone, for legend swatches and pending segments inside other bars. The hatch is diagonal stripes of the tone over a faint wash of it, in theme tokens. The bar grows on the smooth spring when it scrolls into view and retargets from where it is on a new value; it is a clip, so the stripes never stretch. With `label` it is a `meter`; without, decorative. Reduced motion: drawn at its value; changes jump.',
      },
    },
  },
  argTypes: {
    fill: { control: 'inline-radio', options: ['hatched', 'solid'] },
    orientation: { control: 'inline-radio', options: ['vertical', 'horizontal'] },
    tone: { control: 'select', options: ['neutral', 'accent', 'success', 'warning', 'danger', 'chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5'] },
  },
  args: { value: 0.64, fill: 'hatched', orientation: 'vertical', tone: 'neutral', label: 'Projected usage' },
}
export default meta
type Story = StoryObj<HatchedBarProps>

export const Playground: Story = {
  render: (args) => <HatchedBar {...args} className={args.orientation === 'horizontal' ? 'h-3 w-64' : 'h-32 w-6'} />,
}

const RUNS = [84.1, 86.9, 85.2, 90.4, 88.6, 91.2, 87.9, 90.8, 92.5, 91.7, 90.9, 93.4, 91.1, 94.6]
const THRESHOLD = 90

export const RunsCompared: Story = {
  name: 'Runs against a gate',
  render: function Render() {
    const [runs, setRuns] = useState(RUNS)
    const low = 80
    const scale = (v: number) => (v - low) / (100 - low)
    return (
      <div className="flex w-[min(34rem,calc(100vw-2rem))] flex-col gap-3 rounded-xl border border-line bg-surface p-5 text-ui">
        <div className="flex items-baseline justify-between">
          <span className="text-fg-muted">Pass rate · last {runs.length} runs</span>
          <span className="font-mono text-ui-sm text-fg-muted">gate {THRESHOLD}%</span>
        </div>
        <div className="relative h-32">
          <div aria-hidden className="absolute inset-x-0 border-t border-dashed border-success" style={{ bottom: `${scale(THRESHOLD) * 100}%` }} />
          <div className="absolute inset-0 flex items-end gap-2">
            {runs.map((rate, i) => {
              const last = i === runs.length - 1
              return (
                <HatchedBar
                  key={i}
                  value={scale(rate)}
                  fill={rate < THRESHOLD ? 'hatched' : 'solid'}
                  tone={last ? 'success' : 'neutral'}
                  label={`Run ${i + 1}: ${rate}%`}
                  valueText={`${rate}%`}
                  className="h-full w-auto flex-1"
                />
              )
            })}
          </div>
        </div>
        <div className="flex items-center gap-4 text-ui-sm text-fg-muted">
          <span className="flex items-center gap-1.5">
            <Hatch className="size-3" /> Below the gate
          </span>
          <span className="flex items-center gap-1.5">
            <span aria-hidden className="size-3 rounded-[2px] bg-well" /> Passed
          </span>
          <span className="flex items-center gap-1.5">
            <span aria-hidden className="size-3 rounded-[2px] bg-success" /> Latest
          </span>
          <Button variant="outline" size="xs" className="ms-auto" onClick={() => setRuns((r) => r.map((v) => Math.round((v + (Math.random() - 0.5) * 6) * 10) / 10))}>
            New runs
          </Button>
        </div>
      </div>
    )
  },
}

export const PendingSegment: Story = {
  name: 'Pending segment',
  render: () => (
    <div className="flex w-80 flex-col gap-2 text-ui">
      <div className="flex justify-between">
        <span>Quota</span>
        <span className="font-mono text-fg-muted tabular-nums">348 / 400 GB</span>
      </div>
      {/* Used is solid; what a cleanup would free is hatched inside it. */}
      <div aria-hidden className="flex h-2.5 overflow-hidden rounded-xs bg-well">
        <span className="bg-accent" style={{ width: `${(230 / 400) * 100}%` }} />
        <Hatch tone="accent" className="rounded-none" style={{ width: `${(118 / 400) * 100}%` }} />
      </div>
      <p className="text-ui-sm text-fg-muted">118 GB is set to be freed.</p>
    </div>
  ),
}

export const Horizontal: Story = {
  render: () => (
    <div className="flex w-72 flex-col gap-3">
      <HatchedBar value={0.72} orientation="horizontal" fill="solid" tone="accent" label="Actual" className="h-3" />
      <HatchedBar value={0.9} orientation="horizontal" tone="accent" label="Forecast" className="h-3" />
      <HatchedBar value={0.55} orientation="horizontal" tone="neutral" label="Baseline" className="h-3" />
    </div>
  ),
}
