import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderCalyx, meta as about } from './calyx'

export default { title: 'Visuals/Loaders/Geometry/Calyx', tags: ['autodocs'], ...loaderMeta(LoaderCalyx, about) } satisfies Meta<typeof LoaderCalyx>

const s = loaderStories(LoaderCalyx)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
