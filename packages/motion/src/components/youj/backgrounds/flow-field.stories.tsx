import type { Meta, StoryObj } from '@storybook/react-vite'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { FlowField } from './flow-field'
import { StoryHero } from './story-hero'

const meta = {
  title: 'Motion/Backgrounds/Flow Field',
  component: FlowField,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Streaks drifting on a smooth noise current, each leaving a fading trail. The pointer stirs a vortex in the current and lights the streaks it catches in the accent. Density adapts to area. Trails are redrawn from a short history every frame, so nothing ghosts, and it is drawn with Canvas 2D in alpha-bucketed batched strokes, a few draw calls per frame. Under reduced motion it renders one fixed, seeded field.',
      },
    },
  },
  args: { intensity: 1, speed: 1, density: 1, trail: 1, scale: 1, interactive: true },
  argTypes: {
    intensity: { control: { type: 'range', min: 0, max: 1.5, step: 0.05 } },
    speed: { control: { type: 'range', min: 0, max: 4, step: 0.1 } },
    density: { control: { type: 'range', min: 0.2, max: 3, step: 0.1 } },
    trail: { control: { type: 'range', min: 0.3, max: 1.5, step: 0.05 } },
    scale: { control: { type: 'range', min: 0.4, max: 2.5, step: 0.05 } },
    interactive: { control: 'boolean' },
    colors: { control: 'object' },
    className: { control: false },
  },
} satisfies Meta<typeof FlowField>

export default meta
type Story = StoryObj<typeof meta>

export const Hero: Story = {
  render: (args) => (
    <StoryHero
      background={<FlowField {...args} />}
      eyebrow="Live traffic"
      title="Watch requests find their way"
      body="Every request takes the clearest path through your network. Youj shows where the current runs fast and where it pools."
      primary="Open the map"
      secondary="Read the docs"
    />
  ),
}

export const Playground: Story = {
  render: (args) => (
    <div className="relative h-screen min-h-[480px]">
      <FlowField {...args} />
    </div>
  ),
}

export const LongCurrents: Story = {
  args: { scale: 1.8, trail: 1.5, density: 0.8 },
  render: Playground.render,
}

export const ReducedMotion: Story = {
  parameters: {
    docs: { description: { story: 'Reduced motion: one seeded, fixed field with its trails laid down. The same composition every time; no drift and no pointer response.' } },
  },
  render: (args) => (
    <YoujProvider reducedMotion="always">
      <div className="relative h-screen min-h-[480px]">
        <FlowField {...args} />
      </div>
    </YoujProvider>
  ),
}
