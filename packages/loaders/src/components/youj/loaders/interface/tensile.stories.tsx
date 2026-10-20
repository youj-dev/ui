import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderTensile, meta as about } from './tensile'

export default { title: 'Visuals/Loaders/Interface/Tensile', tags: ['autodocs'], ...loaderMeta(LoaderTensile, about) } satisfies Meta<typeof LoaderTensile>

const s = loaderStories(LoaderTensile)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
