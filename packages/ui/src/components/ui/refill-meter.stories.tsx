import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { RefillMeter, type RefillMeterProps } from './refill-meter'
import { Button } from './button'

const meta: Meta<RefillMeterProps> = {
  title: 'UI/Data/Refill Meter',
  component: RefillMeter,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A rate limit’s token bucket as cells you can count: one per token (or a share of the capacity), lit while the token is in the bucket. Give it the level you measured (`value`, at `updatedAt`), the `capacity` and the `refillRate`, and it refills on its own between updates: the edge cell charges from its foot as the next token accrues, then locks in. A spend drains the cells from the edge inward at a constant rate, and a new value mid-drain carries on from where the edge is. `burst` marks the room a client should keep for its largest batch; under it the cells turn amber, and an empty bucket tints the track danger. The refill clock follows the time scale and pauses off screen, in a hidden tab and while full. Reduced motion: the bucket still refills, a whole token at a time, and cells change in place.',
      },
    },
  },
  args: { value: 38, capacity: 60, refillRate: 10, burst: 20, label: 'Tokens' },
  argTypes: {
    value: { control: { type: 'range', min: 0, max: 60, step: 1 } },
    capacity: { control: { type: 'number', min: 1 } },
    refillRate: { control: { type: 'number', min: 0, step: 0.5 } },
    burst: { control: { type: 'number', min: 0 } },
    segments: { control: { type: 'number', min: 1, max: 120 } },
  },
}
export default meta
type Story = StoryObj<RefillMeterProps>

/** Spend tokens and watch the bucket drain, then earn them back at the refill rate. */
export const Live: Story = {
  render: function Render(args) {
    const [bucket, setBucket] = useState({ value: args.value, at: undefined as number | undefined })
    // The level now: the last measurement plus the refill since, as a gateway would report it.
    const levelNow = () =>
      Math.min(args.capacity, bucket.value + ((args.refillRate ?? 0) * (bucket.at ? Date.now() - bucket.at : 0)) / 1000)
    const spend = (n: number) => {
      const level = levelNow()
      setBucket({ value: Math.max(0, level - n), at: Date.now() })
    }
    return (
      <div className="flex w-[min(34rem,calc(100vw-2rem))] flex-col gap-5 rounded-xl border border-line bg-surface p-5">
        <RefillMeter {...args} value={bucket.value} updatedAt={bucket.at} />
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={() => spend(5)}>
            Spend 5
          </Button>
          <Button variant="secondary" size="sm" onClick={() => spend(25)}>
            Spend 25
          </Button>
          <Button variant="secondary" size="sm" onClick={() => spend(args.capacity)}>
            Empty it
          </Button>
        </div>
      </div>
    )
  },
}

export const Playground: Story = {
  name: 'Rate limit',
  render: (args) => (
    <div className="w-[min(34rem,calc(100vw-2rem))] rounded-xl border border-line bg-surface p-5">
      <RefillMeter {...args} />
    </div>
  ),
}

/** Under the burst marker the lit cells turn amber: a batch of 20 would be partly refused. */
export const UnderBurst: Story = { ...Playground, name: 'Under the burst', args: { value: 12 } }

/** Empty, with no refill: every request is refused. */
export const Empty: Story = { ...Playground, args: { value: 0, refillRate: 0 } }

/** A large bucket: each cell is a share of the capacity, and the edge cell charges by that share. */
export const LargeBucket: Story = { ...Playground, name: 'Large bucket', args: { value: 640, capacity: 1000, refillRate: 50, burst: 250, segments: 50 } }
