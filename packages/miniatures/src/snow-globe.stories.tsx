import type { Meta, StoryObj } from '@storybook/react-vite'
import { Showroom } from './stories/showroom'
import { MiniatureSnowGlobe, snowGlobe } from './snow-globe'

const meta = {
  title: 'Miniatures/Snow globe',
  component: MiniatureSnowGlobe,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof MiniatureSnowGlobe>

export default meta
type Story = StoryObj<typeof meta>

/** As the showroom presents it: the stage, the miniature, and the caption rendered from its metadata and readout. */
export const Default: Story = {
  render: (args) => <Showroom meta={snowGlobe} mode={args.mode} render={(p) => <MiniatureSnowGlobe {...args} {...p} />} />,
}

export const Light: Story = { ...Default, args: { mode: 'light' } }
export const Dark: Story = { ...Default, args: { mode: 'dark' } }

/** A still picture: no focus, no keys, no pointer. */
export const Still: Story = { args: { interactive: false, size: 360, stage: true } }
