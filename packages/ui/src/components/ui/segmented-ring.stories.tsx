import type { Meta, StoryObj } from '@storybook/react-vite'
import { useEffect, useState } from 'react'
import { Button } from './button'
import { SegmentedRing, type SegmentedRingInterval, type SegmentedRingProps } from './segmented-ring'

const TABATA: SegmentedRingInterval[] = [
  { kind: 'warmup', duration: 60, label: 'Mobility' },
  ...Array.from({ length: 8 }, (_, i) => [
    { kind: 'work', duration: 20, label: i % 2 ? 'Burpees' : 'Jump squats' } as SegmentedRingInterval,
    ...(i < 7 ? [{ kind: 'rest', duration: 10 } as SegmentedRingInterval] : []),
  ]).flat(),
  { kind: 'cooldown', duration: 60, label: 'Stretch' },
]

const meta: Meta<SegmentedRingProps> = {
  title: 'UI/Data/Segmented Ring',
  component: SegmentedRing,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'An interval workout on one dial: every interval an arc as long as it lasts, round the ring clockwise from the top inside a ruler of ten-second ticks. Work, rest, warm-up and cool-down take their own chart colors; intervals behind you are lit, the running one fills with a bright head at its edge, and the ones ahead wait in a dim wash of their color. The center holds the round in big mono, the phase and the time left. It shows `elapsed` and keeps no clock of its own, so pause, skip or rewind by changing it. As an interval starts it plays the notify cue and announces the phase, its length and what follows; the last three seconds tick; the end plays success. Reduced motion: the round changes in place.',
      },
    },
  },
  args: { intervals: TABATA, elapsed: 60 + 3 * 30 + 12 },
}
export default meta
type Story = StoryObj<SegmentedRingProps>

export const Default: Story = {
  name: 'Interval timer',
  render: (args) => (
    <div className="w-80 max-w-[calc(100vw-2rem)]">
      <SegmentedRing {...args} />
    </div>
  ),
}

/** A running clock with Start, Pause and Skip. */
export const Running: Story = {
  render: function Render(args) {
    const total = args.intervals.reduce((sum, i) => sum + i.duration, 0)
    const [t, setT] = useState(55)
    const [running, setRunning] = useState(true)
    useEffect(() => {
      if (!running) return
      const id = setInterval(() => setT((s) => Math.min(total, s + 0.1)), 100)
      return () => clearInterval(id)
    }, [running, total])
    const starts = args.intervals.reduce<number[]>((acc, i) => [...acc, (acc.at(-1) ?? 0) + i.duration], [])
    return (
      <div className="flex w-80 max-w-[calc(100vw-2rem)] flex-col items-center gap-5">
        <SegmentedRing {...args} elapsed={t} />
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setT((s) => starts.find((x) => x > s) ?? total)}>
            Skip
          </Button>
          <Button onClick={() => setRunning((r) => !r)}>{running ? 'Pause' : 'Start'}</Button>
        </div>
      </div>
    )
  },
}

export const Finished: Story = {
  args: { elapsed: 10_000 },
  render: (args) => (
    <div className="w-80 max-w-[calc(100vw-2rem)]">
      <SegmentedRing {...args} />
    </div>
  ),
}
