import type { Meta, StoryObj } from '@storybook/react-vite'
import { MiniatureServerCabinet, serverCabinet } from './server-cabinet'
import { Showroom } from './stories/showroom'

const meta = {
  title: 'Miniatures/Server cabinet',
  component: MiniatureServerCabinet,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof MiniatureServerCabinet>

export default meta
type Story = StoryObj<typeof meta>

/** As the showroom presents it: the stage, the miniature, and the caption rendered from its metadata and readout. Press N: its own stage goes dark with the room. */
export const Default: Story = {
  render: (args) => <Showroom meta={serverCabinet} mode={args.mode} render={(p) => <MiniatureServerCabinet {...args} {...p} />} />,
}

export const Light: Story = { ...Default, args: { mode: 'light' } }
export const Dark: Story = { ...Default, args: { mode: 'dark' } }

/** A still picture: no focus, no keys, no pointer. */
export const Still: Story = { args: { interactive: false, size: 360, stage: true } }

/** `autoPlay={false}`: its first frame, then still until someone clicks it or presses a key on it, as a gallery of many would want. */
export const WaitsForYou: Story = { ...Default, args: { autoPlay: false } }
