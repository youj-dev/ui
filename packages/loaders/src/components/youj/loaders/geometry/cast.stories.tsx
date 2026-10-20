import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderCast, meta as about } from './cast'

export default { title: 'Visuals/Loaders/Geometry/Cast', tags: ['autodocs'], ...loaderMeta(LoaderCast, about) } satisfies Meta<typeof LoaderCast>

const s = loaderStories(LoaderCast)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
