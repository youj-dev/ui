import type { Meta, StoryObj } from '@storybook/react-vite'
import { Stage, loaderMeta, loaderStories } from '../story-kit'
import { LoaderChord, meta as about } from './chord'

const meta = { title: 'Visuals/Loaders/Color/Chord', tags: ['autodocs'], ...loaderMeta(LoaderChord, about) } satisfies Meta<typeof LoaderChord>
export default meta
type Story = StoryObj<typeof meta>

const s = loaderStories(LoaderChord)
export const Hero = s.Hero
export const Playground = s.Playground

/** Theme colors: its colored parts in the theme's colors, with `colors="theme"`. */
export const Themed: Story = {
  render: (args) => (
    <Stage>
      <LoaderChord {...args} colors="theme" />
    </Stage>
  ),
}

export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
