import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderTrellis, meta as about } from './trellis'

export default { title: 'Visuals/Loaders/Interface/Trellis', tags: ['autodocs'], ...loaderMeta(LoaderTrellis, about, 'Aligning sequences') } satisfies Meta<typeof LoaderTrellis>

const s = loaderStories(LoaderTrellis, { hero: 'A product status and an inline task at their working sizes.' })
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
