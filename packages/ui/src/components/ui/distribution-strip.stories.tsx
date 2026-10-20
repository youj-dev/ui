import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { DistributionStrip, type DistributionStripProps } from './distribution-strip'
import { SegmentedControl, SegmentedControlItem } from './segmented-control'

/** Latencies in ms, log-normal around `median` with a slow tail, from a fixed seed so every visit draws the same swarm. */
function sample(count: number, median: number, spread: number, tail: number, seed: number) {
  let t = seed
  const random = () => {
    t = (t + 0x6d2b79f5) | 0
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
  const normal = () => Math.sqrt(-2 * Math.log(1 - random())) * Math.cos(2 * Math.PI * random())
  return Array.from({ length: count }, () => {
    const slow = random() < tail
    return Math.round(Math.exp(Math.log(slow ? median * 5 : median) + normal() * (slow ? spread * 1.4 : spread)) * 10) / 10
  })
}

const STEADY = sample(420, 88, 0.42, 0.04, 7)
const REGRESSED = sample(420, 132, 0.5, 0.09, 11)

const meta: Meta<DistributionStripProps> = {
  title: 'UI/Data/Distribution Strip',
  component: DistributionStrip,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'How sampled requests spread across latency: every sample is a dot on a log-scaled strip, stacked into rows where they crowd, with the percentiles (p50, p90 and p99 by default) as flagged hairlines and the objective as a dashed line; past it the strip is hatched and its dots take the warning tone. The header gives the share within the objective. Flags that would collide spread apart and stay inside the strip. When it scrolls into view the dots rise in a quick wave along the axis and the markers glide in on the smooth spring; new samples morph the swarm (dots are matched by rank, so each quantile slides to its new place) while the share counts. A figure described by a text summary; the dots are decorative. Reduced motion: drawn in place, new samples land at once.',
      },
    },
  },
  args: { samples: STEADY, slo: 300, label: 'checkout-api · last 24h' },
  argTypes: {
    samples: { control: false },
    slo: { control: { type: 'number', min: 1 } },
    rows: { control: { type: 'range', min: 1, max: 15, step: 2 } },
  },
}
export default meta
type Story = StoryObj<DistributionStripProps>

const frame = 'w-[min(44rem,calc(100vw-2rem))] rounded-xl border border-line bg-surface p-5 sm:p-6'

export const Playground: Story = {
  name: 'Request latency',
  render: (args) => (
    <div className={frame}>
      <DistributionStrip {...args} />
    </div>
  ),
}

/** Switch the window: the swarm morphs to the new distribution, the markers glide and the share counts. */
export const DataChange: Story = {
  name: 'Data change',
  render: function Render(args) {
    const [window, setWindow] = useState('steady')
    return (
      <div className={`${frame} flex flex-col gap-5`}>
        <SegmentedControl aria-label="Window" value={window} onValueChange={setWindow} className="self-start">
          <SegmentedControlItem value="steady">Before deploy</SegmentedControlItem>
          <SegmentedControlItem value="regressed">After deploy</SegmentedControlItem>
        </SegmentedControl>
        <DistributionStrip {...args} samples={window === 'steady' ? STEADY : REGRESSED} />
      </div>
    )
  },
}

/** Other percentiles, and no objective: the dots stay in the neutral ink and the header has no share. */
export const Percentiles: Story = {
  args: { slo: undefined, percentiles: [75, 95, 99.9], label: 'search-api · p75, p95, p99.9' },
  render: (args) => (
    <div className={frame}>
      <DistributionStrip {...args} />
    </div>
  ),
}

/** On a phone: the flags spread apart and stay inside the strip. */
export const Narrow: Story = {
  render: (args) => (
    <div className="w-[22rem] rounded-xl border border-line bg-surface p-4">
      <DistributionStrip {...args} />
    </div>
  ),
}

export const Empty: Story = {
  args: { samples: [] },
  render: (args) => (
    <div className={frame}>
      <DistributionStrip {...args} />
    </div>
  ),
}
