import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderBand, meta as about } from './band'

export default { title: 'Visuals/Loaders/Geometry/Band', tags: ['autodocs'], ...loaderMeta(LoaderBand, about) } satisfies Meta<typeof LoaderBand>

const s = loaderStories(LoaderBand)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
