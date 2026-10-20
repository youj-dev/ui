import type { Meta, StoryObj } from '@storybook/react-vite'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { RipplePond } from './ripple-pond'
import { StoryHero } from './story-hero'

const meta = {
  title: 'Motion/Backgrounds/Ripple Pond',
  component: RipplePond,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A calm dot lattice that behaves like a pond. Moving the pointer drops soft ripples, a press drops a strong one, and an idle field lets a drop fall now and then. Each ring is a travelling wave packet with wavelets trailing it: dots rise and brighten on a crest, sink and dim in the trough. Canvas 2D, dots batched by wave height. Under reduced motion it renders a still pond with two rings caught mid-spread.',
      },
    },
  },
  args: { intensity: 1, speed: 1, spacing: 16, ambient: true, interactive: true },
  argTypes: {
    intensity: { control: { type: 'range', min: 0, max: 1.5, step: 0.05 } },
    speed: { control: { type: 'range', min: 0.2, max: 3, step: 0.1 } },
    spacing: { control: { type: 'range', min: 10, max: 36, step: 1 } },
    ambient: { control: 'boolean' },
    interactive: { control: 'boolean' },
    colors: { control: 'object' },
    className: { control: false },
  },
} satisfies Meta<typeof RipplePond>

export default meta
type Story = StoryObj<typeof meta>

export const Hero: Story = {
  render: (args) => (
    <StoryHero
      background={<RipplePond {...args} />}
      eyebrow="Calm by default"
      title="Every action leaves a ripple"
      body="Move, click, ship. The surface answers each touch and then goes quiet again."
      primary="Make a ripple"
      secondary="Read the docs"
    />
  ),
}

export const Playground: Story = {
  render: (args) => (
    <div className="relative h-screen min-h-[480px]">
      <RipplePond {...args} />
    </div>
  ),
}

export const Still: Story = {
  args: { ambient: false, interactive: false },
  render: Playground.render,
}

export const ReducedMotion: Story = {
  parameters: {
    docs: { description: { story: 'Reduced motion: a still pond with two rings caught mid-spread. The same composition every time; nothing moves and nothing responds.' } },
  },
  render: (args) => (
    <YoujProvider reducedMotion="always">
      <div className="relative h-screen min-h-[480px]">
        <RipplePond {...args} />
      </div>
    </YoujProvider>
  ),
}
