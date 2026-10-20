import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderCollate, meta as about } from './collate'

export default { title: 'Visuals/Loaders/Interface/Collate', tags: ['autodocs'], ...loaderMeta(LoaderCollate, about, 'Merging datasets') } satisfies Meta<typeof LoaderCollate>

const s = loaderStories(LoaderCollate)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
