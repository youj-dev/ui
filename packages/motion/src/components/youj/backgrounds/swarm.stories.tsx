import type { Meta, StoryObj } from '@storybook/react-vite'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { StoryHero } from './story-hero'
import { Swarm } from './swarm'

const meta = {
  title: 'Motion/Backgrounds/Swarm',
  component: Swarm,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A flock that roams the canvas, then gathers and circles the pointer. Each boid steers away from crowding, matches the heading of its neighbors and drifts toward their center, with a slow personal wander. Neighbors come from a spatial hash, so the cost stays linear in the flock. Density adapts to area. Drawn with Canvas 2D as darts batched into alpha tiers. Under reduced motion it renders one fixed, seeded flock.',
      },
    },
  },
  args: { intensity: 1, speed: 1, density: 1, size: 1, interactive: true },
  argTypes: {
    intensity: { control: { type: 'range', min: 0, max: 1.5, step: 0.05 } },
    speed: { control: { type: 'range', min: 0, max: 4, step: 0.1 } },
    density: { control: { type: 'range', min: 0.2, max: 3, step: 0.1 } },
    size: { control: { type: 'range', min: 0.5, max: 2.5, step: 0.1 } },
    interactive: { control: 'boolean' },
    colors: { control: 'object' },
    className: { control: false },
  },
} satisfies Meta<typeof Swarm>

export default meta
type Story = StoryObj<typeof meta>

export const Hero: Story = {
  render: (args) => (
    <StoryHero
      background={<Swarm {...args} />}
      eyebrow="Teams, in sync"
      title="Everyone moving the same way"
      body="Youj keeps a growing team pointed at the same goal, without a meeting to get there."
      primary="Start free"
      secondary="Read the docs"
    />
  ),
}

export const Playground: Story = {
  render: (args) => (
    <div className="relative h-screen min-h-[480px]">
      <Swarm {...args} />
    </div>
  ),
}

export const Dense: Story = {
  args: { density: 2, size: 0.8 },
  render: Playground.render,
}

export const ReducedMotion: Story = {
  parameters: {
    docs: { description: { story: 'Reduced motion: one seeded, fixed flock. The same composition every time; no flight and no pointer response.' } },
  },
  render: (args) => (
    <YoujProvider reducedMotion="always">
      <div className="relative h-screen min-h-[480px]">
        <Swarm {...args} />
      </div>
    </YoujProvider>
  ),
}
