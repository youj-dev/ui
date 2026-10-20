import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderTruss, meta as about } from './truss'

export default { title: 'Visuals/Loaders/Geometry/Truss', tags: ['autodocs'], ...loaderMeta(LoaderTruss, about) } satisfies Meta<typeof LoaderTruss>

const s = loaderStories(LoaderTruss)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
