import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderCondense, meta as about } from './condense'

export default { title: 'Visuals/Loaders/Interface/Condense', tags: ['autodocs'], ...loaderMeta(LoaderCondense, about) } satisfies Meta<typeof LoaderCondense>

const s = loaderStories(LoaderCondense)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
