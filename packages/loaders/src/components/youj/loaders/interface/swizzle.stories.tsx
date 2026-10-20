import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderSwizzle, meta as about } from './swizzle'

export default { title: 'Visuals/Loaders/Interface/Swizzle', tags: ['autodocs'], ...loaderMeta(LoaderSwizzle, about) } satisfies Meta<typeof LoaderSwizzle>

const s = loaderStories(LoaderSwizzle)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
