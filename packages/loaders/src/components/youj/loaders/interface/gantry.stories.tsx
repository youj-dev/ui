import type { Meta, StoryObj } from '@storybook/react-vite'
import { Stage, loaderMeta, loaderStories } from '../story-kit'
import { LoaderGantry, meta as about } from './gantry'

const meta = { title: 'Visuals/Loaders/Interface/Gantry', tags: ['autodocs'], ...loaderMeta(LoaderGantry, about) } satisfies Meta<typeof LoaderGantry>
export default meta
type Story = StoryObj<typeof meta>

const s = loaderStories(LoaderGantry)
export const Hero = s.Hero
export const Playground = s.Playground

/** Theme colors: its colored parts in the theme's colors, with `colors="theme"`. */
export const Themed: Story = {
  render: (args) => (
    <Stage>
      <LoaderGantry {...args} colors="theme" />
    </Stage>
  ),
}

export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
