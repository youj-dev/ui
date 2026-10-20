import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderStride, meta as about } from './stride'

export default { title: 'Visuals/Loaders/Interface/Stride', tags: ['autodocs'], ...loaderMeta(LoaderStride, about) } satisfies Meta<typeof LoaderStride>

const s = loaderStories(LoaderStride)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
