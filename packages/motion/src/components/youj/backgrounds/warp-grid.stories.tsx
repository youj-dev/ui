import type { Meta, StoryObj } from '@storybook/react-vite'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { WarpGrid } from './warp-grid'
import { StoryHero } from './story-hero'

const meta = {
  title: 'Motion/Backgrounds/Warp Grid',
  component: WarpGrid,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A line grid that sags toward the pointer like mass bending space. Points slide toward the well with an inverse-square falloff, so lines bunch and curve around it and stay put far away, and the lines nearest the well take the accent. With nobody there the well eases to the middle of the field and breathes; a press deepens it for a moment. Canvas 2D, one path for the grid and a few batched paths for the lit segments. Under reduced motion it renders a still grid sagging toward the middle.',
      },
    },
  },
  args: { intensity: 1, speed: 1, spacing: 26, depth: 1, radius: 240, interactive: true },
  argTypes: {
    intensity: { control: { type: 'range', min: 0, max: 1.5, step: 0.05 } },
    speed: { control: { type: 'range', min: 0.2, max: 3, step: 0.1 } },
    spacing: { control: { type: 'range', min: 14, max: 60, step: 1 } },
    depth: { control: { type: 'range', min: 0, max: 2, step: 0.05 } },
    radius: { control: { type: 'range', min: 80, max: 400, step: 10 } },
    interactive: { control: 'boolean' },
    colors: { control: 'object' },
    className: { control: false },
  },
} satisfies Meta<typeof WarpGrid>

export default meta
type Story = StoryObj<typeof meta>

export const Hero: Story = {
  render: (args) => (
    <StoryHero
      background={<WarpGrid {...args} />}
      eyebrow="Built to carry weight"
      title="Space bends around what matters"
      body="Point at anything and the whole grid leans in. Let go and it settles back to center."
      primary="Get started"
      secondary="Read the docs"
    />
  ),
}

export const Playground: Story = {
  render: (args) => (
    <div className="relative h-screen min-h-[480px]">
      <WarpGrid {...args} />
    </div>
  ),
}

export const Deep: Story = {
  args: { depth: 1.8, radius: 320 },
  render: Playground.render,
}

export const ReducedMotion: Story = {
  parameters: {
    docs: { description: { story: 'Reduced motion: a still grid sagging toward the middle. The same composition every time; no breathing and no pointer response.' } },
  },
  render: (args) => (
    <YoujProvider reducedMotion="always">
      <div className="relative h-screen min-h-[480px]">
        <WarpGrid {...args} />
      </div>
    </YoujProvider>
  ),
}
