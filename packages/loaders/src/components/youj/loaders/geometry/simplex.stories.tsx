import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderSimplex, meta as about } from './simplex'

export default { title: 'Visuals/Loaders/Geometry/Simplex', tags: ['autodocs'], ...loaderMeta(LoaderSimplex, about) } satisfies Meta<typeof LoaderSimplex>

const s = loaderStories(LoaderSimplex)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
