import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { Illustration } from '@youj/illustrations'
import { ImageCompare, type ImageCompareProps } from './image-compare'

/** One scene twice: the kit's gray, and the theme's hues. Demo media. */
function Scene({ color }: { color?: boolean }) {
  return (
    <div className="grid size-full place-items-center bg-surface py-6">
      <Illustration scene="design-tools" assemble={false} unit={16} {...(color ? { colors: 'theme' as const } : {})} />
    </div>
  )
}

/** A dusk sky and the same sky graded: two gradients in the theme's roles. Demo media. */
function Sky({ graded }: { graded?: boolean }) {
  const top = graded ? 'var(--color-chart-4)' : 'var(--color-fg-subtle)'
  const mid = graded ? 'var(--color-accent)' : 'var(--color-fg-muted)'
  const low = graded ? 'var(--color-warning)' : 'var(--color-line-strong)'
  return (
    <div className="relative size-full" style={{ background: `linear-gradient(to bottom, ${top}, ${mid} 55%, ${low})` }}>
      <div className="absolute inset-x-0 bottom-0 h-1/3" style={{ background: `color-mix(in oklab, ${top} 40%, var(--color-canvas))` }} />
      <div className="absolute start-[62%] top-[38%] size-12 rounded-full" style={{ background: `color-mix(in oklab, ${low} 60%, var(--color-surface))` }} />
    </div>
  )
}

const meta: Meta<ImageCompareProps> = {
  title: 'UI/Display/Image Compare',
  component: ImageCompare,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Two pictures stacked with a divider between them: `before` shows on the start side (or the top) up to the divider, `after` past it. Drag the handle, or press anywhere to spring the divider there; with `hover` it follows a mouse without a press. The handle is a slider: arrows step by 5, Page Up and Down by 20, Home and End go to the ends, and the value text names how much of each side shows. Motion: a press springs the divider, keys step it on a fast tween, the handle shrinks while held. Reduced motion: the divider is just there. It mirrors in right-to-left.',
      },
    },
  },
  argTypes: {
    orientation: { control: 'inline-radio', options: ['horizontal', 'vertical'] },
    hover: { control: 'boolean' },
    disabled: { control: 'boolean' },
    defaultValue: { control: { type: 'range', min: 0, max: 100 } },
  },
  args: {
    before: <Scene />,
    after: <Scene color />,
    beforeLabel: 'Mono',
    afterLabel: 'Theme',
    orientation: 'horizontal',
    hover: false,
    disabled: false,
    defaultValue: 50,
  },
}
export default meta
type Story = StoryObj<ImageCompareProps>

/** Every prop as a control, with the position it reports. */
export const Playground: Story = {
  render: function Render(args) {
    const [value, setValue] = useState(args.defaultValue ?? 50)
    return (
      <div className="flex w-full max-w-[520px] flex-col gap-3">
        <ImageCompare {...args} key={args.orientation} value={value} onValueChange={setValue} className="aspect-[4/3]" />
        <p className="text-ui-sm text-fg-muted tabular-nums">Position {Math.round(value)}</p>
      </div>
    )
  },
}

/** `orientation="vertical"`: the divider runs across, `before` on top. Up and Down move it. */
export const Vertical: Story = {
  args: { orientation: 'vertical', before: <Sky />, after: <Sky graded />, beforeLabel: 'Original', afterLabel: 'Graded', defaultValue: 40 },
  render: (args) => (
    <div className="w-full max-w-[420px]">
      <ImageCompare {...args} className="aspect-[3/4]" />
    </div>
  ),
}

/** `hover`: the divider follows a mouse across the picture with no press. Touch still drags. */
export const Hover: Story = {
  args: { hover: true, before: <Sky />, after: <Sky graded />, beforeLabel: 'Original', afterLabel: 'Graded' },
  render: (args) => (
    <div className="w-full max-w-[520px]">
      <ImageCompare {...args} className="aspect-video" />
    </div>
  ),
}

/** Reduced motion: dragging is the same, but a press or a key puts the divider there at once, and the held handle shrinks without easing. */
export const ReducedMotion: Story = {
  name: 'Reduced motion',
  render: (args) => (
    <YoujProvider reducedMotion="always">
      <div className="w-full max-w-[520px]">
        <ImageCompare {...args} className="aspect-[4/3]" />
      </div>
    </YoujProvider>
  ),
}
