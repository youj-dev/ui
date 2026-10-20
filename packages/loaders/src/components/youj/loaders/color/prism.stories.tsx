import type { Meta, StoryObj } from '@storybook/react-vite'
import { Stage, loaderMeta, loaderStories } from '../story-kit'
import { LoaderPrism, meta as about } from './prism'

const meta = { title: 'Visuals/Loaders/Color/Prism', tags: ['autodocs'], ...loaderMeta(LoaderPrism, about) } satisfies Meta<typeof LoaderPrism>
export default meta
type Story = StoryObj<typeof meta>

const s = loaderStories(LoaderPrism)
export const Hero = s.Hero
export const Playground = s.Playground

/** Theme colors: its colored parts in the theme's colors, with `colors="theme"`. */
export const Themed: Story = {
  render: (args) => (
    <Stage>
      <LoaderPrism {...args} colors="theme" />
    </Stage>
  ),
}

export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
