import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderHalite, meta as about } from './halite'

export default { title: 'Visuals/Loaders/Science/Halite', tags: ['autodocs'], ...loaderMeta(LoaderHalite, about) } satisfies Meta<typeof LoaderHalite>

const s = loaderStories(LoaderHalite)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
