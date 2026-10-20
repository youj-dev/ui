import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderNewel, meta as about } from './newel'

export default { title: 'Visuals/Loaders/Geometry/Newel', tags: ['autodocs'], ...loaderMeta(LoaderNewel, about) } satisfies Meta<typeof LoaderNewel>

const s = loaderStories(LoaderNewel)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
