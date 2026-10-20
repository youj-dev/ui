import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Specimen } from '../../stories/kit'
import { CapsuleStepper } from './capsule-stepper'

const meta: Meta<typeof CapsuleStepper> = {
  title: 'UI/Capsules/Capsule Stepper',
  component: CapsuleStepper,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '− value + in a capsule, for a number you nudge more than type. Base UI’s NumberField underneath: Intl parsing and formatting in the locale, min/max clamping, step and largeStep (Shift+arrows), press-and-hold repeat, typing, and discs that disable at the ends. Each step rolls the number in from the side it moved on the snappy spring, clipped to its window, so a held button reads as a counter spinning. Reduced motion: the number changes in place.',
      },
    },
  },
  args: { label: 'Tempo', defaultValue: 124, min: 60, max: 200, unit: 'BPM' },
}
export default meta
type Story = StoryObj<typeof CapsuleStepper>

/** Press and hold + to spin the tempo up; Shift+ArrowUp jumps by ten. */
export const Hero: Story = {}

function Zoom() {
  const [zoom, setZoom] = useState<number | null>(1)
  return <CapsuleStepper aria-label="Zoom" value={zoom} onValueChange={setZoom} min={0.25} max={4} step={0.25} largeStep={1} format={{ style: 'percent' }} />
}

export const Variants: Story = {
  render: () => (
    <div className="grid gap-6">
      <Specimen label="percent, controlled, no label">
        <Zoom />
      </Specimen>
      <Specimen label="size sm, at its max">
        <CapsuleStepper size="sm" label="Takes" defaultValue={8} min={1} max={8} />
      </Specimen>
      <Specimen label="disabled">
        <CapsuleStepper label="Swing" defaultValue={54} unit="%" disabled />
      </Specimen>
    </div>
  ),
}
