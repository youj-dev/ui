import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderCarve, meta as about } from './carve'

export default { title: 'Visuals/Loaders/Geometry/Carve', tags: ['autodocs'], ...loaderMeta(LoaderCarve, about) } satisfies Meta<typeof LoaderCarve>

const s = loaderStories(LoaderCarve)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
