import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderShingle, meta as about } from './shingle'

export default { title: 'Visuals/Loaders/Geometry/Shingle', tags: ['autodocs'], ...loaderMeta(LoaderShingle, about) } satisfies Meta<typeof LoaderShingle>

const s = loaderStories(LoaderShingle)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
