import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderArbor, meta as about } from './arbor'

export default { title: 'Visuals/Loaders/Geometry/Arbor', tags: ['autodocs'], ...loaderMeta(LoaderArbor, about) } satisfies Meta<typeof LoaderArbor>

const s = loaderStories(LoaderArbor)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
