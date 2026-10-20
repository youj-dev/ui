import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderReciprocal, meta as about } from './reciprocal'

export default { title: 'Visuals/Loaders/Geometry/Reciprocal', tags: ['autodocs'], ...loaderMeta(LoaderReciprocal, about, 'Assembling frame') } satisfies Meta<typeof LoaderReciprocal>

const s = loaderStories(LoaderReciprocal, { hero: 'A product status and an inline task at their working sizes.' })
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
