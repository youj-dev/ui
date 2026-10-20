import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderSustain, meta as about } from './sustain'

export default { title: 'Visuals/Loaders/Signal/Sustain', tags: ['autodocs'], ...loaderMeta(LoaderSustain, about) } satisfies Meta<typeof LoaderSustain>

const s = loaderStories(LoaderSustain)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
