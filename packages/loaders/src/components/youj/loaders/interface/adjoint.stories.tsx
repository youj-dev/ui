import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderAdjoint, meta as about } from './adjoint'

export default { title: 'Visuals/Loaders/Interface/Adjoint', tags: ['autodocs'], ...loaderMeta(LoaderAdjoint, about) } satisfies Meta<typeof LoaderAdjoint>

const s = loaderStories(LoaderAdjoint)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
