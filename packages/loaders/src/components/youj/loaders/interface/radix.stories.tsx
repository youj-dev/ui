import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderRadix, meta as about } from './radix'

export default { title: 'Visuals/Loaders/Interface/Radix', tags: ['autodocs'], ...loaderMeta(LoaderRadix, about) } satisfies Meta<typeof LoaderRadix>

const s = loaderStories(LoaderRadix)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
