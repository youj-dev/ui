import type { Meta, StoryObj } from '@storybook/react-vite'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { Aurora } from './aurora'
import { StoryHero } from './story-hero'

const meta = {
  title: 'Motion/Backgrounds/Aurora',
  component: Aurora,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Layered curtains of light for a hero backdrop. Three layers, each with a bright lower edge, rays hanging upward and pulses traveling along it, drift at different depths. Light is added on dark canvases and tinted on light ones, and the lower frame stays quiet for content. Colors default to an analogous family around `--color-accent`. Under reduced motion it renders a single still frame.',
      },
    },
  },
  args: { intensity: 1, speed: 1, horizon: 0.58, interactive: true },
  argTypes: {
    intensity: { control: { type: 'range', min: 0, max: 1.5, step: 0.05 } },
    speed: { control: { type: 'range', min: 0, max: 4, step: 0.1 } },
    horizon: { control: { type: 'range', min: 0.2, max: 0.9, step: 0.01 } },
    interactive: { control: 'boolean' },
    colors: { control: 'object' },
    className: { control: false },
  },
} satisfies Meta<typeof Aurora>

export default meta
type Story = StoryObj<typeof meta>

export const Hero: Story = {
  render: (args) => (
    <StoryHero
      background={<Aurora {...args} />}
      eyebrow="Youj Intelligence, in beta"
      title="Answers that arrive before the question"
      body="An assistant that reads your whole workspace and surfaces what matters, quietly, at the moment you need it."
      primary="Join the beta"
      secondary="Watch the film"
      contentClassName="pt-24"
    />
  ),
}

export const Playground: Story = {
  render: (args) => (
    <div className="relative h-screen min-h-[480px]">
      <Aurora {...args} />
    </div>
  ),
}

export const ReducedMotion: Story = {
  parameters: {
    docs: { description: { story: 'Reduced motion: a single still frame of the curtains; no drift, no pointer lean.' } },
  },
  render: (args) => (
    <YoujProvider reducedMotion="always">
      <div className="relative h-screen min-h-[480px]">
        <Aurora {...args} />
      </div>
    </YoujProvider>
  ),
}
