import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderSift, meta as about } from './sift'

export default { title: 'Visuals/Loaders/Interface/Sift', tags: ['autodocs'], ...loaderMeta(LoaderSift, about) } satisfies Meta<typeof LoaderSift>

const s = loaderStories(LoaderSift)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
