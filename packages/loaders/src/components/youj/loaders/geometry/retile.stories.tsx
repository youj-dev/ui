import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderRetile, meta as about } from './retile'

export default { title: 'Visuals/Loaders/Geometry/Retile', tags: ['autodocs'], ...loaderMeta(LoaderRetile, about) } satisfies Meta<typeof LoaderRetile>

const s = loaderStories(LoaderRetile)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
