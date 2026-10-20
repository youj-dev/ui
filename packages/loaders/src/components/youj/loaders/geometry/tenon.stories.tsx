import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderTenon, meta as about } from './tenon'

export default { title: 'Visuals/Loaders/Geometry/Tenon', tags: ['autodocs'], ...loaderMeta(LoaderTenon, about) } satisfies Meta<typeof LoaderTenon>

const s = loaderStories(LoaderTenon)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
