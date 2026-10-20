import type { Meta, StoryObj } from '@storybook/react-vite'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { MeshGradient } from './mesh-gradient'
import { StoryHero } from './story-hero'

const meta = {
  title: 'Motion/Backgrounds/Mesh Gradient',
  component: MeshGradient,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A slow, luxurious flowing mesh gradient. Four color masses drift on incommensurate paths through a domain-warped field and blend in OKLab, so transitions stay luminous. Grain plus dithering keep 8-bit output free of banding. Colors default to an analogous family derived from `--color-accent`, over `--color-canvas`, and follow the theme. Under reduced motion it renders one composed still frame.',
      },
    },
  },
  args: { intensity: 1, speed: 1, grain: 0.5, interactive: true },
  argTypes: {
    intensity: { control: { type: 'range', min: 0, max: 1.5, step: 0.05 } },
    speed: { control: { type: 'range', min: 0, max: 4, step: 0.1 } },
    grain: { control: { type: 'range', min: 0, max: 1, step: 0.05 } },
    interactive: { control: 'boolean' },
    colors: { control: 'object' },
    className: { control: false },
  },
} satisfies Meta<typeof MeshGradient>

export default meta
type Story = StoryObj<typeof meta>

export const Hero: Story = {
  render: (args) => (
    <StoryHero
      background={<MeshGradient {...args} intensity={0.4} />}
      eyebrow="Realtime sync, now in every plan"
      title="The workspace that moves as fast as you think"
      body="Plan, build and ship in one quiet, precise surface. Every change lands instantly, for everyone."
      primary="Start building"
      secondary="Book a demo"
      bodyClassName="text-fg"
    />
  ),
}

export const Playground: Story = {
  render: (args) => (
    <div className="relative h-screen min-h-[480px]">
      <MeshGradient {...args} />
    </div>
  ),
}

export const CustomColors: Story = {
  args: { colors: ['var(--color-success)', 'var(--color-accent)', 'var(--color-warning)', 'var(--color-success)'], intensity: 0.8 },
  render: Playground.render,
}

export const ReducedMotion: Story = {
  parameters: {
    docs: { description: { story: 'With reduced motion the loop never starts: a single composed frame is drawn, and redrawn only on resize, prop or theme changes. Pointer tracking is off.' } },
  },
  render: (args) => (
    <YoujProvider reducedMotion="always">
      <div className="relative h-screen min-h-[480px]">
        <MeshGradient {...args} />
      </div>
    </YoujProvider>
  ),
}
