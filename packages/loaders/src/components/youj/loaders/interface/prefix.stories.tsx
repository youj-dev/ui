import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderPrefix, meta as about } from './prefix'

export default { title: 'Visuals/Loaders/Interface/Prefix', tags: ['autodocs'], ...loaderMeta(LoaderPrefix, about) } satisfies Meta<typeof LoaderPrefix>

const s = loaderStories(LoaderPrefix)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
