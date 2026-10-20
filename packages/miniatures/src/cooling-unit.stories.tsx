import type { Meta, StoryObj } from '@storybook/react-vite'
import { Showroom } from './stories/showroom'
import { MiniatureCoolingUnit, coolingUnit } from './cooling-unit'

const meta = {
  title: 'Miniatures/Precision cooling',
  component: MiniatureCoolingUnit,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof MiniatureCoolingUnit>

export default meta
type Story = StoryObj<typeof meta>

/** As the showroom presents it: the stage, the miniature, and the caption rendered from its metadata and readout. */
export const Default: Story = {
  render: (args) => <Showroom meta={coolingUnit} mode={args.mode} render={(p) => <MiniatureCoolingUnit {...args} {...p} />} />,
}

export const Light: Story = { ...Default, args: { mode: 'light' } }
export const Dark: Story = { ...Default, args: { mode: 'dark' } }

/** A still picture: no focus, no keys, no pointer. */
export const Still: Story = { args: { interactive: false, size: 360, stage: true } }
