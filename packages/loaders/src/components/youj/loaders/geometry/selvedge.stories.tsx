import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderSelvedge, meta as about } from './selvedge'

export default { title: 'Visuals/Loaders/Geometry/Selvedge', tags: ['autodocs'], ...loaderMeta(LoaderSelvedge, about) } satisfies Meta<typeof LoaderSelvedge>

const s = loaderStories(LoaderSelvedge)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
