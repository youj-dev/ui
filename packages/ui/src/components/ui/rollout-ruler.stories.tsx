import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from './button'
import { RolloutRuler, type RolloutRulerProps } from './rollout-ruler'

const meta: Meta<RolloutRulerProps> = {
  title: 'UI/Inputs/Rollout Ruler',
  component: RolloutRuler,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'How far a feature has rolled out, on a ruled track cut into its stages (Internal 1%, Beta 5%, 10%, 50%, GA 100% by default), each an equal stretch so the early cohorts get room; the axis says what each gate is worth. The playhead snaps gate to gate: drag it, press anywhere on the ruler, or use the arrow keys, Page keys, Home and End. Ticks already rolled out light in `tone`, the stretch to the next gate is a runway at a third of it. A step you take snaps on the snappy spring; a change from outside (a kill switch) sweeps tick by tick at a constant rate. `readOnly` makes it a meter and `size="sm"` the bare track for a list row. Reduced motion: drawn at its value; changes jump.',
      },
    },
  },
  args: { defaultValue: 10, label: 'Rolled out to' },
}
export default meta
type Story = StoryObj<RolloutRulerProps>

const frame = 'w-[min(40rem,calc(100vw-2rem))] rounded-xl border border-line bg-surface p-5'

export const Playground: Story = {
  render: (args) => (
    <div className={frame}>
      <RolloutRuler {...args} />
    </div>
  ),
}

/** A kill switch sets the value from outside: the ruler sweeps back to zero in the danger tone. */
export const KillSwitch: Story = {
  name: 'Kill switch',
  render: function Render(args) {
    const [value, setValue] = useState(50)
    const [killed, setKilled] = useState<number | null>(null)
    return (
      <div className={`${frame} flex flex-col gap-4`}>
        <RolloutRuler {...args} value={value} onValueChange={setValue} tone={killed !== null ? 'danger' : 'accent'} />
        <Button
          variant={killed !== null ? 'secondary' : 'danger'}
          className="self-start"
          onClick={() => {
            if (killed !== null) {
              setValue(killed)
              setKilled(null)
            } else {
              setKilled(value)
              setValue(0)
            }
          }}
        >
          {killed !== null ? `Restore ${killed}%` : 'Kill switch'}
        </Button>
      </div>
    )
  },
}

/** Stages of your own: a canary at 0.5% and a staff cohort. */
export const CustomStages: Story = {
  name: 'Custom stages',
  args: {
    defaultValue: 2,
    stages: [
      { value: 0.5, label: 'Canary' },
      { value: 2, label: 'Staff' },
      { value: 25, label: '25%' },
      { value: 100, label: 'All' },
    ],
  },
  render: (args) => (
    <div className={frame}>
      <RolloutRuler {...args} />
    </div>
  ),
}

/** Read-only, as a meter; and the bare `sm` track for list rows. */
export const Meters: Story = {
  render: () => (
    <div className={`${frame} flex flex-col gap-6`}>
      <RolloutRuler readOnly value={50} label="semantic-search" />
      <div className="flex flex-col gap-3">
        {[
          ['checkout-v2', 10],
          ['inbox-summaries', 5],
          ['usage-billing', 1],
          ['edge-cache', 100],
        ].map(([key, value]) => (
          <div key={key} className="grid grid-cols-[9rem_minmax(0,1fr)_3rem] items-center gap-4 font-mono text-ui">
            <span className="truncate">{key}</span>
            <RolloutRuler readOnly size="sm" value={value as number} label={key as string} />
            <span className="text-end tabular-nums">{value}%</span>
          </div>
        ))}
      </div>
    </div>
  ),
}

export const Disabled: Story = {
  args: { disabled: true },
  render: (args) => (
    <div className={frame}>
      <RolloutRuler {...args} />
    </div>
  ),
}
