import type { Meta, StoryObj } from '@storybook/react-vite'
import type { CSSProperties } from 'react'
import { Showroom } from './stories/showroom'
import { MiniatureTurntable, turntable } from './turntable'

const meta = {
  title: 'Miniatures/Record turntable',
  component: MiniatureTurntable,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof MiniatureTurntable>

export default meta
type Story = StoryObj<typeof meta>

/** As the showroom presents it: the stage, the miniature, and the caption rendered from its metadata and readout. */
export const Default: Story = {
  render: (args) => <Showroom meta={turntable} mode={args.mode} render={(p) => <MiniatureTurntable {...args} {...p} />} />,
}

export const Light: Story = { ...Default, args: { mode: 'light' } }
export const Dark: Story = { ...Default, args: { mode: 'dark' } }

/** A still picture: no focus, no keys, no pointer. */
export const Still: Story = { args: { interactive: false, size: 360, stage: true } }

/** `size` fits each into a square; three on one page run independently (each in its own shadow root). */
export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', alignItems: 'end', gap: 24, padding: 32 }}>
      {[160, 240, 360].map((size) => (
        <MiniatureTurntable key={size} {...args} size={size} stage />
      ))}
    </div>
  ),
}

/** Theming: any token the figure's root declares yields to `--yjm-<token>` set outside it, here the accent its lights and focus ring use. */
export const Accent: Story = {
  args: { size: 420, stage: true, style: { '--yjm-accent': '#e5484d' } as CSSProperties },
}
