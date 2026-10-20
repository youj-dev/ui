import type { Meta, StoryObj } from '@storybook/react-vite'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { ParticleConstellation } from './particle-constellation'
import { StoryHero } from './story-hero'

const meta = {
  title: 'Motion/Backgrounds/Particle Constellation',
  component: ParticleConstellation,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Drifting particles linked by hairlines when they come within reach of each other. Density adapts to area, so a phone and a 1440p display look equally full. The pointer gathers particles into a loose ring (or repels them) and lights nearby links in the accent. It is drawn with Canvas 2D using a spatial grid and alpha-bucketed batched strokes, a few draw calls per frame. Under reduced motion it renders a fixed, seeded constellation.',
      },
    },
  },
  args: { intensity: 1, speed: 1, density: 1, linkDistance: 130, pointer: 'attract', interactive: true },
  argTypes: {
    intensity: { control: { type: 'range', min: 0, max: 1.5, step: 0.05 } },
    speed: { control: { type: 'range', min: 0, max: 4, step: 0.1 } },
    density: { control: { type: 'range', min: 0.2, max: 3, step: 0.1 } },
    linkDistance: { control: { type: 'range', min: 40, max: 240, step: 5 } },
    pointer: { control: 'inline-radio', options: ['attract', 'repel'] },
    interactive: { control: 'boolean' },
    signals: { control: 'object' },
    colors: { control: 'object' },
    className: { control: false },
  },
} satisfies Meta<typeof ParticleConstellation>

export default meta
type Story = StoryObj<typeof meta>

export const Hero: Story = {
  render: (args) => (
    <StoryHero
      background={<ParticleConstellation {...args} />}
      eyebrow="Service graph, now live"
      title="See every dependency before it breaks"
      body="Youj maps how your services actually talk to each other, live, and tells you which link will fail first."
      primary="Map your stack"
      secondary="Read the docs"
    />
  ),
}

export const Playground: Story = {
  render: (args) => (
    <div className="relative h-screen min-h-[480px]">
      <ParticleConstellation {...args} />
    </div>
  ),
}

export const Signals: Story = {
  args: { signals: true, density: 1.4, linkDistance: 120 },
  render: Playground.render,
}

export const Repel: Story = {
  args: { pointer: 'repel', density: 1.4 },
  render: Playground.render,
}

export const ReducedMotion: Story = {
  parameters: {
    docs: { description: { story: 'Reduced motion: a seeded, fixed constellation. The same composition every time; no drift and no pointer response.' } },
  },
  render: (args) => (
    <YoujProvider reducedMotion="always">
      <div className="relative h-screen min-h-[480px]">
        <ParticleConstellation {...args} />
      </div>
    </YoujProvider>
  ),
}
