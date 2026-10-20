import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderTail, meta as about } from './tail'

export default { title: 'Visuals/Loaders/Signal/Tail', tags: ['autodocs'], ...loaderMeta(LoaderTail, about) } satisfies Meta<typeof LoaderTail>

const s = loaderStories(LoaderTail)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
