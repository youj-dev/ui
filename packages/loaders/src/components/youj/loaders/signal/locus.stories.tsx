import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderLocus, meta as about } from './locus'

export default { title: 'Visuals/Loaders/Signal/Locus', tags: ['autodocs'], ...loaderMeta(LoaderLocus, about) } satisfies Meta<typeof LoaderLocus>

const s = loaderStories(LoaderLocus)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
