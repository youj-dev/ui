import type { Meta, StoryObj } from '@storybook/react-vite'
import { Stage, loaderMeta, loaderStories } from '../story-kit'
import { LoaderGyre, meta as about } from './gyre'

const meta = { title: 'Visuals/Loaders/Color/Gyre', tags: ['autodocs'], ...loaderMeta(LoaderGyre, about) } satisfies Meta<typeof LoaderGyre>
export default meta
type Story = StoryObj<typeof meta>

const s = loaderStories(LoaderGyre)
export const Hero = s.Hero
export const Playground = s.Playground

/** Theme colors: its colored parts in the theme's colors, with `colors="theme"`. */
export const Themed: Story = {
  render: (args) => (
    <Stage>
      <LoaderGyre {...args} colors="theme" />
    </Stage>
  ),
}

export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
