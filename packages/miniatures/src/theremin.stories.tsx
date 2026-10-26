import type { Meta, StoryObj } from '@storybook/react-vite'
import { Showroom } from './stories/showroom'
import { MiniatureTheremin, theremin } from './theremin'

const meta = {
  title: 'Miniatures/Theremin',
  component: MiniatureTheremin,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof MiniatureTheremin>

export default meta
type Story = StoryObj<typeof meta>

/** As the showroom presents it: the stage, the miniature, and the caption rendered from its metadata and readout. */
export const Default: Story = {
  render: (args) => <Showroom meta={theremin} mode={args.mode} render={(p) => <MiniatureTheremin {...args} {...p} />} />,
}

export const Light: Story = { ...Default, args: { mode: 'light' } }
export const Dark: Story = { ...Default, args: { mode: 'dark' } }

/** A still picture: no focus, no keys, no pointer. */
export const Still: Story = { args: { interactive: false, size: 360, stage: true } }
