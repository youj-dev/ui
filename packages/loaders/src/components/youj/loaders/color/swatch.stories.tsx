import type { Meta, StoryObj } from '@storybook/react-vite'
import { Stage, loaderMeta, loaderStories } from '../story-kit'
import { LoaderSwatch, meta as about } from './swatch'

const meta = { title: 'Visuals/Loaders/Color/Swatch', tags: ['autodocs'], ...loaderMeta(LoaderSwatch, about) } satisfies Meta<typeof LoaderSwatch>
export default meta
type Story = StoryObj<typeof meta>

const s = loaderStories(LoaderSwatch)
export const Hero = s.Hero
export const Playground = s.Playground

/** Theme colors: its colored parts in the theme's colors, with `colors="theme"`. */
export const Themed: Story = {
  render: (args) => (
    <Stage>
      <LoaderSwatch {...args} colors="theme" />
    </Stage>
  ),
}

export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
