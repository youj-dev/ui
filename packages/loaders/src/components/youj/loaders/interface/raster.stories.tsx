import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderRaster, meta as about } from './raster'

export default { title: 'Visuals/Loaders/Interface/Raster', tags: ['autodocs'], ...loaderMeta(LoaderRaster, about) } satisfies Meta<typeof LoaderRaster>

const s = loaderStories(LoaderRaster)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
