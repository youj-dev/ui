import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderCore, meta as about } from './core'

export default { title: 'Visuals/Loaders/Geometry/Core', tags: ['autodocs'], ...loaderMeta(LoaderCore, about) } satisfies Meta<typeof LoaderCore>

const s = loaderStories(LoaderCore)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
