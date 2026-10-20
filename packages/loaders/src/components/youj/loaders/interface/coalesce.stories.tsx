import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderCoalesce, meta as about } from './coalesce'

export default { title: 'Visuals/Loaders/Interface/Coalesce', tags: ['autodocs'], ...loaderMeta(LoaderCoalesce, about) } satisfies Meta<typeof LoaderCoalesce>

const s = loaderStories(LoaderCoalesce)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
