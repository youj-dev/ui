import type { Meta, StoryObj } from '@storybook/react-vite'
import { MiniatureHandheldConsole, handheldConsole } from './handheld-console'
import { Showroom } from './stories/showroom'

const meta = {
  title: 'Miniatures/Handheld game console',
  component: MiniatureHandheldConsole,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof MiniatureHandheldConsole>

export default meta
type Story = StoryObj<typeof meta>

/** As the showroom presents it: the stage, the miniature, and the caption rendered from its metadata and readout. */
export const Default: Story = {
  render: (args) => <Showroom meta={handheldConsole} mode={args.mode} render={(p) => <MiniatureHandheldConsole {...args} {...p} />} />,
}

export const Light: Story = { ...Default, args: { mode: 'light' } }
export const Dark: Story = { ...Default, args: { mode: 'dark' } }

/** A still picture: no focus, no keys, no pointer. */
export const Still: Story = { args: { interactive: false, size: 360, stage: true } }
