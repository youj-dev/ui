import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderOgive, meta as about } from './ogive'

export default { title: 'Visuals/Loaders/Geometry/Ogive', tags: ['autodocs'], ...loaderMeta(LoaderOgive, about) } satisfies Meta<typeof LoaderOgive>

const s = loaderStories(LoaderOgive)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
