import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderMosaic, meta as about } from './mosaic'

export default { title: 'Visuals/Loaders/Geometry/Mosaic', tags: ['autodocs'], ...loaderMeta(LoaderMosaic, about) } satisfies Meta<typeof LoaderMosaic>

const s = loaderStories(LoaderMosaic)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
