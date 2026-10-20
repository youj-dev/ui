import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderCarton, meta as about } from './carton'

export default { title: 'Visuals/Loaders/Geometry/Carton', tags: ['autodocs'], ...loaderMeta(LoaderCarton, about) } satisfies Meta<typeof LoaderCarton>

const s = loaderStories(LoaderCarton)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
