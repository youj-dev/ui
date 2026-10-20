import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderQueue, meta as about } from './queue'

export default { title: 'Visuals/Loaders/Interface/Queue', tags: ['autodocs'], ...loaderMeta(LoaderQueue, about) } satisfies Meta<typeof LoaderQueue>

const s = loaderStories(LoaderQueue)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
