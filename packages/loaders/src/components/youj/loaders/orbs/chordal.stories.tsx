import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderChordal, meta as about } from './chordal'

export default { title: 'Visuals/Loaders/Orbs/Chordal', tags: ['autodocs'], ...loaderMeta(LoaderChordal, about) } satisfies Meta<typeof LoaderChordal>

const s = loaderStories(LoaderChordal)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
