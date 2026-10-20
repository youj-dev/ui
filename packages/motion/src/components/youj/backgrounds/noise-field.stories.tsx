import type { Meta, StoryObj } from '@storybook/react-vite'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { NoiseField } from './noise-field'
import { StoryHero } from './story-hero'

const meta = {
  title: 'Motion/Backgrounds/Noise Field',
  component: NoiseField,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Domain-warped flow noise read as a topographic survey. Contour lines are anti-aliased from screen-space derivatives, every fifth is an index line, summits pick up the accent, and a fixed grid of survey marks gives the one rigid reference. The pointer raises a mound that bunches the contours around it. Under reduced motion it renders a single still map.',
      },
    },
  },
  args: { intensity: 1, speed: 1, density: 14, interactive: true },
  argTypes: {
    intensity: { control: { type: 'range', min: 0, max: 1.5, step: 0.05 } },
    speed: { control: { type: 'range', min: 0, max: 4, step: 0.1 } },
    density: { control: { type: 'range', min: 6, max: 40, step: 1 } },
    interactive: { control: 'boolean' },
    colors: { control: 'object' },
    className: { control: false },
  },
} satisfies Meta<typeof NoiseField>

export default meta
type Story = StoryObj<typeof meta>

export const Hero: Story = {
  render: (args) => (
    <StoryHero
      align="start"
      background={<NoiseField {...args} />}
      eyebrow="16 new edge regions"
      title="Route every request along the shortest path"
      body="A global network that reads the terrain in real time: latency, load and failure, rebalanced before your users notice."
      primary="Deploy now"
      secondary="See the network"
    />
  ),
}

export const Playground: Story = {
  render: (args) => (
    <div className="relative h-screen min-h-[480px]">
      <NoiseField {...args} />
    </div>
  ),
}

export const ReducedMotion: Story = {
  parameters: {
    docs: { description: { story: 'Reduced motion: one still map, redrawn only on resize, prop or theme change. No pointer mound.' } },
  },
  render: (args) => (
    <YoujProvider reducedMotion="always">
      <div className="relative h-screen min-h-[480px]">
        <NoiseField {...args} />
      </div>
    </YoujProvider>
  ),
}
