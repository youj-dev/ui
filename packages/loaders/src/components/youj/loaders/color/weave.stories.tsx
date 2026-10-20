import type { Meta, StoryObj } from '@storybook/react-vite'
import { Stage, loaderMeta, loaderStories } from '../story-kit'
import { LoaderWeave, meta as about } from './weave'

const meta = { title: 'Visuals/Loaders/Color/Weave', tags: ['autodocs'], ...loaderMeta(LoaderWeave, about) } satisfies Meta<typeof LoaderWeave>
export default meta
type Story = StoryObj<typeof meta>

const s = loaderStories(LoaderWeave)
export const Hero = s.Hero
export const Playground = s.Playground

/** Theme colors: its colored parts in the theme's colors, with `colors="theme"`. */
export const Themed: Story = {
  render: (args) => (
    <Stage>
      <LoaderWeave {...args} colors="theme" />
    </Stage>
  ),
}

export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
