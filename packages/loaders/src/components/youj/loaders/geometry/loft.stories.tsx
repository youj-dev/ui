import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderLoft, meta as about } from './loft'

export default { title: 'Visuals/Loaders/Geometry/Loft', tags: ['autodocs'], ...loaderMeta(LoaderLoft, about) } satisfies Meta<typeof LoaderLoft>

const s = loaderStories(LoaderLoft)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
