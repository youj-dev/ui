import type { Meta, StoryObj } from '@storybook/react-vite'
import { Stage, loaderMeta, loaderStories } from '../story-kit'
import { LoaderIsotherm, meta as about } from './isotherm'

const meta = { title: 'Visuals/Loaders/Color/Isotherm', tags: ['autodocs'], ...loaderMeta(LoaderIsotherm, about) } satisfies Meta<typeof LoaderIsotherm>
export default meta
type Story = StoryObj<typeof meta>

const s = loaderStories(LoaderIsotherm)
export const Hero = s.Hero
export const Playground = s.Playground

/** Theme colors: its colored parts in the theme's colors, with `colors="theme"`. */
export const Themed: Story = {
  render: (args) => (
    <Stage>
      <LoaderIsotherm {...args} colors="theme" />
    </Stage>
  ),
}

export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
