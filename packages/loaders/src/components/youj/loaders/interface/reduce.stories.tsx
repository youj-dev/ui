import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderReduce, meta as about } from './reduce'

export default { title: 'Visuals/Loaders/Interface/Reduce', tags: ['autodocs'], ...loaderMeta(LoaderReduce, about) } satisfies Meta<typeof LoaderReduce>

const s = loaderStories(LoaderReduce)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
