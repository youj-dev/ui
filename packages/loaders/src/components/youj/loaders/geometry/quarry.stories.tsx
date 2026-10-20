import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderQuarry, meta as about } from './quarry'

export default { title: 'Visuals/Loaders/Geometry/Quarry', tags: ['autodocs'], ...loaderMeta(LoaderQuarry, about) } satisfies Meta<typeof LoaderQuarry>

const s = loaderStories(LoaderQuarry)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
