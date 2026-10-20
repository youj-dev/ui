import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderPleat, meta as about } from './pleat'

export default { title: 'Visuals/Loaders/Geometry/Pleat', tags: ['autodocs'], ...loaderMeta(LoaderPleat, about) } satisfies Meta<typeof LoaderPleat>

const s = loaderStories(LoaderPleat)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
