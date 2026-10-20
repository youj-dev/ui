import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderLacuna, meta as about } from './lacuna'

export default { title: 'Visuals/Loaders/Geometry/Lacuna', tags: ['autodocs'], ...loaderMeta(LoaderLacuna, about) } satisfies Meta<typeof LoaderLacuna>

const s = loaderStories(LoaderLacuna)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
