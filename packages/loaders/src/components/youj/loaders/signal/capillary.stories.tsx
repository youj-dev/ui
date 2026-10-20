import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderCapillary, meta as about } from './capillary'

export default { title: 'Visuals/Loaders/Signal/Capillary', tags: ['autodocs'], ...loaderMeta(LoaderCapillary, about) } satisfies Meta<typeof LoaderCapillary>

const s = loaderStories(LoaderCapillary)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
