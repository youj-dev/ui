import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderStencil, meta as about } from './stencil'

export default { title: 'Visuals/Loaders/Interface/Stencil', tags: ['autodocs'], ...loaderMeta(LoaderStencil, about) } satisfies Meta<typeof LoaderStencil>

const s = loaderStories(LoaderStencil)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
