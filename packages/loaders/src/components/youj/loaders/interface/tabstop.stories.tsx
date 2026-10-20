import type { Meta, StoryObj } from '@storybook/react-vite'
import { Stage, loaderMeta, loaderStories } from '../story-kit'
import { LoaderTabstop, meta as about } from './tabstop'

const meta = { title: 'Visuals/Loaders/Interface/Tabstop', tags: ['autodocs'], ...loaderMeta(LoaderTabstop, about) } satisfies Meta<typeof LoaderTabstop>
export default meta
type Story = StoryObj<typeof meta>

const s = loaderStories(LoaderTabstop)
export const Hero = s.Hero
export const Playground = s.Playground

/** Theme colors: its colored parts in the theme's colors, with `colors="theme"`. */
export const Themed: Story = {
  render: (args) => (
    <Stage>
      <LoaderTabstop {...args} colors="theme" />
    </Stage>
  ),
}

export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
