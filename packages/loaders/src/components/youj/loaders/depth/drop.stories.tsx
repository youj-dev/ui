import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderDrop, meta as about } from './drop'

export default { title: 'Visuals/Loaders/Depth/Drop', tags: ['autodocs'], ...loaderMeta(LoaderDrop, about) } satisfies Meta<typeof LoaderDrop>

const s = loaderStories(LoaderDrop)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
