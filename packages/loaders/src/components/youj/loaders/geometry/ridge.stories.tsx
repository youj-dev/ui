import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderRidge, meta as about } from './ridge'

export default { title: 'Visuals/Loaders/Geometry/Ridge', tags: ['autodocs'], ...loaderMeta(LoaderRidge, about) } satisfies Meta<typeof LoaderRidge>

const s = loaderStories(LoaderRidge)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
