import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderWick, meta as about } from './wick'

export default { title: 'Visuals/Loaders/Signal/Wick', tags: ['autodocs'], ...loaderMeta(LoaderWick, about) } satisfies Meta<typeof LoaderWick>

const s = loaderStories(LoaderWick)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
