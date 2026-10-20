import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderTessera, meta as about } from './tessera'

export default { title: 'Visuals/Loaders/Geometry/Tessera', tags: ['autodocs'], ...loaderMeta(LoaderTessera, about) } satisfies Meta<typeof LoaderTessera>

const s = loaderStories(LoaderTessera)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
