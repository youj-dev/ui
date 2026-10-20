import type { Meta, StoryObj } from '@storybook/react-vite'
import { Stage, loaderMeta, loaderStories } from '../story-kit'
import { LoaderPrompt, meta as about } from './prompt'

const meta = { title: 'Visuals/Loaders/Interface/Prompt', tags: ['autodocs'], ...loaderMeta(LoaderPrompt, about) } satisfies Meta<typeof LoaderPrompt>
export default meta
type Story = StoryObj<typeof meta>

const s = loaderStories(LoaderPrompt)
export const Hero = s.Hero
export const Playground = s.Playground

/** Theme colors: its colored parts in the theme's colors, with `colors="theme"`. */
export const Themed: Story = {
  render: (args) => (
    <Stage>
      <LoaderPrompt {...args} colors="theme" />
    </Stage>
  ),
}

export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
