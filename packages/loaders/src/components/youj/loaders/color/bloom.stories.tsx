import type { Meta, StoryObj } from '@storybook/react-vite'
import { Stage, loaderMeta, loaderStories } from '../story-kit'
import { LoaderBloom, meta as about } from './bloom'

const meta = { title: 'Visuals/Loaders/Color/Bloom', tags: ['autodocs'], ...loaderMeta(LoaderBloom, about) } satisfies Meta<typeof LoaderBloom>
export default meta
type Story = StoryObj<typeof meta>

const s = loaderStories(LoaderBloom)
export const Hero = s.Hero
export const Playground = s.Playground

/** Theme colors: its colored parts in the theme's colors, with `colors="theme"`. */
export const Themed: Story = {
  render: (args) => (
    <Stage>
      <LoaderBloom {...args} colors="theme" />
    </Stage>
  ),
}

export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
