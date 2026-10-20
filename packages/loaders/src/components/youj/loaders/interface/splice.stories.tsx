import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderSplice, meta as about } from './splice'

export default { title: 'Visuals/Loaders/Interface/Splice', tags: ['autodocs'], ...loaderMeta(LoaderSplice, about) } satisfies Meta<typeof LoaderSplice>

const s = loaderStories(LoaderSplice)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
