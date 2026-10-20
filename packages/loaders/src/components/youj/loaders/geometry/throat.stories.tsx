import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderThroat, meta as about } from './throat'

export default { title: 'Visuals/Loaders/Geometry/Throat', tags: ['autodocs'], ...loaderMeta(LoaderThroat, about) } satisfies Meta<typeof LoaderThroat>

const s = loaderStories(LoaderThroat)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
