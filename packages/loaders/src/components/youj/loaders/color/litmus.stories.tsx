import type { Meta, StoryObj } from '@storybook/react-vite'
import { Stage, loaderMeta, loaderStories } from '../story-kit'
import { LoaderLitmus, meta as about } from './litmus'

const meta = { title: 'Visuals/Loaders/Color/Litmus', tags: ['autodocs'], ...loaderMeta(LoaderLitmus, about) } satisfies Meta<typeof LoaderLitmus>
export default meta
type Story = StoryObj<typeof meta>

const s = loaderStories(LoaderLitmus)
export const Hero = s.Hero
export const Playground = s.Playground

/** Theme colors: its colored parts in the theme's colors, with `colors="theme"`. */
export const Themed: Story = {
  render: (args) => (
    <Stage>
      <LoaderLitmus {...args} colors="theme" />
    </Stage>
  ),
}

export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
