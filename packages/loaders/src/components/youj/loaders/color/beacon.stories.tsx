import type { Meta, StoryObj } from '@storybook/react-vite'
import { Stage, loaderMeta, loaderStories } from '../story-kit'
import { LoaderBeacon, meta as about } from './beacon'

const meta = { title: 'Visuals/Loaders/Color/Beacon', tags: ['autodocs'], ...loaderMeta(LoaderBeacon, about) } satisfies Meta<typeof LoaderBeacon>
export default meta
type Story = StoryObj<typeof meta>

const s = loaderStories(LoaderBeacon)
export const Hero = s.Hero
export const Playground = s.Playground

/** Theme colors: its colored parts in the theme's colors, with `colors="theme"`. */
export const Themed: Story = {
  render: (args) => (
    <Stage>
      <LoaderBeacon {...args} colors="theme" />
    </Stage>
  ),
}

export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
