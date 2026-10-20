import type { Meta, StoryObj } from '@storybook/react-vite'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { DotMatrixWave } from './dot-matrix-wave'
import { StoryHero } from './story-hero'

const meta = {
  title: 'Motion/Backgrounds/Dot Matrix Wave',
  component: DotMatrixWave,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A precise lattice of dots whose size and brightness ripple out from the pointer and from clicks. Each dot is one analytically anti-aliased disc on a device-pixel grid, evaluated at its center, so the matrix stays crisp at any DPR. The pointer raises a lens and leaves a wake of soft rings, a click sends a strong ring, and when idle it emits an occasional ambient pulse. Under reduced motion one ring is shown frozen mid-flight.',
      },
    },
  },
  args: { intensity: 1, speed: 1, spacing: 22, interactive: true, ambient: true },
  argTypes: {
    intensity: { control: { type: 'range', min: 0, max: 1.5, step: 0.05 } },
    speed: { control: { type: 'range', min: 0, max: 4, step: 0.1 } },
    spacing: { control: { type: 'range', min: 10, max: 48, step: 1 } },
    interactive: { control: 'boolean' },
    ambient: { control: 'boolean' },
    colors: { control: 'object' },
    className: { control: false },
  },
} satisfies Meta<typeof DotMatrixWave>

export default meta
type Story = StoryObj<typeof meta>

export const Hero: Story = {
  render: (args) => (
    <StoryHero
      background={<DotMatrixWave {...args} />}
      eyebrow="Youj 2.0 is here"
      title="Built to the last pixel"
      body="An interface toolkit engineered for teams who notice the details. Move the pointer and click anywhere to see it respond."
      primary="Get started"
      secondary="Explore components"
    />
  ),
}

export const Playground: Story = {
  render: (args) => (
    <div className="relative h-screen min-h-[480px]">
      <DotMatrixWave {...args} />
    </div>
  ),
}

export const ReducedMotion: Story = {
  parameters: {
    docs: { description: { story: 'Reduced motion: one ring frozen mid-flight, so the still frame still says "this responds". There is no pointer lens, wake or ambient pulse.' } },
  },
  render: (args) => (
    <YoujProvider reducedMotion="always">
      <div className="relative h-screen min-h-[480px]">
        <DotMatrixWave {...args} />
      </div>
    </YoujProvider>
  ),
}
