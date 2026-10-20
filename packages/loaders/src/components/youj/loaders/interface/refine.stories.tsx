import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderRefine, meta as about } from './refine'

export default { title: 'Visuals/Loaders/Interface/Refine', tags: ['autodocs'], ...loaderMeta(LoaderRefine, about) } satisfies Meta<typeof LoaderRefine>

const s = loaderStories(LoaderRefine)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
