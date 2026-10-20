import type { Meta, StoryObj } from '@storybook/react-vite'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { MagneticField } from './magnetic-field'
import { StoryHero } from './story-hero'

const meta = {
  title: 'Motion/Backgrounds/Magnetic Field',
  component: MagneticField,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A grid of dots that bends away from the pointer and springs back. Each dot follows a target on a damped spring, so the field flows around the cursor, rebounds with one small wobble when it leaves, and a press shoves the dots near it. Dots near the pointer take the accent in proportion to how far they are pushed. Canvas 2D, batched into a handful of paths per frame. Under reduced motion it renders a still grid bent around one fixed point.',
      },
    },
  },
  args: { intensity: 1, speed: 1, spacing: 18, radius: 130, pointer: 'repel', interactive: true },
  argTypes: {
    intensity: { control: { type: 'range', min: 0, max: 1.5, step: 0.05 } },
    speed: { control: { type: 'range', min: 0.2, max: 3, step: 0.1 } },
    spacing: { control: { type: 'range', min: 10, max: 40, step: 1 } },
    radius: { control: { type: 'range', min: 60, max: 280, step: 5 } },
    pointer: { control: 'inline-radio', options: ['repel', 'attract'] },
    interactive: { control: 'boolean' },
    colors: { control: 'object' },
    className: { control: false },
  },
} satisfies Meta<typeof MagneticField>

export default meta
type Story = StoryObj<typeof meta>

export const Hero: Story = {
  render: (args) => (
    <StoryHero
      background={<MagneticField {...args} />}
      eyebrow="Live product, no refresh"
      title="Every signal, held in place"
      body="A field of live signals that makes room for whatever you point at, then settles back."
      primary="Start tracking"
      secondary="See how it works"
    />
  ),
}

export const Playground: Story = {
  render: (args) => (
    <div className="relative h-screen min-h-[480px]">
      <MagneticField {...args} />
    </div>
  ),
}

export const Attract: Story = {
  args: { pointer: 'attract' },
  render: Playground.render,
}

export const ReducedMotion: Story = {
  parameters: {
    docs: { description: { story: 'Reduced motion: a still grid bent around one fixed point. The same composition every time; no spring and no pointer response.' } },
  },
  render: (args) => (
    <YoujProvider reducedMotion="always">
      <div className="relative h-screen min-h-[480px]">
        <MagneticField {...args} />
      </div>
    </YoujProvider>
  ),
}
