import type { Meta, StoryObj } from '@storybook/react-vite'
import { Stage, loaderMeta, loaderStories } from '../story-kit'
import { LoaderSpectrum, meta as about } from './spectrum'

const meta = { title: 'Visuals/Loaders/Color/Spectrum', tags: ['autodocs'], ...loaderMeta(LoaderSpectrum, about) } satisfies Meta<typeof LoaderSpectrum>
export default meta
type Story = StoryObj<typeof meta>

const s = loaderStories(LoaderSpectrum)
export const Hero = s.Hero
export const Playground = s.Playground

/** Theme colors: its colored parts in the theme's colors, with `colors="theme"`. */
export const Themed: Story = {
  render: (args) => (
    <Stage>
      <LoaderSpectrum {...args} colors="theme" />
    </Stage>
  ),
}

export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
