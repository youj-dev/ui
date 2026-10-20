import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderLathe, meta as about } from './lathe'

export default { title: 'Visuals/Loaders/Geometry/Lathe', tags: ['autodocs'], ...loaderMeta(LoaderLathe, about) } satisfies Meta<typeof LoaderLathe>

const s = loaderStories(LoaderLathe)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
