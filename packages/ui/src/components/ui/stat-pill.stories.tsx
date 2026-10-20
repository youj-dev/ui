import { useEffect, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { ActivityIcon, CpuIcon, FilmIcon, HardDriveIcon } from '@youj/icons'
import { StatPill } from './stat-pill'

const meta: Meta<typeof StatPill> = {
  title: 'UI/Capsules/Stat Pill',
  component: StatPill,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'One live figure in a capsule: an icon in a recessed disc, its name as a mono eyebrow, the value in mono with its unit small and muted, then how it moves, a delta (an arrow and the change, tinted by `better`: a fall in latency is good) or a word-sized trend with a dot on the latest reading. A new value counts to itself (Counter) and the trend morphs point by point; the first render is still. Reduced motion: values land at once. The delta’s direction is spoken (“Up 4.2”), not left to color.',
      },
    },
  },
  args: { label: 'DSP', value: 38, unit: '%', delta: 4.2 },
}
export default meta
type Story = StoryObj<typeof StatPill>

function Live() {
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1600)
    return () => clearInterval(id)
  }, [])
  const wave = (i: number, base: number, swing: number) => Math.round(base + Math.sin((tick + i) * 1.3) * swing)
  const dsp = Array.from({ length: 8 }, (_, i) => wave(i, 36, 9))
  const latency = wave(3, 11, 3)
  return (
    <div className="flex flex-wrap items-center gap-2">
      <StatPill label="DSP" icon={<CpuIcon />} value={dsp[dsp.length - 1]!} unit="%" trend={dsp} />
      <StatPill label="Latency" icon={<ActivityIcon />} value={latency} unit="ms" delta={latency - wave(2, 11, 3)} better="down" />
      <StatPill label="Frames" icon={<FilmIcon />} value={24} unit="fps" />
      <StatPill label="Cache" icon={<HardDriveIcon />} value={2.4} format={{ maximumFractionDigits: 1 }} unit="GB" delta={0.3} />
    </div>
  )
}

/** A render session’s vitals, updating every 1.6 s: values count to themselves and the trend’s dot glides to each new reading. Lower latency is tinted good. */
export const Hero: Story = { render: () => <Live /> }

export const Playground: Story = {}

/** `better="down"`: for latency and errors, a fall is the good news. A zero change reads “No change”. */
export const Deltas: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <StatPill label="Errors" value={3} delta={-2} better="down" />
      <StatPill label="Queue" value={18} delta={6} better="down" />
      <StatPill label="Uptime" value={0.9991} format={{ style: 'percent', maximumFractionDigits: 2 }} delta={0} />
      <StatPill size="sm" label="Plays" value={48200} format={{ notation: 'compact' }} delta={12} deltaFormat={{ style: 'unit', unit: 'percent' }} />
    </div>
  ),
}
