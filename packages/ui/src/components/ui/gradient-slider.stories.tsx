import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Specimen } from '../../stories/kit'
import { GradientSlider } from './gradient-slider'

const meta: Meta<typeof GradientSlider> = {
  title: 'UI/Inputs/Gradient Slider',
  component: GradientSlider,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A value on a spectrum. The track is a gradient from the theme’s own tokens, lit up to the thumb and dimmed past it: `spectrum` (the default) is the chart palette from cool to warm, with no judgment in it; `accent` runs the accent from faint to full; `status` (success, warning, danger) is only for a scale whose far end really is a risk. The rail spans the thumb’s travel, so the colors, the ruler and the zones share one scale. The thumb is a glass capsule that carries the value in mono and glows in the color beneath it; a ruler runs under the track with the zone edges as major ticks, and the zones name the stretch the value sits in, the current one lit. Base UI’s Slider underneath: arrows step, Page Up/Down and Shift+arrows take large steps, Home/End jump, and the value is spoken with its zone (“0.65, Balanced”). Direct manipulation, so the thumb never eases; the glass swells a touch while held or focused. Reduced motion: no swell. With sound on, crossing into another zone plays `tick`.',
      },
    },
  },
  args: {
    label: 'Creativity',
    min: 0,
    max: 1.5,
    step: 0.05,
    defaultValue: 0.65,
    zones: [
      { label: 'Literal', to: 0.4 },
      { label: 'Balanced', to: 0.9 },
      { label: 'Inventive' },
    ],
    tone: 'spectrum',
    ticks: 15,
  },
  argTypes: {
    tone: { control: 'inline-radio', options: ['spectrum', 'accent', 'status'] },
    ticks: { control: { type: 'number', min: 0, max: 30 } },
  },
  decorators: [
    (Story) => (
      <div className="w-[min(30rem,calc(100vw-2rem))]">
        <Story />
      </div>
    ),
  ],
}
export default meta
type Story = StoryObj<typeof GradientSlider>

/** A model’s creativity: drag the glass, click the track, or tab in and use the arrow keys. Cross a zone edge and its name lights. */
export const Hero: Story = {}

function Controlled() {
  const [value, setValue] = useState(62)
  return (
    <div className="flex flex-col gap-3">
      <GradientSlider
        label="Glow intensity"
        tone="accent"
        value={value}
        onValueChange={setValue}
        zones={[{ label: 'Subtle', to: 33 }, { label: 'Present', to: 66 }, { label: 'Vivid' }]}
      />
      <p className="font-mono text-ui-sm text-fg-muted tabular-nums">value = {value}</p>
    </div>
  )
}

/** `tone="accent"`: the accent from faint to full, for a quantity with no temperature to it. Controlled. */
export const Accent: Story = { render: () => <Controlled /> }

export const Variants: Story = {
  render: () => (
    <div className="grid gap-10">
      <Specimen label="no zones, no ruler">
        <GradientSlider aria-label="Warmth" defaultValue={40} ticks={0} />
      </Specimen>
      <Specimen label="tone=status: a real risk scale">
        <GradientSlider label="Auto-merge threshold" tone="status" defaultValue={0.2} min={0} max={1} step={0.01} format={{ style: 'percent' }} zones={[{ label: 'Reviewed', to: 0.3 }, { label: 'Sampled', to: 0.7 }, { label: 'Unchecked' }]} />
      </Specimen>
      <Specimen label="percent format">
        <GradientSlider label="Risk appetite" defaultValue={0.3} min={0} max={1} step={0.01} format={{ style: 'percent' }} zones={[{ label: 'Cautious', to: 0.35 }, { label: 'Measured', to: 0.7 }, { label: 'Bold' }]} />
      </Specimen>
      <Specimen label="disabled">
        <GradientSlider label="Creativity" disabled defaultValue={0.9} min={0} max={1.5} step={0.05} zones={[{ label: 'Literal', to: 0.4 }, { label: 'Balanced', to: 0.9 }, { label: 'Inventive' }]} />
      </Specimen>
    </div>
  ),
}
