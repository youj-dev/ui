import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderAtrium, meta as about } from './atrium'

export default { title: 'Visuals/Loaders/Geometry/Atrium', tags: ['autodocs'], ...loaderMeta(LoaderAtrium, about) } satisfies Meta<typeof LoaderAtrium>

const s = loaderStories(LoaderAtrium)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
