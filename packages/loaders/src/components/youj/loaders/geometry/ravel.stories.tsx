import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderRavel, meta as about } from './ravel'

export default { title: 'Visuals/Loaders/Geometry/Ravel', tags: ['autodocs'], ...loaderMeta(LoaderRavel, about) } satisfies Meta<typeof LoaderRavel>

const s = loaderStories(LoaderRavel)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
