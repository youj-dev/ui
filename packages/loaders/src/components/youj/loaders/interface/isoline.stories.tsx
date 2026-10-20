import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderIsoline, meta as about } from './isoline'

export default { title: 'Visuals/Loaders/Interface/Isoline', tags: ['autodocs'], ...loaderMeta(LoaderIsoline, about) } satisfies Meta<typeof LoaderIsoline>

const s = loaderStories(LoaderIsoline)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
