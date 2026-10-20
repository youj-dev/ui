import type { Meta, StoryObj } from '@storybook/react-vite'
import { Showroom } from './stories/showroom'
import { MiniatureUpsCabinet, upsCabinet } from './ups-cabinet'

const meta = {
  title: 'Miniatures/UPS cabinet',
  component: MiniatureUpsCabinet,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof MiniatureUpsCabinet>

export default meta
type Story = StoryObj<typeof meta>

/** As the showroom presents it: the stage, the miniature, and the caption rendered from its metadata and readout. */
export const Default: Story = {
  render: (args) => <Showroom meta={upsCabinet} mode={args.mode} render={(p) => <MiniatureUpsCabinet {...args} {...p} />} />,
}

export const Light: Story = { ...Default, args: { mode: 'light' } }
export const Dark: Story = { ...Default, args: { mode: 'dark' } }

/** A still picture: no focus, no keys, no pointer. */
export const Still: Story = { args: { interactive: false, size: 360, stage: true } }
