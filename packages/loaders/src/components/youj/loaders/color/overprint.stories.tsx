import type { Meta, StoryObj } from '@storybook/react-vite'
import { Stage, loaderMeta, loaderStories } from '../story-kit'
import { LoaderOverprint, meta as about } from './overprint'

const meta = { title: 'Visuals/Loaders/Color/Overprint', tags: ['autodocs'], ...loaderMeta(LoaderOverprint, about) } satisfies Meta<typeof LoaderOverprint>
export default meta
type Story = StoryObj<typeof meta>

const s = loaderStories(LoaderOverprint)
export const Hero = s.Hero
export const Playground = s.Playground

/** Theme colors: its colored parts in the theme's colors, with `colors="theme"`. */
export const Themed: Story = {
  render: (args) => (
    <Stage>
      <LoaderOverprint {...args} colors="theme" />
    </Stage>
  ),
}

export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
