import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderTraverse, meta as about } from './traverse'

export default { title: 'Visuals/Loaders/Interface/Traverse', tags: ['autodocs'], ...loaderMeta(LoaderTraverse, about) } satisfies Meta<typeof LoaderTraverse>

const s = loaderStories(LoaderTraverse)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
