import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderDwell, meta as about } from './dwell'

export default { title: 'Visuals/Loaders/Mechanics/Dwell', tags: ['autodocs'], ...loaderMeta(LoaderDwell, about) } satisfies Meta<typeof LoaderDwell>

const s = loaderStories(LoaderDwell)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
