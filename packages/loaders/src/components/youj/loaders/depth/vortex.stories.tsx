import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderVortex, meta as about } from './vortex'

export default { title: 'Visuals/Loaders/Depth/Vortex', tags: ['autodocs'], ...loaderMeta(LoaderVortex, about) } satisfies Meta<typeof LoaderVortex>

const s = loaderStories(LoaderVortex)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
