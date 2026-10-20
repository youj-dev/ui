import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderSlice, meta as about } from './slice'

export default { title: 'Visuals/Loaders/Depth/Slice', tags: ['autodocs'], ...loaderMeta(LoaderSlice, about) } satisfies Meta<typeof LoaderSlice>

const s = loaderStories(LoaderSlice)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
